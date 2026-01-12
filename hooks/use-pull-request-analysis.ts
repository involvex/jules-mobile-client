import { PullRequest, Repository, useGithubApi } from "./use-github-api";
import { useCallback, useEffect, useState } from "react";
import { useApiKey } from "@/constants/api-key-context";
import { useJulesApi } from "./use-jules-api";

export interface PullRequestAnalysis {
  id: number;
  title: string;
  confidence: number;
  summary: string;
  issues: string[];
  suggestions: string[];
  riskLevel: "low" | "medium" | "high";
  timeEstimate: string;
  createdAt: Date;
}

export interface PullRequestReview {
  id: number;
  prNumber: number;
  reviewId: string;
  status: "pending" | "approved" | "changes_requested" | "commented";
  body: string;
  submittedAt: Date;
  author: string;
}

export interface PullRequestMetrics {
  totalFilesChanged: number;
  totalAdditions: number;
  totalDeletions: number;
  complexityScore: number;
  estimatedReviewTime: number;
  riskFactors: string[];
}

export function usePullRequestAnalysis() {
  const { octokit } = useGithubApi();
  const { apiKey } = useApiKey();
  const { analyzeCode, getAiResponse } = useJulesApi({ apiKey });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Map<number, PullRequestAnalysis>>(
    new Map(),
  );
  const [reviews, setReviews] = useState<Map<number, PullRequestReview[]>>(
    new Map(),
  );

  // Helper functions - defined first to avoid hoisting issues
  const fetchPrDetails = useCallback(
    async (owner: string, repo: string, prNumber: number) => {
      if (!octokit) throw new Error("GitHub API not initialized");
      const { data } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
      });
      return data;
    },
    [octokit],
  );

  const fetchPrDiff = useCallback(
    async (owner: string, repo: string, prNumber: number) => {
      if (!octokit) throw new Error("GitHub API not initialized");
      const { data } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
        mediaType: {
          format: "diff",
        },
      });
      return data as unknown as string;
    },
    [octokit],
  );

  const fetchPrFiles = useCallback(
    async (owner: string, repo: string, prNumber: number) => {
      if (!octokit) throw new Error("GitHub API not initialized");
      const { data } = await octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber,
      });
      return data;
    },
    [octokit],
  );

  const estimateReviewTime = useCallback(
    (
      filesChanged: number,
      additions: number,
      deletions: number,
      complexity: number,
    ): string => {
      let time = filesChanged * 5;
      time += Math.min(additions + deletions, 1000) / 20;
      time += complexity / 2;
      const minutes = Math.ceil(time);
      return minutes > 60
        ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
        : `${minutes}m`;
    },
    [],
  );

  const calculateComplexityScore = useCallback(
    (files: any[], diff: string): number => {
      let score = 0;
      score += files.length * 10;
      const additions = (diff.match(/\+/g) || []).length;
      const deletions = (diff.match(/-/g) || []).length;
      score += Math.min(additions + deletions, 1000) / 10;
      const sensitiveFiles = files.filter(
        file =>
          file.filename.includes("config") ||
          file.filename.includes("auth") ||
          file.filename.includes("security"),
      );
      score += sensitiveFiles.length * 50;
      return Math.min(score, 100);
    },
    [],
  );

  const identifyRiskFactors = useCallback(
    (files: any[], diff: string): string[] => {
      const risks: string[] = [];
      const sensitiveFiles = files.filter(
        file =>
          file.filename.includes("config") ||
          file.filename.includes("auth") ||
          file.filename.includes("security") ||
          file.filename.includes("database"),
      );
      if (sensitiveFiles.length > 0)
        risks.push("Modifies sensitive configuration files");
      const additions = (diff.match(/\+/g) || []).length;
      const deletions = (diff.match(/-/g) || []).length;
      if (additions + deletions > 500) risks.push("Large number of changes");
      const hasTests = files.some(
        file =>
          file.filename.includes("test") || file.filename.includes("spec"),
      );
      if (!hasTests && files.length > 1) risks.push("No test files included");
      return risks;
    },
    [],
  );

  const generateAnalysisPrompt = useCallback((prDetails: any, diff: string) => {
    return `
      Analyze this pull request for code quality, potential issues, and improvements:

      PR Title: ${prDetails.title}
      PR Description: ${prDetails.body || "No description provided"}
      
      Changes:
      ${diff.slice(0, 10000)}

      Please provide your response as valid JSON with "summary", "issues"[], "suggestions"[], "qualityScore", and "riskLevel" fields.
    `;
  }, []);

  const parseAnalysisResponse = useCallback(
    (response: string, prDetails: any, diff: string): PullRequestAnalysis => {
      try {
        const parsed = JSON.parse(response);
        const additions = (diff.match(/\+/g) || []).length;
        const deletions = (diff.match(/-/g) || []).length;

        return {
          id: prDetails.number,
          title: prDetails.title,
          confidence: 0.85,
          summary: parsed.summary || "Analysis completed",
          issues: parsed.issues || [],
          suggestions: parsed.suggestions || [],
          riskLevel: parsed.riskLevel || "medium",
          timeEstimate: estimateReviewTime(
            prDetails.changed_files || 0,
            additions,
            deletions,
            parsed.qualityScore || 5,
          ),
          createdAt: new Date(),
        };
      } catch (error) {
        return {
          id: prDetails.number,
          title: prDetails.title,
          confidence: 0.5,
          summary: response.substring(0, 200),
          issues: [],
          suggestions: [],
          riskLevel: "medium",
          timeEstimate: "30 minutes",
          createdAt: new Date(),
        };
      }
    },
    [estimateReviewTime],
  );

  const generateReviewPrompt = useCallback((analysis: PullRequestAnalysis) => {
    return `
      Based on this pull request analysis, write a detailed code review:
      Summary: ${analysis.summary}
      Issues: ${analysis.issues.join(", ")}
      Suggestions: ${analysis.suggestions.join(", ")}
      Risk Level: ${analysis.riskLevel}
    `;
  }, []);

  // Analyze pull request using AI
  const analyzePullRequest = useCallback(
    async (
      owner: string,
      repo: string,
      prNumber: number,
      sourceName: string = "github",
    ): Promise<PullRequestAnalysis> => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const prDetails = await fetchPrDetails(owner, repo, prNumber);
        const diff = await fetchPrDiff(owner, repo, prNumber);
        const prompt = generateAnalysisPrompt(prDetails, diff);

        const session = await analyzeCode(sourceName, prompt);
        if (!session) throw new Error("Failed to start analysis session");

        const response = await getAiResponse(
          session.name,
          "Generate the JSON analysis now.",
        );
        const agentMsg = response?.agentMessaged?.agentMessage;
        if (!agentMsg) throw new Error("Failed to get AI response");

        const structuredAnalysis = parseAnalysisResponse(
          agentMsg,
          prDetails,
          diff,
        );

        setAnalyses(prev => {
          const newMap = new Map(prev);
          newMap.set(prNumber, structuredAnalysis);
          return newMap;
        });

        return structuredAnalysis;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Analysis failed";
        setError(message);
        console.error("Failed to analyze PR:", err);
        throw err;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [
      analyzeCode,
      getAiResponse,
      fetchPrDetails,
      fetchPrDiff,
      generateAnalysisPrompt,
      parseAnalysisResponse,
    ],
  );

  // Automated PR review
  const createAutomatedReview = useCallback(
    async (
      owner: string,
      repo: string,
      prNumber: number,
      analysis: PullRequestAnalysis,
    ): Promise<PullRequestReview> => {
      try {
        const reviewPrompt = generateReviewPrompt(analysis);

        // Get review content from AI
        const session = await analyzeCode("github", reviewPrompt);
        if (!session) throw new Error("Failed to create review session");

        const response = await getAiResponse(
          session.name,
          "Write the review now.",
        );
        const reviewContent =
          response?.agentMessaged?.agentMessage || "Analysis completed.";

        // Create review on GitHub
        if (!octokit) throw new Error("GitHub API not initialized");
        const { data: review } = await octokit.rest.pulls.createReview({
          owner,
          repo,
          pull_number: prNumber,
          body: reviewContent,
          event: "COMMENT",
        });

        const structuredReview: PullRequestReview = {
          id: review.id,
          prNumber,
          reviewId: review.id.toString(),
          status: "commented",
          body: review.body,
          submittedAt: new Date(),
          author: "Jules AI",
        };

        // Cache the review
        setReviews(prev => {
          const newMap = new Map(prev);
          const existingReviews = newMap.get(prNumber) || [];
          newMap.set(prNumber, [...existingReviews, structuredReview]);
          return newMap;
        });

        return structuredReview;
      } catch (error) {
        console.error("Failed to create automated review:", error);
        throw error;
      }
    },
    [analyzeCode, getAiResponse, octokit, generateReviewPrompt],
  );

  // Get PR metrics
  const getPullRequestMetrics = useCallback(
    async (
      owner: string,
      repo: string,
      prNumber: number,
    ): Promise<PullRequestMetrics> => {
      try {
        const diff = await fetchPrDiff(owner, repo, prNumber);
        const files = await fetchPrFiles(owner, repo, prNumber);

        const totalFilesChanged = files.length;
        const totalAdditions = (diff.match(/\+/g) || []).length;
        const totalDeletions = (diff.match(/-/g) || []).length;
        const complexityScore = calculateComplexityScore(files, diff);
        const estimatedReviewTimeRaw =
          totalFilesChanged * 5 + complexityScore / 2;

        return {
          totalFilesChanged,
          totalAdditions,
          totalDeletions,
          complexityScore,
          estimatedReviewTime: estimatedReviewTimeRaw,
          riskFactors: identifyRiskFactors(files, diff),
        };
      } catch (error) {
        console.error("Failed to get PR metrics:", error);
        throw error;
      }
    },
    [fetchPrDiff, fetchPrFiles, calculateComplexityScore, identifyRiskFactors],
  );

  // Comment on PR
  const addCommentToPr = useCallback(
    async (
      owner: string,
      repo: string,
      prNumber: number,
      comment: string,
    ): Promise<void> => {
      if (!octokit) throw new Error("GitHub API not initialized");
      try {
        await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: prNumber,
          body: comment,
        });
      } catch (error) {
        console.error("Failed to add comment:", error);
        throw error;
      }
    },
    [octokit],
  );

  // Approve PR
  const approvePr = useCallback(
    async (
      owner: string,
      repo: string,
      prNumber: number,
      body?: string,
    ): Promise<void> => {
      if (!octokit) throw new Error("GitHub API not initialized");
      try {
        await octokit.rest.pulls.createReview({
          owner,
          repo,
          pull_number: prNumber,
          event: "APPROVE",
          body: body || "LGTM! \ud83d\ude80",
        });
      } catch (error) {
        console.error("Failed to approve PR:", error);
        throw error;
      }
    },
    [octokit],
  );

  // Request changes on PR
  const requestChangesOnPr = useCallback(
    async (
      owner: string,
      repo: string,
      prNumber: number,
      body: string,
    ): Promise<void> => {
      if (!octokit) throw new Error("GitHub API not initialized");
      try {
        await octokit.rest.pulls.createReview({
          owner,
          repo,
          pull_number: prNumber,
          event: "REQUEST_CHANGES",
          body,
        });
      } catch (error) {
        console.error("Failed to request changes:", error);
        throw error;
      }
    },
    [octokit],
  );

  return {
    isAnalyzing,
    analyses,
    reviews,
    error,
    analyzePullRequest,
    createAutomatedReview,
    getPullRequestMetrics,
    addCommentToPr,
    approvePr,
    requestChangesOnPr,
  };
}

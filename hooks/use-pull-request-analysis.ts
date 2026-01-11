import { PullRequest, Repository, useGithubApi } from "./use-github-api";
import { useCallback, useEffect, useState } from "react";
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
  const { getPullRequests, getRepoDetails } = useGithubApi();
  const { analyzeCode, getAiResponse } = useJulesApi();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyses, setAnalyses] = useState<Map<number, PullRequestAnalysis>>(
    new Map(),
  );
  const [reviews, setReviews] = useState<Map<number, PullRequestReview[]>>(
    new Map(),
  );

  // Analyze pull request using AI
  const analyzePullRequest = useCallback(
    async (
      owner: string,
      repo: string,
      prNumber: number,
    ): Promise<PullRequestAnalysis> => {
      setIsAnalyzing(true);

      try {
        // Get PR details and diff
        const prDetails = await fetchPrDetails(owner, repo, prNumber);
        const diff = await fetchPrDiff(owner, repo, prNumber);

        // Generate analysis prompt
        const prompt = generateAnalysisPrompt(prDetails, diff);

        // Get AI analysis
        const analysis = await getAiResponse(prompt);

        // Parse and structure the response
        const structuredAnalysis = parseAnalysisResponse(
          analysis,
          prDetails,
          diff,
        );

        // Cache the analysis
        setAnalyses(prev => {
          const newMap = new Map(prev);
          newMap.set(prNumber, structuredAnalysis);
          return newMap;
        });

        return structuredAnalysis;
      } catch (error) {
        console.error("Failed to analyze PR:", error);
        throw error;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [getAiResponse],
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
        const reviewContent = await getAiResponse(reviewPrompt);

        // Create review on GitHub
        const review = await createGithubReview(
          owner,
          repo,
          prNumber,
          reviewContent,
        );

        // Cache the review
        setReviews(prev => {
          const newMap = new Map(prev);
          const existingReviews = newMap.get(prNumber) || [];
          newMap.set(prNumber, [...existingReviews, review]);
          return newMap;
        });

        return review;
      } catch (error) {
        console.error("Failed to create automated review:", error);
        throw error;
      }
    },
    [getAiResponse],
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

        // Calculate metrics
        const totalFilesChanged = files.length;
        const totalAdditions = diff.additions || 0;
        const totalDeletions = diff.deletions || 0;

        // Calculate complexity score based on various factors
        const complexityScore = calculateComplexityScore(files, diff);

        // Estimate review time
        const estimatedReviewTime = estimateReviewTime(
          totalFilesChanged,
          totalAdditions,
          totalDeletions,
          complexityScore,
        );

        // Identify risk factors
        const riskFactors = identifyRiskFactors(files, diff);

        return {
          totalFilesChanged,
          totalAdditions,
          totalDeletions,
          complexityScore,
          estimatedReviewTime,
          riskFactors,
        };
      } catch (error) {
        console.error("Failed to get PR metrics:", error);
        throw error;
      }
    },
    [],
  );

  // Comment on PR
  const addCommentToPr = useCallback(
    async (
      owner: string,
      repo: string,
      prNumber: number,
      comment: string,
    ): Promise<void> => {
      try {
        await fetch(
          `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`,
          {
            method: "POST",
            headers: {
              Authorization: `token ${process.env.EXPO_PUBLIC_GITHUB_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ body: comment }),
          },
        );
      } catch (error) {
        console.error("Failed to add comment:", error);
        throw error;
      }
    },
    [],
  );

  // Approve PR
  const approvePr = useCallback(
    async (
      owner: string,
      repo: string,
      prNumber: number,
      body?: string,
    ): Promise<void> => {
      try {
        await fetch(
          `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
          {
            method: "POST",
            headers: {
              Authorization: `token ${process.env.EXPO_PUBLIC_GITHUB_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              event: "APPROVE",
              body: body || "LGTM! 🚀",
            }),
          },
        );
      } catch (error) {
        console.error("Failed to approve PR:", error);
        throw error;
      }
    },
    [],
  );

  // Request changes on PR
  const requestChangesOnPr = useCallback(
    async (
      owner: string,
      repo: string,
      prNumber: number,
      body: string,
    ): Promise<void> => {
      try {
        await fetch(
          `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
          {
            method: "POST",
            headers: {
              Authorization: `token ${process.env.EXPO_PUBLIC_GITHUB_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              event: "REQUEST_CHANGES",
              body,
            }),
          },
        );
      } catch (error) {
        console.error("Failed to request changes:", error);
        throw error;
      }
    },
    [],
  );

  // Helper functions
  const fetchPrDetails = async (
    owner: string,
    repo: string,
    prNumber: number,
  ) => {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      {
        headers: {
          Authorization: `token ${process.env.EXPO_PUBLIC_GITHUB_TOKEN}`,
        },
      },
    );
    return response.json();
  };

  const fetchPrDiff = async (owner: string, repo: string, prNumber: number) => {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      {
        headers: {
          Authorization: `token ${process.env.EXPO_PUBLIC_GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3.diff",
        },
      },
    );
    return response.text();
  };

  const fetchPrFiles = async (
    owner: string,
    repo: string,
    prNumber: number,
  ) => {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
      {
        headers: {
          Authorization: `token ${process.env.EXPO_PUBLIC_GITHUB_TOKEN}`,
        },
      },
    );
    return response.json();
  };

  const createGithubReview = async (
    owner: string,
    repo: string,
    prNumber: number,
    body: string,
  ) => {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${process.env.EXPO_PUBLIC_GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: "COMMENT",
          body,
        }),
      },
    );
    return response.json();
  };

  const generateAnalysisPrompt = (prDetails: any, diff: string) => {
    return `
      Analyze this pull request for code quality, potential issues, and improvements:

      PR Title: ${prDetails.title}
      PR Description: ${prDetails.body || "No description provided"}
      
      Changes:
      ${diff}

      Please provide:
      1. A concise summary of what this PR does
      2. Identify any potential issues or bugs
      3. Suggest improvements or optimizations
      4. Assess the overall code quality
      5. Estimate the complexity and risk level

      Format your response as JSON with the following structure:
      {
        "summary": "Brief summary",
        "issues": ["Issue 1", "Issue 2"],
        "suggestions": ["Suggestion 1", "Suggestion 2"],
        "qualityScore": 1-10,
        "riskLevel": "low|medium|high"
      }
    `;
  };

  const generateReviewPrompt = (analysis: PullRequestAnalysis) => {
    return `
      Based on this pull request analysis, write a detailed code review:

      Summary: ${analysis.summary}
      Issues: ${analysis.issues.join(", ")}
      Suggestions: ${analysis.suggestions.join(", ")}
      Risk Level: ${analysis.riskLevel}

      Please write a professional code review that:
      1. Acknowledges the good parts of the code
      2. Points out specific issues with suggestions for improvement
      3. Provides constructive feedback
      4. Is helpful and educational

      Keep the review concise but thorough.
    `;
  };

  const parseAnalysisResponse = (
    response: string,
    prDetails: any,
    diff: string,
  ): PullRequestAnalysis => {
    try {
      // Try to parse JSON from response
      const parsed = JSON.parse(response);

      return {
        id: prDetails.number,
        title: prDetails.title,
        confidence: 0.85, // Default confidence
        summary: parsed.summary || "Analysis completed",
        issues: parsed.issues || [],
        suggestions: parsed.suggestions || [],
        riskLevel: parsed.riskLevel || "medium",
        timeEstimate: estimateReviewTime(
          (diff.match(/\+/g) || []).length,
          (diff.match(/-/g) || []).length,
          0,
          parsed.qualityScore || 5,
        ),
        createdAt: new Date(),
      };
    } catch (error) {
      // If JSON parsing fails, create a basic analysis
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
  };

  const calculateComplexityScore = (files: any[], diff: string): number => {
    let score = 0;

    // Base score on number of files
    score += files.length * 10;

    // Score based on diff size
    const additions = (diff.match(/\+/g) || []).length;
    const deletions = (diff.match(/-/g) || []).length;
    score += Math.min(additions + deletions, 1000) / 10;

    // Score based on file types
    const sensitiveFiles = files.filter(
      file =>
        file.filename.includes("config") ||
        file.filename.includes("auth") ||
        file.filename.includes("security"),
    );
    score += sensitiveFiles.length * 50;

    return Math.min(score, 100);
  };

  const estimateReviewTime = (
    filesChanged: number,
    additions: number,
    deletions: number,
    complexity: number,
  ): number => {
    // Base time: 5 minutes per file
    let time = filesChanged * 5;

    // Additional time based on changes
    time += Math.min(additions + deletions, 1000) / 20;

    // Additional time based on complexity
    time += complexity / 2;

    return Math.ceil(time);
  };

  const identifyRiskFactors = (files: any[], diff: string): string[] => {
    const risks: string[] = [];

    // Check for sensitive files
    const sensitiveFiles = files.filter(
      file =>
        file.filename.includes("config") ||
        file.filename.includes("auth") ||
        file.filename.includes("security") ||
        file.filename.includes("database"),
    );

    if (sensitiveFiles.length > 0) {
      risks.push("Modifies sensitive configuration files");
    }

    // Check for large changes
    const additions = (diff.match(/\+/g) || []).length;
    const deletions = (diff.match(/-/g) || []).length;

    if (additions + deletions > 500) {
      risks.push("Large number of changes");
    }

    // Check for test files
    const hasTests = files.some(
      file => file.filename.includes("test") || file.filename.includes("spec"),
    );

    if (!hasTests && files.length > 1) {
      risks.push("No test files included");
    }

    return risks;
  };

  return {
    isAnalyzing,
    analyses,
    reviews,
    analyzePullRequest,
    createAutomatedReview,
    getPullRequestMetrics,
    addCommentToPr,
    approvePr,
    requestChangesOnPr,
  };
}

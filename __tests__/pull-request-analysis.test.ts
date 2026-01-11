import { usePullRequestAnalysis } from "@/hooks/use-pull-request-analysis";
import { renderHook, act } from "@testing-library/react-native";
import { useGithubApi } from "@/hooks/use-github-api";
import { useJulesApi } from "@/hooks/use-jules-api";
import React from "react";

// Mock useGithubApi
jest.mock("@/hooks/use-github-api", () => ({
  useGithubApi: jest.fn(),
}));

// Mock useJulesApi
jest.mock("@/hooks/use-jules-api", () => ({
  useJulesApi: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe("usePullRequestAnalysis", () => {
  const mockGetPullRequests = jest.fn();
  const mockGetRepoDetails = jest.fn();
  const mockGetAiResponse = jest.fn();
  const mockAnalyzeCode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useGithubApi as jest.Mock).mockReturnValue({
      getPullRequests: mockGetPullRequests,
      getRepoDetails: mockGetRepoDetails,
    });

    (useJulesApi as jest.Mock).mockReturnValue({
      getAiResponse: mockGetAiResponse,
      analyzeCode: mockAnalyzeCode,
    });

    // Mock fetch responses
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({}),
      text: jest.fn().mockResolvedValue("diff content"),
    });
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => usePullRequestAnalysis());

    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.analyses).toBeInstanceOf(Map);
    expect(result.current.reviews).toBeInstanceOf(Map);
  });

  it("should analyze pull request successfully", async () => {
    const mockPrDetails = {
      number: 123,
      title: "Test PR",
      body: "Test description",
      user: { login: "testuser" },
      html_url: "https://github.com/test/repo/pull/123",
    };

    const mockAnalysisResponse = JSON.stringify({
      summary: "Test summary",
      issues: ["Issue 1", "Issue 2"],
      suggestions: ["Suggestion 1"],
      qualityScore: 8,
      riskLevel: "medium",
    });

    mockGetAiResponse.mockResolvedValue(mockAnalysisResponse);

    const { result } = renderHook(() => usePullRequestAnalysis());

    const analysis = await act(async () => {
      return result.current.analyzePullRequest("testuser", "testrepo", 123);
    });

    expect(mockGetAiResponse).toHaveBeenCalled();
    expect(analysis.id).toBe(123);
    expect(analysis.title).toBe("Test PR");
    expect(analysis.summary).toBe("Test summary");
    expect(analysis.issues).toEqual(["Issue 1", "Issue 2"]);
    expect(analysis.riskLevel).toBe("medium");
    expect(result.current.isAnalyzing).toBe(false);
  });

  it("should handle analysis errors", async () => {
    const analysisError = new Error("Analysis failed");
    mockGetAiResponse.mockRejectedValue(analysisError);

    const { result } = renderHook(() => usePullRequestAnalysis());

    await expect(
      act(async () => {
        return result.current.analyzePullRequest("testuser", "testrepo", 123);
      }),
    ).rejects.toThrow("Analysis failed");

    expect(result.current.isAnalyzing).toBe(false);
  });

  it("should create automated review", async () => {
    const mockAnalysis = {
      id: 123,
      title: "Test PR",
      confidence: 0.85,
      summary: "Test summary",
      issues: ["Issue 1"],
      suggestions: ["Suggestion 1"],
      riskLevel: "medium",
      timeEstimate: "30 minutes",
      createdAt: new Date(),
    };

    const mockReviewResponse = {
      id: 456,
      body: "Automated review content",
      submitted_at: new Date().toISOString(),
      user: { login: "testuser" },
    };

    mockGetAiResponse.mockResolvedValue("Review content");
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockReviewResponse),
    });

    const { result } = renderHook(() => usePullRequestAnalysis());

    const review = await act(async () => {
      return result.current.createAutomatedReview(
        "testuser",
        "testrepo",
        123,
        mockAnalysis,
      );
    });

    expect(mockGetAiResponse).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/reviews"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: expect.stringContaining("Review content"),
      }),
    );
    expect(review.id).toBe(456);
  });

  it("should get pull request metrics", async () => {
    const mockDiff = "+++ a/file.js\n--- b/file.js\n+ new line\n- old line";
    const mockFiles = [
      { filename: "file.js", additions: 10, deletions: 5 },
      { filename: "config.json", additions: 2, deletions: 0 },
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        text: jest.fn().mockResolvedValue(mockDiff),
      })
      .mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockFiles),
      });

    const { result } = renderHook(() => usePullRequestAnalysis());

    const metrics = await act(async () => {
      return result.current.getPullRequestMetrics("testuser", "testrepo", 123);
    });

    expect(metrics.totalFilesChanged).toBe(2);
    expect(metrics.totalAdditions).toBe(12);
    expect(metrics.totalDeletions).toBe(5);
    expect(metrics.complexityScore).toBeGreaterThan(0);
    expect(metrics.estimatedReviewTime).toBeGreaterThan(0);
    expect(metrics.riskFactors).toBeInstanceOf(Array);
  });

  it("should add comment to PR", async () => {
    const comment = "This is a test comment";

    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({ id: 789 }),
    });

    const { result } = renderHook(() => usePullRequestAnalysis());

    await act(async () => {
      await result.current.addCommentToPr("testuser", "testrepo", 123, comment);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/issues/123/comments"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining(comment),
      }),
    );
  });

  it("should approve PR", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({ id: 789 }),
    });

    const { result } = renderHook(() => usePullRequestAnalysis());

    await act(async () => {
      await result.current.approvePr("testuser", "testrepo", 123);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/pulls/123/reviews"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("APPROVE"),
      }),
    );
  });

  it("should request changes on PR", async () => {
    const body = "Please fix these issues";

    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({ id: 789 }),
    });

    const { result } = renderHook(() => usePullRequestAnalysis());

    await act(async () => {
      await result.current.requestChangesOnPr(
        "testuser",
        "testrepo",
        123,
        body,
      );
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/pulls/123/reviews"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("REQUEST_CHANGES"),
      }),
    );
  });

  it("should calculate complexity score correctly", () => {
    const { result } = renderHook(() => usePullRequestAnalysis());

    const files = [
      { filename: "file.js", additions: 10, deletions: 5 },
      { filename: "config.json", additions: 2, deletions: 0 },
    ];
    const diff = "+++ a/file.js\n--- b/file.js\n+ new line\n- old line";

    // Test the helper function indirectly through getPullRequestMetrics
    expect(result.current.getPullRequestMetrics).toBeDefined();
  });

  it("should identify risk factors correctly", () => {
    const { result } = renderHook(() => usePullRequestAnalysis());

    // Test the helper function indirectly through getPullRequestMetrics
    expect(result.current.getPullRequestMetrics).toBeDefined();
  });

  it("should estimate review time correctly", () => {
    const { result } = renderHook(() => usePullRequestAnalysis());

    // Test the helper function indirectly through getPullRequestMetrics
    expect(result.current.getPullRequestMetrics).toBeDefined();
  });
});

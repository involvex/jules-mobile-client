import { useGitHubService } from "./use-github-service";
import { Repository } from "../services/github";
import { useJulesApi } from "./use-jules-api";
import { useCallback, useState } from "react";
export interface GithubSessionContext {
  owner: string;
  repo: string;
  branch?: string;
  defaultBranch?: string;
  repository?: Repository | undefined;
}

export interface SessionCreationOptions {
  prompt: string;
  branch?: string;
  repository?: Repository;
  useDefaultBranch?: boolean;
}

export interface SessionTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category:
    | "development"
    | "testing"
    | "documentation"
    | "maintenance"
    | "custom";
}

export function useGithubSession() {
  const { getRepo } = useGitHubService();
  const { createSession, fetchSources } = useJulesApi({
    apiKey: "",
    t: key => key,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse GitHub URL
  const parseGithubUrl = useCallback(
    (url: string): { owner: string; repo: string; branch?: string } | null => {
      try {
        const urlObj = new URL(url);
        if (!urlObj.hostname.includes("github.com")) {
          return null;
        }

        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        if (pathParts.length >= 2) {
          const result: { owner: string; repo: string; branch?: string } = {
            owner: pathParts[0],
            repo: pathParts[1],
          };

          // Check for branch in URL (e.g., /owner/repo/tree/branch)
          if (pathParts.length >= 4 && pathParts[2] === "tree") {
            result.branch = pathParts[3];
          }

          return result;
        }
        return null;
      } catch (error) {
        console.error("Invalid GitHub URL:", error);
        return null;
      }
    },
    [],
  );

  // Repository-specific prompt templates
  const sessionTemplates: SessionTemplate[] = [
    {
      id: "bug-fix",
      name: "Bug Fix",
      description: "Fix a specific bug or issue in the codebase",
      prompt: "Fix the following bug in this repository:",
      category: "development",
    },
    {
      id: "feature-addition",
      name: "Feature Addition",
      description: "Add a new feature to the existing codebase",
      prompt: "Implement the following feature in this repository:",
      category: "development",
    },
    {
      id: "code-review",
      name: "Code Review",
      description: "Review and improve existing code quality",
      prompt: "Review the following code and suggest improvements:",
      category: "maintenance",
    },
    {
      id: "test-coverage",
      name: "Test Coverage",
      description: "Add or improve test coverage for the codebase",
      prompt: "Add comprehensive tests for the following functionality:",
      category: "testing",
    },
    {
      id: "documentation",
      name: "Documentation",
      description: "Generate or update documentation",
      prompt: "Generate documentation for the following code:",
      category: "documentation",
    },
    {
      id: "refactoring",
      name: "Refactoring",
      description: "Refactor code for better performance or readability",
      prompt:
        "Refactor the following code for better performance and readability:",
      category: "maintenance",
    },
  ];

  // Get repository details and default branch
  const getRepositoryContext = useCallback(
    async (
      owner: string,
      repo: string,
      branch?: string,
    ): Promise<GithubSessionContext | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const repository = await getRepo(owner, repo);

        return {
          owner,
          repo,
          branch,
          defaultBranch: repository.default_branch || "main",
          repository,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch repository details";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getRepo],
  );

  // Create session with GitHub context
  const createGithubSession = useCallback(
    async (
      githubContext: GithubSessionContext,
      options: SessionCreationOptions,
    ): Promise<string | null> => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch available sources to find the GitHub source
        const sources = await fetchSources(true);
        const githubSource = sources.find(
          source =>
            source.githubRepo?.owner === githubContext.owner &&
            source.githubRepo?.repo === githubContext.repo,
        );

        if (!githubSource) {
          throw new Error(
            `No GitHub source found for ${githubContext.owner}/${githubContext.repo}`,
          );
        }

        // Determine the branch to use
        const branchToUse =
          options.branch ||
          (options.useDefaultBranch ? githubContext.defaultBranch : "main");

        // Create the session
        const session = await createSession(
          githubSource.name,
          options.prompt,
          branchToUse,
        );

        if (session) {
          return session.name;
        }

        return null;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to create GitHub session";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchSources, createSession],
  );

  // Parse GitHub URL and create session
  const createSessionFromUrl = useCallback(
    async (
      githubUrl: string,
      prompt: string,
      options: Partial<SessionCreationOptions> = {},
    ): Promise<string | null> => {
      try {
        setIsLoading(true);
        setError(null);

        // Parse the GitHub URL
        const urlData = parseGithubUrl(githubUrl);
        if (!urlData) {
          throw new Error("Invalid GitHub URL");
        }

        // Get repository context
        const context = await getRepositoryContext(
          urlData.owner,
          urlData.repo,
          urlData.branch,
        );
        if (!context) {
          throw new Error("Failed to get repository context");
        }

        // Create session
        const sessionName = await createGithubSession(context, {
          prompt,
          branch: urlData.branch || options.branch,
          repository: context.repository,
          useDefaultBranch: options.useDefaultBranch ?? true,
          ...options,
        });

        return sessionName;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to create session from URL";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [parseGithubUrl, getRepositoryContext, createGithubSession],
  );

  // Get available session templates
  const getTemplates = useCallback(
    (category?: SessionTemplate["category"]) => {
      if (category) {
        return sessionTemplates.filter(
          template => template.category === category,
        );
      }
      return sessionTemplates;
    },
    [sessionTemplates],
  );

  // Get template by ID
  const getTemplate = useCallback(
    (id: string) => {
      return sessionTemplates.find(template => template.id === id);
    },
    [sessionTemplates],
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    clearError,
    getRepositoryContext,
    createGithubSession,
    createSessionFromUrl,
    getTemplates,
    getTemplate,
  };
}

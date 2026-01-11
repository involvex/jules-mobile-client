import { useCallback, useEffect, useState } from "react";
import { useApiKey } from "@/constants/api-key-context";
import { Octokit } from "@octokit/rest";

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
  language?: string;
  stargazers_count: number;
  forks_count: number;
}

export interface Workflow {
  id: number;
  name: string;
  path: string;
  state: "active" | "disabled_manually" | "disabled_inactivity";
  created_at: string;
  updated_at: string;
}

export interface WorkflowRun {
  id: number;
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion:
    | "success"
    | "failure"
    | "cancelled"
    | "skipped"
    | "timed_out"
    | "action_required"
    | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  head_branch: string;
  head_sha: string;
  event: string;
  jobs_url: string;
  logs_url: string;
}

export interface Job {
  id: number;
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion:
    | "success"
    | "failure"
    | "cancelled"
    | "skipped"
    | "timed_out"
    | "action_required"
    | null;
  started_at: string;
  completed_at: string;
  steps: JobStep[];
}

export interface JobStep {
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion:
    | "success"
    | "failure"
    | "cancelled"
    | "skipped"
    | "timed_out"
    | "action_required"
    | null;
  started_at: string;
  completed_at: string;
}

export interface WorkflowJob {
  id: number;
  run_id: number;
  run_url: string;
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion:
    | "success"
    | "failure"
    | "cancelled"
    | "skipped"
    | "timed_out"
    | "action_required"
    | null;
  started_at: string;
  completed_at: string;
  steps: JobStep[];
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  html_url: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
}

export interface SearchResults {
  total_count: number;
  items: Repository[];
}

export function useGithubApi() {
  const { GITHUB_TOKEN } = useApiKey();
  const [octokit, setOctokit] = useState<Octokit | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Octokit client when token changes
  useEffect(() => {
    if (GITHUB_TOKEN) {
      const client = new Octokit({
        auth: GITHUB_TOKEN,
        userAgent: "Jules-Mobile-Client/1.0.0",
        request: {
          timeout: 10000, // 10 second timeout
        },
      });
      setOctokit(client);
      setIsAuthenticated(true);
    } else {
      setOctokit(null);
      setIsAuthenticated(false);
    }
  }, [GITHUB_TOKEN]);

  // Validate token
  const validateToken = useCallback(async (): Promise<boolean> => {
    if (!octokit) return false;

    try {
      setIsLoading(true);
      const { data } = await octokit.rest.users.getAuthenticated();
      return !!data.login;
    } catch (error) {
      console.error("Token validation failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [octokit]);

  // Get user repositories
  const getUserRepos = useCallback(
    async (perPage = 30, page = 1): Promise<Repository[]> => {
      if (!octokit) throw new Error("GitHub API not initialized");

      try {
        setIsLoading(true);
        const { data } = await octokit.rest.repos.listForAuthenticatedUser({
          per_page: perPage,
          page,
          sort: "updated",
          direction: "desc",
        });
        return data as Repository[];
      } catch (error) {
        console.error("Failed to fetch repositories:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [octokit],
  );

  // Get repository details
  const getRepoDetails = useCallback(
    async (owner: string, repo: string): Promise<Repository> => {
      if (!octokit) throw new Error("GitHub API not initialized");

      try {
        setIsLoading(true);
        const { data } = await octokit.rest.repos.get({
          owner,
          repo,
        });
        return data as Repository;
      } catch (error) {
        console.error("Failed to fetch repository details:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [octokit],
  );

  // Get workflows for repository
  const getWorkflows = useCallback(
    async (owner: string, repo: string): Promise<Workflow[]> => {
      if (!octokit) throw new Error("GitHub API not initialized");

      try {
        setIsLoading(true);
        const { data } = await octokit.rest.actions.listRepoWorkflows({
          owner,
          repo,
        });
        return data.workflows as Workflow[];
      } catch (error) {
        console.error("Failed to fetch workflows:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [octokit],
  );

  // Get workflow runs
  const getWorkflowRuns = useCallback(
    async (
      owner: string,
      repo: string,
      workflowId?: number,
      perPage = 30,
      page = 1,
    ): Promise<WorkflowRun[]> => {
      if (!octokit) throw new Error("GitHub API not initialized");

      try {
        setIsLoading(true);
        const params: any = {
          owner,
          repo,
          per_page: perPage,
          page,
          status: "completed",
        };

        if (workflowId) {
          params.workflow_id = workflowId;
        }

        const { data } = await octokit.rest.actions.listWorkflowRuns(params);
        return data.workflow_runs as WorkflowRun[];
      } catch (error) {
        console.error("Failed to fetch workflow runs:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [octokit],
  );

  // Get workflow run logs
  const getWorkflowRunLogs = useCallback(
    async (owner: string, repo: string, runId: number): Promise<string> => {
      if (!octokit) throw new Error("GitHub API not initialized");

      try {
        setIsLoading(true);
        const response = await octokit.rest.actions.downloadWorkflowRunLogs({
          owner,
          repo,
          run_id: runId,
        });

        // The response.data is a Buffer, convert to string
        const buffer = response.data as Buffer;
        return buffer.toString();
      } catch (error) {
        console.error("Failed to fetch workflow logs:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [octokit],
  );

  // Get pull requests
  const getPullRequests = useCallback(
    async (
      owner: string,
      repo: string,
      state: "open" | "closed" | "all" = "open",
      perPage = 30,
      page = 1,
    ): Promise<PullRequest[]> => {
      if (!octokit) throw new Error("GitHub API not initialized");

      try {
        setIsLoading(true);
        const { data } = await octokit.rest.pulls.list({
          owner,
          repo,
          state,
          per_page: perPage,
          page,
        });
        return data as PullRequest[];
      } catch (error) {
        console.error("Failed to fetch pull requests:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [octokit],
  );

  // Get workflow jobs
  const getWorkflowJobs = useCallback(
    async (
      owner: string,
      repo: string,
      runId: number,
    ): Promise<WorkflowJob[]> => {
      if (!octokit) throw new Error("GitHub API not initialized");

      try {
        setIsLoading(true);
        const { data } = await octokit.rest.actions.listJobsForWorkflowRun({
          owner,
          repo,
          run_id: runId,
        });
        return data.jobs as WorkflowJob[];
      } catch (error) {
        console.error("Failed to fetch workflow jobs:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [octokit],
  );

  // Get workflow run details
  const getWorkflowRunDetails = useCallback(
    async (
      owner: string,
      repo: string,
      runId: number,
    ): Promise<WorkflowRun> => {
      if (!octokit) throw new Error("GitHub API not initialized");

      try {
        setIsLoading(true);
        const { data } = await octokit.rest.actions.getWorkflowRun({
          owner,
          repo,
          run_id: runId,
        });
        return data as WorkflowRun;
      } catch (error) {
        console.error("Failed to fetch workflow run details:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [octokit],
  );

  // Search repositories
  const searchRepositories = useCallback(
    async (query: string, perPage = 30, page = 1): Promise<SearchResults> => {
      if (!octokit) throw new Error("GitHub API not initialized");

      try {
        setIsLoading(true);
        const { data } = await octokit.rest.search.repos({
          q: query,
          per_page: perPage,
          page,
          sort: "stars",
          order: "desc",
        });
        return data as SearchResults;
      } catch (error) {
        console.error("Failed to search repositories:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [octokit],
  );

  // Get repository by full name
  const getRepositoryByFullName = useCallback(
    async (fullName: string): Promise<Repository | null> => {
      if (!octokit) throw new Error("GitHub API not initialized");

      try {
        setIsLoading(true);
        const [owner, repo] = fullName.split("/");
        if (!owner || !repo) {
          return null;
        }

        const { data } = await octokit.rest.repos.get({
          owner,
          repo,
        });
        return data as Repository;
      } catch (error) {
        console.error("Failed to fetch repository:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [octokit],
  );

  // Parse GitHub URL
  const parseGithubUrl = useCallback(
    (url: string): { owner: string; repo: string } | null => {
      try {
        const urlObj = new URL(url);
        if (!urlObj.hostname.includes("github.com")) {
          return null;
        }

        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        if (pathParts.length >= 2) {
          return {
            owner: pathParts[0],
            repo: pathParts[1],
          };
        }
        return null;
      } catch (error) {
        console.error("Invalid GitHub URL:", error);
        return null;
      }
    },
    [],
  );

  return {
    octokit,
    isAuthenticated,
    isLoading,
    validateToken,
    getUserRepos,
    getRepoDetails,
    getWorkflows,
    getWorkflowRuns,
    getWorkflowRunLogs,
    getPullRequests,
    searchRepositories,
    getRepositoryByFullName,
    parseGithubUrl,
  };
}

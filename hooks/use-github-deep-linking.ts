import { useCallback, useEffect, useState } from "react";
import * as Linking from "expo-linking";

export interface GithubUrlData {
  type: "repository" | "pull_request" | "issue" | "workflow" | "unknown";
  owner: string;
  repo: string;
  number?: number; // For PRs and issues
  workflowId?: number; // For workflows
  branch?: string; // For branches
  path?: string; // For file paths
}

export function useGithubDeepLinking() {
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  // Parse GitHub URL into structured data
  const parseGithubUrlData = useCallback(
    (url: string): GithubUrlData | null => {
      try {
        const urlObj = new URL(url);
        if (!urlObj.hostname.includes("github.com")) {
          return null;
        }

        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        if (pathParts.length < 2) {
          return null;
        }

        const owner = pathParts[0];
        const repo = pathParts[1];
        const remainingPath = pathParts.slice(2);

        const data: GithubUrlData = {
          type: "repository",
          owner,
          repo,
        };

        // Parse specific GitHub URL patterns
        if (remainingPath.length >= 1) {
          const section = remainingPath[0];

          switch (section) {
            case "pull":
            case "issues":
              if (remainingPath.length >= 2) {
                data.type = section === "pull" ? "pull_request" : "issue";
                data.number = parseInt(remainingPath[1], 10);
              }
              break;

            case "actions":
              if (
                remainingPath.length >= 2 &&
                remainingPath[1] === "workflows"
              ) {
                data.type = "workflow";
                if (remainingPath.length >= 3) {
                  data.workflowId = parseInt(remainingPath[2], 10);
                }
              }
              break;

            case "tree":
            case "blob":
              if (remainingPath.length >= 2) {
                data.branch = remainingPath[1];
                data.path = remainingPath.slice(2).join("/");
              }
              break;

            default:
              // Check if it's a branch or tag
              if (
                !section.startsWith("pull/") &&
                !section.startsWith("issues/")
              ) {
                data.branch = section;
              }
              break;
          }
        }

        return data;
      } catch (error) {
        console.error("Failed to parse GitHub URL:", error);
        return null;
      }
    },
    [],
  );

  // Handle incoming deep links
  const handleDeepLink = useCallback(
    async (event: { url: string }) => {
      const url = event.url;
      setLastUrl(url);

      const urlData = parseGithubUrlData(url);
      if (urlData) {
        console.log("GitHub deep link detected:", urlData);

        // You can add custom logic here based on the URL type
        switch (urlData.type) {
          case "repository":
            console.log(`Opening repository: ${urlData.owner}/${urlData.repo}`);
            break;
          case "pull_request":
            console.log(
              `Opening PR #${urlData.number} in ${urlData.owner}/${urlData.repo}`,
            );
            break;
          case "issue":
            console.log(
              `Opening issue #${urlData.number} in ${urlData.owner}/${urlData.repo}`,
            );
            break;
          case "workflow":
            console.log(
              `Opening workflow ${urlData.workflowId} in ${urlData.owner}/${urlData.repo}`,
            );
            break;
        }
      }
    },
    [parseGithubUrlData],
  );

  // Get initial URL on app launch
  const getInitialUrl = useCallback(async () => {
    try {
      const url = await Linking.getInitialURL();
      if (url) {
        setInitialUrl(url);
        await handleDeepLink({ url });
      }
    } catch (error) {
      console.error("Failed to get initial URL:", error);
    }
  }, [handleDeepLink]);

  // Listen for deep link events
  useEffect(() => {
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Get initial URL
    getInitialUrl();

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink, getInitialUrl]);

  // Create GitHub URLs
  const createGithubUrl = useCallback((data: GithubUrlData): string => {
    const baseUrl = `https://github.com/${data.owner}/${data.repo}`;

    switch (data.type) {
      case "repository":
        return baseUrl;
      case "pull_request":
        return `${baseUrl}/pull/${data.number}`;
      case "issue":
        return `${baseUrl}/issues/${data.number}`;
      case "workflow":
        return data.workflowId
          ? `${baseUrl}/actions/workflows/${data.workflowId}`
          : `${baseUrl}/actions`;
      case "unknown":
        return baseUrl;
      default:
        return baseUrl;
    }
  }, []);

  // Open GitHub URL in external browser
  const openGithubUrl = useCallback(async (url: string): Promise<boolean> => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to open GitHub URL:", error);
      return false;
    }
  }, []);

  // Open repository in browser
  const openRepository = useCallback(
    async (owner: string, repo: string): Promise<boolean> => {
      const url = `https://github.com/${owner}/${repo}`;
      return openGithubUrl(url);
    },
    [openGithubUrl],
  );

  // Open pull request in browser
  const openPullRequest = useCallback(
    async (owner: string, repo: string, number: number): Promise<boolean> => {
      const url = `https://github.com/${owner}/${repo}/pull/${number}`;
      return openGithubUrl(url);
    },
    [openGithubUrl],
  );

  // Open issue in browser
  const openIssue = useCallback(
    async (owner: string, repo: string, number: number): Promise<boolean> => {
      const url = `https://github.com/${owner}/${repo}/issues/${number}`;
      return openGithubUrl(url);
    },
    [openGithubUrl],
  );

  return {
    initialUrl,
    lastUrl,
    parseGithubUrlData,
    handleDeepLink,
    createGithubUrl,
    openGithubUrl,
    openRepository,
    openPullRequest,
    openIssue,
    getInitialUrl,
  };
}

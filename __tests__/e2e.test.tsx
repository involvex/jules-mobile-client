import {
  render,
  fireEvent,
  waitFor,
  screen,
} from "@testing-library/react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { ApiKeyProvider } from "@/constants/api-key-context";
import { GithubProvider } from "@/constants/github-context";
import CreateSession from "@/app/create-session";
import SessionDetail from "@/app/session/[id]";
import Repos from "@/app/(tabs)/repos";

// Mock navigation
const Stack = createNativeStackNavigator();

const TestApp = () => (
  <NavigationContainer>
    <ApiKeyProvider>
      <GithubProvider>
        <Stack.Navigator>
          <Stack.Screen name="Repos" component={Repos} />
          <Stack.Screen name="CreateSession" component={CreateSession} />
          <Stack.Screen name="SessionDetail" component={SessionDetail} />
        </Stack.Navigator>
      </GithubProvider>
    </ApiKeyProvider>
  </NavigationContainer>
);

describe("End-to-End User Journeys", () => {
  beforeEach(() => {
    // Mock all necessary hooks and APIs
    jest.clearAllMocks();
  });

  describe("Repository Selection to Session Creation", () => {
    it("should allow user to select repository and create session", async () => {
      // Mock successful repository fetch
      const mockRepos = [
        {
          id: 1,
          name: "test-repo",
          full_name: "testuser/test-repo",
          owner: { login: "testuser", avatar_url: "avatar.jpg" },
          private: false,
          html_url: "https://github.com/testuser/test-repo",
          language: "JavaScript",
          stargazers_count: 10,
          forks_count: 5,
          updated_at: "2023-01-01T00:00:00Z",
        },
      ];

      // Mock successful session creation
      const mockSession = {
        id: "session-123",
        name: "Test Session",
        prompt: "Fix the bug",
        createdAt: new Date(),
        github: {
          owner: "testuser",
          repo: "test-repo",
          defaultBranch: "main",
        },
      };

      render(<TestApp />);

      // Wait for repositories to load
      await waitFor(() => {
        expect(screen.getByText("test-repo")).toBeTruthy();
      });

      // Select repository
      const repoButton = screen.getByText("test-repo");
      fireEvent.press(repoButton);

      // Should navigate to create session screen
      await waitFor(() => {
        expect(screen.getByText("Create Session")).toBeTruthy();
      });

      // Fill in session details
      const promptInput = screen.getByPlaceholderText("Enter your prompt");
      fireEvent.changeText(promptInput, "Fix the bug");

      // Create session
      const createButton = screen.getByText("Create Session");
      fireEvent.press(createButton);

      // Should navigate to session detail
      await waitFor(() => {
        expect(screen.getByText("Test Session")).toBeTruthy();
      });

      expect(screen.getByText("Fix the bug")).toBeTruthy();
    });

    it("should handle repository selection with error", async () => {
      // Mock API error
      const mockError = new Error("Network error");

      render(<TestApp />);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText("Failed to load repositories")).toBeTruthy();
      });

      // Should show retry button
      const retryButton = screen.getByText("Retry");
      fireEvent.press(retryButton);

      // Should attempt to reload
      await waitFor(() => {
        expect(screen.getByText("Loading...")).toBeTruthy();
      });
    });
  });

  describe("Workflow Monitoring Journey", () => {
    it("should allow user to monitor workflow runs", async () => {
      // Mock workflow data
      const mockWorkflows = [
        {
          id: 1,
          name: "CI/CD Pipeline",
          path: ".github/workflows/ci.yml",
          state: "active",
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        },
      ];

      const mockWorkflowRuns = [
        {
          id: 100,
          name: "Build and Test",
          status: "in_progress",
          conclusion: null,
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        },
        {
          id: 101,
          name: "Deploy",
          status: "completed",
          conclusion: "success",
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        },
      ];

      render(<TestApp />);

      // Navigate to session with GitHub integration
      await waitFor(() => {
        expect(screen.getByText("GitHub Workflows")).toBeTruthy();
      });

      // Select workflow
      const workflowButton = screen.getByText("CI/CD Pipeline");
      fireEvent.press(workflowButton);

      // Should show workflow runs
      await waitFor(() => {
        expect(screen.getByText("Build and Test")).toBeTruthy();
        expect(screen.getByText("Deploy")).toBeTruthy();
      });

      // Select workflow run to view logs
      const runButton = screen.getByText("Build and Test");
      fireEvent.press(runButton);

      // Should show logs viewer
      await waitFor(() => {
        expect(screen.getByText("Workflow Logs")).toBeTruthy();
      });

      // Should show real-time updates
      await waitFor(() => {
        expect(screen.getByText("in_progress")).toBeTruthy();
      });
    });

    it("should handle workflow monitoring with errors", async () => {
      render(<TestApp />);

      // Navigate to workflow section
      await waitFor(() => {
        expect(screen.getByText("GitHub Workflows")).toBeTruthy();
      });

      // Mock API error during workflow fetch
      const errorButton = screen.getByText("Trigger Error");
      fireEvent.press(errorButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText("Failed to load workflows")).toBeTruthy();
      });

      // Should show retry option
      const retryButton = screen.getByText("Retry");
      fireEvent.press(retryButton);
    });
  });

  describe("Pull Request Analysis Journey", () => {
    it("should allow user to analyze pull requests", async () => {
      const mockPullRequests = [
        {
          number: 123,
          title: "Fix authentication bug",
          body: "This PR fixes the authentication issue",
          user: { login: "contributor" },
          html_url: "https://github.com/user/repo/pull/123",
          state: "open",
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        },
      ];

      const mockAnalysis = {
        id: 123,
        title: "Fix authentication bug",
        confidence: 0.85,
        summary: "This PR fixes the authentication issue",
        issues: ["Security vulnerability", "Code style issues"],
        suggestions: ["Add input validation", "Improve error handling"],
        riskLevel: "medium",
        timeEstimate: "30 minutes",
        createdAt: new Date(),
      };

      render(<TestApp />);

      // Navigate to PR analysis section
      await waitFor(() => {
        expect(screen.getByText("Pull Request Analysis")).toBeTruthy();
      });

      // Select PR
      const prButton = screen.getByText("Fix authentication bug");
      fireEvent.press(prButton);

      // Should show analysis button
      const analyzeButton = screen.getByText("Analyze PR");
      fireEvent.press(analyzeButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText("Analyzing...")).toBeTruthy();
      });

      // Should show analysis results
      await waitFor(() => {
        expect(screen.getByText("Analysis Complete")).toBeTruthy();
        expect(screen.getByText("medium")).toBeTruthy();
      });

      // Should show detailed analysis
      const detailsButton = screen.getByText("View Details");
      fireEvent.press(detailsButton);

      await waitFor(() => {
        expect(screen.getByText("Security vulnerability")).toBeTruthy();
        expect(screen.getByText("Add input validation")).toBeTruthy();
      });
    });

    it("should handle PR analysis errors gracefully", async () => {
      render(<TestApp />);

      // Navigate to PR analysis
      await waitFor(() => {
        expect(screen.getByText("Pull Request Analysis")).toBeTruthy();
      });

      // Select PR
      const prButton = screen.getByText("Fix authentication bug");
      fireEvent.press(prButton);

      // Mock analysis error
      const analyzeButton = screen.getByText("Analyze PR");
      fireEvent.press(analyzeButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText("Analysis failed")).toBeTruthy();
      });

      // Should show retry option
      const retryButton = screen.getByText("Retry Analysis");
      fireEvent.press(retryButton);
    });
  });

  describe("Complete GitHub Integration Workflow", () => {
    it("should handle complete workflow from repo selection to session completion", async () => {
      const mockRepos = [
        {
          id: 1,
          name: "ecommerce-app",
          full_name: "devteam/ecommerce-app",
          owner: { login: "devteam", avatar_url: "avatar.jpg" },
          private: false,
          html_url: "https://github.com/devteam/ecommerce-app",
          language: "JavaScript",
          stargazers_count: 150,
          forks_count: 75,
          updated_at: "2023-01-01T00:00:00Z",
        },
      ];

      const mockSession = {
        id: "session-456",
        name: "E-commerce Bug Fix",
        prompt: "Fix the checkout flow bug",
        createdAt: new Date(),
        github: {
          owner: "devteam",
          repo: "ecommerce-app",
          defaultBranch: "main",
        },
      };

      const mockWorkflows = [
        {
          id: 1,
          name: "CI/CD Pipeline",
          path: ".github/workflows/ci.yml",
          state: "active",
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        },
      ];

      render(<TestApp />);

      // Step 1: Select repository
      await waitFor(() => {
        expect(screen.getByText("ecommerce-app")).toBeTruthy();
      });

      const repoButton = screen.getByText("ecommerce-app");
      fireEvent.press(repoButton);

      // Step 2: Create session
      await waitFor(() => {
        expect(screen.getByText("Create Session")).toBeTruthy();
      });

      const promptInput = screen.getByPlaceholderText("Enter your prompt");
      fireEvent.changeText(promptInput, "Fix the checkout flow bug");

      const createButton = screen.getByText("Create Session");
      fireEvent.press(createButton);

      // Step 3: Navigate to session detail
      await waitFor(() => {
        expect(screen.getByText("E-commerce Bug Fix")).toBeTruthy();
      });

      // Step 4: Monitor workflows
      const workflowsButton = screen.getByText("GitHub Workflows");
      fireEvent.press(workflowsButton);

      await waitFor(() => {
        expect(screen.getByText("CI/CD Pipeline")).toBeTruthy();
      });

      // Step 5: View workflow runs
      const workflowButton = screen.getByText("CI/CD Pipeline");
      fireEvent.press(workflowButton);

      await waitFor(() => {
        expect(screen.getByText("Build and Test")).toBeTruthy();
      });

      // Step 6: View logs
      const runButton = screen.getByText("Build and Test");
      fireEvent.press(runButton);

      await waitFor(() => {
        expect(screen.getByText("Workflow Logs")).toBeTruthy();
      });

      // Step 7: Analyze PRs
      const prAnalysisButton = screen.getByText("Pull Request Analysis");
      fireEvent.press(prAnalysisButton);

      await waitFor(() => {
        expect(screen.getByText("Fix authentication bug")).toBeTruthy();
      });

      // Step 8: Complete analysis
      const prButton = screen.getByText("Fix authentication bug");
      fireEvent.press(prButton);

      const analyzeButton = screen.getByText("Analyze PR");
      fireEvent.press(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText("Analysis Complete")).toBeTruthy();
      });

      // Verify complete workflow was successful
      expect(screen.getByText("medium")).toBeTruthy();
      expect(screen.getByText("Security vulnerability")).toBeTruthy();
    });

    it("should handle network interruptions gracefully", async () => {
      render(<TestApp />);

      // Simulate network error during repository fetch
      const errorButton = screen.getByText("Simulate Network Error");
      fireEvent.press(errorButton);

      // Should show offline indicator
      await waitFor(() => {
        expect(screen.getByText("No internet connection")).toBeTruthy();
      });

      // Should show cached data if available
      await waitFor(() => {
        expect(screen.getByText("Cached repositories")).toBeTruthy();
      });

      // Should retry when connection is restored
      const retryButton = screen.getByText("Retry");
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(screen.getByText("Loading...")).toBeTruthy();
      });
    });
  });

  describe("Error Recovery and Edge Cases", () => {
    it("should handle invalid GitHub URLs gracefully", async () => {
      render(<TestApp />);

      // Navigate to URL input
      const urlInput = screen.getByPlaceholderText("Enter GitHub URL");
      fireEvent.changeText(urlInput, "invalid-url");

      const submitButton = screen.getByText("Submit");
      fireEvent.press(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText("Invalid GitHub URL")).toBeTruthy();
      });
    });

    it("should handle authentication errors", async () => {
      render(<TestApp />);

      // Simulate expired token
      const expiredTokenButton = screen.getByText("Simulate Expired Token");
      fireEvent.press(expiredTokenButton);

      // Should show authentication error
      await waitFor(() => {
        expect(screen.getByText("Authentication required")).toBeTruthy();
      });

      // Should show login option
      const loginButton = screen.getByText("Login to GitHub");
      fireEvent.press(loginButton);
    });

    it("should handle rate limiting", async () => {
      render(<TestApp />);

      // Simulate rapid API calls
      for (let i = 0; i < 10; i++) {
        const refreshButton = screen.getByText("Refresh");
        fireEvent.press(refreshButton);
      }

      // Should show rate limit warning
      await waitFor(() => {
        expect(screen.getByText("API rate limit exceeded")).toBeTruthy();
      });

      // Should show retry after delay
      await waitFor(() => {
        expect(screen.getByText("Retry in 1 minute")).toBeTruthy();
      });
    });
  });
});

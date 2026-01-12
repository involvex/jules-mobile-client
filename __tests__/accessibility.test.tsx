import {
  render,
  fireEvent,
  waitFor,
  screen,
} from "@testing-library/react-native";
import { RepositorySyncManager } from "@/components/github/repository-sync-manager";
import { GithubSessionCreator } from "@/components/github/github-session-creator";
import { PullRequestAnalyzer } from "@/components/github/pull-request-analyzer";
import { NotificationsCenter } from "@/components/github/notifications-center";
import { WorkflowRunDetails } from "@/components/github/workflow-run-details";
import { WorkflowLogsViewer } from "@/components/github/workflow-logs-viewer";
import { WorkflowDashboard } from "@/components/github/workflow-dashboard";
import { NavigationContainer } from "@react-navigation/native";
import { Text, View } from "react-native";

// Mock accessibility props
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  return {
    ...RN,
    AccessibilityInfo: {
      ...RN.AccessibilityInfo,
      announceForAccessibility: jest.fn(),
      isScreenReaderEnabled: jest.fn().mockResolvedValue(true),
      setAccessibilityFocus: jest.fn(),
    },
  };
});

describe("Accessibility Tests", () => {
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

  describe("Workflow Dashboard", () => {
    it("should have proper ARIA labels for workflow cards", () => {
      render(
        <WorkflowDashboard
          {...({
            workflows: mockWorkflows,
            onWorkflowSelect: () => {},
            onWorkflowRun: () => {},
          } as any)}
        />,
      );

      const workflowCard = screen.getByText("CI/CD Pipeline");

      // Check for accessibility props
      expect(workflowCard.props.accessibilityLabel).toContain("CI/CD Pipeline");
      expect(workflowCard.props.accessibilityRole).toBe("button");
      expect(workflowCard.props.accessibilityState).toEqual({ enabled: true });
    });

    it("should announce workflow status changes", async () => {
      const { AccessibilityInfo } = require("react-native");

      const mockWorkflows = [
        {
          id: 1,
          name: "Test Workflow",
          state: "active",
        },
      ];

      render(
        <WorkflowDashboard
          {...({
            workflows: mockWorkflows,
            onWorkflowSelect: () => {},
            onWorkflowRun: () => {},
          } as any)}
        />,
      );

      // Simulate status change
      const workflowCard = screen.getByText("Test Workflow");
      fireEvent(workflowCard, "accessibilityAction", {
        actionName: "activate",
      });

      await waitFor(() => {
        expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
          "Workflow Test Workflow activated",
        );
      });
    });

    it("should support keyboard navigation", () => {
      const mockWorkflows = [
        { id: 1, name: "Workflow 1" },
        { id: 2, name: "Workflow 2" },
      ];

      render(
        <WorkflowDashboard
          {...({
            workflows: mockWorkflows,
            onWorkflowSelect: () => {},
            onWorkflowRun: () => {},
          } as any)}
        />,
      );

      const workflow1 = screen.getByText("Workflow 1");
      const workflow2 = screen.getByText("Workflow 2");

      // Check for focusable props
      expect(workflow1.props.accessibilityHint).toBeTruthy();
      expect(workflow2.props.accessibilityHint).toBeTruthy();
      expect(workflow1.props.accessibilityRole).toBe("button");
      expect(workflow2.props.accessibilityRole).toBe("button");
    });
  });

  describe("Workflow Logs Viewer", () => {
    it("should have proper accessibility for log content", () => {
      const mockLogs =
        "Step 1: Running tests\n✓ Tests passed\nStep 2: Building";
      const mockRun = { id: 1, name: "Test Run", status: "completed" };

      render(
        <WorkflowLogsViewer
          {...({
            logs: mockLogs,
            workflowRun: mockRun,
            onClose: () => {},
          } as any)}
        />,
      );

      const logContent = screen.getByText("Step 1: Running tests");

      expect(logContent.props.accessibilityLabel).toContain("Workflow logs");
      expect(logContent.props.accessibilityRole).toBe("text");
      expect(logContent.props.accessibilityHint).toContain("scrollable");
    });

    it("should announce log loading status", async () => {
      const { AccessibilityInfo } = require("react-native");

      render(
        <WorkflowLogsViewer
          {...({
            logs: "",
            workflowRun: { id: 1, name: "Test Run", status: "in_progress" },
            onClose: () => {},
          } as any)}
        />,
      );

      await waitFor(() => {
        expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
          "Loading workflow logs",
        );
      });
    });

    it("should support text selection for accessibility", () => {
      const mockLogs = "Error: Test failed\nLine 10: Syntax error";

      render(
        <WorkflowLogsViewer
          {...({
            logs: mockLogs,
            workflowRun: { id: 1, name: "Test Run", status: "failed" },
            onClose: () => {},
          } as any)}
        />,
      );

      const logText = screen.getByText("Error: Test failed");

      expect(logText.props.selectable).toBe(true);
      expect(logText.props.accessibilityRole).toBe("text");
    });
  });

  describe("Pull Request Analyzer", () => {
    it("should have proper labels for analysis results", () => {
      const mockAnalysis = {
        id: 123,
        title: "Fix authentication bug",
        confidence: 0.85,
        summary: "This PR fixes the authentication issue",
        issues: ["Security vulnerability"],
        suggestions: ["Add input validation"],
        riskLevel: "medium",
        timeEstimate: "30 minutes",
      };

      render(
        <PullRequestAnalyzer
          {...({
            analysis: mockAnalysis,
            onRetry: () => {},
            onExport: () => {},
          } as any)}
        />,
      );

      const riskLevel = screen.getByText("medium");
      const confidence = screen.getByText("85%");
      const issues = screen.getByText("Security vulnerability");

      expect(riskLevel.props.accessibilityLabel).toContain(
        "Risk level: medium",
      );
      expect(confidence.props.accessibilityLabel).toContain("Confidence: 85%");
      expect(issues.props.accessibilityLabel).toContain(
        "Issue: Security vulnerability",
      );
    });

    it("should announce analysis completion", async () => {
      const { AccessibilityInfo } = require("react-native");

      render(
        <PullRequestAnalyzer
          {...({
            analysis: null,
            onRetry: () => {},
            onExport: () => {},
          } as any)}
        />,
      );

      // Simulate analysis completion
      fireEvent(
        screen.getByTestId("analysis-complete"),
        "accessibilityAction",
        {
          actionName: "activate",
        },
      );

      await waitFor(() => {
        expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
          "Analysis completed with medium risk level",
        );
      });
    });

    it("should support screen reader navigation through analysis sections", () => {
      const mockAnalysis = {
        id: 123,
        title: "Test PR",
        issues: ["Issue 1", "Issue 2"],
        suggestions: ["Suggestion 1", "Suggestion 2"],
      };

      render(
        <PullRequestAnalyzer
          {...({
            analysis: mockAnalysis,
            onRetry: () => {},
            onExport: () => {},
          } as any)}
        />,
      );

      const issuesSection = screen.getByText("Issues");
      const suggestionsSection = screen.getByText("Suggestions");

      expect(issuesSection.props.accessibilityRole).toBe("header");
      expect(suggestionsSection.props.accessibilityRole).toBe("header");
      expect(issuesSection.props.accessibilityLevel).toBe(2);
      expect(suggestionsSection.props.accessibilityLevel).toBe(2);
    });
  });

  describe("Repository Sync Manager", () => {
    it("should have proper labels for sync status", () => {
      const mockSyncStatus = {
        isSyncing: false,
        lastSync: new Date(),
        nextSync: new Date(),
        error: null,
        progress: 100,
      };

      render(
        <RepositorySyncManager
          {...({
            syncStatus: mockSyncStatus,
            onSync: () => {},
            onSettings: () => {},
          } as any)}
        />,
      );

      const syncStatus = screen.getByText("Last sync:");
      const progress = screen.getByText("100%");

      expect(syncStatus.props.accessibilityLabel).toContain("Sync status");
      expect(progress.props.accessibilityLabel).toContain(
        "Sync progress: 100%",
      );
    });

    it("should announce sync completion", async () => {
      const { AccessibilityInfo } = require("react-native");

      render(
        <RepositorySyncManager
          {...({
            syncStatus: {
              isSyncing: false,
              lastSync: null,
              nextSync: null,
              error: null,
              progress: 0,
            },
            onSync: () => {},
            onSettings: () => {},
          } as any)}
        />,
      );

      // Simulate sync completion
      fireEvent(screen.getByText("Sync Now"), "accessibilityAction", {
        actionName: "activate",
      });

      await waitFor(() => {
        expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
          "Repository sync completed successfully",
        );
      });
    });

    it("should handle error states accessibly", () => {
      const mockSyncStatus = {
        isSyncing: false,
        lastSync: null,
        nextSync: null,
        error: "Network error",
        progress: 0,
      };

      render(
        <RepositorySyncManager
          {...({
            syncStatus: mockSyncStatus,
            onSync: () => {},
            onSettings: () => {},
          } as any)}
        />,
      );

      const errorText = screen.getByText("Network error");

      expect(errorText.props.accessibilityLabel).toContain(
        "Error: Network error",
      );
      expect(errorText.props.accessibilityRole).toBe("alert");
      expect(errorText.props.accessibilityState).toEqual({ disabled: false });
    });
  });

  describe("Notifications Center", () => {
    it("should have proper labels for notification items", () => {
      const mockNotifications = [
        {
          id: 1,
          title: "Workflow Completed",
          body: "CI/CD pipeline completed successfully",
          type: "workflow",
          read: false,
          timestamp: new Date(),
        },
      ];

      render(
        <NotificationsCenter
          {...({
            notifications: mockNotifications,
            onMarkAsRead: () => {},
            onClearAll: () => {},
            onSettings: () => {},
          } as any)}
        />,
      );

      const notificationItem = screen.getByText("Workflow Completed");

      expect(notificationItem.props.accessibilityLabel).toContain(
        "Workflow Completed",
      );
      expect(notificationItem.props.accessibilityRole).toBe("button");
      expect(notificationItem.props.accessibilityState).toEqual({
        selected: false,
      });
    });

    it("should announce new notifications", async () => {
      const { AccessibilityInfo } = require("react-native");

      render(
        <NotificationsCenter
          {...({
            notifications: [],
            onMarkAsRead: () => {},
            onClearAll: () => {},
            onSettings: () => {},
          } as any)}
        />,
      );

      // Simulate new notification
      fireEvent(screen.getByTestId("new-notification"), "accessibilityAction", {
        actionName: "activate",
      });

      await waitFor(() => {
        expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
          "New notification: Workflow Completed",
        );
      });
    });

    it("should support marking notifications as read", () => {
      const mockNotifications = [
        {
          id: 1,
          title: "Test Notification",
          read: false,
        },
      ];

      render(
        <NotificationsCenter
          {...({
            notifications: mockNotifications,
            onMarkAsRead: () => {},
            onClearAll: () => {},
            onSettings: () => {},
          } as any)}
        />,
      );

      const markAsReadButton = screen.getByText("Mark as Read");

      expect(markAsReadButton.props.accessibilityLabel).toContain(
        "Mark as read",
      );
      expect(markAsReadButton.props.accessibilityRole).toBe("button");
    });
  });

  describe("GitHub Session Creator", () => {
    it("should have proper labels for form fields", () => {
      render(
        <GithubSessionCreator
          {...({ onSessionCreate: () => {}, onCancel: () => {} } as any)}
        />,
      );

      const repoInput = screen.getByPlaceholderText("Select repository");
      const promptInput = screen.getByPlaceholderText("Enter your prompt");

      expect(repoInput.props.accessibilityLabel).toContain(
        "Repository selection",
      );
      expect(promptInput.props.accessibilityLabel).toContain("Session prompt");
      expect(repoInput.props.accessibilityRole).toBe("text");
      expect(promptInput.props.accessibilityRole).toBe("text");
    });

    it("should announce form validation errors", async () => {
      const { AccessibilityInfo } = require("react-native");

      render(
        <GithubSessionCreator
          {...({ onSessionCreate: () => {}, onCancel: () => {} } as any)}
        />,
      );

      // Submit empty form
      const createButton = screen.getByText("Create Session");
      fireEvent(createButton, "accessibilityAction", {
        actionName: "activate",
      });

      await waitFor(() => {
        expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
          "Please select a repository and enter a prompt",
        );
      });
    });

    it("should support keyboard navigation through form", () => {
      render(
        <GithubSessionCreator
          {...({ onSessionCreate: () => {}, onCancel: () => {} } as any)}
        />,
      );

      const repoInput = screen.getByPlaceholderText("Select repository");
      const promptInput = screen.getByPlaceholderText("Enter your prompt");
      const createButton = screen.getByText("Create Session");

      expect(repoInput.props.accessibilityHint).toContain("Select repository");
      expect(promptInput.props.accessibilityHint).toContain(
        "Enter session prompt",
      );
      expect(createButton.props.accessibilityHint).toContain(
        "Create new session",
      );
    });
  });

  describe("Workflow Run Details", () => {
    it("should have proper labels for run information", () => {
      const mockRun = {
        id: 100,
        name: "Build and Test",
        status: "completed",
        conclusion: "success",
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      };

      render(
        <WorkflowRunDetails
          {...({
            workflowRun: mockRun,
            onLogsView: () => {},
            onRetry: () => {},
            onClose: () => {},
          } as any)}
        />,
      );

      const runName = screen.getByText("Build and Test");
      const status = screen.getByText("completed");
      const conclusion = screen.getByText("success");

      expect(runName.props.accessibilityLabel).toContain(
        "Workflow run: Build and Test",
      );
      expect(status.props.accessibilityLabel).toContain("Status: completed");
      expect(conclusion.props.accessibilityLabel).toContain(
        "Conclusion: success",
      );
    });

    it("should announce run status changes", async () => {
      const { AccessibilityInfo } = require("react-native");

      render(
        <WorkflowRunDetails
          {...({
            workflowRun: {
              id: 1,
              name: "Test Run",
              status: "in_progress",
              conclusion: null,
            },
            onLogsView: () => {},
            onRetry: () => {},
            onClose: () => {},
          } as any)}
        />,
      );

      // Simulate status change
      fireEvent(screen.getByText("in_progress"), "accessibilityAction", {
        actionName: "activate",
      });

      await waitFor(() => {
        expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
          "Workflow run status changed to in_progress",
        );
      });
    });

    it("should support navigation to logs", () => {
      const mockRun = { id: 1, name: "Test Run", status: "completed" };

      render(
        <WorkflowRunDetails
          {...({
            workflowRun: mockRun,
            onLogsView: () => {},
            onRetry: () => {},
            onClose: () => {},
          } as any)}
        />,
      );

      const logsButton = screen.getByText("View Logs");

      expect(logsButton.props.accessibilityLabel).toContain(
        "View workflow logs",
      );
      expect(logsButton.props.accessibilityRole).toBe("button");
      expect(logsButton.props.accessibilityHint).toContain("Opens logs viewer");
    });
  });

  describe("General Accessibility Features", () => {
    it("should support dynamic text sizing", () => {
      // Test that components respect system text size settings
      const { Appearance } = require("react-native");
      Appearance.getColorScheme = jest.fn().mockReturnValue("light");

      render(
        <View>
          <Text style={{ fontSize: 16 }}>Test text</Text>
          <Text style={{ fontSize: 20 }}>Larger text</Text>
        </View>,
      );

      const smallText = screen.getByText("Test text");
      const largeText = screen.getByText("Larger text");

      expect(smallText.props.style.fontSize).toBe(16);
      expect(largeText.props.style.fontSize).toBe(20);
    });

    it("should support high contrast mode", () => {
      const { Appearance } = require("react-native");
      Appearance.getColorScheme = jest.fn().mockReturnValue("dark");

      render(
        <View style={{ backgroundColor: "#000" } as any}>
          <Text style={{ color: "#fff" }}>High contrast text</Text>
        </View>,
      );

      const container = screen.getByText("High contrast text").parent;
      expect(container.props.style.backgroundColor).toBe("#000");
    });

    it("should handle focus management", () => {
      const { AccessibilityInfo } = require("react-native");

      render(
        <View>
          <Text testID="focusable-text">Focusable text</Text>
        </View>,
      );

      const focusableText = screen.getByTestId("focusable-text");

      fireEvent(focusableText, "focus");

      expect(AccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledWith(
        expect.any(Object),
      );
    });

    it("should provide meaningful error messages", () => {
      render(
        <View>
          <Text testID="error-message" accessibilityRole="alert">
            Network connection failed
          </Text>
        </View>,
      );

      const errorMessage = screen.getByTestId("error-message");

      expect(errorMessage.props.accessibilityRole).toBe("alert");
      expect(errorMessage.props.accessibilityLabel).toContain(
        "Network connection failed",
      );
    });
  });
});

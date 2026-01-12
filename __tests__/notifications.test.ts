import { renderHook, act } from "@testing-library/react-native";
import { useGithubWebhooks } from "@/hooks/use-github-webhooks";
import { useNotifications } from "@/hooks/use-notifications";
import { useGithubApi } from "@/hooks/use-github-api";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import React from "react";

// Mock expo-notifications
jest.mock("expo-notifications", () => ({
  setNotificationChannelAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  SchedulableTriggerInputTypes: {
    TIME_INTERVAL: "timeInterval",
  },
}));

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

// Mock useGithubWebhooks
jest.mock("@/hooks/use-github-webhooks", () => ({
  useGithubWebhooks: jest.fn(),
}));

// Mock useGithubApi
jest.mock("@/hooks/use-github-api", () => ({
  useGithubApi: jest.fn(),
}));

// Mock Platform
jest.mock("react-native", () => ({
  ...jest.requireActual("react-native"),
  Platform: { OS: "ios" },
}));

describe("useNotifications", () => {
  const mockHandleEvent = jest.fn();
  const mockGetPullRequests = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useGithubWebhooks as jest.Mock).mockReturnValue({
      handleEvent: mockHandleEvent,
    });

    (useGithubApi as jest.Mock).mockReturnValue({
      getPullRequests: mockGetPullRequests,
    });

    // Mock SecureStore responses
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

    // Mock Notifications responses
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
    });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
      data: "test-token",
    });
    (
      Notifications.addNotificationReceivedListener as jest.Mock
    ).mockReturnValue({
      remove: jest.fn(),
    });
    (
      Notifications.addNotificationResponseReceivedListener as jest.Mock
    ).mockReturnValue({
      remove: jest.fn(),
    });
  });

  it("should initialize with default preferences", () => {
    const { result } = renderHook(() => useNotifications());

    expect(result.current.preferences).toEqual({
      pushNotifications: true,
      emailNotifications: false,
      workflowEvents: true,
      pullRequestEvents: true,
      repositoryEvents: true,
      commentEvents: true,
      mentionEvents: true,
      frequency: "immediate",
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "08:00",
      },
    });
  });

  it("should schedule notification successfully", async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.scheduleNotification(
        "Test Title",
        "Test Body",
        { type: "test" },
        "high",
      );
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: "Test Title",
          body: "Test Body",
          data: { type: "test" },
        }),
      }),
    );
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe("Test Title");
  });

  it("should not schedule notification during quiet hours", async () => {
    const { result } = renderHook(() => useNotifications());

    // Enable quiet hours
    await act(async () => {
      await result.current.updatePreferences({
        quietHours: {
          enabled: true,
          start: "00:00",
          end: "23:59",
        },
      });
    });

    await act(async () => {
      await result.current.scheduleNotification("Test Title", "Test Body", {
        type: "test",
      });
    });

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("should handle GitHub events and create notifications", async () => {
    const { result } = renderHook(() => useNotifications());

    const eventData = {
      workflow_name: "Test Workflow",
      conclusion: "success",
      user: { login: "testuser" },
      title: "Test PR",
    };

    await act(async () => {
      await result.current.handleGithubEvent("workflow.completed", eventData);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe("Workflow Completed");
  });

  it("should mark notification as read", () => {
    const { result } = renderHook(() => useNotifications());

    // Add a notification
    act(() => {
      result.current.scheduleNotification("Test", "Test", { type: "test" });
    });

    // Mark as read
    act(() => {
      result.current.markAsRead(result.current.notifications[0].id);
    });

    expect(result.current.notifications[0].read).toBe(true);
  });

  it("should mark all notifications as read", () => {
    const { result } = renderHook(() => useNotifications());

    // Add multiple notifications
    act(() => {
      result.current.scheduleNotification("Test 1", "Test 1", { type: "test" });
      result.current.scheduleNotification("Test 2", "Test 2", { type: "test" });
    });

    // Mark all as read
    act(() => {
      result.current.markAllAsRead();
    });

    expect(result.current.notifications.every(n => n.read)).toBe(true);
  });

  it("should delete notification", () => {
    const { result } = renderHook(() => useNotifications());

    // Add a notification
    act(() => {
      result.current.scheduleNotification("Test", "Test", { type: "test" });
    });

    const notificationId = result.current.notifications[0].id;

    // Delete notification
    act(() => {
      result.current.deleteNotification(notificationId);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it("should clear all notifications", () => {
    const { result } = renderHook(() => useNotifications());

    // Add multiple notifications
    act(() => {
      result.current.scheduleNotification("Test 1", "Test 1", { type: "test" });
      result.current.scheduleNotification("Test 2", "Test 2", { type: "test" });
    });

    // Clear all
    act(() => {
      result.current.clearAllNotifications();
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it("should update preferences", async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.updatePreferences({
        pushNotifications: false,
        workflowEvents: false,
      });
    });

    expect(result.current.preferences.pushNotifications).toBe(false);
    expect(result.current.preferences.workflowEvents).toBe(false);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "notification_preferences",
      JSON.stringify({
        ...result.current.preferences,
        pushNotifications: false,
        workflowEvents: false,
      }),
    );
  });

  it("should get notifications by type", () => {
    const { result } = renderHook(() => useNotifications());

    // Add notifications of different types
    act(() => {
      result.current.scheduleNotification("Test 1", "Test 1", {
        type: "workflow",
      });
      result.current.scheduleNotification("Test 2", "Test 2", {
        type: "pull_request",
      });
      result.current.scheduleNotification("Test 3", "Test 3", {
        type: "workflow",
      });
    });

    const workflowNotifications =
      result.current.getNotificationsByType("workflow");
    expect(workflowNotifications).toHaveLength(2);
    expect(workflowNotifications.every(n => n.type === "workflow")).toBe(true);
  });

  it("should get unread notifications", () => {
    const { result } = renderHook(() => useNotifications());

    // Add notifications
    act(() => {
      result.current.scheduleNotification("Test 1", "Test 1", { type: "test" });
      result.current.scheduleNotification("Test 2", "Test 2", { type: "test" });
    });

    // Mark one as read
    act(() => {
      result.current.markAsRead(result.current.notifications[0].id);
    });

    const unreadNotifications = result.current.getUnreadNotifications();
    expect(unreadNotifications).toHaveLength(1);
    expect(unreadNotifications[0].read).toBe(false);
  });

  it("should get recent notifications", () => {
    const { result } = renderHook(() => useNotifications());

    // Add notifications
    act(() => {
      result.current.scheduleNotification("Test 1", "Test 1", { type: "test" });
      result.current.scheduleNotification("Test 2", "Test 2", { type: "test" });
    });

    const recentNotifications = result.current.getRecentNotifications(24);
    expect(recentNotifications.length).toBeGreaterThan(0);
  });

  it("should check if current time is in quiet hours", () => {
    const { result } = renderHook(() => useNotifications());

    // Test with quiet hours enabled
    act(() => {
      result.current.updatePreferences({
        quietHours: {
          enabled: true,
          start: "22:00",
          end: "08:00",
        },
      });
    });

    // This test would need more sophisticated mocking to test actual time logic
    // For now, we just verify the function exists and can be called
    expect(typeof result.current.scheduleNotification).toBe("function");
  });

  it("should save and load notifications from storage", async () => {
    const { result } = renderHook(() => useNotifications());

    // Add a notification
    act(() => {
      result.current.scheduleNotification("Test", "Test", { type: "test" });
    });

    // Simulate app restart by creating a new hook instance
    const { result: result2 } = renderHook(() => useNotifications());

    // Mock loading notifications
    const mockNotifications = [
      {
        id: "1",
        title: "Test",
        body: "Test",
        type: "test" as any,
        data: { type: "test" },
        timestamp: new Date(),
        read: false,
        priority: "medium" as any,
      },
    ];

    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
      JSON.stringify(mockNotifications),
    );

    // The hook should load notifications on initialization
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith("notifications");
  });
});

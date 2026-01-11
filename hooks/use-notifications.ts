import { useCallback, useEffect, useRef, useState } from "react";
import { useGithubWebhooks } from "./use-github-webhooks";
import * as Notifications from "expo-notifications";
import { useGithubApi } from "./use-github-api";
import { Platform } from "react-native";
import * as Device from "expo-device";

export interface NotificationPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  workflowEvents: boolean;
  pullRequestEvents: boolean;
  repositoryEvents: boolean;
  commentEvents: boolean;
  mentionEvents: boolean;
  frequency: "immediate" | "hourly" | "daily" | "weekly";
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: "workflow" | "pull_request" | "repository" | "comment" | "mention";
  data: any;
  timestamp: Date;
  read: boolean;
  priority: "low" | "medium" | "high";
  actionUrl?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  today: number;
  thisWeek: number;
}

export function useNotifications() {
  const { handleEvent } = useGithubWebhooks();
  const { getPullRequests } = useGithubApi();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    today: 0,
    thisWeek: 0,
  });
  const notificationListener = useRef();
  const responseListener = useRef();

  // Initialize notifications
  const initializeNotifications = useCallback(async () => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.log("Notification permissions not granted");
      return;
    }

    // Get push token
    const token = await Notifications.getExpoPushTokenAsync();
    console.log("Push token:", token);

    // Handle incoming notifications
    notificationListener.current =
      Notifications.addNotificationReceivedListener(notification => {
        console.log("Notification received:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(response => {
        console.log("Notification response:", response);
        handleNotificationAction(response);
      });

    // Load saved notifications and preferences
    await loadNotifications();
    await loadPreferences();
  }, []);

  // Schedule notification
  const scheduleNotification = useCallback(
    async (
      title: string,
      body: string,
      data?: any,
      priority: "low" | "medium" | "high" = "medium",
      delay?: number,
    ) => {
      if (!preferences.pushNotifications) {
        return;
      }

      // Check quiet hours
      if (isInQuietHours()) {
        return;
      }

      const content: Notifications.NotificationContentInput = {
        title,
        body,
        data,
        priority: getNotificationPriority(priority),
      };

      if (delay) {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: { seconds: delay },
        });
      } else {
        await Notifications.presentNotificationAsync(content);
      }

      // Add to local notifications list
      const notification: Notification = {
        id: Date.now().toString(),
        title,
        body,
        type: data?.type || "general",
        data,
        timestamp: new Date(),
        read: false,
        priority,
        actionUrl: data?.actionUrl,
      };

      setNotifications(prev => [notification, ...prev]);
      updateStats();
    },
    [preferences.pushNotifications],
  );

  // Handle GitHub events and create notifications
  const handleGithubEvent = useCallback(
    async (eventType: string, data: any) => {
      const shouldNotify = shouldCreateNotification(eventType, data);
      if (!shouldNotify) {
        return;
      }

      const notificationData = createNotificationData(eventType, data);
      if (notificationData) {
        await scheduleNotification(
          notificationData.title,
          notificationData.body,
          notificationData.data,
          notificationData.priority,
        );
      }
    },
    [scheduleNotification],
  );

  // Handle notification actions
  const handleNotificationAction = useCallback((response: any) => {
    const data = response.notification.request.content.data;
    if (data?.actionUrl) {
      // Navigate to the action URL
      console.log("Navigating to:", data.actionUrl);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)),
    );
    updateStats();
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    updateStats();
  }, []);

  // Delete notification
  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    updateStats();
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    updateStats();
  }, []);

  // Update preferences
  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>) => {
      const updatedPreferences = { ...preferences, ...newPreferences };
      setPreferences(updatedPreferences);

      // Save to storage
      await savePreferences(updatedPreferences);
    },
    [preferences],
  );

  // Get notifications by type
  const getNotificationsByType = useCallback(
    (type: Notification["type"]) => {
      return notifications.filter(n => n.type === type);
    },
    [notifications],
  );

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.read);
  }, [notifications]);

  // Get recent notifications
  const getRecentNotifications = useCallback(
    (hours: number = 24) => {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      return notifications.filter(n => n.timestamp > cutoff);
    },
    [notifications],
  );

  // Helper functions
  const isInQuietHours = useCallback(() => {
    if (!preferences.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startHours, startMinutes] = preferences.quietHours.start
      .split(":")
      .map(Number);
    const [endHours, endMinutes] = preferences.quietHours.end
      .split(":")
      .map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    if (startTotalMinutes <= endTotalMinutes) {
      // Same day range
      return (
        currentMinutes >= startTotalMinutes && currentMinutes <= endTotalMinutes
      );
    } else {
      // Overnight range
      return (
        currentMinutes >= startTotalMinutes || currentMinutes <= endTotalMinutes
      );
    }
  }, [preferences.quietHours]);

  const getNotificationPriority = useCallback(
    (priority: "low" | "medium" | "high") => {
      switch (priority) {
        case "high":
          return Notifications.AndroidNotificationPriority.HIGH;
        case "medium":
          return Notifications.AndroidNotificationPriority.DEFAULT;
        case "low":
          return Notifications.AndroidNotificationPriority.LOW;
      }
    },
    [],
  );

  const shouldCreateNotification = useCallback(
    (eventType: string, data: any): boolean => {
      switch (eventType) {
        case "workflow.completed":
          return preferences.workflowEvents;
        case "pull_request.opened":
        case "pull_request.closed":
        case "pull_request.review_requested":
          return preferences.pullRequestEvents;
        case "repository.created":
        case "repository.deleted":
          return preferences.repositoryEvents;
        case "issue_comment.created":
        case "pull_request_review_comment.created":
          return preferences.commentEvents;
        case "mention":
          return preferences.mentionEvents;
        default:
          return true;
      }
    },
    [preferences],
  );

  const createNotificationData = useCallback((eventType: string, data: any) => {
    switch (eventType) {
      case "workflow.completed":
        return {
          title: "Workflow Completed",
          body: `${data.workflow_name} finished with status: ${data.conclusion}`,
          data: { type: "workflow", ...data },
          priority: data.conclusion === "success" ? "low" : "high",
        };
      case "pull_request.opened":
        return {
          title: "New Pull Request",
          body: `${data.user.login} opened PR: ${data.title}`,
          data: { type: "pull_request", ...data },
          priority: "medium",
        };
      case "pull_request.closed":
        return {
          title: "Pull Request Closed",
          body: `PR #${data.number} was ${data.state}`,
          data: { type: "pull_request", ...data },
          priority: "low",
        };
      case "repository.created":
        return {
          title: "Repository Created",
          body: `New repository: ${data.repository.full_name}`,
          data: { type: "repository", ...data },
          priority: "low",
        };
      case "mention":
        return {
          title: "You were mentioned",
          body: `${data.user.login} mentioned you in ${data.context}`,
          data: { type: "mention", ...data },
          priority: "high",
        };
      default:
        return null;
    }
  }, []);

  const updateStats = useCallback(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const today = notifications.filter(
      n => n.timestamp.toDateString() === new Date().toDateString(),
    ).length;
    const thisWeek = notifications.filter(
      n => n.timestamp.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).length;

    setStats({ total, unread, today, thisWeek });
  }, [notifications]);

  const savePreferences = useCallback(
    async (prefs: NotificationPreferences) => {
      try {
        await SecureStore.setItemAsync(
          "notification_preferences",
          JSON.stringify(prefs),
        );
      } catch (error) {
        console.error("Failed to save preferences:", error);
      }
    },
    [],
  );

  const loadPreferences = useCallback(async () => {
    try {
      const saved = await SecureStore.getItemAsync("notification_preferences");
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    }
  }, []);

  const saveNotifications = useCallback(async () => {
    try {
      await SecureStore.setItemAsync(
        "notifications",
        JSON.stringify(notifications),
      );
    } catch (error) {
      console.error("Failed to save notifications:", error);
    }
  }, [notifications]);

  const loadNotifications = useCallback(async () => {
    try {
      const saved = await SecureStore.getItemAsync("notifications");
      if (saved) {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
        updateStats();
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }, [updateStats]);

  // Cleanup
  useEffect(() => {
    initializeNotifications();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current,
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [initializeNotifications]);

  // Save notifications when they change
  useEffect(() => {
    saveNotifications();
  }, [notifications, saveNotifications]);

  return {
    preferences,
    notifications,
    stats,
    scheduleNotification,
    handleGithubEvent,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updatePreferences,
    getNotificationsByType,
    getUnreadNotifications,
    getRecentNotifications,
  };
}

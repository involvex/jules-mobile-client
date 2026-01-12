import { useCallback, useEffect, useRef, useState } from "react";
import { useGithubWebhooks } from "./use-github-webhooks";
import * as Notifications from "expo-notifications";
import { useGithubApi } from "./use-github-api";
import { storage } from "@/utils/storage";
import { Platform } from "react-native";

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
  type:
    | "workflow"
    | "pull_request"
    | "repository"
    | "comment"
    | "mention"
    | "general";
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
  const { handleEvent } = useGithubWebhooks() as any;
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
  const notificationListener = useRef<Notifications.Subscription | undefined>(
    undefined,
  );
  const responseListener = useRef<Notifications.Subscription | undefined>(
    undefined,
  );

  const updateStats = useCallback(() => {
    const total = notifications.length;
    const unreadCount = notifications.filter(n => !n.read).length;
    const today = notifications.filter(
      n => new Date(n.timestamp).toDateString() === new Date().toDateString(),
    ).length;
    const thisWeek = notifications.filter(
      n =>
        new Date(n.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).length;

    setStats({ total, unread: unreadCount, today, thisWeek });
  }, [notifications]);

  const savePreferences = useCallback(
    async (prefs: NotificationPreferences) => {
      try {
        await storage.setItem(
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
      const saved = await storage.getItem("notification_preferences");
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    }
  }, []);

  const saveNotifications = useCallback(async () => {
    try {
      await storage.setItem("notifications", JSON.stringify(notifications));
    } catch (error) {
      console.error("Failed to save notifications:", error);
    }
  }, [notifications]);

  const loadNotifications = useCallback(async () => {
    try {
      const saved = await storage.getItem("notifications");
      if (saved) {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }, []);

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

    const startTotalMinutes = (startHours || 0) * 60 + (startMinutes || 0);
    const endTotalMinutes = (endHours || 0) * 60 + (endMinutes || 0);

    if (startTotalMinutes <= endTotalMinutes) {
      return (
        currentMinutes >= startTotalMinutes && currentMinutes <= endTotalMinutes
      );
    } else {
      return (
        currentMinutes >= startTotalMinutes || currentMinutes <= endTotalMinutes
      );
    }
  }, [preferences.quietHours]);

  const getNotificationPriority = useCallback(
    (priority: "low" | "medium" | "high") => {
      switch (priority) {
        case "high":
          return "high" as any; // Using string values since we're providing them to NotificationContentInput
        case "medium":
          return "default" as any;
        case "low":
          return "low" as any;
        default:
          return "default" as any;
      }
    },
    [],
  );

  const handleNotificationAction = useCallback((response: any) => {
    const data = response.notification.request.content.data;
    if (data?.actionUrl) {
      console.log("Navigating to:", data.actionUrl);
    }
  }, []);

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
          trigger: {
            seconds: delay,
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          } as any,
        });
      } else {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: null,
        });
      }

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
    },
    [preferences.pushNotifications, isInQuietHours, getNotificationPriority],
  );

  const shouldCreateNotification = useCallback(
    (eventType: string, _data: any): boolean => {
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
          priority: data.conclusion === "success" ? "low" : ("high" as const),
        };
      case "pull_request.opened":
        return {
          title: "New Pull Request",
          body: `${data.user.login} opened PR: ${data.title}`,
          data: { type: "pull_request", ...data },
          priority: "medium" as const,
        };
      case "pull_request.closed":
        return {
          title: "Pull Request Closed",
          body: `PR #${data.number} was ${data.state}`,
          data: { type: "pull_request", ...data },
          priority: "low" as const,
        };
      case "repository.created":
        return {
          title: "Repository Created",
          body: `New repository: ${data.repository.full_name}`,
          data: { type: "repository", ...data },
          priority: "low" as const,
        };
      case "mention":
        return {
          title: "You were mentioned",
          body: `${data.user.login} mentioned you in ${data.context}`,
          data: { type: "mention", ...data },
          priority: "high" as const,
        };
      default:
        return null;
    }
  }, []);

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
          notificationData.priority as "low" | "medium" | "high",
        );
      }
    },
    [scheduleNotification, shouldCreateNotification, createNotificationData],
  );

  const initializeNotifications = useCallback(async () => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.log("Notification permissions not granted");
      return;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync();
      console.log("Push token:", token);
    } catch (err) {
      console.log("Failed to get push token", err);
    }

    notificationListener.current =
      Notifications.addNotificationReceivedListener(notification => {
        console.log("Notification received:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(response => {
        console.log("Notification response:", response);
        handleNotificationAction(response);
      });

    await loadNotifications();
    await loadPreferences();
  }, [loadNotifications, loadPreferences, handleNotificationAction]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>) => {
      const updatedPreferences = { ...preferences, ...newPreferences };
      setPreferences(updatedPreferences);
      await savePreferences(updatedPreferences);
    },
    [preferences, savePreferences],
  );

  const getNotificationsByType = useCallback(
    (type: Notification["type"]) => {
      return notifications.filter(n => n.type === type);
    },
    [notifications],
  );

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.read);
  }, [notifications]);

  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const getRecentNotifications = useCallback(
    (hours: number = 24) => {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      return notifications.filter(n => new Date(n.timestamp) > cutoff);
    },
    [notifications],
  );

  useEffect(() => {
    void initializeNotifications();

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [initializeNotifications]);

  useEffect(() => {
    void saveNotifications();
    updateStats();
  }, [notifications, saveNotifications, updateStats]);

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
    getUnreadCount,
    getRecentNotifications,
  };
}

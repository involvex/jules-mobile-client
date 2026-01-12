import {
  useWorkflowUpdates,
  WorkflowUpdate,
} from "@/hooks/use-workflow-updates";
import React, { useCallback, useEffect, useState } from "react";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";

interface WorkflowNotificationsProps {
  owner: string;
  repo: string;
  enabled: boolean;
}

export function WorkflowNotifications({
  owner,
  repo,
  enabled,
}: WorkflowNotificationsProps) {
  const { getRecentUpdates, clearUpdates } = useWorkflowUpdates();
  const [notifications, setNotifications] = useState<WorkflowUpdate[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "icon");

  // Check for new notifications
  const checkForNotifications = useCallback(() => {
    if (!enabled) return;

    const recentUpdates = getRecentUpdates(5);
    const newNotifications = recentUpdates.filter(
      update =>
        !notifications.find(
          n =>
            n.runId === update.runId &&
            n.timestamp.getTime() === update.timestamp.getTime(),
        ),
    );

    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev].slice(0, 10));
      setIsVisible(true);

      // Trigger haptic feedback for important events
      newNotifications.forEach(update => {
        if (update.type === "completed" || update.type === "status_change") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      });

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    }
  }, [enabled, getRecentUpdates, notifications]);

  // Clear notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setIsVisible(false);
    clearUpdates();
  }, [clearUpdates]);

  // Check for notifications periodically
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(checkForNotifications, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [enabled, checkForNotifications]);

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: cardColor, borderColor }]}
    >
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: textColor }]}>
          Workflow Notifications
        </ThemedText>
        <ThemedText
          style={[styles.clearButton, { color: textColor }]}
          onPress={clearAllNotifications}
        >
          Clear
        </ThemedText>
      </View>

      {notifications.slice(0, 3).map((notification, index) => (
        <NotificationItem key={index} notification={notification} />
      ))}

      {notifications.length > 3 && (
        <ThemedText style={[styles.moreText, { color: textColor }]}>
          +{notifications.length - 3} more
        </ThemedText>
      )}
    </ThemedView>
  );
}

interface NotificationItemProps {
  notification: WorkflowUpdate;
}

function NotificationItem({ notification }: NotificationItemProps) {
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "background");

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "status_change":
        return "🔄";
      case "new_run":
        return "🚀";
      case "completed":
        return "✅";
      default:
        return "ℹ️";
    }
  };

  const getNotificationColor = (type: string, conclusion?: string | null) => {
    if (type === "completed") {
      switch (conclusion) {
        case "success":
          return "#22c55e";
        case "failure":
          return "#ef4444";
        case "cancelled":
          return "#f59e0b";
        default:
          return "#9ca3af";
      }
    }
    return "#3b82f6";
  };

  const icon = getNotificationIcon(notification.type);
  const color = getNotificationColor(
    notification.type,
    notification.conclusion,
  );

  return (
    <View style={[styles.notificationItem, { backgroundColor: cardColor }]}>
      <ThemedText style={[styles.icon, { color }]}>{icon}</ThemedText>
      <View style={styles.notificationContent}>
        <ThemedText style={[styles.notificationText, { color: textColor }]}>
          {notification.type === "status_change" &&
            `Status changed to ${notification.status}`}
          {notification.type === "new_run" && "New workflow run started"}
          {notification.type === "completed" &&
            `Workflow completed with ${notification.conclusion}`}
        </ThemedText>
        <ThemedText style={[styles.notificationTime, { color: textColor }]}>
          {notification.timestamp.toLocaleTimeString()}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 20,
    right: 20,
    left: 20,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  clearButton: {
    fontSize: 14,
    opacity: 0.7,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  moreText: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: "center",
    marginTop: 4,
  },
});

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Switch,
  TextInput,
} from "react-native";
import { useNotifications } from "@/hooks/use-notifications";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatDistanceToNow, format } from "date-fns";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import React, { useEffect, useState } from "react";

interface NotificationsCenterProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationsCenter({
  visible,
  onClose,
}: NotificationsCenterProps) {
  const colorScheme = useColorScheme();
  const {
    preferences,
    notifications,
    stats,
    scheduleNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updatePreferences,
    getNotificationsByType,
    getUnreadNotifications,
    getRecentNotifications,
  } = useNotifications();
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "unread" | "recent"
  >("all");
  const [showSettings, setShowSettings] = useState(false);
  const [showQuietHours, setShowQuietHours] = useState(false);

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const loadNotifications = async () => {
    // Notifications are loaded automatically by the hook
  };

  const getFilteredNotifications = () => {
    switch (selectedFilter) {
      case "unread":
        return getUnreadNotifications();
      case "recent":
        return getRecentNotifications(24);
      default:
        return notifications;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "workflow":
        return "gearshape";
      case "pull_request":
        return "doc.text";
      case "repository":
        return "folder";
      case "comment":
        return "bubble.left.and.bubble.right";
      case "mention":
        return "at";
      default:
        return "bell";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "workflow":
        return colorScheme === "dark" ? "#3b82f6" : "#2563eb";
      case "pull_request":
        return colorScheme === "dark" ? "#8b5cf6" : "#7c3aed";
      case "repository":
        return colorScheme === "dark" ? "#10b981" : "#059669";
      case "comment":
        return colorScheme === "dark" ? "#f59e0b" : "#d97706";
      case "mention":
        return colorScheme === "dark" ? "#ef4444" : "#dc2626";
      default:
        return colorScheme === "dark" ? "#94a3b8" : "#64748b";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return "exclamationmark.triangle";
      case "medium":
        return "bell.badge";
      case "low":
        return "bell";
      default:
        return "bell";
    }
  };

  const formatNotificationTime = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const notificationDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    if (notificationDate.getTime() === today.getTime()) {
      return format(date, "HH:mm");
    } else if (
      notificationDate.getTime() ===
      new Date(today.getTime() - 86400000).getTime()
    ) {
      return "Yesterday";
    } else {
      return format(date, "MMM d, HH:mm");
    }
  };

  const handleNotificationAction = (notification: any) => {
    if (notification.actionUrl) {
      // Handle navigation to the action URL
      console.log("Navigating to:", notification.actionUrl);
    }
    markAsRead(notification.id);
  };

  const clearOldNotifications = () => {
    Alert.alert(
      "Clear Old Notifications",
      "Are you sure you want to clear all notifications older than 30 days?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          onPress: () => {
            const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const oldNotifications = notifications.filter(
              n => n.timestamp < cutoff,
            );
            oldNotifications.forEach(n => deleteNotification(n.id));
            Alert.alert(
              "Cleared",
              `${oldNotifications.length} old notifications have been cleared`,
            );
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colorScheme === "dark" ? "#0f172a" : "#ffffff" },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <IconSymbol
                  name="xmark"
                  size={20}
                  color={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
                />
              </TouchableOpacity>
              <Text
                style={[
                  styles.headerTitle,
                  { color: colorScheme === "dark" ? "#f1f5f9" : "#1e293b" },
                ]}
              >
                Notifications
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={() => setShowSettings(true)}
                style={styles.settingsButton}
              >
                <IconSymbol
                  name="gearshape"
                  size={20}
                  color={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total</Text>
              <Text style={styles.statValue}>{stats.total}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Unread</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: colorScheme === "dark" ? "#ef4444" : "#dc2626" },
                ]}
              >
                {stats.unread}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Today</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: colorScheme === "dark" ? "#22c55e" : "#16a34a" },
                ]}
              >
                {stats.today}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={markAllAsRead}
            >
              <IconSymbol name="checkmark.circle" size={16} color="#fff" />
              <Text style={styles.primaryButtonText}>Mark All Read</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={clearAllNotifications}
            >
              <IconSymbol
                name="trash"
                size={16}
                color={colorScheme === "dark" ? "#1f2937" : "#f3f4f6"}
              />
              <Text style={styles.secondaryButtonText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {/* Filters */}
          <View style={styles.filtersContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === "all" && styles.filterButtonActive,
                { borderColor: colorScheme === "dark" ? "#334155" : "#e5e7eb" },
              ]}
              onPress={() => setSelectedFilter("all")}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === "all" && styles.filterTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === "unread" && styles.filterButtonActive,
                { borderColor: colorScheme === "dark" ? "#334155" : "#e5e7eb" },
              ]}
              onPress={() => setSelectedFilter("unread")}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === "unread" && styles.filterTextActive,
                ]}
              >
                Unread
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === "recent" && styles.filterButtonActive,
                { borderColor: colorScheme === "dark" ? "#334155" : "#e5e7eb" },
              ]}
              onPress={() => setSelectedFilter("recent")}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === "recent" && styles.filterTextActive,
                ]}
              >
                Recent
              </Text>
            </TouchableOpacity>
          </View>

          {/* Notifications List */}
          <ScrollView style={styles.notificationsList}>
            {getFilteredNotifications().length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="bell.slash" size={48} color="#94a3b8" />
                <Text style={styles.emptyStateText}>
                  No notifications to show
                </Text>
              </View>
            ) : (
              getFilteredNotifications().map(notification => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    {
                      backgroundColor:
                        colorScheme === "dark" ? "#1f2937" : "#f8fafc",
                    },
                    notification.read && styles.readNotification,
                  ]}
                  onPress={() => handleNotificationAction(notification)}
                  onLongPress={() => {
                    Alert.alert(
                      "Notification Actions",
                      "What would you like to do with this notification?",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Mark as Read",
                          onPress: () => markAsRead(notification.id),
                        },
                        {
                          text: "Delete",
                          onPress: () => deleteNotification(notification.id),
                          style: "destructive",
                        },
                      ],
                    );
                  }}
                >
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationIconContainer}>
                      <IconSymbol
                        name={getNotificationIcon(notification.type)}
                        size={20}
                        color={getNotificationColor(notification.type)}
                      />
                    </View>
                    <View style={styles.notificationText}>
                      <Text
                        style={[
                          styles.notificationTitle,
                          {
                            color:
                              colorScheme === "dark" ? "#f1f5f9" : "#1e293b",
                          },
                        ]}
                      >
                        {notification.title}
                      </Text>
                      <Text
                        style={[
                          styles.notificationBody,
                          {
                            color:
                              colorScheme === "dark" ? "#94a3b8" : "#64748b",
                          },
                        ]}
                      >
                        {notification.body}
                      </Text>
                      <Text
                        style={[
                          styles.notificationTime,
                          {
                            color:
                              colorScheme === "dark" ? "#64748b" : "#94a3b8",
                          },
                        ]}
                      >
                        {formatNotificationTime(notification.timestamp)}
                      </Text>
                    </View>
                    <View style={styles.notificationMeta}>
                      <IconSymbol
                        name={getPriorityIcon(notification.priority)}
                        size={16}
                        color={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
                      />
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        {/* Settings Modal */}
        <Modal visible={showSettings} transparent animationType="slide">
          <View style={styles.settingsOverlay}>
            <View
              style={[
                styles.settingsContent,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#1f2937" : "#ffffff",
                },
              ]}
            >
              <View style={styles.settingsHeader}>
                <Text
                  style={[
                    styles.settingsTitle,
                    { color: colorScheme === "dark" ? "#f1f5f9" : "#1e293b" },
                  ]}
                >
                  Notification Settings
                </Text>
                <TouchableOpacity
                  onPress={() => setShowSettings(false)}
                  style={styles.closeSettingsButton}
                >
                  <IconSymbol
                    name="xmark"
                    size={20}
                    color={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.settingsList}>
                {/* Push Notifications */}
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text
                      style={[
                        styles.settingLabel,
                        {
                          color: colorScheme === "dark" ? "#f1f5f9" : "#1e293b",
                        },
                      ]}
                    >
                      Push Notifications
                    </Text>
                    <Text
                      style={[
                        styles.settingDescription,
                        {
                          color: colorScheme === "dark" ? "#94a3b8" : "#64748b",
                        },
                      ]}
                    >
                      Receive notifications on your device
                    </Text>
                  </View>
                  <Switch
                    value={preferences.pushNotifications}
                    onValueChange={value =>
                      updatePreferences({ pushNotifications: value })
                    }
                    thumbColor={colorScheme === "dark" ? "#1f2937" : "#f3f4f6"}
                    trackColor={{ false: "#94a3b8", true: "#22c55e" }}
                  />
                </View>

                {/* Email Notifications */}
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text
                      style={[
                        styles.settingLabel,
                        {
                          color: colorScheme === "dark" ? "#f1f5f9" : "#1e293b",
                        },
                      ]}
                    >
                      Email Notifications
                    </Text>
                    <Text
                      style={[
                        styles.settingDescription,
                        {
                          color: colorScheme === "dark" ? "#94a3b8" : "#64748b",
                        },
                      ]}
                    >
                      Receive email notifications
                    </Text>
                  </View>
                  <Switch
                    value={preferences.emailNotifications}
                    onValueChange={value =>
                      updatePreferences({ emailNotifications: value })
                    }
                    thumbColor={colorScheme === "dark" ? "#1f2937" : "#f3f4f6"}
                    trackColor={{ false: "#94a3b8", true: "#3b82f6" }}
                  />
                </View>

                {/* Event Types */}
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colorScheme === "dark" ? "#94a3b8" : "#64748b" },
                  ]}
                >
                  Event Types
                </Text>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text
                      style={[
                        styles.settingLabel,
                        {
                          color: colorScheme === "dark" ? "#f1f5f9" : "#1e293b",
                        },
                      ]}
                    >
                      Workflow Events
                    </Text>
                  </View>
                  <Switch
                    value={preferences.workflowEvents}
                    onValueChange={value =>
                      updatePreferences({ workflowEvents: value })
                    }
                    thumbColor={colorScheme === "dark" ? "#1f2937" : "#f3f4f6"}
                    trackColor={{ false: "#94a3b8", true: "#3b82f6" }}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text
                      style={[
                        styles.settingLabel,
                        {
                          color: colorScheme === "dark" ? "#f1f5f9" : "#1e293b",
                        },
                      ]}
                    >
                      Pull Request Events
                    </Text>
                  </View>
                  <Switch
                    value={preferences.pullRequestEvents}
                    onValueChange={value =>
                      updatePreferences({ pullRequestEvents: value })
                    }
                    thumbColor={colorScheme === "dark" ? "#1f2937" : "#f3f4f6"}
                    trackColor={{ false: "#94a3b8", true: "#8b5cf6" }}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text
                      style={[
                        styles.settingLabel,
                        {
                          color: colorScheme === "dark" ? "#f1f5f9" : "#1e293b",
                        },
                      ]}
                    >
                      Repository Events
                    </Text>
                  </View>
                  <Switch
                    value={preferences.repositoryEvents}
                    onValueChange={value =>
                      updatePreferences({ repositoryEvents: value })
                    }
                    thumbColor={colorScheme === "dark" ? "#1f2937" : "#f3f4f6"}
                    trackColor={{ false: "#94a3b8", true: "#10b981" }}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text
                      style={[
                        styles.settingLabel,
                        {
                          color: colorScheme === "dark" ? "#f1f5f9" : "#1e293b",
                        },
                      ]}
                    >
                      Comment Events
                    </Text>
                  </View>
                  <Switch
                    value={preferences.commentEvents}
                    onValueChange={value =>
                      updatePreferences({ commentEvents: value })
                    }
                    thumbColor={colorScheme === "dark" ? "#1f2937" : "#f3f4f6"}
                    trackColor={{ false: "#94a3b8", true: "#f59e0b" }}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text
                      style={[
                        styles.settingLabel,
                        {
                          color: colorScheme === "dark" ? "#f1f5f9" : "#1e293b",
                        },
                      ]}
                    >
                      Mention Events
                    </Text>
                  </View>
                  <Switch
                    value={preferences.mentionEvents}
                    onValueChange={value =>
                      updatePreferences({ mentionEvents: value })
                    }
                    thumbColor={colorScheme === "dark" ? "#1f2937" : "#f3f4f6"}
                    trackColor={{ false: "#94a3b8", true: "#ef4444" }}
                  />
                </View>

                {/* Quiet Hours */}
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colorScheme === "dark" ? "#94a3b8" : "#64748b" },
                  ]}
                >
                  Quiet Hours
                </Text>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text
                      style={[
                        styles.settingLabel,
                        {
                          color: colorScheme === "dark" ? "#f1f5f9" : "#1e293b",
                        },
                      ]}
                    >
                      Enable Quiet Hours
                    </Text>
                    <Text
                      style={[
                        styles.settingDescription,
                        {
                          color: colorScheme === "dark" ? "#94a3b8" : "#64748b",
                        },
                      ]}
                    >
                      Don't disturb during specified hours
                    </Text>
                  </View>
                  <Switch
                    value={preferences.quietHours.enabled}
                    onValueChange={value =>
                      updatePreferences({
                        quietHours: {
                          ...preferences.quietHours,
                          enabled: value,
                        },
                      })
                    }
                    thumbColor={colorScheme === "dark" ? "#1f2937" : "#f3f4f6"}
                    trackColor={{ false: "#94a3b8", true: "#64748b" }}
                  />
                </View>

                {preferences.quietHours.enabled && (
                  <TouchableOpacity
                    style={styles.quietHoursButton}
                    onPress={() => setShowQuietHours(true)}
                  >
                    <Text
                      style={[
                        styles.quietHoursText,
                        {
                          color: colorScheme === "dark" ? "#f1f5f9" : "#1e293b",
                        },
                      ]}
                    >
                      {`Quiet Hours: ${preferences.quietHours.start} - ${preferences.quietHours.end}`}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Frequency */}
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colorScheme === "dark" ? "#94a3b8" : "#64748b" },
                  ]}
                >
                  Notification Frequency
                </Text>

                {(["immediate", "hourly", "daily", "weekly"] as const).map(
                  frequency => (
                    <TouchableOpacity
                      key={frequency}
                      style={styles.frequencyItem}
                      onPress={() => updatePreferences({ frequency })}
                    >
                      <View style={styles.frequencyRadio}>
                        {preferences.frequency === frequency && (
                          <View style={styles.frequencyRadioInner} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.frequencyText,
                          {
                            color:
                              colorScheme === "dark" ? "#f1f5f9" : "#1e293b",
                          },
                        ]}
                      >
                        {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </ScrollView>

              <View style={styles.settingsActions}>
                <TouchableOpacity
                  style={[styles.settingsButton, styles.primarySettingsButton]}
                  onPress={() => setShowSettings(false)}
                >
                  <Text style={styles.primarySettingsButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Quiet Hours Modal */}
        <Modal visible={showQuietHours} transparent animationType="slide">
          <View style={styles.quietHoursOverlay}>
            <View
              style={[
                styles.quietHoursContent,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#1f2937" : "#ffffff",
                },
              ]}
            >
              <Text
                style={[
                  styles.quietHoursTitle,
                  { color: colorScheme === "dark" ? "#f1f5f9" : "#1e293b" },
                ]}
              >
                Set Quiet Hours
              </Text>

              <View style={styles.timeInputContainer}>
                <Text
                  style={[
                    styles.timeInputLabel,
                    { color: colorScheme === "dark" ? "#94a3b8" : "#64748b" },
                  ]}
                >
                  Start Time
                </Text>
                <TextInput
                  style={[
                    styles.timeInput,
                    {
                      borderColor:
                        colorScheme === "dark" ? "#334155" : "#e5e7eb",
                    },
                  ]}
                  value={preferences.quietHours.start}
                  onChangeText={value =>
                    updatePreferences({
                      quietHours: { ...preferences.quietHours, start: value },
                    })
                  }
                  placeholder="HH:MM"
                  placeholderTextColor={
                    colorScheme === "dark" ? "#9ca3af" : "#6b7280"
                  }
                />
              </View>

              <View style={styles.timeInputContainer}>
                <Text
                  style={[
                    styles.timeInputLabel,
                    { color: colorScheme === "dark" ? "#94a3b8" : "#64748b" },
                  ]}
                >
                  End Time
                </Text>
                <TextInput
                  style={[
                    styles.timeInput,
                    {
                      borderColor:
                        colorScheme === "dark" ? "#334155" : "#e5e7eb",
                    },
                  ]}
                  value={preferences.quietHours.end}
                  onChangeText={value =>
                    updatePreferences({
                      quietHours: { ...preferences.quietHours, end: value },
                    })
                  }
                  placeholder="HH:MM"
                  placeholderTextColor={
                    colorScheme === "dark" ? "#9ca3af" : "#6b7280"
                  }
                />
              </View>

              <View style={styles.quietHoursActions}>
                <TouchableOpacity
                  style={[styles.quietHoursButton, styles.cancelButton]}
                  onPress={() => setShowQuietHours(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quietHoursButton, styles.saveButton]}
                  onPress={() => setShowQuietHours(false)}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "95%",
    maxHeight: "80%",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 8,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
  },
  secondaryButton: {
    backgroundColor: "#e5e7eb",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: "#1f2937",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  filtersContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    borderColor: "#2563eb",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#2563eb",
  },
  notificationsList: {
    maxHeight: "60%",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
  },
  notificationItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  readNotification: {
    opacity: 0.7,
  },
  notificationContent: {
    flexDirection: "row",
  },
  notificationIconContainer: {
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
  },
  notificationMeta: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  settingsContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  settingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeSettingsButton: {
    padding: 8,
    borderRadius: 8,
  },
  settingsList: {
    maxHeight: "70%",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quietHoursButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginBottom: 16,
  },
  quietHoursText: {
    fontSize: 16,
    fontWeight: "500",
  },
  frequencyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  frequencyRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#64748b",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  frequencyRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563eb",
  },
  frequencyText: {
    fontSize: 16,
  },
  settingsActions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  primarySettingsButton: {
    backgroundColor: "#2563eb",
  },
  primarySettingsButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  quietHoursOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  quietHoursContent: {
    width: "80%",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  quietHoursTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  timeInputContainer: {
    marginBottom: 16,
  },
  timeInputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: "center",
  },
  quietHoursActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#22c55e",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

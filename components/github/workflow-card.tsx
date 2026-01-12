import { Workflow, WorkflowUpdate } from "@/hooks/use-github-api";
import { Pressable, StyleSheet, View } from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import React from "react";

interface WorkflowCardProps {
  workflow: Workflow;
  isActive: boolean;
  onPress: () => void;
  updates: WorkflowUpdate[];
}

export function WorkflowCard({
  workflow,
  isActive,
  onPress,
  updates,
}: WorkflowCardProps) {
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "icon");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "#22c55e";
      case "failure":
        return "#ef4444";
      case "cancelled":
        return "#f59e0b";
      case "in_progress":
        return "#3b82f6";
      default:
        return "#9ca3af";
    }
  };

  const getRecentStatus = () => {
    const recentUpdate = updates[updates.length - 1];
    if (recentUpdate) {
      return recentUpdate.status;
    }
    return workflow.state === "active" ? "idle" : "disabled";
  };

  const recentStatus = getRecentStatus();
  const statusColor = getStatusColor(recentStatus);

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <ThemedView
        style={[
          styles.card,
          {
            backgroundColor: cardColor,
            borderColor,
            borderWidth: isActive ? 2 : 1,
            borderStyle: isActive ? "solid" : "dashed",
          },
        ]}
      >
        <View style={styles.header}>
          <ThemedText style={[styles.name, { color: textColor }]}>
            {workflow.name}
          </ThemedText>
          <View
            style={[styles.statusIndicator, { backgroundColor: statusColor }]}
          />
        </View>

        <ThemedText style={[styles.path, { color: textColor }]}>
          {workflow.path}
        </ThemedText>

        <View style={styles.footer}>
          <ThemedText style={[styles.state, { color: textColor }]}>
            {workflow.state}
          </ThemedText>
          {updates.length > 0 && (
            <ThemedText style={[styles.count, { color: textColor }]}>
              {updates.length} updates
            </ThemedText>
          )}
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 12,
    width: 200,
  },
  card: {
    padding: 12,
    borderRadius: 12,
    minHeight: 100,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  path: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  state: {
    fontSize: 12,
    textTransform: "capitalize",
  },
  count: {
    fontSize: 12,
    opacity: 0.7,
  },
});

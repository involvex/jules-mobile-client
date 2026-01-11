import { Pressable, StyleSheet, View } from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { WorkflowRun } from "@/hooks/use-github-api";
import React from "react";

interface WorkflowRunCardProps {
  run: WorkflowRun;
  workflow?: any; // Workflow type if available
}

export function WorkflowRunCard({ run, workflow }: WorkflowRunCardProps) {
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");

  const getStatusColor = (status: string, conclusion?: string | null) => {
    if (status === "completed" && conclusion) {
      switch (conclusion) {
        case "success":
          return "#22c55e";
        case "failure":
          return "#ef4444";
        case "cancelled":
          return "#f59e0b";
        case "skipped":
          return "#9ca3af";
        case "timed_out":
          return "#ef4444";
        default:
          return "#9ca3af";
      }
    }

    switch (status) {
      case "in_progress":
        return "#3b82f6";
      case "queued":
        return "#f59e0b";
      default:
        return "#9ca3af";
    }
  };

  const getStatusText = (status: string, conclusion?: string | null) => {
    if (status === "completed" && conclusion) {
      return conclusion.charAt(0).toUpperCase() + conclusion.slice(1);
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const statusColor = getStatusColor(run.status, run.conclusion);
  const statusText = getStatusText(run.status, run.conclusion);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Pressable style={styles.container}>
      <ThemedView
        style={[
          styles.card,
          {
            backgroundColor: cardColor,
            borderColor,
            borderWidth: 1,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <ThemedText style={[styles.name, { color: textColor }]}>
              {run.name}
            </ThemedText>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor }]}
            >
              <ThemedText style={styles.statusText}>{statusText}</ThemedText>
            </View>
          </View>

          {workflow && (
            <ThemedText style={[styles.workflowName, { color: textColor }]}>
              {workflow.name}
            </ThemedText>
          )}
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: textColor }]}>
              Branch:
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: textColor }]}>
              {run.head_branch || "Unknown"}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: textColor }]}>
              Event:
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: textColor }]}>
              {run.event || "Unknown"}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: textColor }]}>
              Started:
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: textColor }]}>
              {formatDate(run.created_at)}
            </ThemedText>
          </View>

          {run.status === "completed" && run.updated_at !== run.created_at && (
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: textColor }]}>
                Completed:
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: textColor }]}>
                {formatDate(run.updated_at)}
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <ThemedText style={[styles.runId, { color: textColor }]}>
            Run #{run.id}
          </ThemedText>
          {run.head_sha && (
            <ThemedText style={[styles.sha, { color: textColor }]}>
              {run.head_sha.substring(0, 7)}
            </ThemedText>
          )}
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  workflowName: {
    fontSize: 12,
    opacity: 0.8,
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    opacity: 0.8,
    width: 60,
  },
  detailValue: {
    fontSize: 12,
    flex: 1,
    textAlign: "right",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    paddingTop: 8,
  },
  runId: {
    fontSize: 12,
    opacity: 0.8,
  },
  sha: {
    fontSize: 12,
    opacity: 0.8,
    fontFamily: "monospace",
  },
});

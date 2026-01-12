import { Pressable, StyleSheet, View } from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { WorkflowJob } from "@/hooks/use-github-api";
import React from "react";

interface WorkflowJobCardProps {
  job: WorkflowJob;
}

export function WorkflowJobCard({ job }: WorkflowJobCardProps) {
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "icon");

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

  const statusColor = getStatusColor(job.status, job.conclusion);
  const statusText = getStatusText(job.status, job.conclusion);

  const formatTime = (timeString: string) => {
    if (!timeString) return "Not started";
    const date = new Date(timeString);
    return date.toLocaleString();
  };

  const getDuration = () => {
    if (!job.started_at) return "Not started";
    const start = new Date(job.started_at);
    const end = job.completed_at ? new Date(job.completed_at) : new Date();
    const diff = end.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
          <ThemedText style={[styles.jobName, { color: textColor }]}>
            {job.name}
          </ThemedText>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <ThemedText style={styles.statusText}>{statusText}</ThemedText>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: textColor }]}>
              Started:
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: textColor }]}>
              {formatTime(job.started_at)}
            </ThemedText>
          </View>

          {job.completed_at && (
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: textColor }]}>
                Completed:
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: textColor }]}>
                {formatTime(job.completed_at)}
              </ThemedText>
            </View>
          )}

          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: textColor }]}>
              Duration:
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: textColor }]}>
              {getDuration()}
            </ThemedText>
          </View>
        </View>

        {/* Steps */}
        {job.steps && job.steps.length > 0 && (
          <View style={styles.steps}>
            <ThemedText style={[styles.stepsTitle, { color: textColor }]}>
              Steps ({job.steps.length})
            </ThemedText>
            {job.steps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepStatus,
                    {
                      backgroundColor: getStatusColor(
                        step.status,
                        step.conclusion,
                      ),
                    },
                  ]}
                />
                <ThemedText style={[styles.stepName, { color: textColor }]}>
                  {step.name}
                </ThemedText>
                <ThemedText
                  style={[styles.stepStatusText, { color: textColor }]}
                >
                  {getStatusText(step.status, step.conclusion)}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  jobName: {
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
    width: 80,
  },
  detailValue: {
    fontSize: 12,
    flex: 1,
    textAlign: "right",
  },
  steps: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    paddingTop: 12,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  stepStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  stepName: {
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  stepStatusText: {
    fontSize: 12,
    opacity: 0.8,
  },
});

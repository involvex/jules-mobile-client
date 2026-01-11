import { useGithubApi, WorkflowJob, WorkflowRun } from "@/hooks/use-github-api";
import { Modal, ScrollView, StyleSheet, View } from "react-native";
import { useWorkflowUpdates } from "@/hooks/use-workflow-updates";
import React, { useCallback, useEffect, useState } from "react";
import { WorkflowLogsViewer } from "./workflow-logs-viewer";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { WorkflowJobCard } from "./workflow-job-card";

interface WorkflowRunDetailsProps {
  owner: string;
  repo: string;
  runId: number;
  visible: boolean;
  onClose: () => void;
}

export function WorkflowRunDetails({
  owner,
  repo,
  runId,
  visible,
  onClose,
}: WorkflowRunDetailsProps) {
  const {
    getWorkflowRunDetails,
    getWorkflowJobs,
    cancelWorkflowRun,
    retryWorkflowRun,
    isLoading,
  } = useGithubApi();
  const { getUpdatesForWorkflow } = useWorkflowUpdates();
  const [runDetails, setRunDetails] = useState<WorkflowRun | null>(null);
  const [jobs, setJobs] = useState<WorkflowJob[]>([]);
  const [activeTab, setActiveTab] = useState<"details" | "logs" | "jobs">(
    "details",
  );
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const colorScheme = useColorScheme();

  // Load run details and jobs
  const loadRunDetails = useCallback(async () => {
    try {
      const [runData, jobsData] = await Promise.all([
        getWorkflowRunDetails(owner, repo, runId),
        getWorkflowJobs(owner, repo, runId),
      ]);

      setRunDetails(runData);
      setJobs(jobsData);
    } catch (error) {
      console.error("Failed to load run details:", error);
    }
  }, [owner, repo, runId, getWorkflowRunDetails, getWorkflowJobs]);

  useEffect(() => {
    if (visible) {
      loadRunDetails();
    }
  }, [visible, loadRunDetails]);

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

  const canCancel =
    runDetails?.status === "in_progress" || runDetails?.status === "queued";
  const canRetry =
    runDetails?.status === "completed" && runDetails?.conclusion !== "success";

  const handleCancel = async () => {
    try {
      await cancelWorkflowRun(owner, repo, runId);
      loadRunDetails();
    } catch (error) {
      console.error("Failed to cancel workflow run:", error);
    }
  };

  const handleRetry = async () => {
    try {
      await retryWorkflowRun(owner, repo, runId);
      loadRunDetails();
    } catch (error) {
      console.error("Failed to retry workflow run:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (!visible || !runDetails) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <ThemedView
          style={[styles.header, { backgroundColor: cardColor, borderColor }]}
        >
          <View style={styles.headerContent}>
            <ThemedText style={[styles.runTitle, { color: textColor }]}>
              {runDetails.name}
            </ThemedText>
            <ThemedText style={[styles.runSubtitle, { color: textColor }]}>
              Run #{runDetails.id} • {runDetails.event}
            </ThemedText>
          </View>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor: getStatusColor(
                    runDetails.status,
                    runDetails.conclusion,
                  ),
                },
              ]}
            />
            <ThemedText style={[styles.statusText, { color: textColor }]}>
              {runDetails.status === "completed" && runDetails.conclusion
                ? runDetails.conclusion.charAt(0).toUpperCase() +
                  runDetails.conclusion.slice(1)
                : runDetails.status.charAt(0).toUpperCase() +
                  runDetails.status.slice(1)}
            </ThemedText>
          </View>
        </ThemedView>

        {/* Tabs */}
        <ThemedView
          style={[styles.tabs, { backgroundColor: cardColor, borderColor }]}
        >
          {["details", "jobs", "logs"].map(tab => (
            <ThemedView
              key={tab}
              style={[
                styles.tab,
                {
                  borderBottomColor:
                    activeTab === tab ? "#3b82f6" : "transparent",
                },
                { borderBottomWidth: activeTab === tab ? 2 : 0 },
              ]}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  { color: activeTab === tab ? "#3b82f6" : textColor },
                  { opacity: activeTab === tab ? 1 : 0.7 },
                ]}
                onPress={() => setActiveTab(tab as any)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>

        {/* Content */}
        <ScrollView style={styles.content}>
          {activeTab === "details" && (
            <ThemedView style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                Run Information
              </ThemedText>

              <ThemedView
                style={[
                  styles.infoCard,
                  { backgroundColor: cardColor, borderColor },
                ]}
              >
                <View style={styles.infoRow}>
                  <ThemedText style={[styles.infoLabel, { color: textColor }]}>
                    Branch:
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: textColor }]}>
                    {runDetails.head_branch || "Unknown"}
                  </ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={[styles.infoLabel, { color: textColor }]}>
                    Commit:
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: textColor }]}>
                    {runDetails.head_sha?.substring(0, 7) || "Unknown"}
                  </ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={[styles.infoLabel, { color: textColor }]}>
                    Started:
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: textColor }]}>
                    {formatDate(runDetails.created_at)}
                  </ThemedText>
                </View>
                {runDetails.status === "completed" && (
                  <View style={styles.infoRow}>
                    <ThemedText
                      style={[styles.infoLabel, { color: textColor }]}
                    >
                      Completed:
                    </ThemedText>
                    <ThemedText
                      style={[styles.infoValue, { color: textColor }]}
                    >
                      {formatDate(runDetails.updated_at)}
                    </ThemedText>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <ThemedText style={[styles.infoLabel, { color: textColor }]}>
                    Event:
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: textColor }]}>
                    {runDetails.event}
                  </ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={[styles.infoLabel, { color: textColor }]}>
                    URL:
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: textColor }]}>
                    {runDetails.html_url}
                  </ThemedText>
                </View>
              </ThemedView>

              {/* Actions */}
              {(canCancel || canRetry) && (
                <ThemedView style={styles.actions}>
                  {canCancel && (
                    <ThemedView
                      style={[
                        styles.actionButton,
                        { backgroundColor: "#ef4444" },
                      ]}
                    >
                      <ThemedText
                        style={styles.actionText}
                        onPress={handleCancel}
                      >
                        Cancel Run
                      </ThemedText>
                    </ThemedView>
                  )}
                  {canRetry && (
                    <ThemedView
                      style={[
                        styles.actionButton,
                        { backgroundColor: "#3b82f6" },
                      ]}
                    >
                      <ThemedText
                        style={styles.actionText}
                        onPress={handleRetry}
                      >
                        Retry Run
                      </ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>
              )}
            </ThemedView>
          )}

          {activeTab === "jobs" && (
            <ThemedView style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                Jobs ({jobs.length})
              </ThemedText>

              {jobs.length > 0 ? (
                jobs.map(job => <WorkflowJobCard key={job.id} job={job} />)
              ) : (
                <ThemedText style={[styles.emptyText, { color: textColor }]}>
                  No jobs found for this run.
                </ThemedText>
              )}
            </ThemedView>
          )}

          {activeTab === "logs" && (
            <WorkflowLogsViewer owner={owner} repo={repo} runId={runId} />
          )}
        </ScrollView>

        {/* Footer */}
        <ThemedView
          style={[styles.footer, { backgroundColor: cardColor, borderColor }]}
        >
          <ThemedText
            style={[styles.closeText, { color: textColor }]}
            onPress={onClose}
          >
            Close
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    marginBottom: 8,
  },
  runTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  runSubtitle: {
    fontSize: 12,
    opacity: 0.8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  infoCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    opacity: 0.8,
    width: 80,
  },
  infoValue: {
    fontSize: 12,
    flex: 1,
    textAlign: "right",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  actionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: 20,
    fontSize: 14,
    opacity: 0.7,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  closeText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});

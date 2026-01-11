import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { PullRequest, Repository, useGithubApi } from "@/hooks/use-github-api";
import { usePullRequestAnalysis } from "@/hooks/use-pull-request-analysis";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import React, { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface PullRequestAnalyzerProps {
  repository: Repository;
}

export function PullRequestAnalyzer({ repository }: PullRequestAnalyzerProps) {
  const colorScheme = useColorScheme();
  const {
    isAnalyzing,
    analyses,
    reviews,
    analyzePullRequest,
    createAutomatedReview,
    getPullRequestMetrics,
    addCommentToPr,
    approvePr,
    requestChangesOnPr,
  } = usePullRequestAnalysis();
  const { getPullRequests } = useGithubApi();
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [selectedPr, setSelectedPr] = useState<PullRequest | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [customComment, setCustomComment] = useState("");

  useEffect(() => {
    loadPullRequests();
  }, [repository]);

  const loadPullRequests = async () => {
    try {
      const prs = await getPullRequests(
        repository.owner.login,
        repository.name,
        "open",
      );
      setPullRequests(prs);
    } catch (error) {
      console.error("Failed to load PRs:", error);
      Alert.alert("Error", "Failed to load pull requests");
    }
  };

  const handleAnalyze = async (pr: PullRequest) => {
    try {
      const analysis = await analyzePullRequest(
        repository.owner.login,
        repository.name,
        pr.number,
      );
      setSelectedPr(pr);
      Alert.alert(
        "Analysis Complete",
        `PR analyzed successfully. Risk level: ${analysis.riskLevel}`,
      );
    } catch (error) {
      console.error("Analysis failed:", error);
      Alert.alert("Analysis Failed", "Unable to analyze pull request");
    }
  };

  const handleGetMetrics = async (pr: PullRequest) => {
    try {
      const prMetrics = await getPullRequestMetrics(
        repository.owner.login,
        repository.name,
        pr.number,
      );
      setMetrics(prMetrics);
      Alert.alert(
        "Metrics Loaded",
        `Files changed: ${prMetrics.totalFilesChanged}, Complexity: ${prMetrics.complexityScore}`,
      );
    } catch (error) {
      console.error("Failed to get metrics:", error);
      Alert.alert("Error", "Failed to get PR metrics");
    }
  };

  const handleCreateReview = async (pr: PullRequest) => {
    const analysis = analyses.get(pr.number);
    if (!analysis) {
      Alert.alert("Error", "Please analyze the PR first");
      return;
    }

    try {
      await createAutomatedReview(
        repository.owner.login,
        repository.name,
        pr.number,
        analysis,
      );
      Alert.alert("Review Created", "Automated review has been created");
    } catch (error) {
      console.error("Failed to create review:", error);
      Alert.alert("Error", "Failed to create automated review");
    }
  };

  const handleApprove = async (pr: PullRequest) => {
    Alert.alert(
      "Approve PR",
      "Are you sure you want to approve this pull request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              await approvePr(
                repository.owner.login,
                repository.name,
                pr.number,
              );
              Alert.alert("Approved", "Pull request has been approved");
            } catch (error) {
              console.error("Failed to approve:", error);
              Alert.alert("Error", "Failed to approve pull request");
            }
          },
        },
      ],
    );
  };

  const handleRequestChanges = async (pr: PullRequest) => {
    setShowReviewModal(true);
  };

  const submitRequestChanges = async () => {
    if (!customComment.trim()) {
      Alert.alert(
        "Error",
        "Please provide a comment explaining the changes needed",
      );
      return;
    }

    try {
      await requestChangesOnPr(
        repository.owner.login,
        repository.name,
        selectedPr!.number,
        customComment,
      );
      Alert.alert(
        "Changes Requested",
        "Review with requested changes has been submitted",
      );
      setShowReviewModal(false);
      setCustomComment("");
    } catch (error) {
      console.error("Failed to request changes:", error);
      Alert.alert("Error", "Failed to request changes");
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return colorScheme === "dark" ? "#22c55e" : "#16a34a";
      case "medium":
        return colorScheme === "dark" ? "#f59e0b" : "#d97706";
      case "high":
        return colorScheme === "dark" ? "#ef4444" : "#dc2626";
      default:
        return colorScheme === "dark" ? "#94a3b8" : "#64748b";
    }
  };

  const getAnalysisStatus = (pr: PullRequest) => {
    const analysis = analyses.get(pr.number);
    if (!analysis) return { status: "Not Analyzed", color: "#94a3b8" };
    return { status: "Analyzed", color: "#22c55e" };
  };

  const getMetricsStatus = (pr: PullRequest) => {
    if (!metrics) return { status: "Metrics Not Loaded", color: "#94a3b8" };
    return { status: "Metrics Loaded", color: "#3b82f6" };
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>
          Pull Request Analyzer
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Repository: {repository.full_name}
        </ThemedText>
      </ThemedView>

      {pullRequests.length === 0 ? (
        <ThemedView style={styles.emptyState}>
          <IconSymbol
            name="doc.text.magnifyingglass"
            size={48}
            color="#94a3b8"
          />
          <ThemedText style={styles.emptyStateText}>
            No open pull requests found in this repository.
          </ThemedText>
        </ThemedView>
      ) : (
        <ScrollView style={styles.prList}>
          {pullRequests.map(pr => {
            const analysisStatus = getAnalysisStatus(pr);
            const metricsStatus = getMetricsStatus(pr);

            return (
              <ThemedView
                key={pr.id}
                style={[
                  styles.prCard,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#1f2937" : "#f8fafc",
                  },
                ]}
              >
                <View style={styles.prHeader}>
                  <View style={styles.prInfo}>
                    <Text style={styles.prTitle}>
                      #{pr.number}: {pr.title}
                    </Text>
                    <Text style={styles.prMeta}>
                      by {pr.user.login} •{" "}
                      {formatDistanceToNow(new Date(pr.created_at), {
                        addSuffix: true,
                      })}
                    </Text>
                  </View>
                  <View style={styles.prStatus}>
                    <View
                      style={[
                        styles.statusIndicator,
                        { backgroundColor: analysisStatus.color },
                      ]}
                    />
                    <Text style={styles.statusText}>
                      {analysisStatus.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.prActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.analyzeButton]}
                    onPress={() => handleAnalyze(pr)}
                    disabled={isAnalyzing}
                  >
                    <IconSymbol name="wand.and.stars" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>
                      {isAnalyzing ? "Analyzing..." : "Analyze"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.metricsButton]}
                    onPress={() => handleGetMetrics(pr)}
                  >
                    <IconSymbol name="chart.bar" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Metrics</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.reviewButton]}
                    onPress={() => handleCreateReview(pr)}
                  >
                    <IconSymbol name="doc.text" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Auto Review</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.prActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(pr)}
                  >
                    <IconSymbol
                      name="checkmark.circle"
                      size={16}
                      color="#fff"
                    />
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.changesButton]}
                    onPress={() => {
                      setSelectedPr(pr);
                      handleRequestChanges(pr);
                    }}
                  >
                    <IconSymbol
                      name="exclamationmark.circle"
                      size={16}
                      color="#fff"
                    />
                    <Text style={styles.actionButtonText}>Request Changes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.commentButton]}
                    onPress={() => {
                      setSelectedPr(pr);
                      Alert.prompt(
                        "Add Comment",
                        "Enter your comment:",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Comment",
                            onPress: async comment => {
                              if (comment) {
                                try {
                                  await addCommentToPr(
                                    repository.owner.login,
                                    repository.name,
                                    pr.number,
                                    comment,
                                  );
                                  Alert.alert(
                                    "Comment Added",
                                    "Your comment has been added to the PR",
                                  );
                                } catch (error) {
                                  console.error(
                                    "Failed to add comment:",
                                    error,
                                  );
                                  Alert.alert("Error", "Failed to add comment");
                                }
                              }
                            },
                          },
                        ],
                        "plain-text",
                      );
                    }}
                  >
                    <IconSymbol
                      name="bubble.left.and.bubble.right"
                      size={16}
                      color="#fff"
                    />
                    <Text style={styles.actionButtonText}>Comment</Text>
                  </TouchableOpacity>
                </View>

                {analyses.get(pr.number) && (
                  <View style={styles.analysisResults}>
                    <Text style={styles.analysisTitle}>Analysis Results</Text>
                    <View style={styles.analysisRow}>
                      <Text style={styles.analysisLabel}>Risk Level:</Text>
                      <View style={styles.riskBadge}>
                        <Text
                          style={[
                            styles.riskText,
                            {
                              color: getRiskColor(
                                analyses.get(pr.number)!.riskLevel,
                              ),
                            },
                          ]}
                        >
                          {analyses.get(pr.number)!.riskLevel.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.analysisRow}>
                      <Text style={styles.analysisLabel}>Summary:</Text>
                      <Text style={styles.analysisValue}>
                        {analyses.get(pr.number)!.summary}
                      </Text>
                    </View>
                    {analyses.get(pr.number)!.issues.length > 0 && (
                      <View style={styles.analysisRow}>
                        <Text style={styles.analysisLabel}>Issues:</Text>
                        <View style={styles.issuesList}>
                          {analyses
                            .get(pr.number)!
                            .issues.map((issue, index) => (
                              <Text key={index} style={styles.issueItem}>
                                • {issue}
                              </Text>
                            ))}
                        </View>
                      </View>
                    )}
                    {analyses.get(pr.number)!.suggestions.length > 0 && (
                      <View style={styles.analysisRow}>
                        <Text style={styles.analysisLabel}>Suggestions:</Text>
                        <View style={styles.suggestionsList}>
                          {analyses
                            .get(pr.number)!
                            .suggestions.map((suggestion, index) => (
                              <Text key={index} style={styles.suggestionItem}>
                                • {suggestion}
                              </Text>
                            ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </ThemedView>
            );
          })}
        </ScrollView>
      )}

      {/* Request Changes Modal */}
      <Modal visible={showReviewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colorScheme === "dark" ? "#1f2937" : "#ffffff",
              },
            ]}
          >
            <Text style={styles.modalTitle}>Request Changes</Text>
            <Text style={styles.modalSubtitle}>
              Please provide detailed feedback on what changes are needed:
            </Text>

            <TextInput
              style={[
                styles.textInput,
                { borderColor: colorScheme === "dark" ? "#374151" : "#d1d5db" },
              ]}
              value={customComment}
              onChangeText={setCustomComment}
              placeholder="Enter your review comments..."
              placeholderTextColor={
                colorScheme === "dark" ? "#9ca3af" : "#6b7280"
              }
              multiline
              numberOfLines={6}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowReviewModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={submitRequestChanges}
                disabled={!customComment.trim()}
              >
                <Text style={styles.submitButtonText}>
                  Submit Changes Request
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.8,
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
  prList: {
    flex: 1,
  },
  prCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  prInfo: {
    flex: 1,
  },
  prTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  prMeta: {
    fontSize: 12,
    opacity: 0.8,
  },
  prStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    opacity: 0.8,
  },
  prActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
  },
  analyzeButton: {
    backgroundColor: "#3b82f6",
  },
  metricsButton: {
    backgroundColor: "#10b981",
  },
  reviewButton: {
    backgroundColor: "#8b5cf6",
  },
  approveButton: {
    backgroundColor: "#22c55e",
  },
  changesButton: {
    backgroundColor: "#f59e0b",
  },
  commentButton: {
    backgroundColor: "#6366f1",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
  analysisResults: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  analysisRow: {
    marginBottom: 8,
  },
  analysisLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 4,
  },
  analysisValue: {
    fontSize: 14,
  },
  riskBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  riskText: {
    fontSize: 12,
    fontWeight: "600",
  },
  issuesList: {
    marginTop: 4,
  },
  issueItem: {
    fontSize: 14,
    color: "#ef4444",
    marginBottom: 2,
  },
  suggestionsList: {
    marginTop: 4,
  },
  suggestionItem: {
    fontSize: 14,
    color: "#10b981",
    marginBottom: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 20,
    minHeight: 120,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#ef4444",
  },
  submitButton: {
    backgroundColor: "#22c55e",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});

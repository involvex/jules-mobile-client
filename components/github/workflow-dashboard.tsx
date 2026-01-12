import {
  useWorkflowUpdates,
  WorkflowUpdate,
} from "@/hooks/use-workflow-updates";
import { useGithubApi, Workflow, WorkflowRun } from "@/hooks/use-github-api";
import React, { useCallback, useEffect, useState } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { WorkflowRunCard } from "./workflow-run-card";
import { FlatList, StyleSheet } from "react-native";
import { WorkflowCard } from "./workflow-card";

interface WorkflowDashboardProps {
  owner: string;
  repo: string;
}

export function WorkflowDashboard({ owner, repo }: WorkflowDashboardProps) {
  const { getWorkflows, getWorkflowRuns, isLoading } = useGithubApi();
  const { startPolling, stopPolling, getUpdatesForWorkflow, getRecentUpdates } =
    useWorkflowUpdates();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const colorScheme = useColorScheme();

  // Load workflows and runs
  const loadWorkflows = useCallback(async () => {
    try {
      const [workflowsData, runsData] = await Promise.all([
        getWorkflows(owner, repo),
        getWorkflowRuns(owner, repo, undefined, 20, 1),
      ]);

      setWorkflows(workflowsData);
      setWorkflowRuns(runsData);
      setHasMore(runsData.length === 20);
    } catch (error) {
      console.error("Failed to load workflows:", error);
    }
  }, [owner, repo, getWorkflows, getWorkflowRuns]);

  // Load more workflow runs
  const loadMoreRuns = useCallback(async () => {
    if (isLoading || !hasMore) return;

    try {
      const newRuns = await getWorkflowRuns(
        owner,
        repo,
        undefined,
        20,
        page + 1,
      );
      setWorkflowRuns(prev => [...prev, ...newRuns]);
      setPage(prev => prev + 1);
      setHasMore(newRuns.length === 20);
    } catch (error) {
      console.error("Failed to load more runs:", error);
    }
  }, [owner, repo, getWorkflowRuns, isLoading, hasMore, page]);

  // Start polling for updates
  useEffect(() => {
    loadWorkflows();
    startPolling(owner, repo, 30000); // Poll every 30 seconds

    return () => {
      stopPolling();
    };
  }, [owner, repo, startPolling, stopPolling, loadWorkflows]);

  // Get updates for selected workflow
  const workflowUpdates = selectedWorkflow
    ? getUpdatesForWorkflow(selectedWorkflow.id)
    : getRecentUpdates(20);

  const renderWorkflowItem = ({ item }: { item: Workflow }) => (
    <WorkflowCard
      workflow={item}
      isActive={selectedWorkflow?.id === item.id}
      onPress={() => setSelectedWorkflow(item)}
      updates={getUpdatesForWorkflow(item.id) as any}
    />
  );

  const renderRunItem = ({ item }: { item: WorkflowRun }) => (
    <WorkflowRunCard
      run={item}
      workflow={workflows.find(w => w.id === item.id)}
    />
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ThemedText style={[styles.title, { color: textColor }]}>
        Workflows
      </ThemedText>

      {/* Workflows List */}
      <ThemedView style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
          Active Workflows
        </ThemedText>
        <FlatList
          data={workflows}
          renderItem={renderWorkflowItem}
          keyExtractor={item => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.workflowsList}
        />
      </ThemedView>

      {/* Workflow Runs */}
      <ThemedView style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
          Recent Runs
        </ThemedText>
        <FlatList
          data={workflowRuns}
          renderItem={renderRunItem}
          keyExtractor={item => item.id.toString()}
          onEndReached={loadMoreRuns}
          onEndReachedThreshold={0.1}
          showsVerticalScrollIndicator={false}
        />
      </ThemedView>

      {/* Updates Feed */}
      {workflowUpdates.length > 0 && (
        <ThemedView style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
            Recent Updates
          </ThemedText>
          {workflowUpdates
            .slice(0, 5)
            .map((update: WorkflowUpdate, index: number) => (
              <ThemedView key={index} style={styles.updateItem}>
                <ThemedText style={[styles.updateText, { color: textColor }]}>
                  {update.type === "status_change" &&
                    `Status changed to ${update.status}`}
                  {update.type === "new_run" && "New workflow run started"}
                  {update.type === "completed" &&
                    `Workflow completed with ${update.conclusion}`}
                </ThemedText>
                <ThemedText style={[styles.updateTime, { color: textColor }]}>
                  {update.timestamp.toLocaleTimeString()}
                </ThemedText>
              </ThemedView>
            ))}
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  workflowsList: {
    maxHeight: 120,
  },
  updateItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  updateText: {
    flex: 1,
    fontSize: 14,
  },
  updateTime: {
    fontSize: 12,
    opacity: 0.7,
  },
});

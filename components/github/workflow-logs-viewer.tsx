import {
  atomOneDark,
  atomOneLight,
} from "react-syntax-highlighter/dist/esm/styles/hljs";
import { useWorkflowUpdates } from "@/hooks/use-workflow-updates";
import SyntaxHighlighter from "react-native-syntax-highlighter";
import React, { useCallback, useEffect, useState } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useGithubApi } from "@/hooks/use-github-api";
import { ScrollView, StyleSheet } from "react-native";

interface WorkflowLogsViewerProps {
  owner: string;
  repo: string;
  runId: number;
}

export function WorkflowLogsViewer({
  owner,
  repo,
  runId,
}: WorkflowLogsViewerProps) {
  const { getWorkflowRunLogs, getWorkflowRunDetails, isLoading } =
    useGithubApi();
  const { getUpdatesForWorkflow } = useWorkflowUpdates();
  const [logs, setLogs] = useState<string>("");
  const [runDetails, setRunDetails] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "background");

  // Load logs and run details
  const loadLogs = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [logsData, runData] = await Promise.all([
        getWorkflowRunLogs(owner, repo, runId),
        getWorkflowRunDetails(owner, repo, runId),
      ]);

      setLogs(logsData);
      setRunDetails(runData);
    } catch (error) {
      console.error("Failed to load logs:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [owner, repo, runId, getWorkflowRunLogs, getWorkflowRunDetails]);

  // Auto-refresh logs when run is in progress
  useEffect(() => {
    loadLogs();

    if (runDetails?.status === "in_progress") {
      const interval = setInterval(loadLogs, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [loadLogs, runDetails?.status]);

  const getLogLanguage = () => {
    // Try to detect language from logs
    if (logs.includes("npm") || logs.includes("yarn")) return "bash";
    if (logs.includes("python")) return "python";
    if (logs.includes("java")) return "java";
    if (logs.includes("node")) return "javascript";
    return "bash"; // Default
  };

  const formatLogLine = (line: string) => {
    // Add timestamp formatting if present
    const timestampMatch = line.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    if (timestampMatch) {
      return line.replace(timestampMatch[0], `[${timestampMatch[0]}]`);
    }
    return line;
  };

  const processedLogs = logs.split("\n").map(formatLogLine).join("\n");

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ThemedView style={[styles.header, { backgroundColor: cardColor }]}>
        <ThemedText style={[styles.title, { color: textColor }]}>
          Workflow Run Logs
        </ThemedText>
        {runDetails && (
          <ThemedText style={[styles.runInfo, { color: textColor }]}>
            Run #{runDetails.id} • {runDetails.status} • {runDetails.event}
          </ThemedText>
        )}
        <ThemedText style={[styles.refreshStatus, { color: textColor }]}>
          {isRefreshing
            ? "Refreshing..."
            : "Auto-refresh enabled for in-progress runs"}
        </ThemedText>
      </ThemedView>

      <ScrollView style={styles.logsContainer}>
        {isLoading ? (
          <ThemedText style={[styles.loadingText, { color: textColor }]}>
            Loading logs...
          </ThemedText>
        ) : logs ? (
          <SyntaxHighlighter
            language={getLogLanguage()}
            style={colorScheme === "dark" ? atomOneDark : atomOneLight}
            customStyle={{
              backgroundColor: "transparent",
              fontSize: 12,
              lineHeight: 18,
              padding: 0,
              margin: 0,
            }}
            codeTagProps={{
              style: {
                fontFamily: "monospace",
                fontSize: 12,
              },
            }}
            value={processedLogs}
          />
        ) : (
          <ThemedText style={[styles.emptyText, { color: textColor }]}>
            No logs available for this run.
          </ThemedText>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  runInfo: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  refreshStatus: {
    fontSize: 12,
    opacity: 0.7,
  },
  logsContainer: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    textAlign: "center",
    paddingVertical: 20,
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: 20,
    fontSize: 14,
    opacity: 0.7,
  },
});

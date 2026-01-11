import { useCallback, useEffect, useRef, useState } from "react";
import { useGithubApi } from "./use-github-api";

export interface WorkflowUpdate {
  type: "status_change" | "new_run" | "completed";
  workflowId: number;
  runId: number;
  status: string;
  conclusion: string | null;
  timestamp: Date;
}

export function useWorkflowUpdates() {
  const { getWorkflowRuns, getWorkflowRunDetails, isAuthenticated, isLoading } =
    useGithubApi();
  const [updates, setUpdates] = useState<WorkflowUpdate[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRunIdsRef = useRef<Map<number, number>>(new Map());
  const lastStatusesRef = useRef<Map<number, string>>(new Map());

  // Poll for workflow status changes
  const startPolling = useCallback(
    async (owner: string, repo: string, intervalMs = 30000) => {
      if (!isAuthenticated || isLoading) return;

      setIsPolling(true);
      const poll = async () => {
        try {
          // Get recent workflow runs
          const runs = await getWorkflowRuns(owner, repo, undefined, 10, 1);

          runs.forEach(async run => {
            const lastRunId = lastRunIdsRef.current.get(run.id);
            const lastStatus = lastStatusesRef.current.get(run.id);

            // Check for new runs
            if (!lastRunId) {
              setUpdates(prev => [
                ...prev,
                {
                  type: "new_run",
                  workflowId: run.id,
                  runId: run.id,
                  status: run.status,
                  conclusion: run.conclusion,
                  timestamp: new Date(),
                },
              ]);
              lastRunIdsRef.current.set(run.id, run.id);
            }

            // Check for status changes
            if (lastStatus && lastStatus !== run.status) {
              setUpdates(prev => [
                ...prev,
                {
                  type: "status_change",
                  workflowId: run.id,
                  runId: run.id,
                  status: run.status,
                  conclusion: run.conclusion,
                  timestamp: new Date(),
                },
              ]);
            }

            // Check for completion
            if (
              run.status === "completed" &&
              run.conclusion &&
              lastStatus !== "completed"
            ) {
              setUpdates(prev => [
                ...prev,
                {
                  type: "completed",
                  workflowId: run.id,
                  runId: run.id,
                  status: run.status,
                  conclusion: run.conclusion,
                  timestamp: new Date(),
                },
              ]);
            }

            lastStatusesRef.current.set(run.id, run.status);
          });
        } catch (error) {
          console.error("Failed to poll workflow updates:", error);
        }
      };

      // Initial poll
      await poll();

      // Set up interval
      pollingIntervalRef.current = setInterval(poll, intervalMs);
    },
    [isAuthenticated, isLoading, getWorkflowRuns],
  );

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
    lastRunIdsRef.current.clear();
    lastStatusesRef.current.clear();
  }, []);

  // Clear updates
  const clearUpdates = useCallback(() => {
    setUpdates([]);
  }, []);

  // Get updates for a specific workflow
  const getUpdatesForWorkflow = useCallback(
    (workflowId: number) => {
      return updates.filter(update => update.workflowId === workflowId);
    },
    [updates],
  );

  // Get recent updates
  const getRecentUpdates = useCallback(
    (limit = 10) => {
      return updates.slice(-limit);
    },
    [updates],
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    updates,
    isPolling,
    startPolling,
    stopPolling,
    clearUpdates,
    getUpdatesForWorkflow,
    getRecentUpdates,
  };
}

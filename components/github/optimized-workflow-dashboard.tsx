import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
  TextInput,
} from "react-native";
import { OptimizedList, SkeletonList } from "@/components/ui/optimized-list";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { cacheManager, performanceMonitor } from "@/utils/performance";
import { useWorkflowUpdates } from "@/hooks/use-workflow-updates";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useGithubApi } from "@/hooks/use-github-api";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

// Enable LayoutAnimation on Android
if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface Workflow {
  id: number;
  name: string;
  path: string;
  state: string;
  created_at: string;
  updated_at: string;
}

interface OptimizedWorkflowDashboardProps {
  owner: string;
  repo: string;
  onWorkflowSelect: (workflow: Workflow) => void;
  onWorkflowRun: (workflowId: number) => void;
}

export function OptimizedWorkflowDashboard({
  owner,
  repo,
  onWorkflowSelect,
  onWorkflowRun,
}: OptimizedWorkflowDashboardProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "updated" | "created">(
    "updated",
  );
  const [filterBy, setFilterBy] = useState<"all" | "active" | "disabled">(
    "all",
  );

  const { getWorkflows } = useGithubApi();
  const { startPolling, stopPolling, updates, isPolling } =
    useWorkflowUpdates();

  const textColor = useThemeColor({}, "text");

  // Performance optimization: memoize expensive calculations
  const filteredAndSortedWorkflows = useMemo(() => {
    let filtered = workflows;

    // Filter by state
    if (filterBy !== "all") {
      filtered = filtered.filter(workflow => workflow.state === filterBy);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        workflow =>
          workflow.name.toLowerCase().includes(query) ||
          workflow.path.toLowerCase().includes(query),
      );
    }

    // Sort workflows
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "updated":
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        case "created":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        default:
          return 0;
      }
    });
  }, [workflows, searchQuery, sortBy, filterBy]);

  // Performance optimization: cache workflows
  const loadWorkflows = useCallback(async () => {
    const cacheKey = `workflows_${owner}_${repo}`;
    const cached = cacheManager.get<Workflow[]>(cacheKey);

    if (cached) {
      setWorkflows(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const timer = performanceMonitor.startTimer("loadWorkflows");
      const data = await getWorkflows(owner, repo);
      timer();

      setWorkflows(data);
      cacheManager.set(cacheKey, data, 5 * 60 * 1000); // Cache for 5 minutes
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workflows");
    } finally {
      setLoading(false);
    }
  }, [owner, repo, getWorkflows]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWorkflows();
    setRefreshing(false);
  }, [loadWorkflows]);

  const handleWorkflowSelect = useCallback(
    (workflow: Workflow) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      onWorkflowSelect(workflow);
    },
    [onWorkflowSelect],
  );

  const handleWorkflowRun = useCallback(
    (workflowId: number) => {
      onWorkflowRun(workflowId);
    },
    [onWorkflowRun],
  );

  const handleSortChange = useCallback((newSortBy: typeof sortBy) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSortBy(newSortBy);
  }, []);

  const handleFilterChange = useCallback((newFilterBy: typeof filterBy) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFilterBy(newFilterBy);
  }, []);

  // Start polling for updates when component mounts
  useEffect(() => {
    loadWorkflows();
    startPolling(owner, repo, 30000); // Poll every 30 seconds

    return () => {
      stopPolling();
    };
  }, [owner, repo, startPolling, stopPolling, loadWorkflows]);

  // Update workflow status based on real-time updates
  useEffect(() => {
    if (updates.length > 0) {
      setWorkflows(prevWorkflows =>
        prevWorkflows.map(workflow => {
          const latestUpdate = updates.find(u => u.workflowId === workflow.id);
          if (latestUpdate) {
            return {
              ...workflow,
              // Update workflow status based on latest update
              state:
                latestUpdate.status === "completed"
                  ? "completed"
                  : workflow.state,
            };
          }
          return workflow;
        }),
      );
    }
  }, [updates]);

  const renderWorkflowItem = useCallback(
    ({ item, index }: { item: Workflow; index: number }) => (
      <WorkflowCard
        workflow={item}
        onPress={() => handleWorkflowSelect(item)}
        onRun={() => handleWorkflowRun(item.id)}
        style={[
          styles.workflowCard,
          { transform: [{ scale: 1 }] }, // For animation
        ]}
      />
    ),
    [handleWorkflowSelect, handleWorkflowRun],
  );

  const renderHeader = useCallback(
    () => (
      <View style={styles.headerContainer}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchLabel}>Search workflows:</Text>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <AnimatedTextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name or path..."
              placeholderTextColor={textColor}
            />
          </View>
        </View>

        <View style={styles.filtersContainer}>
          <Text style={styles.filtersLabel}>Sort by:</Text>
          <View style={styles.sortButtons}>
            {[
              { key: "name", label: "Name" },
              { key: "updated", label: "Updated" },
              { key: "created", label: "Created" },
            ].map(sortOption => (
              <TouchableOpacity
                key={sortOption.key}
                style={[
                  styles.sortButton,
                  sortBy === sortOption.key && styles.sortButtonActive,
                ]}
                onPress={() =>
                  handleSortChange(sortOption.key as typeof sortBy)
                }
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === sortOption.key && styles.sortButtonTextActive,
                  ]}
                >
                  {sortOption.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filtersLabel}>Filter by:</Text>
          <View style={styles.filterButtons}>
            {[
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "disabled", label: "Disabled" },
            ].map(filterOption => (
              <TouchableOpacity
                key={filterOption.key}
                style={[
                  styles.filterButton,
                  filterBy === filterOption.key && styles.filterButtonActive,
                ]}
                onPress={() =>
                  handleFilterChange(filterOption.key as typeof filterBy)
                }
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filterBy === filterOption.key &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {filterOption.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isPolling && (
          <View style={styles.pollingIndicator}>
            <Text style={styles.pollingText}>Live updates enabled</Text>
          </View>
        )}
      </View>
    ),
    [
      searchQuery,
      sortBy,
      filterBy,
      handleSortChange,
      handleFilterChange,
      isPolling,
      textColor,
    ],
  );

  if (loading && workflows.length === 0) {
    return (
      <View style={styles.container}>
        <SkeletonList
          itemCount={8}
          renderItem={index => (
            <View key={index} style={styles.skeletonCard}>
              <View style={styles.skeletonTitle} />
              <View style={styles.skeletonSubtitle} />
              <View style={styles.skeletonActions} />
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OptimizedList
        data={filteredAndSortedWorkflows}
        renderItem={renderWorkflowItem}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={renderHeader}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        loading={loading}
        emptyMessage="No workflows found"
        estimatedItemSize={120}
        showsVerticalScrollIndicator={false}
      />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

interface WorkflowCardProps {
  workflow: Workflow;
  onPress: () => void;
  onRun: () => void;
  style?: any;
}

function WorkflowCard({ workflow, onPress, onRun, style }: WorkflowCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => setIsPressed(true);
  const handlePressOut = () => setIsPressed(false);

  const animatedStyle = useMemo(
    () => ({
      transform: [
        { scale: isPressed ? 0.98 : 1 },
        { translateY: isPressed ? 2 : 0 },
      ],
      shadowOpacity: isPressed ? 0.1 : 0.2,
    }),
    [isPressed],
  );

  const statusColor = useMemo(() => {
    switch (workflow.state) {
      case "active":
        return "#4ade80"; // Green
      case "disabled":
        return "#f87171"; // Red
      default:
        return "#94a3b8"; // Gray
    }
  }, [workflow.state]);

  return (
    <PanGestureHandler
      onGestureEvent={(event: any) => {
        // Handle swipe gestures for quick actions
        if (event.nativeEvent.translationX > 50) {
          onRun();
        }
      }}
      onHandlerStateChange={(event: any) => {
        if (event.nativeEvent.state === State.END) {
          onPress();
        }
      }}
    >
      <Animated.View style={[styles.cardContainer, animatedStyle, style]}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.workflowName} numberOfLines={2}>
              {workflow.name}
            </Text>
            <View
              style={[styles.statusIndicator, { backgroundColor: statusColor }]}
            />
          </View>

          <Text style={styles.workflowPath} numberOfLines={1}>
            {workflow.path}
          </Text>

          <View style={styles.cardFooter}>
            <Text style={styles.workflowDate}>
              Updated: {new Date(workflow.updated_at).toLocaleDateString()}
            </Text>
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onRun}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              >
                <Text style={styles.actionButtonText}>Run</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.detailsButton]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              >
                <Text
                  style={[styles.actionButtonText, styles.detailsButtonText]}
                >
                  Details
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  headerContainer: {
    padding: 16,
    backgroundColor: "transparent",
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
  },
  sortButtonActive: {
    backgroundColor: "#3b82f6",
  },
  sortButtonText: {
    fontSize: 12,
    color: "#333",
  },
  sortButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
  },
  filterButtonActive: {
    backgroundColor: "#10b981",
  },
  filterButtonText: {
    fontSize: 12,
    color: "#333",
  },
  filterButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  pollingIndicator: {
    backgroundColor: "#ecfdf5",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  pollingText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  workflowCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  cardContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    boxShadow: "0px 2px 4px 0px rgba(0, 0, 0, 0.1)",
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  workflowName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginRight: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  workflowPath: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workflowDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
  },
  detailsButton: {
    backgroundColor: "#eff6ff",
  },
  actionButtonText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
  detailsButtonText: {
    color: "#2563eb",
  },
  skeletonCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  skeletonTitle: {
    height: 20,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonSubtitle: {
    height: 16,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    marginBottom: 12,
    width: "60%",
  },
  skeletonActions: {
    height: 24,
    backgroundColor: "#e5e7eb",
    borderRadius: 12,
    width: "30%",
  },
  errorContainer: {
    padding: 16,
    alignItems: "center",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

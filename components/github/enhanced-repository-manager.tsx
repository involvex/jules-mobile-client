import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { OptimizedList, SkeletonList } from "@/components/ui/optimized-list";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useGithubApi, Repository } from "@/hooks/use-github-api";
import { useRepositorySync } from "@/hooks/use-repository-sync";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { formatDistanceToNow } from "date-fns";
import { Image } from "expo-image";

interface EnhancedRepositoryManagerProps {
  onRepositorySelect?: (repository: Repository) => void;
}

export function EnhancedRepositoryManager({
  onRepositorySelect,
}: EnhancedRepositoryManagerProps) {
  const colorScheme = useColorScheme();
  const {
    syncStatus,
    cache,
    syncRepositories,
    getOfflineRepositories,
    checkRepositoryHealth,
    startBackgroundSync,
    stopBackgroundSync,
  } = useRepositorySync();
  const { isAuthenticated, getRepoTopics, getRepoLanguages } = useGithubApi();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string | null>(null);
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedRepoId, setExpandedRepoId] = useState<number | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<Record<number, boolean>>(
    {},
  );
  const [repoDetails, setRepoDetails] = useState<
    Record<
      number,
      {
        topics?: string[];
        languages?: Record<string, number>;
      }
    >
  >({});

  const theme = useThemeColor({}, "text");
  const isDark = colorScheme === "dark";

  // Enhanced repository data with additional details
  const enhancedRepositories = useMemo(() => {
    return repositories.map(repo => ({
      ...repo,
      topics: repoDetails[repo.id]?.topics || repo.topics || [],
      languages: repoDetails[repo.id]?.languages || repo.languages || {},
    }));
  }, [repositories, repoDetails]);

  // Filter and search repositories
  const filteredRepositories = useMemo(() => {
    return enhancedRepositories
      .filter(repo => {
        // Search filter
        const matchesSearch = searchQuery
          ? repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            repo.description
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
          : true;

        // Language filter
        const matchesLanguage = languageFilter
          ? repo.language === languageFilter ||
            Object.keys(repo.languages || {}).includes(languageFilter)
          : true;

        // Topic filter
        const matchesTopic = topicFilter
          ? (repo.topics || []).includes(topicFilter)
          : true;

        return matchesSearch && matchesLanguage && matchesTopic;
      })
      .sort((a, b) => {
        // Sort by updated_at if available, otherwise by id
        if (a.updated_at && b.updated_at) {
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        }
        return b.id - a.id;
      });
  }, [enhancedRepositories, searchQuery, languageFilter, topicFilter]);

  const loadRepositories = useCallback(
    async (reset = false) => {
      if (!reset && (!hasMore || loadingMore)) return;

      try {
        if (reset) {
          setPage(1);
          setHasMore(true);
        }

        const currentPage = reset ? 1 : page;
        setLoadingMore(!reset);

        if (cache) {
          setRepositories(cache.repositories);
        } else {
          const offlineRepos = await getOfflineRepositories();
          setRepositories(offlineRepos);
        }

        // Simulate pagination - in real implementation, this would be API call
        if (currentPage === 1) {
          setHasMore(cache ? cache.repositories.length > 0 : false);
        }
      } catch (error) {
        console.error("Failed to load repositories:", error);
        Alert.alert("Error", "Failed to load repositories");
      } finally {
        setLoadingMore(false);
      }
    },
    [cache, page, hasMore, loadingMore, getOfflineRepositories],
  );

  const handleSync = async () => {
    try {
      setIsRefreshing(true);
      await syncRepositories();
      await loadRepositories(true);
    } catch (error) {
      console.error("Sync failed:", error);
      Alert.alert(
        "Sync Failed",
        "Unable to sync repositories. Please check your connection.",
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleHealthCheck = async (repository: Repository) => {
    try {
      const health = await checkRepositoryHealth(repository);
      Alert.alert(
        "Repository Health",
        `Status: ${health.healthy ? "Healthy" : "Issues detected"}\n\nIssues: ${health.issues.join(", ")}`,
      );
    } catch (error) {
      console.error("Health check failed:", error);
      Alert.alert("Health Check Failed", "Unable to check repository health.");
    }
  };

  const loadRepoDetails = useCallback(
    async (repo: Repository) => {
      if (repoDetails[repo.id] || loadingDetails[repo.id]) return;

      try {
        setLoadingDetails(prev => ({ ...prev, [repo.id]: true }));

        // Load topics and languages in parallel
        const [topics, languages] = await Promise.all([
          getRepoTopics(repo.owner.login, repo.name),
          getRepoLanguages(repo.owner.login, repo.name),
        ]);

        setRepoDetails(prev => ({
          ...prev,
          [repo.id]: { topics, languages },
        }));
      } catch (error) {
        console.error(`Failed to load details for ${repo.full_name}:`, error);
      } finally {
        setLoadingDetails(prev => ({ ...prev, [repo.id]: false }));
      }
    },
    [repoDetails, loadingDetails, getRepoTopics, getRepoLanguages],
  );

  const toggleRepoExpansion = useCallback(
    (repoId: number) => {
      if (expandedRepoId === repoId) {
        setExpandedRepoId(null);
      } else {
        setExpandedRepoId(repoId);
        // Load details when expanding
        const repo = repositories.find(r => r.id === repoId);
        if (repo) {
          loadRepoDetails(repo);
        }
      }
    },
    [expandedRepoId, repositories, loadRepoDetails],
  );

  const formatLastSync = (date: Date | null) => {
    if (!date) return "Never";
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const formatNextSync = (date: Date | null) => {
    if (!date) return "Not scheduled";
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getStatusIcon = () => {
    if (syncStatus.isSyncing) return "cloud.upload";
    if (syncStatus.error) return "exclamationmark.triangle";
    if (syncStatus.lastSync) return "checkmark.circle";
    return "cloud";
  };

  const getStatusColor = () => {
    if (syncStatus.isSyncing)
      return colorScheme === "dark" ? "#3b82f6" : "#2563eb";
    if (syncStatus.error) return colorScheme === "dark" ? "#ef4444" : "#dc2626";
    if (syncStatus.lastSync)
      return colorScheme === "dark" ? "#22c55e" : "#16a34a";
    return colorScheme === "dark" ? "#94a3b8" : "#64748b";
  };

  const getRepositoryIcon = (repository: Repository) => {
    return repository.private ? "lock.fill" : "globe.fill";
  };

  const getRepositoryIconColor = (repository: Repository) => {
    return repository.private
      ? colorScheme === "dark"
        ? "#f59e0b"
        : "#d97706"
      : colorScheme === "dark"
        ? "#22c55e"
        : "#16a34a";
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      JavaScript: "#f1e05a",
      TypeScript: "#3178c6",
      Python: "#3572A5",
      Java: "#b07219",
      Go: "#00ADD8",
      Rust: "#dea584",
      Swift: "#ffac45",
      Kotlin: "#A97BFF",
      PHP: "#4F5D95",
      Ruby: "#701516",
      "C++": "#f34b7d",
      "C#": "#178600",
      HTML: "#e34c26",
      CSS: "#563d7c",
    };
    return colors[language] || "#64748b";
  };

  const renderRepositoryItem = useCallback(
    ({ item }: { item: Repository }) => {
      const isExpanded = expandedRepoId === item.id;
      const isLoading = loadingDetails[item.id];
      const hasDetails = !!repoDetails[item.id];

      return (
        <View
          style={[
            styles.repositoryContainer,
            isDark && styles.repositoryContainerDark,
          ]}
        >
          <TouchableOpacity
            style={[styles.repositoryItem, isDark && styles.repositoryItemDark]}
            onPress={() => onRepositorySelect?.(item)}
            onLongPress={() => handleHealthCheck(item)}
            activeOpacity={0.8}
          >
            <View style={styles.repositoryHeader}>
              <View style={styles.repositoryInfo}>
                <IconSymbol
                  name={getRepositoryIcon(item)}
                  size={16}
                  color={getRepositoryIconColor(item)}
                />
                <View style={styles.repositoryText}>
                  <ThemedText style={styles.repositoryName}>
                    {item.full_name}
                  </ThemedText>
                  {item.description && (
                    <ThemedText style={styles.repositoryDescription}>
                      {item.description}
                    </ThemedText>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => toggleRepoExpansion(item.id)}
                activeOpacity={0.6}
              >
                <IconSymbol
                  name={isExpanded ? "chevron.up" : "chevron.down"}
                  size={16}
                  color={isDark ? "#94a3b8" : "#64748b"}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.repositoryMeta}>
              <View style={styles.metaItem}>
                <IconSymbol name="star.fill" size={12} color="#f59e0b" />
                <ThemedText style={styles.metaText}>
                  {item.stargazers_count}
                </ThemedText>
              </View>
              <View style={styles.metaItem}>
                <IconSymbol name="fork.knife" size={12} color="#64748b" />
                <ThemedText style={styles.metaText}>
                  {item.forks_count}
                </ThemedText>
              </View>
              {item.language && (
                <View style={styles.metaItem}>
                  <View
                    style={[
                      styles.languageDot,
                      { backgroundColor: getLanguageColor(item.language) },
                    ]}
                  />
                  <ThemedText style={styles.metaText}>
                    {item.language}
                  </ThemedText>
                </View>
              )}
            </View>

            {isExpanded && (
              <View style={styles.repositoryDetails}>
                {isLoading ? (
                  <View style={styles.detailsLoading}>
                    <ActivityIndicator size="small" color={theme} />
                    <ThemedText style={styles.loadingText}>
                      Loading details...
                    </ThemedText>
                  </View>
                ) : hasDetails ? (
                  <>
                    {repoDetails[item.id]?.topics &&
                      repoDetails[item.id].topics.length > 0 && (
                        <View style={styles.detailsSection}>
                          <ThemedText style={styles.sectionTitle}>
                            Topics:
                          </ThemedText>
                          <View style={styles.topicsContainer}>
                            {repoDetails[item.id].topics.map(topic => (
                              <View
                                key={topic}
                                style={[
                                  styles.topicTag,
                                  isDark && styles.topicTagDark,
                                ]}
                              >
                                <ThemedText style={styles.topicText}>
                                  #{topic}
                                </ThemedText>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                    {repoDetails[item.id]?.languages &&
                      Object.keys(repoDetails[item.id].languages).length >
                        0 && (
                        <View style={styles.detailsSection}>
                          <ThemedText style={styles.sectionTitle}>
                            Languages:
                          </ThemedText>
                          <View style={styles.languagesContainer}>
                            {Object.entries(repoDetails[item.id].languages).map(
                              ([lang, bytes]) => (
                                <View key={lang} style={styles.languageItem}>
                                  <View
                                    style={[
                                      styles.languageDot,
                                      {
                                        backgroundColor: getLanguageColor(lang),
                                      },
                                    ]}
                                  />
                                  <ThemedText style={styles.languageText}>
                                    {lang}: {Math.round(bytes / 1024)} KB
                                  </ThemedText>
                                </View>
                              ),
                            )}
                          </View>
                        </View>
                      )}
                  </>
                ) : null}
              </View>
            )}
          </TouchableOpacity>
        </View>
      );
    },
    [
      expandedRepoId,
      loadingDetails,
      repoDetails,
      isDark,
      theme,
      onRepositorySelect,
      toggleRepoExpansion,
      getRepositoryIcon,
      getRepositoryIconColor,
      getLanguageColor,
    ],
  );

  const renderSearchHeader = () => (
    <View
      style={[styles.searchContainer, isDark && styles.searchContainerDark]}
    >
      <View style={styles.searchInputContainer}>
        <IconSymbol
          name="magnifyingglass"
          size={16}
          color={isDark ? "#94a3b8" : "#64748b"}
        />
        <TextInput
          style={[styles.searchInput, isDark && styles.searchInputDark]}
          placeholder="Search repositories..."
          placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearch}
            onPress={() => setSearchQuery("")}
          >
            <IconSymbol
              name="xmark.circle.fill"
              size={16}
              color={isDark ? "#94a3b8" : "#64748b"}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterButton, isDark && styles.filterButtonDark]}
          onPress={() =>
            setLanguageFilter(
              languageFilter === "TypeScript" ? null : "TypeScript",
            )
          }
        >
          <ThemedText style={styles.filterButtonText}>
            {languageFilter === "TypeScript" ? "✓ TypeScript" : "TypeScript"}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, isDark && styles.filterButtonDark]}
          onPress={() =>
            setTopicFilter(topicFilter === "react" ? null : "react")
          }
        >
          <ThemedText style={styles.filterButtonText}>
            {topicFilter === "react" ? "✓ React" : "React"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <ThemedView style={styles.emptyState}>
      <IconSymbol name="doc.text.magnifyingglass" size={48} color="#94a3b8" />
      <ThemedText style={styles.emptyStateText}>
        {searchQuery || languageFilter || topicFilter
          ? "No repositories match your filters"
          : "No repositories found. Sync to load your repositories."}
      </ThemedText>
      {!searchQuery && !languageFilter && !topicFilter && (
        <TouchableOpacity
          style={[styles.syncButton, styles.primaryButton]}
          onPress={handleSync}
          disabled={syncStatus.isSyncing}
        >
          <IconSymbol name="arrow.clockwise" size={16} color="#fff" />
          <ThemedText style={styles.primaryButtonText}>
            {syncStatus.isSyncing ? "Syncing..." : "Sync Now"}
          </ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    if (loadingMore) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme} />
          <Text style={styles.loadingText}>Loading more...</Text>
        </View>
      );
    }
    return null;
  };

  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.card}>
          <IconSymbol
            name="exclamationmark.triangle"
            size={48}
            color="#f59e0b"
          />
          <ThemedText style={styles.title}>Authentication Required</ThemedText>
          <ThemedText style={styles.subtitle}>
            Please configure your GitHub API token in Settings to access
            repository synchronization.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Sync Status Card */}
      <ThemedView style={[styles.card, styles.statusCard]}>
        <View style={styles.statusHeader}>
          <View style={styles.statusIconContainer}>
            <IconSymbol
              name={getStatusIcon()}
              size={24}
              color={getStatusColor()}
            />
          </View>
          <View style={styles.statusInfo}>
            <ThemedText style={styles.statusTitle}>
              {syncStatus.isSyncing
                ? "Syncing..."
                : syncStatus.error
                  ? "Sync Failed"
                  : syncStatus.lastSync
                    ? "Sync Complete"
                    : "Not Synced"}
            </ThemedText>
            <ThemedText style={styles.statusText}>
              Last sync: {formatLastSync(syncStatus.lastSync)}
            </ThemedText>
            <ThemedText style={styles.statusText}>
              Next sync: {formatNextSync(syncStatus.nextSync)}
            </ThemedText>
          </View>
        </View>

        {syncStatus.error && (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{syncStatus.error}</ThemedText>
          </View>
        )}

        <View style={styles.syncActions}>
          <TouchableOpacity
            style={[styles.syncButton, styles.primaryButton]}
            onPress={handleSync}
            disabled={syncStatus.isSyncing}
          >
            <IconSymbol name="arrow.clockwise" size={16} color="#fff" />
            <ThemedText style={styles.primaryButtonText}>
              {syncStatus.isSyncing ? "Syncing..." : "Sync Now"}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.syncButton, styles.secondaryButton]}
            onPress={
              syncStatus.isSyncing ? stopBackgroundSync : startBackgroundSync
            }
          >
            <IconSymbol
              name={syncStatus.isSyncing ? "pause.fill" : "play.fill"}
              size={16}
              color={colorScheme === "dark" ? "#1f2937" : "#f3f4f6"}
            />
            <ThemedText
              style={[
                styles.secondaryButtonText,
                { color: colorScheme === "dark" ? "#1f2937" : "#f3f4f6" },
              ]}
            >
              {syncStatus.isSyncing ? "Pause Sync" : "Start Background Sync"}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {syncStatus.isSyncing && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${syncStatus.progress}%` },
                ]}
              />
            </View>
            <ThemedText style={styles.progressText}>
              {syncStatus.progress}%
            </ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Repositories List */}
      <ThemedView style={styles.repositoriesCard}>
        <View style={styles.cardHeader}>
          <ThemedText style={styles.cardTitle}>
            Repositories ({filteredRepositories.length})
          </ThemedText>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleSync}
            disabled={syncStatus.isSyncing}
          >
            <IconSymbol
              name="arrow.clockwise"
              size={16}
              color={getStatusColor()}
            />
          </TouchableOpacity>
        </View>

        <OptimizedList
          data={filteredRepositories}
          renderItem={renderRepositoryItem}
          keyExtractor={item => item.id.toString()}
          onEndReached={() => loadRepositories()}
          onRefresh={handleSync}
          refreshing={isRefreshing}
          loading={loadingMore}
          emptyMessage={
            searchQuery || languageFilter || topicFilter
              ? "No repositories match your filters"
              : "No repositories found. Sync to load your repositories."
          }
          ListHeaderComponent={renderSearchHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
          estimatedItemSize={150}
          initialNumToRender={10}
          windowSize={10}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
        />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  repositoriesCard: {
    flex: 1,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statusIconContainer: {
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    opacity: 0.8,
  },
  errorContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
  },
  syncActions: {
    flexDirection: "row",
    gap: 8,
  },
  syncButton: {
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
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: "#e5e7eb",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#22c55e",
  },
  progressText: {
    textAlign: "right",
    fontSize: 12,
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
  },
  searchContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#f8fafc",
  },
  searchContainerDark: {
    backgroundColor: "#1f2937",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#1f2937",
    fontSize: 14,
  },
  searchInputDark: {
    color: "#f1f5f9",
    backgroundColor: "#334155",
  },
  clearSearch: {
    padding: 4,
  },
  filtersContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
  },
  filterButtonDark: {
    backgroundColor: "#334155",
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  repositoryContainer: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  repositoryContainerDark: {
    backgroundColor: "#1f2937",
  },
  repositoryItem: {
    padding: 12,
  },
  repositoryItemDark: {
    backgroundColor: "#1f2937",
  },
  repositoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  repositoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  repositoryText: {
    marginLeft: 8,
    flex: 1,
  },
  repositoryName: {
    fontSize: 16,
    fontWeight: "500",
  },
  repositoryDescription: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  expandButton: {
    padding: 8,
  },
  repositoryMeta: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    opacity: 0.8,
  },
  languageDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  repositoryDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  detailsLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
  },
  loadingText: {
    fontSize: 12,
    color: "#64748b",
  },
  detailsSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    opacity: 0.8,
  },
  topicsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  topicTag: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topicTagDark: {
    backgroundColor: "#334155",
  },
  topicText: {
    fontSize: 10,
    fontWeight: "500",
  },
  languagesContainer: {
    gap: 4,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  languageText: {
    fontSize: 12,
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
  loadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
  },
});

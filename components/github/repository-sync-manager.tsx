import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useGithubApi, Repository } from "@/hooks/use-github-api";
import { useRepositorySync } from "@/hooks/use-repository-sync";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import React, { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface RepositorySyncManagerProps {
  onRepositorySelect?: (repository: Repository) => void;
}

export function RepositorySyncManager({
  onRepositorySelect,
}: RepositorySyncManagerProps) {
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
  const { isAuthenticated } = useGithubApi();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadRepositories();
  }, [cache]);

  const loadRepositories = async () => {
    if (cache) {
      setRepositories(cache.repositories);
    } else {
      const offlineRepos = await getOfflineRepositories();
      setRepositories(offlineRepos);
    }
  };

  const handleSync = async () => {
    try {
      setIsRefreshing(true);
      await syncRepositories();
      await loadRepositories();
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
            Repositories ({repositories.length})
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

        <ScrollView
          style={styles.repositoriesList}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleSync}
              tintColor={getStatusColor()}
            />
          }
        >
          {repositories.length === 0 ? (
            <ThemedView style={styles.emptyState}>
              <IconSymbol
                name="doc.text.magnifyingglass"
                size={48}
                color="#94a3b8"
              />
              <ThemedText style={styles.emptyStateText}>
                No repositories found. Sync to load your repositories.
              </ThemedText>
            </ThemedView>
          ) : (
            repositories.map(repository => (
              <TouchableOpacity
                key={repository.id}
                style={[
                  styles.repositoryItem,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#1f2937" : "#f8fafc",
                  },
                ]}
                onPress={() => onRepositorySelect?.(repository)}
                onLongPress={() => handleHealthCheck(repository)}
              >
                <View style={styles.repositoryInfo}>
                  <IconSymbol
                    name={getRepositoryIcon(repository)}
                    size={16}
                    color={getRepositoryIconColor(repository)}
                  />
                  <View style={styles.repositoryText}>
                    <ThemedText style={styles.repositoryName}>
                      {repository.full_name}
                    </ThemedText>
                    {repository.description && (
                      <ThemedText style={styles.repositoryDescription}>
                        {repository.description}
                      </ThemedText>
                    )}
                  </View>
                </View>
                <View style={styles.repositoryMeta}>
                  <View style={styles.metaItem}>
                    <IconSymbol name="star.fill" size={12} color="#f59e0b" />
                    <ThemedText style={styles.metaText}>
                      {repository.stargazers_count}
                    </ThemedText>
                  </View>
                  <View style={styles.metaItem}>
                    <IconSymbol name="fork.knife" size={12} color="#64748b" />
                    <ThemedText style={styles.metaText}>
                      {repository.forks_count}
                    </ThemedText>
                  </View>
                  <View style={styles.metaItem}>
                    <IconSymbol name="circlebadge" size={12} color="#64748b" />
                    <ThemedText style={styles.metaText}>
                      {repository.language || "Unknown"}
                    </ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
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
  repositoriesList: {
    flex: 1,
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
  repositoryItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  repositoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
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
  repositoryMeta: {
    flexDirection: "row",
    gap: 16,
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

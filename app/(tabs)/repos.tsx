import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, StyleSheet, Text, View } from "react-native";
import React, { useCallback, useEffect } from "react";
import { Stack } from "expo-router";

import { EnhancedRepositoryManager } from "@/components/github/enhanced-repository-manager";
import { Repository, useGithubApi } from "@/hooks/use-github-api";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useI18n } from "@/constants/i18n-context";

export default function Repos() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useI18n();
  const { isAuthenticated, validateToken } = useGithubApi();

  const handleRepoPress = useCallback((repo: Repository) => {
    // TODO: Navigate to repository detail or session creation
    Alert.alert(
      repo.name,
      `${repo.description || "No description available"}\n\n${repo.html_url}`,
      [
        { text: "cancel", style: "cancel" },
        {
          text: "startSession",
          onPress: () => {
            // TODO: Implement session creation with repository context
            console.log("Starting session for:", repo.full_name);
          },
        },
      ],
    );
  }, []);

  // Initialize validation on mount only once
  useEffect(() => {
    const init = async () => {
      if (isAuthenticated) {
        await validateToken();
      }
    };
    init();
  }, []); // Empty dependency array - only run once on mount

  if (!isAuthenticated) {
    return (
      <>
        <Stack.Screen options={{ title: "repos" }} />
        <SafeAreaView
          style={[styles.container, isDark && styles.containerDark]}
          edges={["top"]}
        >
          <View style={[styles.header, isDark && styles.headerDark]}>
            <View style={styles.headerLeft}>
              <View style={styles.logoContainer}>
                <IconSymbol name="paperplane.fill" size={20} color="#ffffff" />
              </View>
              <Text
                style={[styles.headerTitle, isDark && styles.headerTitleDark]}
              >
                {t("repos")}
              </Text>
            </View>
          </View>

          <View style={[styles.emptyContainer, styles.centerContainer]}>
            <IconSymbol
              name="exclamationmark.triangle.fill"
              size={48}
              color="#f59e0b"
            />
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              {t("noApiKey")}
            </Text>
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              {t("noApiKeyHint")}
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "repos" }} />
      <SafeAreaView
        style={[styles.container, isDark && styles.containerDark]}
        edges={["top"]}
      >
        {/* ヘッダー */}
        <View style={[styles.header, isDark && styles.headerDark]}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <IconSymbol name="paperplane.fill" size={20} color="#ffffff" />
            </View>
            <Text
              style={[styles.headerTitle, isDark && styles.headerTitleDark]}
            >
              {t("sessions")}
            </Text>
          </View>
        </View>

        {/* Enhanced Repository Manager */}
        <EnhancedRepositoryManager onRepositorySelect={handleRepoPress} />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  containerDark: {
    backgroundColor: "#020617",
  },
  header: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerDark: {
    backgroundColor: "#0f172a",
    borderBottomColor: "#1e293b",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoContainer: {
    backgroundColor: "#2563eb",
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  headerTitleDark: {
    color: "#f8fafc",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  centerContainer: {
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#334155",
    textAlign: "center",
  },
  emptyTitleDark: {
    color: "#94a3b8",
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 16,
  },
  emptyTextDark: {
    color: "#94a3b8",
  },
});

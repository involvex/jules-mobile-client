import {
  Alert,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { Stack, useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useCallback, useEffect, useRef } from "react";

import { EnhancedRepositoryManager } from "@/components/github/enhanced-repository-manager";
import { useGitHubService } from "@/hooks/use-github-service";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useI18n } from "@/constants/i18n-context";
import { Repository } from "@/services/github";

export default function Repos() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useI18n();
  const router = useRouter();
  const {
    isAuthenticated,
    validateToken,
    refreshRepos,
    isLoading,
    user,
    lastError,
  } = useGitHubService();

  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      spinValue.setValue(0);
      spinValue.stopAnimation();
    }
  }, [isLoading, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleRepoPress = useCallback(
    (repo: Repository) => {
      // Navigate to session creation with repo context
      Alert.alert(
        repo.name,
        `${repo.description || "No description available"}\n\n${repo.html_url}`,
        [
          { text: t("cancel"), style: "cancel" },
          {
            text: t("startSession"),
            onPress: () => {
              router.push({
                pathname: "/create-session",
                params: {
                  repoUrl: repo.html_url,
                  repoFullName: repo.full_name,
                },
              });
            },
          },
        ],
      );
    },
    [router, t],
  );

  // Initialize validation on mount only once
  useEffect(() => {
    const init = async () => {
      if (isAuthenticated) {
        await validateToken();
      }
    };
    init();
  }, [isAuthenticated, validateToken]); // Add missing dependencies

  useFocusEffect(
    useCallback(() => {
      validateToken();
    }, [validateToken]),
  );

  if (!isAuthenticated) {
    const isInvalid = lastError?.status === 401 || lastError?.type === "auth";

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
            <TouchableOpacity
              onPress={() => validateToken()}
              disabled={isLoading}
              style={styles.refreshButton}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <IconSymbol
                  name="arrow.clockwise"
                  size={20}
                  color={isDark ? "#94a3b8" : "#64748b"}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>

          <View style={[styles.emptyContainer, styles.centerContainer]}>
            <IconSymbol
              name={isInvalid ? "lock.fill" : "exclamationmark.triangle.fill"}
              size={48}
              color={isInvalid ? "#ef4444" : "#f59e0b"}
            />
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              {isInvalid ? t("invalidApiKey") : t("noApiKey")}
            </Text>
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              {isInvalid ? t("invalidApiKeyHint") : t("noApiKeyHint")}
            </Text>

            {isInvalid && (
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => router.push("/(tabs)/settings")}
              >
                <Text style={styles.settingsButtonText}>{t("settings")}</Text>
              </TouchableOpacity>
            )}
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
            <View>
              <Text
                style={[styles.headerTitle, isDark && styles.headerTitleDark]}
              >
                {t("repos")}
              </Text>
              {user && (
                <View style={styles.userContainer}>
                  <Text
                    style={[styles.userLogin, isDark && styles.userLoginDark]}
                  >
                    {user.login}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={refreshRepos}
            disabled={isLoading}
            style={styles.refreshButton}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <IconSymbol
                name="arrow.clockwise"
                size={20}
                color={isDark ? "#94a3b8" : "#64748b"}
              />
            </Animated.View>
          </TouchableOpacity>
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
  refreshButton: {
    padding: 8,
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
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -2,
  },
  userLogin: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  userLoginDark: {
    color: "#94a3b8",
  },
  settingsButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#2563eb",
    borderRadius: 8,
  },
  settingsButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

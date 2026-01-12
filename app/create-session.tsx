import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GithubSessionCreator } from "@/components/github/github-session-creator";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PresetBrowser, PresetForm } from "@/components/presets";
import { useHeaderHeight } from "@react-navigation/elements";
import React, { useEffect, useRef, useState } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApiKey } from "@/constants/api-key-context";
import { useJulesApi } from "@/hooks/use-jules-api";
import { useI18n } from "@/constants/i18n-context";
import { router, Stack } from "expo-router";
import { Preset } from "@/constants/types";

/**
 * シマー効果付きスケルトン
 */
function Skeleton({
  width,
  height,
  style,
}: {
  width: number | string;
  height: number;
  style?: object;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: 8,
          backgroundColor: isDark ? "#334155" : "#e2e8f0",
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * フォームスケルトン
 */
function FormSkeleton({ paddingBottom }: { paddingBottom: number }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <ScrollView
      contentContainerStyle={[skeletonStyles.content, { paddingBottom }]}
    >
      {/* ラベル1 */}
      <View style={skeletonStyles.section}>
        <Skeleton width={200} height={16} style={{ marginBottom: 8 }} />
        {/* セレクトボックス */}
        <View
          style={[
            skeletonStyles.selectBox,
            isDark && skeletonStyles.selectBoxDark,
          ]}
        >
          <Skeleton width="60%" height={16} />
          <Skeleton width={16} height={16} style={{ borderRadius: 8 }} />
        </View>
      </View>

      {/* ラベル2 */}
      <View style={[skeletonStyles.section, { marginTop: 24 }]}>
        <Skeleton width={180} height={16} style={{ marginBottom: 8 }} />
        {/* テキストエリア */}
        <View
          style={[
            skeletonStyles.textArea,
            isDark && skeletonStyles.textAreaDark,
          ]}
        >
          <Skeleton width="90%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="75%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="60%" height={14} />
        </View>
      </View>

      {/* ボタン */}
      <Skeleton
        width="100%"
        height={52}
        style={{ marginTop: 24, borderRadius: 12 }}
      />
    </ScrollView>
  );
}

const skeletonStyles = StyleSheet.create({
  content: {
    padding: 16,
  },
  section: {
    gap: 8,
  },
  selectBox: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectBoxDark: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
  },
  textArea: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    height: 120,
  },
  textAreaDark: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
  },
});

export default function CreateSessionScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const { apiKey } = useApiKey();
  const [selectedSource, setSelectedSource] = useState("");
  const [prompt, setPrompt] = useState("");
  const [sourcesLoaded, setSourcesLoaded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showGithubCreator, setShowGithubCreator] = useState(false);
  const [showPresetBrowser, setShowPresetBrowser] = useState(false);
  const [showPresetForm, setShowPresetForm] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);

  const {
    isLoading,
    error,
    clearError,
    sources,
    hasMoreSources,
    isLoadingMoreSources,
    fetchSources,
    fetchMoreSources,
    createSession,
  } = useJulesApi({ apiKey, t });

  // Pre-fetch sources when screen loads
  useEffect(() => {
    if (apiKey && !sourcesLoaded) {
      void fetchSources().then(() => setSourcesLoaded(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Background fetch more sources while dropdown is open
  useEffect(() => {
    if (!isDropdownOpen || !hasMoreSources || isLoadingMoreSources) return;

    // Fetch next page after a short delay while dropdown is open
    const timer = setTimeout(() => {
      void fetchMoreSources();
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDropdownOpen, hasMoreSources, isLoadingMoreSources, sources.length]);

  // Toggle dropdown (sources already loaded)
  const toggleSources = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Handle scroll to load more sources (manual trigger)
  const handleSourcesScroll = (event: {
    nativeEvent: {
      layoutMeasurement: { height: number };
      contentOffset: { y: number };
      contentSize: { height: number };
    };
  }) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;

    if (isCloseToBottom && hasMoreSources && !isLoadingMoreSources) {
      void fetchMoreSources();
    }
  };

  // Create session
  const handleCreate = async () => {
    if (!selectedSource || !prompt.trim()) {
      Alert.alert(t("error"), t("inputError"));
      return;
    }

    // Get default branch from selected source
    const source = sources.find(s => s.name === selectedSource);
    const defaultBranch =
      source?.githubRepo?.defaultBranch?.displayName || "main";

    const session = await createSession(selectedSource, prompt, defaultBranch);
    if (session) {
      Alert.alert(t("createSuccess"), "", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    }
  };

  // Handle GitHub session creation
  const handleGithubSessionCreated = (sessionName: string) => {
    setShowGithubCreator(false);
    Alert.alert(t("createSuccess"), "", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  };

  // Handle GitHub session creation cancel
  const handleGithubSessionCancel = () => {
    setShowGithubCreator(false);
  };

  // Handle preset selection
  const handlePresetSelected = (preset: Preset) => {
    setSelectedPreset(preset);
    setShowPresetBrowser(false);
    setShowPresetForm(true);
  };

  // Handle preset form submission
  const handlePresetFormSubmit = (
    processedPrompt: string,
    variables: Record<string, any>,
  ) => {
    setPrompt(processedPrompt);
    setShowPresetForm(false);
    setSelectedPreset(null);
  };

  // Handle preset browser cancel
  const handlePresetBrowserCancel = () => {
    setShowPresetBrowser(false);
  };

  // Handle preset form cancel
  const handlePresetFormCancel = () => {
    setShowPresetForm(false);
    setSelectedPreset(null);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t("newTask"),
          headerStyle: {
            backgroundColor: isDark ? "#0f172a" : "#ffffff",
          },
          headerTintColor: isDark ? "#f8fafc" : "#0f172a",
        }}
      />

      <KeyboardAvoidingView
        style={[styles.container, isDark && styles.containerDark]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}
      >
        {isLoading ? (
          <FormSkeleton paddingBottom={40 + insets.bottom} />
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: 40 + insets.bottom },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {/* Error */}
            {error && (
              <View
                style={[styles.errorBanner, isDark && styles.errorBannerDark]}
              >
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={clearError}>
                  <Text style={styles.errorClose}>×</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Source selection */}
            <View style={styles.section}>
              <Text style={[styles.label, isDark && styles.labelDark]}>
                {t("selectRepo")}
              </Text>
              <TouchableOpacity
                style={[styles.selectButton, isDark && styles.selectButtonDark]}
                onPress={toggleSources}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    isDark && styles.selectButtonTextDark,
                    !selectedSource && styles.placeholderText,
                  ]}
                  numberOfLines={1}
                >
                  {selectedSource
                    ? sources.find(s => s.name === selectedSource)
                        ?.displayName || selectedSource
                    : t("selectPlaceholder")}
                </Text>
                <IconSymbol
                  name={isDropdownOpen ? "chevron.up" : "chevron.down"}
                  size={16}
                  color={isDark ? "#64748b" : "#94a3b8"}
                />
              </TouchableOpacity>

              {/* Source list with lazy loading */}
              {isDropdownOpen && sourcesLoaded && sources.length > 0 && (
                <ScrollView
                  style={[styles.sourceList, isDark && styles.sourceListDark]}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                  onScroll={handleSourcesScroll}
                  scrollEventThrottle={400}
                >
                  {sources.map(source => {
                    const displayName = source.githubRepo
                      ? `${source.githubRepo.owner}/${source.githubRepo.repo}`
                      : source.displayName || source.name;
                    return (
                      <TouchableOpacity
                        key={source.name}
                        style={[
                          styles.sourceItem,
                          selectedSource === source.name &&
                            styles.sourceItemSelected,
                          isDark && styles.sourceItemDark,
                        ]}
                        onPress={() => {
                          setSelectedSource(source.name);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <IconSymbol
                          name="link"
                          size={14}
                          color={
                            selectedSource === source.name
                              ? "#2563eb"
                              : isDark
                                ? "#64748b"
                                : "#94a3b8"
                          }
                        />
                        <Text
                          style={[
                            styles.sourceItemText,
                            isDark && styles.sourceItemTextDark,
                            selectedSource === source.name &&
                              styles.sourceItemTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {displayName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {/* Loading indicator for more sources */}
                  {isLoadingMoreSources && (
                    <View style={styles.loadingMore}>
                      <ActivityIndicator size="small" color="#2563eb" />
                      <Text
                        style={[
                          styles.loadingMoreText,
                          isDark && styles.loadingMoreTextDark,
                        ]}
                      >
                        {t("loadingMore")}
                      </Text>
                    </View>
                  )}
                  {/* End of list indicator */}
                  {!hasMoreSources && sources.length > 20 && (
                    <View style={styles.endOfList}>
                      <Text
                        style={[
                          styles.endOfListText,
                          isDark && styles.endOfListTextDark,
                        ]}
                      >
                        {sources.length} repos
                      </Text>
                    </View>
                  )}
                </ScrollView>
              )}

              {sourcesLoaded && sources.length === 0 && isDropdownOpen && (
                <Text style={[styles.hint, { color: "#f59e0b" }]}>
                  {t("noSourcesFound")}
                </Text>
              )}
            </View>

            {/* プロンプト入力 */}
            <View style={[styles.section, { marginTop: 24 }]}>
              <Text style={[styles.label, isDark && styles.labelDark]}>
                {t("promptLabel")}
              </Text>
              <TextInput
                style={[styles.textArea, isDark && styles.textAreaDark]}
                value={prompt}
                onChangeText={setPrompt}
                placeholder={t("promptPlaceholder")}
                placeholderTextColor={isDark ? "#475569" : "#94a3b8"}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Preset Button */}
            <TouchableOpacity
              style={[styles.presetButton, styles.secondaryButton]}
              onPress={() => setShowPresetBrowser(true)}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <IconSymbol name="text.book.closed" size={20} color="#7c3aed" />
              <Text style={styles.presetButtonText}>Use Preset</Text>
            </TouchableOpacity>

            {/* GitHub Session Button */}
            <TouchableOpacity
              style={[styles.githubButton, styles.secondaryButton]}
              onPress={() => setShowGithubCreator(true)}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <IconSymbol name="link" size={20} color="#2563eb" />
              <Text style={styles.githubButtonText}>
                {t("createGithubSession")}
              </Text>
            </TouchableOpacity>

            {/* 作成ボタン */}
            <TouchableOpacity
              style={[
                styles.createButton,
                (!selectedSource || !prompt.trim()) &&
                  styles.createButtonDisabled,
              ]}
              onPress={handleCreate}
              disabled={!selectedSource || !prompt.trim() || isLoading}
              activeOpacity={0.8}
            >
              <IconSymbol name="plus" size={20} color="#ffffff" />
              <Text style={styles.createButtonText}>{t("startSession")}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* GitHub Session Creator Modal */}
        {showGithubCreator && (
          <GithubSessionCreator
            onSessionCreated={handleGithubSessionCreated}
            onCancel={handleGithubSessionCancel}
          />
        )}

        {/* Preset Browser Modal */}
        {showPresetBrowser && (
          <View style={StyleSheet.absoluteFill}>
            <PresetBrowser
              onPresetSelected={handlePresetSelected}
              onCancel={handlePresetBrowserCancel}
            />
          </View>
        )}

        {/* Preset Form Modal */}
        {showPresetForm && selectedPreset && (
          <View style={StyleSheet.absoluteFill}>
            <PresetForm
              preset={selectedPreset}
              onSubmit={handlePresetFormSubmit}
              onCancel={handlePresetFormCancel}
            />
          </View>
        )}
      </KeyboardAvoidingView>
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
  content: {
    padding: 16,
  },
  errorBanner: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorBannerDark: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
    flex: 1,
  },
  errorClose: {
    color: "#dc2626",
    fontSize: 18,
    fontWeight: "700",
    paddingLeft: 12,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  labelDark: {
    color: "#cbd5e1",
  },
  selectButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectButtonDark: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
  },
  selectButtonText: {
    fontSize: 15,
    color: "#0f172a",
    flex: 1,
  },
  selectButtonTextDark: {
    color: "#f8fafc",
  },
  placeholderText: {
    color: "#94a3b8",
  },
  sourceList: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    marginTop: 8,
    overflow: "hidden",
    maxHeight: 250,
  },
  sourceListDark: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
  },
  sourceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  sourceItemDark: {
    borderBottomColor: "#334155",
  },
  sourceItemSelected: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
  },
  sourceItemText: {
    fontSize: 14,
    color: "#334155",
    flex: 1,
  },
  sourceItemTextDark: {
    color: "#e2e8f0",
  },
  sourceItemTextSelected: {
    color: "#2563eb",
    fontWeight: "600",
  },
  hint: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
  textArea: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#0f172a",
    height: 120,
  },
  textAreaDark: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
    color: "#f8fafc",
  },
  createButton: {
    backgroundColor: "#2563eb",
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: "0px 4px 8px 0px rgba(37, 99, 235, 0.2)",
    elevation: 8,
  },
  createButtonDisabled: {
    backgroundColor: "#94a3b8",
    shadowOpacity: 0,
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  githubButton: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  githubButtonText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "700",
  },
  presetButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: "#2e3138",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  presetButtonText: {
    color: "#7c3aed",
    fontSize: 16,
    fontWeight: "700",
  },
  loadingMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 12,
    color: "#64748b",
  },
  loadingMoreTextDark: {
    color: "#94a3b8",
  },
  endOfList: {
    alignItems: "center",
    padding: 8,
  },
  endOfListText: {
    fontSize: 11,
    color: "#94a3b8",
  },
  endOfListTextDark: {
    color: "#64748b",
  },
});

import {
  Alert,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useGithubDeepLinkingIntegration } from "@/constants/github-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useI18n } from "@/constants/i18n-context";
import React, { useEffect, useState } from "react";

interface GithubUrlHandlerProps {
  visible: boolean;
  onDismiss: () => void;
  onLaunchSession: (url: string, prompt?: string) => void;
}

export function GithubUrlHandler({
  visible,
  onDismiss,
  onLaunchSession,
}: GithubUrlHandlerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useI18n();

  const {
    initialUrl,
    lastUrl,
    parseGithubUrlData,
    openGithubUrl,
    createGithubUrl,
  } = useGithubDeepLinkingIntegration();

  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [urlData, setUrlData] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      // Get current URL when modal opens
      Linking.getInitialURL().then(url => {
        if (url) {
          setCurrentUrl(url);
          const data = parseGithubUrlData(url);
          setUrlData(data);
        }
      });
    }
  }, [visible]);

  const handleUrlChange = async () => {
    try {
      const url = await Linking.getInitialURL();
      if (url) {
        setCurrentUrl(url);
        const data = parseGithubUrlData(url);
        setUrlData(data);
      }
    } catch (error) {
      console.error("Failed to get URL:", error);
    }
  };

  const handleLaunchSession = () => {
    if (!urlData) {
      Alert.alert(t("error"), t("noValidGithubUrl"));
      return;
    }

    if (urlData.type === "repository") {
      onLaunchSession(currentUrl);
    } else {
      Alert.alert(
        t("confirmLaunch"),
        t("launchSessionForType", { type: urlData.type }),
        [
          { text: t("cancel"), style: "cancel" },
          { text: t("launch"), onPress: () => onLaunchSession(currentUrl) },
        ],
      );
    }
  };

  const handleOpenInBrowser = () => {
    if (currentUrl) {
      openGithubUrl(currentUrl);
    }
  };

  const handleCopyUrl = () => {
    // In a real implementation, you would use a clipboard API
    Alert.alert(t("info"), t("urlCopiedToClipboard"));
  };

  const getDisplayInfo = () => {
    if (!urlData) return null;

    switch (urlData.type) {
      case "repository":
        return {
          title: t("repository"),
          subtitle: `${urlData.owner}/${urlData.repo}`,
          icon: "folder",
        };
      case "pull_request":
        return {
          title: t("pullRequest"),
          subtitle: `#${urlData.number} in ${urlData.owner}/${urlData.repo}`,
          icon: "arrow.triangle.merge",
        };
      case "issue":
        return {
          title: t("issue"),
          subtitle: `#${urlData.number} in ${urlData.owner}/${urlData.repo}`,
          icon: "exclamationmark.triangle",
        };
      case "workflow":
        return {
          title: t("workflow"),
          subtitle: urlData.workflowId
            ? `Workflow ${urlData.workflowId} in ${urlData.owner}/${urlData.repo}`
            : `Actions in ${urlData.owner}/${urlData.repo}`,
          icon: "gearshape",
        };
      default:
        return {
          title: t("unknown"),
          subtitle: currentUrl,
          icon: "questionmark",
        };
    }
  };

  const displayInfo = getDisplayInfo();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <View style={[styles.container, isDark && styles.containerDark]}>
        {/* Header */}
        <View style={[styles.header, isDark && styles.headerDark]}>
          <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
            <IconSymbol
              name="xmark"
              size={20}
              color={isDark ? "#f8fafc" : "#0f172a"}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            {t("githubUrlDetected")}
          </Text>
          <TouchableOpacity
            onPress={handleUrlChange}
            style={styles.refreshButton}
          >
            <IconSymbol
              name="arrow.clockwise"
              size={20}
              color={isDark ? "#f8fafc" : "#0f172a"}
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {urlData ? (
            <>
              {/* URL Info Card */}
              <View style={[styles.infoCard, isDark && styles.infoCardDark]}>
                <View style={styles.infoHeader}>
                  <IconSymbol
                    name={displayInfo?.icon || "link"}
                    size={24}
                    color="#2563eb"
                  />
                  <View style={styles.infoText}>
                    <Text
                      style={[styles.infoTitle, isDark && styles.infoTitleDark]}
                    >
                      {displayInfo?.title}
                    </Text>
                    <Text
                      style={[
                        styles.infoSubtitle,
                        isDark && styles.infoSubtitleDark,
                      ]}
                    >
                      {displayInfo?.subtitle}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[styles.urlText, isDark && styles.urlTextDark]}
                  numberOfLines={2}
                >
                  {currentUrl}
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <Text
                  style={[
                    styles.actionsTitle,
                    isDark && styles.actionsTitleDark,
                  ]}
                >
                  {t("whatWouldYouLikeToDo")}
                </Text>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.primaryAction]}
                    onPress={handleLaunchSession}
                    disabled={isProcessing}
                  >
                    <IconSymbol name="play.fill" size={20} color="#ffffff" />
                    <Text style={styles.primaryActionText}>
                      {t("launchJulesSession")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.secondaryAction]}
                    onPress={handleOpenInBrowser}
                  >
                    <IconSymbol name="safari.fill" size={20} color="#2563eb" />
                    <Text style={styles.secondaryActionText}>
                      {t("openInBrowser")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.tertiaryAction]}
                    onPress={handleCopyUrl}
                  >
                    <IconSymbol
                      name="doc.on.doc.fill"
                      size={20}
                      color="#64748b"
                    />
                    <Text style={styles.tertiaryActionText}>
                      {t("copyUrl")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Context Info */}
              {urlData.type === "repository" && (
                <View
                  style={[styles.contextCard, isDark && styles.contextCardDark]}
                >
                  <Text
                    style={[
                      styles.contextTitle,
                      isDark && styles.contextTitleDark,
                    ]}
                  >
                    {t("repositoryContext")}
                  </Text>
                  <Text
                    style={[
                      styles.contextText,
                      isDark && styles.contextTextDark,
                    ]}
                  >
                    {t("repositoryContextDescription")}
                  </Text>
                </View>
              )}

              {urlData.type === "pull_request" && (
                <View
                  style={[styles.contextCard, isDark && styles.contextCardDark]}
                >
                  <Text
                    style={[
                      styles.contextTitle,
                      isDark && styles.contextTitleDark,
                    ]}
                  >
                    {t("pullRequestContext")}
                  </Text>
                  <Text
                    style={[
                      styles.contextText,
                      isDark && styles.contextTextDark,
                    ]}
                  >
                    {t("pullRequestContextDescription")}
                  </Text>
                </View>
              )}

              {urlData.type === "workflow" && (
                <View
                  style={[styles.contextCard, isDark && styles.contextCardDark]}
                >
                  <Text
                    style={[
                      styles.contextTitle,
                      isDark && styles.contextTitleDark,
                    ]}
                  >
                    {t("workflowContext")}
                  </Text>
                  <Text
                    style={[
                      styles.contextText,
                      isDark && styles.contextTextDark,
                    ]}
                  >
                    {t("workflowContextDescription")}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol
                name="link"
                size={48}
                color={isDark ? "#64748b" : "#94a3b8"}
              />
              <Text
                style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}
              >
                {t("noGithubUrl")}
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  isDark && styles.emptySubtitleDark,
                ]}
              >
                {t("noGithubUrlDescription")}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerDark: {
    borderBottomColor: "#334155",
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  headerTitleDark: {
    color: "#f8fafc",
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoCardDark: {
    backgroundColor: "#1e293b",
    shadowColor: "#000",
    shadowOpacity: 0.3,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  infoTitleDark: {
    color: "#f8fafc",
  },
  infoSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  infoSubtitleDark: {
    color: "#94a3b8",
  },
  urlText: {
    fontSize: 12,
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    padding: 10,
    borderRadius: 8,
    fontFamily: "monospace",
  },
  urlTextDark: {
    color: "#94a3b8",
    backgroundColor: "#0f172a",
  },
  actions: {
    marginBottom: 16,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 12,
  },
  actionsTitleDark: {
    color: "#f8fafc",
  },
  actionButtons: {
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    gap: 12,
  },
  primaryAction: {
    backgroundColor: "#2563eb",
  },
  primaryActionText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  secondaryAction: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  secondaryActionText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  tertiaryAction: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tertiaryActionText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  contextCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  contextCardDark: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
  },
  contextTitleDark: {
    color: "#f8fafc",
  },
  contextText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  contextTextDark: {
    color: "#94a3b8",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
  },
  emptyTitleDark: {
    color: "#94a3b8",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
  emptySubtitleDark: {
    color: "#64748b",
  },
});

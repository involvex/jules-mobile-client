import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useGithubDeepLinkingIntegration } from "@/constants/github-context";
import { useGithubSession } from "@/hooks/use-github-session";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useI18n } from "@/constants/i18n-context";
import React, { useEffect, useState } from "react";

interface GithubSessionCreatorProps {
  onSessionCreated?: (sessionName: string) => void;
  onCancel?: () => void;
}

export function GithubSessionCreator({
  onSessionCreated,
  onCancel,
}: GithubSessionCreatorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useI18n();

  const {
    isLoading,
    error,
    clearError,
    getRepositoryContext,
    createGithubSession,
    createSessionFromUrl,
    getTemplates,
    getTemplate,
  } = useGithubSession();

  const { parseGithubUrlData, openGithubUrl } =
    useGithubDeepLinkingIntegration();

  const [step, setStep] = useState<
    "url" | "repo" | "template" | "prompt" | "confirm"
  >("url");
  const [githubUrl, setGithubUrl] = useState("");
  const [repository, setRepository] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [branch, setBranch] = useState("main");
  const [useDefaultBranch, setUseDefaultBranch] = useState(true);

  useEffect(() => {
    clearError();
  }, [step, clearError]);

  const handleUrlSubmit = async () => {
    if (!githubUrl.trim()) {
      Alert.alert(t("error"), t("enterGithubUrl"));
      return;
    }

    const urlData = parseGithubUrlData(githubUrl);
    if (!urlData || urlData.type !== "repository") {
      Alert.alert(t("error"), t("invalidGithubUrl"));
      return;
    }

    try {
      const context = await getRepositoryContext(urlData.owner, urlData.repo);
      if (context) {
        setRepository(context);
        setBranch(context.defaultBranch || "main");
        setStep("template");
      } else {
        Alert.alert(t("error"), t("failedToLoadRepository"));
      }
    } catch (err) {
      Alert.alert(t("error"), t("failedToLoadRepository"));
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = getTemplate(templateId);
    if (template) {
      setCustomPrompt(template.prompt);
    }
    setStep("prompt");
  };

  const handlePromptSubmit = () => {
    if (!customPrompt.trim()) {
      Alert.alert(t("error"), t("enterPrompt"));
      return;
    }
    setStep("confirm");
  };

  const handleSessionCreate = async () => {
    if (!repository) {
      Alert.alert(t("error"), t("noRepositorySelected"));
      return;
    }

    try {
      const sessionName = await createGithubSession(repository, {
        prompt: customPrompt,
        branch: useDefaultBranch ? repository.defaultBranch : branch,
        repository: repository.repository,
        useDefaultBranch,
      });

      if (sessionName) {
        onSessionCreated?.(sessionName);
        Alert.alert(t("success"), t("sessionCreatedSuccessfully"));
      } else {
        Alert.alert(t("error"), t("failedToCreateSession"));
      }
    } catch (err) {
      Alert.alert(
        t("error"),
        err instanceof Error ? err.message : t("failedToCreateSession"),
      );
    }
  };

  const handleUrlPaste = async () => {
    // In a real implementation, you would use a clipboard API
    // For now, we'll just show a placeholder
    Alert.alert(t("info"), t("pasteUrlFromClipboard"));
  };

  const renderStep = () => {
    switch (step) {
      case "url":
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, isDark && styles.stepTitleDark]}>
              {t("enterGithubUrl")}
            </Text>
            <Text
              style={[styles.stepSubtitle, isDark && styles.stepSubtitleDark]}
            >
              {t("enterGithubUrlDescription")}
            </Text>

            <View
              style={[
                styles.inputContainer,
                isDark && styles.inputContainerDark,
              ]}
            >
              <TextInput
                style={[styles.urlInput, isDark && styles.urlInputDark]}
                value={githubUrl}
                onChangeText={setGithubUrl}
                placeholder="https://github.com/owner/repository"
                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.pasteButton}
                onPress={handleUrlPaste}
              >
                <IconSymbol name="doc.on.doc" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onCancel}
              >
                <Text style={styles.secondaryButtonText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleUrlSubmit}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>{t("next")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case "template":
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, isDark && styles.stepTitleDark]}>
              {t("selectTemplate")}
            </Text>
            <Text
              style={[styles.stepSubtitle, isDark && styles.stepSubtitleDark]}
            >
              {t("selectTemplateDescription")}
            </Text>

            <ScrollView
              style={styles.templateList}
              showsVerticalScrollIndicator={false}
            >
              {getTemplates().map(template => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateItem,
                    selectedTemplate === template.id &&
                      styles.templateItemSelected,
                    isDark && styles.templateItemDark,
                  ]}
                  onPress={() => handleTemplateSelect(template.id)}
                >
                  <View style={styles.templateInfo}>
                    <Text
                      style={[
                        styles.templateName,
                        isDark && styles.templateNameDark,
                      ]}
                    >
                      {template.name}
                    </Text>
                    <Text
                      style={[
                        styles.templateDescription,
                        isDark && styles.templateDescriptionDark,
                      ]}
                    >
                      {template.description}
                    </Text>
                  </View>
                  <IconSymbol
                    name={
                      selectedTemplate === template.id
                        ? "checkmark.circle.fill"
                        : "circle"
                    }
                    size={20}
                    color={
                      selectedTemplate === template.id
                        ? "#2563eb"
                        : isDark
                          ? "#64748b"
                          : "#94a3b8"
                    }
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setStep("url")}
              >
                <Text style={styles.secondaryButtonText}>{t("back")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={() => setStep("prompt")}
                disabled={!selectedTemplate}
              >
                <Text style={styles.primaryButtonText}>{t("next")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case "prompt":
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, isDark && styles.stepTitleDark]}>
              {t("customizePrompt")}
            </Text>
            <Text
              style={[styles.stepSubtitle, isDark && styles.stepSubtitleDark]}
            >
              {t("customizePromptDescription")}
            </Text>

            <View
              style={[
                styles.textAreaContainer,
                isDark && styles.textAreaContainerDark,
              ]}
            >
              <TextInput
                style={[styles.textArea, isDark && styles.textAreaDark]}
                value={customPrompt}
                onChangeText={setCustomPrompt}
                placeholder={t("enterYourPrompt")}
                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.branchRow}>
              <Text
                style={[styles.branchLabel, isDark && styles.branchLabelDark]}
              >
                {t("branch")}
              </Text>
              <View style={styles.branchOptions}>
                <TouchableOpacity
                  style={[
                    styles.branchOption,
                    useDefaultBranch && styles.branchOptionSelected,
                    isDark && styles.branchOptionDark,
                  ]}
                  onPress={() => setUseDefaultBranch(true)}
                >
                  <Text
                    style={[
                      styles.branchOptionText,
                      useDefaultBranch && styles.branchOptionTextSelected,
                      isDark && styles.branchOptionTextDark,
                    ]}
                  >
                    {repository?.defaultBranch || "main"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.branchOption,
                    !useDefaultBranch && styles.branchOptionSelected,
                    isDark && styles.branchOptionDark,
                  ]}
                  onPress={() => setUseDefaultBranch(false)}
                >
                  <TextInput
                    style={[
                      styles.branchInput,
                      !useDefaultBranch && styles.branchInputActive,
                      isDark && styles.branchInputDark,
                    ]}
                    value={branch}
                    onChangeText={setBranch}
                    placeholder="custom-branch"
                    placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                    editable={!useDefaultBranch}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setStep("template")}
              >
                <Text style={styles.secondaryButtonText}>{t("back")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handlePromptSubmit}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>{t("next")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case "confirm":
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, isDark && styles.stepTitleDark]}>
              {t("confirmSession")}
            </Text>
            <Text
              style={[styles.stepSubtitle, isDark && styles.stepSubtitleDark]}
            >
              {t("confirmSessionDescription")}
            </Text>

            <View
              style={[styles.confirmCard, isDark && styles.confirmCardDark]}
            >
              <View style={styles.confirmRow}>
                <Text
                  style={[
                    styles.confirmLabel,
                    isDark && styles.confirmLabelDark,
                  ]}
                >
                  {t("repository")}
                </Text>
                <Text
                  style={[
                    styles.confirmValue,
                    isDark && styles.confirmValueDark,
                  ]}
                >
                  {repository?.owner}/{repository?.repo}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text
                  style={[
                    styles.confirmLabel,
                    isDark && styles.confirmLabelDark,
                  ]}
                >
                  {t("branch")}
                </Text>
                <Text
                  style={[
                    styles.confirmValue,
                    isDark && styles.confirmValueDark,
                  ]}
                >
                  {useDefaultBranch
                    ? repository?.defaultBranch || "main"
                    : branch}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text
                  style={[
                    styles.confirmLabel,
                    isDark && styles.confirmLabelDark,
                  ]}
                >
                  {t("prompt")}
                </Text>
                <Text
                  style={[
                    styles.confirmValue,
                    isDark && styles.confirmValueDark,
                  ]}
                  numberOfLines={3}
                >
                  {customPrompt}
                </Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setStep("prompt")}
              >
                <Text style={styles.secondaryButtonText}>{t("back")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleSessionCreate}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? t("creating") : t("createSession")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <View
        style={[styles.modalContainer, isDark && styles.modalContainerDark]}
      >
        {/* Header */}
        <View style={[styles.header, isDark && styles.headerDark]}>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <IconSymbol
              name="xmark"
              size={20}
              color={isDark ? "#f8fafc" : "#0f172a"}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            {t("createGithubSession")}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {["url", "template", "prompt", "confirm"].map((stepKey, index) => (
            <View key={stepKey} style={styles.progressStep}>
              <View
                style={[
                  styles.progressDot,
                  step === stepKey && styles.progressDotActive,
                  isDark && styles.progressDotDark,
                ]}
              />
              {index < 3 && (
                <View
                  style={[
                    styles.progressLine,
                    step === stepKey ||
                    (index === 0 && step === "template") ||
                    (index === 1 && step === "prompt") ||
                    (index === 2 && step === "confirm")
                      ? styles.progressLineActive
                      : styles.progressLineInactive,
                    isDark && styles.progressLineDark,
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderStep()}

          {/* Error Display */}
          {error && (
            <View
              style={[styles.errorBanner, isDark && styles.errorBannerDark]}
            >
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  modalContainerDark: {
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
  headerSpacer: {
    width: 28, // Same width as closeButton for alignment
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  progressContainerDark: {
    borderBottomColor: "#334155",
  },
  progressStep: {
    alignItems: "center",
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#cbd5e1",
    marginBottom: 8,
  },
  progressDotActive: {
    backgroundColor: "#2563eb",
  },
  progressDotDark: {
    backgroundColor: "#475569",
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: "#cbd5e1",
  },
  progressLineActive: {
    backgroundColor: "#2563eb",
  },
  progressLineInactive: {
    backgroundColor: "#cbd5e1",
  },
  progressLineDark: {
    backgroundColor: "#475569",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepContainer: {
    gap: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  stepTitleDark: {
    color: "#f8fafc",
  },
  stepSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  stepSubtitleDark: {
    color: "#94a3b8",
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
  },
  inputContainerDark: {
    borderColor: "#334155",
    backgroundColor: "#1e293b",
  },
  urlInput: {
    flex: 1,
    fontSize: 16,
    color: "#0f172a",
    padding: 14,
  },
  urlInputDark: {
    color: "#f8fafc",
  },
  pasteButton: {
    padding: 14,
    borderLeftWidth: 1,
    borderLeftColor: "#e2e8f0",
  },
  pasteButtonDark: {
    borderLeftColor: "#334155",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  secondaryButtonText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButtonDark: {
    backgroundColor: "#0f172a",
    borderColor: "#334155",
  },
  templateList: {
    maxHeight: 300,
  },
  templateItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    marginBottom: 8,
  },
  templateItemSelected: {
    borderColor: "#2563eb",
    backgroundColor: "rgba(37, 99, 235, 0.1)",
  },
  templateItemDark: {
    borderColor: "#334155",
    backgroundColor: "#0f172a",
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 2,
  },
  templateNameDark: {
    color: "#f8fafc",
  },
  templateDescription: {
    fontSize: 12,
    color: "#64748b",
  },
  templateDescriptionDark: {
    color: "#94a3b8",
  },
  textAreaContainer: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  textAreaContainerDark: {
    borderColor: "#334155",
    backgroundColor: "#1e293b",
  },
  textArea: {
    fontSize: 16,
    color: "#0f172a",
    padding: 14,
    minHeight: 120,
  },
  textAreaDark: {
    color: "#f8fafc",
  },
  branchRow: {
    gap: 8,
  },
  branchLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  branchLabelDark: {
    color: "#e2e8f0",
  },
  branchOptions: {
    flexDirection: "row",
    gap: 8,
  },
  branchOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },
  branchOptionSelected: {
    borderColor: "#2563eb",
    backgroundColor: "rgba(37, 99, 235, 0.1)",
  },
  branchOptionDark: {
    borderColor: "#334155",
    backgroundColor: "#1e293b",
  },
  branchOptionText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  branchOptionTextSelected: {
    color: "#2563eb",
    fontWeight: "600",
  },
  branchOptionTextDark: {
    color: "#94a3b8",
  },
  branchInput: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  branchInputActive: {
    color: "#2563eb",
    fontWeight: "600",
  },
  branchInputDark: {
    color: "#94a3b8",
  },
  confirmCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    padding: 16,
  },
  confirmCardDark: {
    borderColor: "#334155",
    backgroundColor: "#1e293b",
  },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  confirmRowDark: {
    borderBottomColor: "#334155",
  },
  confirmLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  confirmLabelDark: {
    color: "#94a3b8",
  },
  confirmValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  confirmValueDark: {
    color: "#f8fafc",
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  errorBannerDark: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
  },
});

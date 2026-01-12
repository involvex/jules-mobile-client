import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { IconSymbol, IconSymbolName } from "@/components/ui/icon-symbol";
import { useGithubWebhookIntegration } from "@/constants/github-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useI18n } from "@/constants/i18n-context";
import React, { useEffect, useState } from "react";

interface WebhookManagementProps {
  owner: string;
  repo: string;
}

export function WebhookManagement({ owner, repo }: WebhookManagementProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useI18n();

  const {
    isInitialized,
    initializeWebhooks,
    subscribe,
    unsubscribe,
    verifyWebhook,
    processWebhook,
    getRecentEvents,
    clearEvents,
    events,
  } = useGithubWebhookIntegration();

  const [webhookSecret, setWebhookSecret] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Initialize with a default secret if available
    const defaultSecret = "jules-mobile-client-secret";
    if (!isInitialized) {
      initializeWebhooks(defaultSecret);
      setWebhookSecret(defaultSecret);
      setIsEnabled(true);
    }
  }, [isInitialized, initializeWebhooks]);

  const handleToggleWebhook = () => {
    if (isEnabled) {
      // Disable webhook processing
      setIsEnabled(false);
      clearEvents();
    } else {
      // Enable webhook processing
      if (!webhookSecret) {
        Alert.alert(t("error"), t("enterWebhookSecret"));
        return;
      }

      initializeWebhooks(webhookSecret);
      setIsEnabled(true);
    }
  };

  const handleUpdateSecret = () => {
    if (!webhookSecret) {
      Alert.alert(t("error"), t("enterWebhookSecret"));
      return;
    }

    initializeWebhooks(webhookSecret);
    Alert.alert(t("success"), t("webhookSecretUpdated"));
  };

  const handleTestWebhook = () => {
    // Create a test webhook payload
    const testPayload = {
      event: "ping",
      delivery_id: Date.now().toString(),
      repository: {
        owner: { login: owner },
        name: repo,
      },
      zen: "Testing webhook functionality",
    };

    // Process the test payload
    processWebhook(JSON.stringify(testPayload), "sha256=invalid-signature");

    Alert.alert(t("success"), t("webhookTestProcessed"));
  };

  const recentEvents = getRecentEvents(10);

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.titleDark]}>
            {t("webhookManagement")}
          </Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            {t("webhookManagementDescription")}
          </Text>
        </View>

        {/* Status Card */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Text
                style={[styles.statusLabel, isDark && styles.statusLabelDark]}
              >
                {t("webhookStatus")}
              </Text>
              <Text
                style={[styles.statusValue, isDark && styles.statusValueDark]}
              >
                {isEnabled ? t("enabled") : t("disabled")}
              </Text>
            </View>
            <Switch value={isEnabled} onValueChange={handleToggleWebhook} />
          </View>
        </View>

        {/* Configuration */}
        {isEnabled && (
          <View style={[styles.card, isDark && styles.cardDark]}>
            <Text
              style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}
            >
              {t("webhookConfiguration")}
            </Text>

            <View style={styles.inputGroup}>
              <Text
                style={[styles.inputLabel, isDark && styles.inputLabelDark]}
              >
                {t("webhookSecret")}
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  isDark && styles.inputContainerDark,
                ]}
              >
                <TextInput
                  style={[styles.input, isDark && styles.inputDark]}
                  value={webhookSecret}
                  onChangeText={setWebhookSecret}
                  placeholder="Enter webhook secret"
                  placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleUpdateSecret}
              >
                <Text style={styles.secondaryButtonText}>
                  {t("updateSecret")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleTestWebhook}
              >
                <Text style={styles.primaryButtonText}>{t("testWebhook")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Events */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text
            style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}
          >
            {t("trackedEvents")}
          </Text>
          {[
            { key: "push", label: t("pushEvents"), icon: "arrow.up" },
            {
              key: "pull_request",
              label: t("pullRequestEvents"),
              icon: "arrow.triangle.merge",
            },
            {
              key: "workflow_run",
              label: t("workflowEvents"),
              icon: "gearshape",
            },
            { key: "repository", label: t("repositoryEvents"), icon: "folder" },
          ].map(event => (
            <View key={event.key} style={styles.eventRow}>
              <IconSymbol
                name={event.icon as IconSymbolName}
                size={16}
                color={isDark ? "#94a3b8" : "#64748b"}
              />
              <Text style={[styles.eventText, isDark && styles.eventTextDark]}>
                {event.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Recent Events */}
        {recentEvents.length > 0 && (
          <View style={[styles.card, isDark && styles.cardDark]}>
            <Text
              style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}
            >
              {t("recentEvents")}
            </Text>
            {recentEvents.map(event => (
              <View key={event.id} style={styles.eventItem}>
                <View style={styles.eventInfo}>
                  <Text
                    style={[styles.eventName, isDark && styles.eventNameDark]}
                  >
                    {event.name}
                  </Text>
                  <Text
                    style={[styles.eventTime, isDark && styles.eventTimeDark]}
                  >
                    {new Date(event.created_at).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.eventStatus}>
                  <View style={[styles.statusIndicator, styles.statusActive]} />
                  <Text
                    style={[styles.statusText, isDark && styles.statusTextDark]}
                  >
                    {t("received")}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Instructions */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text
            style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}
          >
            {t("setupInstructions")}
          </Text>
          <Text
            style={[styles.instructions, isDark && styles.instructionsDark]}
          >
            {t("webhookSetupInstructions")}
          </Text>
        </View>
      </ScrollView>
    </View>
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
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  titleDark: {
    color: "#f8fafc",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  subtitleDark: {
    color: "#94a3b8",
  },
  card: {
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
  cardDark: {
    backgroundColor: "#1e293b",
    shadowColor: "#000",
    shadowOpacity: 0.3,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  statusLabelDark: {
    color: "#94a3b8",
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  statusValueDark: {
    color: "#f8fafc",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 12,
  },
  sectionTitleDark: {
    color: "#f8fafc",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 6,
  },
  inputLabelDark: {
    color: "#94a3b8",
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },
  inputContainerDark: {
    borderColor: "#334155",
    backgroundColor: "#0f172a",
  },
  input: {
    fontSize: 16,
    color: "#0f172a",
    padding: 12,
  },
  inputDark: {
    color: "#f8fafc",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
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
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  eventRowDark: {
    borderBottomColor: "#334155",
  },
  eventText: {
    fontSize: 14,
    color: "#334155",
    marginLeft: 10,
  },
  eventTextDark: {
    color: "#e2e8f0",
  },
  eventItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  eventItemDark: {
    borderBottomColor: "#334155",
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 2,
  },
  eventNameDark: {
    color: "#f8fafc",
  },
  eventTime: {
    fontSize: 12,
    color: "#64748b",
  },
  eventTimeDark: {
    color: "#94a3b8",
  },
  eventStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: "#10b981",
  },
  statusInactive: {
    backgroundColor: "#ef4444",
  },
  statusText: {
    fontSize: 12,
    color: "#64748b",
  },
  statusTextDark: {
    color: "#94a3b8",
  },
  instructions: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 20,
  },
  instructionsDark: {
    color: "#94a3b8",
  },
});

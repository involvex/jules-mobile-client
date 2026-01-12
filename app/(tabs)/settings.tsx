import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  TextInput,
  Linking,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import {
  SettingsGroup,
  SettingsSection,
  SettingsItem,
} from "@/constants/types";
import { IconSymbol, IconSymbolName } from "@/components/ui/icon-symbol";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { UseTheme } from "@/constants/theme-enhanced";
import { SafeAreaView } from "react-native-safe-area-context";
import { settingsManager } from "@/utils/settings-manager";
import { useApiKey } from "@/constants/api-key-context";
import { useI18n } from "@/constants/i18n-context";
import pkg from "../../package.json";

const { width: _SCREEN_WIDTH } = Dimensions.get("window");

const SettingItemComponent = ({ 
  item,
  isDark,
  onValueChange,
  theme,
}: { 
  item: SettingsItem;
  isDark: boolean;
  onValueChange: (_value: string | boolean | number) => void;
  theme: any;
}) => {
  const [localValue, setLocalValue] = useState(item.value?.toString() || "");

  // Only update local value if the item value changed externally (not from this component)
  useEffect(() => {
    if (item.type === "input") {
      const externalValue = item.value?.toString() || "";
      if (externalValue !== localValue) {
        setLocalValue(externalValue);
      }
    }
  }, [item.value]); // Removed item.type and localValue to prevent reset while typing

  const itemStyles = useMemo(() => {
    return {
      container: [
        styles.settingItem,
        { borderBottomColor: isDark ? theme.colors.border : "#f1f5f9" },
      ],
      title: [
        styles.settingTitle,
        { color: isDark ? theme.colors.text : "#0f172a" },
      ],
      description: [
        styles.settingDescription,
        { color: isDark ? theme.colors.textSecondary : "#64748b" },
      ],
      input: [
        styles.settingInput,
        {
          backgroundColor: isDark ? theme.colors.background : "#f8fafc",
          borderColor: isDark ? theme.colors.border : "#e2e8f0",
          color: isDark ? theme.colors.text : "#0f172a",
        },
      ],
      saveButton: [
        styles.saveButton,
        { backgroundColor: theme.colors.primary },
      ],
      value: [styles.settingValue, { color: theme.colors.primary }],
    };
  }, [isDark, theme, item]);

  switch (item.type) {
    case "toggle":
      return (
        <View key={item.id} style={itemStyles.container}>
          <View style={styles.settingContent}>
            <Text style={itemStyles.title}>{item.title}</Text>
            {item.description && (
              <Text style={itemStyles.description}>{item.description}</Text>
            )}
          </View>
          <Switch
            value={!!item.value}
            onValueChange={onValueChange}
            trackColor={{
              false: isDark ? "#334155" : "#e2e8f0",
              true: theme.colors.primary,
            }}
            thumbColor="#ffffff"
          />
        </View>
      );

    case "input":
      return (
        <View key={item.id} style={itemStyles.container}>
          <View style={styles.settingContent}>
            <Text style={itemStyles.title}>{item.title}</Text>
            {item.description && (
              <Text style={itemStyles.description}>{item.description}</Text>
            )}
            <TextInput
              style={itemStyles.input}
              value={localValue}
              onChangeText={setLocalValue}
              placeholder={`Enter ${item.title.toLowerCase()}`}
              placeholderTextColor={
                isDark ? theme.colors.textTertiary : "#94a3b8"
              }
              secureTextEntry={
                item.id.toLowerCase().includes("token") ||
                item.id.toLowerCase().includes("key")
              }
            />
            <TouchableOpacity
              style={itemStyles.saveButton}
              onPress={() => onValueChange(localValue)}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      );

    case "select":
      return (
        <TouchableOpacity
          key={item.id}
          style={itemStyles.container}
          onPress={() => {
            if (item.options) {
              Alert.alert(
                item.title,
                "Select an option",
                item.options.map(option => ({
                  text: option.label,
                  onPress: () => onValueChange(option.value),
                  style:
                    item.value === option.value ? "destructive" : "default",
                })),
              );
            }
          }}
          activeOpacity={0.6}
        >
          <View style={styles.settingContent}>
            <Text style={itemStyles.title}>{item.title}</Text>
            {item.description && (
              <Text style={itemStyles.description}>{item.description}</Text>
            )}
            <Text style={itemStyles.value}>
              {item.options?.find(opt => opt.value === item.value)?.label ||
                item.value ||
                "Not set"}
            </Text>
          </View>
          <IconSymbol
            name="chevron.right"
            size={16}
            color={isDark ? theme.colors.textSecondary : "#64748b"}
          />
        </TouchableOpacity>
      );

    case "slider":
      return (
        <View key={item.id} style={itemStyles.container}>
          <View style={styles.settingContent}>
            <Text style={itemStyles.title}>
              {item.title}: {item.value}
            </Text>
            {item.description && (
              <Text style={itemStyles.description}>{item.description}</Text>
            )}
          </View>
        </View>
      );

    case "button":
      return (
        <View key={item.id} style={itemStyles.container}>
          <View style={styles.settingContent}>
            <Text style={itemStyles.title}>{item.title}</Text>
            {item.description && (
              <Text style={itemStyles.description}>{item.description}</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: "#ef4444" }]}
            onPress={() => onValueChange("")}
          >
            <Text style={styles.saveButtonText}>Execute</Text>
          </TouchableOpacity>
        </View>
      );

    default:
      return null;
  }
};

const SupportCard = ({ isDark, theme }: { isDark: boolean; theme: any }) => {
  return (
    <View style={[styles.supportCard, isDark && styles.supportCardDark]}>
      <View style={styles.supportHeader}>
        <IconSymbol name="heart.fill" size={24} color="#ef4444" />
        <Text style={[styles.supportTitle, isDark && styles.supportTitleDark]}>
          Support & Sponsorship
        </Text>
      </View>
      <Text
        style={[
          styles.supportDescription,
          isDark && styles.supportDescriptionDark,
        ]}
      >
        Jules Mobile Client is open source. Your support helps maintain and
        improve the project.
      </Text>
      <View style={styles.supportLinks}>
        <TouchableOpacity
          style={[
            styles.supportButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={() =>
            Linking.openURL("https://github.com/sponsors/involvex")
          }
        >
          <IconSymbol name="star.fill" size={16} color="#fff" />
          <Text style={styles.supportButtonText}>Github Sponsor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.supportButton, styles.paypalButton]}
          onPress={() => Linking.openURL("https://paypal.me/involvex")}
        >
          <Text style={styles.supportButtonText}>PayPal Support</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function NewSettingsScreen() {
  const theme = UseTheme();
  const isDark = theme.isDark;
  const { t: _t } = useI18n();

  const {
    setApiKey: saveApiKeyToContext,
    setGITHUB_TOKEN: saveGITHUB_TOKENContext,
  } = useApiKey();

  const [settings, setSettings] = useState<SettingsGroup | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["account"]),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const loadedSettings = await settingsManager.getAllSettings();
      if (loadedSettings) {
        setSettings(loadedSettings);
      }
    } catch {
      Alert.alert("Error", "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(prev => {
        if (prev) {
          Alert.alert("Timeout", "Loading settings took too long.");
          return false;
        }
        return prev;
      });
    }, 5000);

    void loadSettings();
    return () => clearTimeout(timer);
  }, [loadSettings]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleSettingChange = async (
    sectionId: string,
    itemId: string,
    value: string | boolean | number,
  ) => {
    if (itemId === "clearCache") {
      try {
        const { enhancedCache } = await import("@/utils/enhanced-cache");
        await enhancedCache.clear();
        Alert.alert("Success", "Cache cleared successfully");
      } catch {
        Alert.alert("Error", "Failed to clear cache");
      }
      return;
    }
    try {
      const result = await settingsManager.setSetting(sectionId, itemId, value);
      if (result.success) {
        setSettings(prev => {
          if (!prev) return prev;
          const newSettings = { ...prev };
          const section = newSettings.sections.find(s => s.id === sectionId);
          if (section) {
            const item = section.items.find(i => i.id === itemId);
            if (item) item.value = value;
          }
          return newSettings;
        });

        if (sectionId === "account") {
          if (itemId === "apiKey") await saveApiKeyToContext(value as string);
          else if (itemId === "githubToken")
            await saveGITHUB_TOKENContext(value as string);
          else if (itemId === "githubLogin") {
            const githubUrl =
              "https://github.com/settings/tokens/new?description=Jules%20Mobile%20Client&scopes=repo,workflow,read:user";
            await Linking.openURL(githubUrl);
          }
        }
      } else {
        Alert.alert("Validation Error", result.errors.join("\n"));
      }
    } catch {
      Alert.alert("Error", "Failed to update setting");
    }
  };

  const renderSection = (section: SettingsSection) => {
    const isExpanded = expandedSections.has(section.id);
    const hasRestartRequired = section.items.some(
      item => item.requiresRestart && item.value !== item.defaultValue,
    );

    return (
      <View
        key={section.id}
        style={[styles.section, isDark && styles.sectionDark]}
      >
        <TouchableOpacity
          style={[styles.sectionHeader, isDark && styles.sectionHeaderDark]}
          onPress={() => toggleSection(section.id)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionTitleContainer}>
            <IconSymbol
              name={section.icon as IconSymbolName}
              size={20}
              color={isDark ? theme.colors.textTertiary : "#64748b"}
            />
            <Text
              style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}
            >
              {section.title}
            </Text>
            {hasRestartRequired && (
              <View style={styles.restartBadge}>
                <Text style={styles.restartBadgeText}>Restart</Text>
              </View>
            )}
          </View>
          <IconSymbol
            name={isExpanded ? "chevron.up" : "chevron.down"}
            size={16}
            color={isDark ? theme.colors.textSecondary : "#64748b"}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            <Text
              style={[
                styles.sectionDescription,
                isDark && styles.sectionDescriptionDark,
              ]}
            >
              {section.description}
            </Text>
            {section.items.map(item => (
              <SettingItemComponent
                key={item.id}
                item={item}
                isDark={isDark}
                theme={theme}
                onValueChange={value =>
                  handleSettingChange(section.id, item.id, value)
                }
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const filteredSections = useMemo(() => {
    return (
      settings?.sections?.filter(section => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          section.title.toLowerCase().includes(query) ||
          section.description.toLowerCase().includes(query) ||
          section.items.some(
            item =>
              item.title.toLowerCase().includes(query) ||
              item.description?.toLowerCase().includes(query),
          )
        );
      }) || []
    );
  }, [settings, searchQuery]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Settings
        </Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.searchContainer, isDark && styles.searchContainerDark]}
        >
          <IconSymbol
            name="magnifyingglass"
            size={16}
            color={isDark ? theme.colors.textTertiary : "#64748b"}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search settings..."
            placeholderTextColor={
              isDark ? theme.colors.textTertiary : "#94a3b8"
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={[
                styles.loadingText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Loading settings...
            </Text>
          </View>
        ) : (
          <>
            <SupportCard isDark={isDark} theme={theme} />
            {filteredSections.map(renderSection)}
          </>
        )}

        <View style={[styles.appInfo, isDark && styles.appInfoDark]}>
          <Text style={[styles.appInfoText, isDark && styles.appInfoTextDark]}>
            Jules Mobile Client v{pkg.version}
          </Text>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL("https://github.com/involvex/jules-mobile-client")
            }
          >
            <Text style={[styles.appInfoLink, { color: theme.colors.primary }]}>
              View on GitHub
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingWrapper: {
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
    elevation: 1,
  },
  searchContainerDark: {
    backgroundColor: "#161b22",
    borderColor: "#30363d",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.05)",
    elevation: 2,
  },
  sectionDark: {
    backgroundColor: "#161b22",
    borderColor: "#30363d",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  sectionHeaderDark: {
    borderBottomColor: "#30363d",
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionTitleDark: {
    color: "#f8fafc",
  },
  restartBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  restartBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#ffffff",
  },
  sectionContent: {
    padding: 16,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  sectionDescriptionDark: {
    color: "#8b949e",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  settingValue: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "600",
  },
  settingInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 8,
  },
  saveButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  supportCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.08)",
    elevation: 4,
  },
  supportCardDark: {
    backgroundColor: "#161b22",
    borderColor: "#30363d",
  },
  supportHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  supportTitleDark: {
    color: "#f8fafc",
  },
  supportDescription: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    marginBottom: 16,
  },
  supportDescriptionDark: {
    color: "#8b949e",
  },
  supportLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
    flex: 1,
    minWidth: 140,
    justifyContent: "center",
  },
  supportButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  paypalButton: {
    backgroundColor: "#003087",
  },
  appInfo: {
    alignItems: "center",
    padding: 20,
    marginTop: 10,
  },
  appInfoDark: {
    opacity: 0.8,
  },
  appInfoText: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  appInfoTextDark: {
    color: "#8b949e",
  },
  appInfoLink: {
    fontSize: 12,
    textDecorationLine: "underline",
  },
});
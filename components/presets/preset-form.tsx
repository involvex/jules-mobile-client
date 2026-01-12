import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PresetVariableInput } from "./preset-variable-input";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { presetManager } from "@/utils/preset-manager";
import React, { useState, useEffect } from "react";
import { Preset } from "@/constants/types";

interface PresetFormProps {
  preset: Preset;
  onSubmit: (processedPrompt: string, variables: Record<string, any>) => void;
  onCancel: () => void;
}

export function PresetForm({ preset, onSubmit, onCancel }: PresetFormProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [variables, setVariables] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize variables with defaults
  useEffect(() => {
    const initialVariables: Record<string, any> = {};
    preset.variables.forEach(variable => {
      initialVariables[variable.name] = variable.defaultValue || "";
    });
    setVariables(initialVariables);
  }, [preset]);

  const handleVariableChange = (name: string, value: any) => {
    setVariables(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    preset.variables.forEach(variable => {
      const value = variables[variable.name];

      // Check required fields
      if (variable.required && (!value || value.toString().trim() === "")) {
        newErrors[variable.name] = `${variable.label} is required`;
        isValid = false;
      }

      // Type-specific validation
      if (value) {
        switch (variable.type) {
          case "number":
            if (isNaN(Number(value))) {
              newErrors[variable.name] =
                `${variable.label} must be a valid number`;
              isValid = false;
            } else {
              const num = Number(value);
              if (
                variable.validation?.min !== undefined &&
                num < variable.validation.min
              ) {
                newErrors[variable.name] =
                  `${variable.label} must be at least ${variable.validation.min}`;
                isValid = false;
              }
              if (
                variable.validation?.max !== undefined &&
                num > variable.validation.max
              ) {
                newErrors[variable.name] =
                  `${variable.label} must be at most ${variable.validation.max}`;
                isValid = false;
              }
            }
            break;
          case "string":
            if (
              variable.validation?.pattern &&
              !new RegExp(variable.validation.pattern).test(value)
            ) {
              newErrors[variable.name] = `${variable.label} format is invalid`;
              isValid = false;
            }
            break;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert(
        "Validation Error",
        "Please fix the errors before submitting",
      );
      return;
    }

    setIsProcessing(true);

    try {
      const processedPrompt = presetManager.processPrompt(preset, variables);
      onSubmit(processedPrompt, variables);
    } catch (error) {
      console.error("Failed to process preset:", error);
      Alert.alert("Error", "Failed to process preset. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getCategoryInfo = () => {
    // This would normally come from presetManager.getCategories()
    // For now, return a placeholder
    return {
      name: preset.category,
      color: "#2563eb",
      icon: "circle.fill",
    };
  };

  const categoryInfo = getCategoryInfo();

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={[styles.header, isDark && styles.headerDark]}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <IconSymbol
              name="xmark"
              size={20}
              color={isDark ? "#94a3b8" : "#64748b"}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            Configure Preset
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Preset Info */}
          <View style={[styles.presetInfo, isDark && styles.presetInfoDark]}>
            <View style={styles.presetHeader}>
              <Text
                style={[styles.presetName, isDark && styles.presetNameDark]}
              >
                {preset.name}
              </Text>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: categoryInfo.color + "20" },
                ]}
              >
                <IconSymbol
                  name={categoryInfo.icon as any}
                  size={12}
                  color={categoryInfo.color}
                />
                <Text
                  style={[
                    styles.categoryBadgeText,
                    { color: categoryInfo.color },
                  ]}
                >
                  {categoryInfo.name}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.presetDescription,
                isDark && styles.presetDescriptionDark,
              ]}
            >
              {preset.description}
            </Text>

            {preset.tags.length > 0 && (
              <View style={styles.tagContainer}>
                {preset.tags.map(tag => (
                  <View
                    key={tag}
                    style={[styles.tag, isDark && styles.tagDark]}
                  >
                    <Text
                      style={[styles.tagText, isDark && styles.tagTextDark]}
                    >
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Variables Form */}
          <View style={styles.formContainer}>
            <Text style={[styles.formTitle, isDark && styles.formTitleDark]}>
              Configure Variables
            </Text>

            {preset.variables.map(variable => (
              <PresetVariableInput
                key={variable.name}
                variable={variable}
                value={variables[variable.name]}
                onValueChange={value =>
                  handleVariableChange(variable.name, value)
                }
                error={errors[variable.name]}
              />
            ))}
          </View>

          {/* Preview */}
          <View
            style={[
              styles.previewContainer,
              isDark && styles.previewContainerDark,
            ]}
          >
            <Text
              style={[styles.previewTitle, isDark && styles.previewTitleDark]}
            >
              Preview
            </Text>
            <Text
              style={[styles.previewText, isDark && styles.previewTextDark]}
            >
              {presetManager.processPrompt(preset, variables)}
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.footer, isDark && styles.footerDark]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isProcessing && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isProcessing}
          >
            <Text style={styles.submitButtonText}>
              {isProcessing ? "Processing..." : "Use Preset"}
            </Text>
            <IconSymbol name="arrow.right" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  containerDark: {
    backgroundColor: "#0f172a",
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  headerDark: {
    backgroundColor: "#1e293b",
    borderBottomColor: "#334155",
  },
  cancelButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    textAlign: "center",
  },
  headerTitleDark: {
    color: "#f8fafc",
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  presetInfo: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  presetInfoDark: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
  },
  presetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  presetName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
  },
  presetNameDark: {
    color: "#f8fafc",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  presetDescription: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    marginBottom: 12,
  },
  presetDescriptionDark: {
    color: "#94a3b8",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagDark: {
    backgroundColor: "#334155",
  },
  tagText: {
    fontSize: 12,
    color: "#475569",
  },
  tagTextDark: {
    color: "#cbd5e1",
  },
  formContainer: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 16,
  },
  formTitleDark: {
    color: "#f8fafc",
  },
  previewContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  previewContainerDark: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 12,
  },
  previewTitleDark: {
    color: "#f8fafc",
  },
  previewText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    fontFamily: "monospace",
  },
  previewTextDark: {
    color: "#94a3b8",
  },
  footer: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  footerDark: {
    backgroundColor: "#1e293b",
    borderTopColor: "#334155",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

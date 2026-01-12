import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PresetVariable } from "@/constants/types";
import React, { useState } from "react";

interface PresetVariableInputProps {
  variable: PresetVariable;
  value: any;
  onValueChange: (value: any) => void;
  error?: string;
}

export function PresetVariableInput({
  variable,
  value,
  onValueChange,
  error,
}: PresetVariableInputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleTextChange = (text: string) => {
    onValueChange(text);
  };

  const handleNumberChange = (text: string) => {
    const num = parseFloat(text);
    if (!isNaN(num) || text === "") {
      onValueChange(text === "" ? "" : num);
    }
  };

  const handleBooleanChange = (newValue: boolean) => {
    onValueChange(newValue);
  };

  const handleSelectPress = () => {
    if (!variable.options) return;

    Alert.alert(
      variable.label,
      "Select an option",
      variable.options.map(option => ({
        text: option,
        onPress: () => onValueChange(option),
        style: value === option ? "destructive" : "default",
      })),
    );
  };

  const renderInput = () => {
    switch (variable.type) {
      case "string":
        return (
          <TextInput
            style={[
              styles.input,
              isDark && styles.inputDark,
              error && styles.inputError,
            ]}
            value={value || ""}
            onChangeText={handleTextChange}
            placeholder={
              variable.defaultValue || `Enter ${variable.label.toLowerCase()}`
            }
            placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
            multiline={
              variable.name.toLowerCase().includes("description") ||
              variable.name.toLowerCase().includes("code")
            }
            numberOfLines={
              variable.name.toLowerCase().includes("description") ? 3 : 1
            }
          />
        );

      case "number":
        return (
          <TextInput
            style={[
              styles.input,
              isDark && styles.inputDark,
              error && styles.inputError,
            ]}
            value={value?.toString() || ""}
            onChangeText={handleNumberChange}
            placeholder={
              variable.defaultValue?.toString() ||
              `Enter ${variable.label.toLowerCase()}`
            }
            placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
            keyboardType="numeric"
          />
        );

      case "boolean":
        return (
          <View style={styles.booleanContainer}>
            <Text
              style={[styles.booleanLabel, isDark && styles.booleanLabelDark]}
            >
              {value ? "Yes" : "No"}
            </Text>
            <Switch
              value={value || false}
              onValueChange={handleBooleanChange}
              trackColor={{ false: "#e2e8f0", true: "#2563eb" }}
              thumbColor={value ? "#ffffff" : "#f4f4f5"}
            />
          </View>
        );

      case "select":
        return (
          <TouchableOpacity
            style={[
              styles.selectButton,
              isDark && styles.selectButtonDark,
              error && styles.selectButtonError,
            ]}
            onPress={handleSelectPress}
          >
            <Text
              style={[
                styles.selectButtonText,
                isDark && styles.selectButtonTextDark,
                !value && styles.selectPlaceholder,
              ]}
            >
              {value || `Select ${variable.label.toLowerCase()}`}
            </Text>
            <IconSymbol
              name="chevron.down"
              size={16}
              color={isDark ? "#64748b" : "#94a3b8"}
            />
          </TouchableOpacity>
        );

      default:
        return (
          <Text style={[styles.errorText, isDark && styles.errorTextDark]}>
            Unsupported variable type: {variable.type}
          </Text>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, isDark && styles.labelDark]}>
          {variable.label}
          {variable.required && <Text style={styles.required}>*</Text>}
        </Text>
        {variable.description && (
          <Text style={[styles.description, isDark && styles.descriptionDark]}>
            {variable.description}
          </Text>
        )}
      </View>

      {renderInput()}

      {error && (
        <Text style={[styles.errorText, isDark && styles.errorTextDark]}>
          {error}
        </Text>
      )}

      {variable.validation && (
        <View style={styles.validationContainer}>
          {variable.validation.min !== undefined && (
            <Text
              style={[
                styles.validationText,
                isDark && styles.validationTextDark,
              ]}
            >
              Min: {variable.validation.min}
            </Text>
          )}
          {variable.validation.max !== undefined && (
            <Text
              style={[
                styles.validationText,
                isDark && styles.validationTextDark,
              ]}
            >
              Max: {variable.validation.max}
            </Text>
          )}
          {variable.validation.pattern && (
            <Text
              style={[
                styles.validationText,
                isDark && styles.validationTextDark,
              ]}
            >
              Format required
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  labelDark: {
    color: "#f8fafc",
  },
  required: {
    color: "#dc2626",
  },
  description: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 18,
  },
  descriptionDark: {
    color: "#94a3b8",
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#0f172a",
    minHeight: 44,
  },
  inputDark: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
    color: "#f8fafc",
  },
  inputError: {
    borderColor: "#dc2626",
  },
  booleanContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
  },
  booleanLabel: {
    fontSize: 16,
    color: "#0f172a",
  },
  booleanLabelDark: {
    color: "#f8fafc",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    minHeight: 44,
  },
  selectButtonDark: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
  },
  selectButtonError: {
    borderColor: "#dc2626",
  },
  selectButtonText: {
    fontSize: 16,
    color: "#0f172a",
    flex: 1,
  },
  selectButtonTextDark: {
    color: "#f8fafc",
  },
  selectPlaceholder: {
    color: "#94a3b8",
  },
  errorText: {
    fontSize: 14,
    color: "#dc2626",
    marginTop: 4,
  },
  errorTextDark: {
    color: "#ef4444",
  },
  validationContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  validationText: {
    fontSize: 12,
    color: "#64748b",
  },
  validationTextDark: {
    color: "#94a3b8",
  },
});

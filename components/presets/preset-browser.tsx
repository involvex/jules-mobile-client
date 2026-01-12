import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Preset, PresetCategory } from "@/constants/types";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { presetManager } from "@/utils/preset-manager";
import React, { useState, useEffect } from "react";

interface PresetBrowserProps {
  onPresetSelected: (preset: Preset) => void;
  onCancel: () => void;
}

export function PresetBrowser({
  onPresetSelected,
  onCancel,
}: PresetBrowserProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [presets, setPresets] = useState<Preset[]>([]);
  const [categories, setCategories] = useState<PresetCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [loadedPresets, loadedCategories] = await Promise.all([
        presetManager.getPresets(),
        presetManager.getCategories(),
      ]);
      setPresets(loadedPresets);
      setCategories(loadedCategories);
    } catch (error) {
      console.error("Failed to load presets:", error);
      Alert.alert("Error", "Failed to load presets");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPresets = presets.filter(preset => {
    const matchesCategory =
      selectedCategory === "all" || preset.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.tags.some(tag =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    return matchesCategory && matchesSearch;
  });

  const handlePresetSelect = async (preset: Preset) => {
    try {
      await presetManager.recordUsage(preset.id);
      onPresetSelected(preset);
    } catch (error) {
      console.error("Failed to record usage:", error);
      onPresetSelected(preset); // Still select even if recording fails
    }
  };

  const renderCategoryItem = ({
    item,
  }: {
    item: PresetCategory | { id: string; name: string; icon: string };
  }) => {
    const isSelected = selectedCategory === item.id;
    const categoryPresets =
      item.id === "all" ? presets : presets.filter(p => p.category === item.id);

    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          isDark && styles.categoryItemDark,
          isSelected && styles.categoryItemSelected,
          isSelected && isDark && styles.categoryItemSelectedDark,
        ]}
        onPress={() => setSelectedCategory(item.id)}
      >
        <IconSymbol
          name={item.icon as any}
          size={20}
          color={isSelected ? "#ffffff" : isDark ? "#94a3b8" : "#64748b"}
        />
        <Text
          style={[
            styles.categoryText,
            isDark && styles.categoryTextDark,
            isSelected && styles.categoryTextSelected,
          ]}
        >
          {item.name}
        </Text>
        <View style={styles.categoryCount}>
          <Text
            style={[
              styles.categoryCountText,
              isSelected && styles.categoryCountTextSelected,
            ]}
          >
            {categoryPresets.length}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPresetItem = ({ item }: { item: Preset }) => {
    const category = categories.find(c => c.id === item.category);

    return (
      <TouchableOpacity
        style={[styles.presetItem, isDark && styles.presetItemDark]}
        onPress={() => handlePresetSelect(item)}
      >
        <View style={styles.presetHeader}>
          <View style={styles.presetTitleRow}>
            <Text
              style={[styles.presetName, isDark && styles.presetNameDark]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {item.isFavorite && (
              <IconSymbol name="star.fill" size={16} color="#fbbf24" />
            )}
          </View>
          {category && (
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: category.color + "20" },
              ]}
            >
              <IconSymbol
                name={category.icon as any}
                size={12}
                color={category.color}
              />
              <Text
                style={[styles.categoryBadgeText, { color: category.color }]}
              >
                {category.name}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={[
            styles.presetDescription,
            isDark && styles.presetDescriptionDark,
          ]}
          numberOfLines={2}
        >
          {item.description}
        </Text>

        <View style={styles.presetFooter}>
          <View style={styles.tagContainer}>
            {item.tags.slice(0, 3).map(tag => (
              <View key={tag} style={[styles.tag, isDark && styles.tagDark]}>
                <Text style={[styles.tagText, isDark && styles.tagTextDark]}>
                  {tag}
                </Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={[styles.moreTags, isDark && styles.moreTagsDark]}>
                +{item.tags.length - 3}
              </Text>
            )}
          </View>

          <View style={styles.usageInfo}>
            <IconSymbol
              name="arrow.up.right"
              size={12}
              color={isDark ? "#64748b" : "#94a3b8"}
            />
            <Text style={[styles.usageText, isDark && styles.usageTextDark]}>
              {item.usageCount}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const allCategories = [
    { id: "all", name: "All", icon: "square.grid.2x2.fill" },
    ...categories,
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
            Loading presets...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
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
          Choose Preset
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View
        style={[styles.searchContainer, isDark && styles.searchContainerDark]}
      >
        <IconSymbol
          name="magnifyingglass"
          size={16}
          color={isDark ? "#64748b" : "#94a3b8"}
        />
        <TextInput
          style={[styles.searchInput, isDark && styles.searchInputDark]}
          placeholder="Search presets..."
          placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories */}
      <FlatList
        horizontal
        data={allCategories}
        keyExtractor={item => item.id}
        renderItem={renderCategoryItem}
        contentContainerStyle={styles.categoriesContainer}
        showsHorizontalScrollIndicator={false}
      />

      {/* Presets List */}
      <FlatList
        data={filteredPresets}
        keyExtractor={item => item.id}
        renderItem={renderPresetItem}
        contentContainerStyle={styles.presetsContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol
              name="doc.text.magnifyingglass"
              size={48}
              color={isDark ? "#475569" : "#94a3b8"}
            />
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              {searchQuery ? "No presets found" : "No presets in this category"}
            </Text>
          </View>
        }
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#64748b",
  },
  loadingTextDark: {
    color: "#94a3b8",
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    padding: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchContainerDark: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#0f172a",
  },
  searchInputDark: {
    color: "#f8fafc",
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  categoryItemDark: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
  },
  categoryItemSelected: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  categoryItemSelectedDark: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    flex: 1,
  },
  categoryTextDark: {
    color: "#e2e8f0",
  },
  categoryTextSelected: {
    color: "#ffffff",
  },
  categoryCount: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  categoryCountTextSelected: {
    color: "#ffffff",
  },
  presetsContainer: {
    padding: 16,
    gap: 12,
  },
  presetItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  presetItemDark: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
  },
  presetHeader: {
    marginBottom: 8,
  },
  presetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  presetName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    flex: 1,
  },
  presetNameDark: {
    color: "#f8fafc",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
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
  presetFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tagContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
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
  moreTags: {
    fontSize: 12,
    color: "#94a3b8",
  },
  moreTagsDark: {
    color: "#64748b",
  },
  usageInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  usageText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  usageTextDark: {
    color: "#64748b",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
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

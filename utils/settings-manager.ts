import {
  SettingsGroup,
  SettingsSection,
  SettingsItem,
} from "@/constants/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { enhancedCache } from "./enhanced-cache";

/**
 * Settings Manager - handles application settings with validation and migration
 */
export class SettingsManager {
  private static instance: SettingsManager;
  private readonly STORAGE_KEY = "@jules_settings";
  private readonly CACHE_KEY = "settings_group";

  private settings: SettingsGroup;
  private isLoaded = false;

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  constructor() {
    this.settings = this.getDefaultSettings();
  }

  /**
   * Load settings from storage
   */
  async load(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Try cache first
      const cached = await enhancedCache.get<SettingsGroup>(this.CACHE_KEY);
      if (cached) {
        this.settings = cached;
        this.isLoaded = true;
        return;
      }

      // Load from AsyncStorage
      const settingsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (settingsData) {
        const loadedSettings: SettingsGroup = JSON.parse(settingsData);

        // Migrate settings if needed
        this.settings = await this.migrateSettings(loadedSettings);
      } else {
        // Use defaults
        this.settings = this.getDefaultSettings();
      }

      this.isLoaded = true;

      // Cache the settings
      await this.saveToCache();
    } catch (error) {
      console.warn("Failed to load settings:", error);
      this.settings = this.getDefaultSettings();
      this.isLoaded = true;
    }
  }

  /**
   * Save settings to storage
   */
  private async save(): Promise<void> {
    try {
      this.settings.lastModified = new Date();
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(this.settings),
      );
      await this.saveToCache();
    } catch (error) {
      console.warn("Failed to save settings:", error);
      throw error;
    }
  }

  /**
   * Save to cache
   */
  private async saveToCache(): Promise<void> {
    await enhancedCache.set(this.CACHE_KEY, this.settings, { ttl: 1800000 }); // 30 minutes
  }

  /**
   * Get setting value
   */
  async getSetting(sectionId: string, itemId: string): Promise<unknown> {
    await this.load();

    const section = this.settings.sections.find(s => s.id === sectionId);
    if (!section) return null;

    const item = section.items.find(i => i.id === itemId);
    return item ? item.value : null;
  }

  /**
   * Set setting value with validation
   */
  async setSetting(
    sectionId: string,
    itemId: string,
    value: unknown,
  ): Promise<{ success: boolean; errors: string[] }> {
    await this.load();

    const section = this.settings.sections.find(s => s.id === sectionId);
    if (!section) return { success: false, errors: ["Section not found"] };

    const item = section.items.find(i => i.id === itemId);
    if (!item) return { success: false, errors: ["Item not found"] };

    // Validate the value
    const validation = this.validateSetting(item, value);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Update the value
    item.value = value;

    // Handle dependencies
    if (item.dependencies) {
      await this.updateDependentSettings(item.dependencies, value);
    }

    await this.save();
    return { success: true, errors: [] };
  }

  /**
   * Get all settings
   */
  async getAllSettings(): Promise<SettingsGroup> {
    await this.load();
    return { ...this.settings };
  }

  /**
   * Get settings for a specific section
   */
  async getSectionSettings(sectionId: string): Promise<SettingsSection | null> {
    await this.load();
    return this.settings.sections.find(s => s.id === sectionId) || null;
  }

  /**
   * Reset section to defaults
   */
  async resetSection(sectionId: string): Promise<boolean> {
    await this.load();

    const section = this.settings.sections.find(s => s.id === sectionId);
    if (!section) return false;

    const defaultSection = this.getDefaultSettings().sections.find(
      s => s.id === sectionId,
    );
    if (!defaultSection) return false;

    // Reset all items in the section
    section.items = defaultSection.items.map(defaultItem => ({
      ...defaultItem,
      value: defaultItem.defaultValue,
    }));

    await this.save();
    return true;
  }

  /**
   * Reset all settings to defaults
   */
  async resetAllSettings(): Promise<void> {
    this.settings = this.getDefaultSettings();
    await this.save();
  }

  /**
   * Export settings to JSON
   */
  async exportSettings(): Promise<string> {
    await this.load();
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Import settings from JSON
   */
  async importSettings(
    jsonData: string,
  ): Promise<{ success: boolean; errors: string[] }> {
    try {
      const importedSettings: SettingsGroup = JSON.parse(jsonData);

      // Validate imported settings
      const errors: string[] = [];
      for (const section of importedSettings.sections) {
        for (const item of section.items) {
          const validation = this.validateSetting(item, item.value);
          if (!validation.valid) {
            errors.push(
              `Invalid value for ${section.id}.${item.id}: ${validation.errors.join(", ")}`,
            );
          }
        }
      }

      if (errors.length > 0) {
        return { success: false, errors };
      }

      this.settings = importedSettings;
      await this.save();

      return { success: true, errors: [] };
    } catch {
      return { success: false, errors: ["Invalid settings format"] };
    }
  }

  /**
   * Search settings by query
   */
  async searchSettings(
    query: string,
  ): Promise<{ section: SettingsSection; item: SettingsItem }[]> {
    await this.load();

    const lowercaseQuery = query.toLowerCase();
    const results: { section: SettingsSection; item: SettingsItem }[] = [];

    for (const section of this.settings.sections) {
      for (const item of section.items) {
        if (
          item.title.toLowerCase().includes(lowercaseQuery) ||
          item.description?.toLowerCase().includes(lowercaseQuery) ||
          section.title.toLowerCase().includes(lowercaseQuery)
        ) {
          results.push({ section, item });
        }
      }
    }

    return results;
  }

  /**
   * Get settings that require restart
   */
  async getSettingsRequiringRestart(): Promise<
    { section: SettingsSection; item: SettingsItem }[]
  > {
    await this.load();

    const results: { section: SettingsSection; item: SettingsItem }[] = [];

    for (const section of this.settings.sections) {
      for (const item of section.items) {
        if (item.requiresRestart && item.value !== item.defaultValue) {
          results.push({ section, item });
        }
      }
    }

    return results;
  }

  /**
   * Validate a setting value
   */
  private validateSetting(
    item: SettingsItem,
    value: unknown,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check validation rules
    if (item.validation) {
      for (const rule of item.validation) {
        switch (rule.type) {
          case "required":
            if (
              rule.value &&
              (!value || String(value).trim() === "")
            ) {
              errors.push(rule.message);
            }
            break;
          case "min":
            if (typeof value === "number" && value < rule.value) {
              errors.push(rule.message);
            }
            break;
          case "max":
            if (typeof value === "number" && value > rule.value) {
              errors.push(rule.message);
            }
            break;
          case "pattern":
            if (
              typeof value === "string" &&
              rule.value &&
              !new RegExp(rule.value).test(value)
            ) {
              errors.push(rule.message);
            }
            break;
        }
      }
    }

    // Type-specific validation
    switch (item.type) {
      case "select":
        if (item.options && !item.options.find(opt => opt.value === value)) {
          errors.push(
            `Value must be one of: ${item.options.map(opt => opt.value).join(", ")}`,
          );
        }
        break;
      case "input":
        if (typeof value !== "string") {
          errors.push("Value must be a string");
        }
        break;
      case "slider":
        if (typeof value !== "number" || isNaN(value as number)) {
          errors.push("Value must be a number");
        }
        break;
      case "toggle":
        if (typeof value !== "boolean") {
          errors.push("Value must be true or false");
        }
        break;
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Update dependent settings
   */
  private async updateDependentSettings(
    dependencies: string[],
    value: unknown,
  ): Promise<void> {
    // Parse dependencies (format: "sectionId.itemId")
    for (const dependency of dependencies) {
      const [depSectionId, depItemId] = dependency.split(".");
      if (depSectionId && depItemId) {
        // For now, just log dependencies - could implement more complex logic
        console.log(`Setting ${dependency} depends on value:`, value);
      }
    }
  }

  /**
   * Migrate settings from old format
   */
  private async migrateSettings(oldSettings: any): Promise<SettingsGroup> {
    // This is a placeholder for future migrations
    // For now, just return the old settings if they're in the new format
    if (oldSettings.sections && Array.isArray(oldSettings.sections)) {
      return oldSettings;
    }

    // If old format, create new format with defaults
    console.log("Migrating settings from old format");
    return this.getDefaultSettings();
  }

  /**
   * Get default settings structure
   */
  private getDefaultSettings(): SettingsGroup {
    return {
      sections: [
        {
          id: "account",
          title: "Account & API",
          icon: "person.fill",
          description: "API keys and account settings",
          items: [
            {
              id: "apiKey",
              type: "input",
              title: "Jules API Key",
              description: "Your Google AI API key for Jules",
              value: "",
              defaultValue: "",
              category: "account",
              validation: [
                {
                  type: "required",
                  value: true,
                  message: "API key is required",
                },
                {
                  type: "min",
                  value: 30,
                  message: "API key is too short",
                },
              ],
            },
            {
              id: "githubToken",
              type: "input",
              title: "GitHub Token",
              description: "Personal access token for GitHub API",
              value: "",
              defaultValue: "",
              category: "account",
              validation: [
                {
                  type: "pattern",
                  value: "^ghp_[A-Za-z0-9]{36}$|^github_pat_[A-Za-z0-9_]{82}$",
                  message: "Invalid GitHub token format",
                },
              ],
            },
            {
              id: "githubLogin",
              type: "button",
              title: "Connect GitHub",
              description: "Generate a token on GitHub.com",
              value: "",
              defaultValue: "",
              category: "account",
            },
          ],
        },
        {
          id: "appearance",
          title: "Appearance",
          icon: "paintbrush.fill",
          description: "Theme and visual preferences",
          items: [
            {
              id: "theme",
              type: "select",
              title: "Theme",
              description: "Choose your preferred theme",
              value: "system",
              defaultValue: "system",
              category: "appearance",
              options: [
                { label: "Light", value: "light" },
                { label: "Dark", value: "dark" },
                { label: "System", value: "system" },
              ],
            },
            {
              id: "language",
              type: "select",
              title: "Language",
              description: "Interface language",
              value: "en",
              defaultValue: "en",
              category: "appearance",
              options: [
                { label: "English", value: "en" },
                { label: "日本語", value: "ja" },
              ],
            },
          ],
        },
        {
          id: "performance",
          title: "Performance & Caching",
          icon: "speedometer",
          description: "Performance and cache settings",
          items: [
            {
              id: "cacheEnabled",
              type: "toggle",
              title: "Enable Caching",
              description: "Cache API responses for better performance",
              value: true,
              defaultValue: true,
              category: "performance",
            },
            {
              id: "cacheSize",
              type: "slider",
              title: "Cache Size (MB)",
              description: "Maximum cache size in megabytes",
              value: 100,
              defaultValue: 100,
              category: "performance",
              validation: [
                { type: "min", value: 10, message: "Minimum 10MB" },
                { type: "max", value: 500, message: "Maximum 500MB" },
              ],
            },
            {
              id: "compressionEnabled",
              type: "toggle",
              title: "Enable Compression",
              description: "Compress cached data to save space",
              value: true,
              defaultValue: true,
              category: "performance",
            },
            {
              id: "backgroundSync",
              type: "toggle",
              title: "Background Sync",
              description: "Sync data in background for faster loading",
              value: true,
              defaultValue: true,
              category: "performance",
            },
          ],
        },
        {
          id: "github",
          title: "GitHub Integration",
          icon: "link",
          description: "GitHub-specific settings",
          items: [
            {
              id: "defaultBranch",
              type: "input",
              title: "Default Branch",
              description: "Default branch for new sessions",
              value: "main",
              defaultValue: "main",
              category: "github",
            },
            {
              id: "autoSync",
              type: "toggle",
              title: "Auto Sync Repositories",
              description: "Automatically sync repository data",
              value: true,
              defaultValue: true,
              category: "github",
            },
            {
              id: "webhookEnabled",
              type: "toggle",
              title: "Enable Webhooks",
              description: "Receive real-time updates via webhooks",
              value: false,
              defaultValue: false,
              category: "github",
            },
          ],
        },
        {
          id: "jules",
          title: "Jules Chat",
          icon: "message.fill",
          description: "Chat and conversation settings",
          items: [
            {
              id: "autoSave",
              type: "toggle",
              title: "Auto-save Conversations",
              description: "Automatically save chat history",
              value: true,
              defaultValue: true,
              category: "jules",
            },
            {
              id: "maxHistory",
              type: "slider",
              title: "Max History Items",
              description: "Maximum number of history items to keep",
              value: 100,
              defaultValue: 100,
              category: "jules",
              validation: [
                { type: "min", value: 10, message: "Minimum 10 items" },
                { type: "max", value: 1000, message: "Maximum 1000 items" },
              ],
            },
            {
              id: "presetSuggestions",
              type: "toggle",
              title: "Preset Suggestions",
              description: "Show preset suggestions when typing",
              value: true,
              defaultValue: true,
              category: "jules",
            },
          ],
        },
        {
          id: "localai",
          title: "Local AI",
          icon: "cpu",
          description: "Local LLM execution settings",
          items: [
            {
              id: "enableLocalAi",
              type: "toggle",
              title: "Enable Local AI",
              description: "Allow running lightweight models on device",
              value: true,
              defaultValue: true,
              category: "localai",
            },
            {
              id: "autoDetect",
              type: "toggle",
              title: "Auto-detect Capabilities",
              description: "Automatically detect WebGPU/Native support",
              value: true,
              defaultValue: true,
              category: "localai",
            },
            {
              id: "defaultModel",
              type: "select",
              title: "Default Local Model",
              description: "Model to use for local chat",
              value: "gemma-2b",
              defaultValue: "gemma-2b",
              category: "localai",
              options: [
                { label: "Gemma 2B", value: "gemma-2b" },
                { label: "Phi-3 Mini", value: "phi-3" },
                { label: "TinyLlama", value: "tiny-llama" },
              ],
            },
          ],
        },
        {
          id: "advanced",
          title: "Advanced",
          icon: "gear",
          description: "Advanced settings and debugging",
          advanced: true,
          items: [
            {
              id: "debugMode",
              type: "toggle",
              title: "Debug Mode",
              description: "Enable debug logging and features",
              value: false,
              defaultValue: false,
              category: "advanced",
              requiresRestart: true,
            },
            {
              id: "analyticsEnabled",
              type: "toggle",
              title: "Enable Analytics",
              description: "Send anonymous usage analytics",
              value: true,
              defaultValue: true,
              category: "advanced",
            },
            {
              id: "experimentalFeatures",
              type: "toggle",
              title: "Experimental Features",
              description: "Enable experimental features",
              value: false,
              defaultValue: false,
              category: "advanced",
              requiresRestart: true,
            },
            {
              id: "clearCache",
              type: "button",
              title: "Clear Cache",
              description: "Remove all cached data",
              value: "",
              defaultValue: "",
              category: "advanced",
            },
          ],
        },
      ],
      version: "1.0.0",
      lastModified: new Date(),
    };
  }
}

// Export singleton instance
export const settingsManager = SettingsManager.getInstance();

import {
  Preset,
  PresetCategory,
  PresetCollection,
  PresetVariable,
  PresetUsageStats,
} from "@/constants/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { enhancedCache } from "./enhanced-cache";

/**
 * Preset Manager - handles storage, retrieval, and management of Jules Chat presets
 */
export class PresetManager {
  private static instance: PresetManager;
  private readonly STORAGE_KEY = "@jules_presets";
  private readonly STATS_KEY = "@jules_preset_stats";
  private readonly CACHE_KEY = "presets_collection";

  private presets: Preset[] = [];
  private categories: PresetCategory[] = [];
  private stats: PresetUsageStats[] = [];
  private isLoaded = false;

  static getInstance(): PresetManager {
    if (!PresetManager.instance) {
      PresetManager.instance = new PresetManager();
    }
    return PresetManager.instance;
  }

  /**
   * Load presets from storage
   */
  async load(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Try cache first
      const cached = await enhancedCache.get<PresetCollection>(this.CACHE_KEY);
      if (cached) {
        this.presets = cached.presets;
        this.categories = cached.categories;
        this.stats = cached.stats;
        this.isLoaded = true;
        return;
      }

      // Load from AsyncStorage
      const [presetsData, statsData] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEY),
        AsyncStorage.getItem(this.STATS_KEY),
      ]);

      if (presetsData) {
        const collection: PresetCollection = JSON.parse(presetsData);
        this.presets = collection.presets || [];
        this.categories = collection.categories || [];
      }

      if (statsData) {
        this.stats = JSON.parse(statsData);
      }

      // Initialize default categories if none exist
      if (this.categories.length === 0) {
        this.initializeDefaultCategories();
      }

      // Initialize default presets if none exist
      if (this.presets.length === 0) {
        this.initializeDefaultPresets();
      }

      this.isLoaded = true;

      // Cache the collection
      await this.saveToCache();
    } catch (error) {
      console.warn("Failed to load presets:", error);
      this.initializeDefaultCategories();
      this.initializeDefaultPresets();
      this.isLoaded = true;
    }
  }

  /**
   * Save presets to storage
   */
  private async save(): Promise<void> {
    try {
      const collection: PresetCollection = {
        presets: this.presets,
        categories: this.categories,
        stats: this.stats,
      };

      await Promise.all([
        AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(collection)),
        AsyncStorage.setItem(this.STATS_KEY, JSON.stringify(this.stats)),
      ]);

      await this.saveToCache();
    } catch (error) {
      console.warn("Failed to save presets:", error);
      throw error;
    }
  }

  /**
   * Save to cache
   */
  private async saveToCache(): Promise<void> {
    const collection: PresetCollection = {
      presets: this.presets,
      categories: this.categories,
      stats: this.stats,
    };

    await enhancedCache.set(this.CACHE_KEY, collection, { ttl: 3600000 }); // 1 hour
  }

  /**
   * Get all presets
   */
  async getPresets(category?: string): Promise<Preset[]> {
    await this.load();

    if (category) {
      return this.presets.filter(preset => preset.category === category);
    }

    return [...this.presets];
  }

  /**
   * Get preset by ID
   */
  async getPreset(id: string): Promise<Preset | null> {
    await this.load();
    return this.presets.find(preset => preset.id === id) || null;
  }

  /**
   * Create a new preset
   */
  async createPreset(
    preset: Omit<Preset, "id" | "usageCount" | "createdAt" | "updatedAt">,
  ): Promise<Preset> {
    await this.load();

    const newPreset: Preset = {
      ...preset,
      id: this.generateId(),
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.presets.push(newPreset);
    await this.save();

    return newPreset;
  }

  /**
   * Update an existing preset
   */
  async updatePreset(
    id: string,
    updates: Partial<Preset>,
  ): Promise<Preset | null> {
    await this.load();

    const index = this.presets.findIndex(preset => preset.id === id);
    if (index === -1) return null;

    this.presets[index] = {
      ...this.presets[index],
      ...updates,
      updatedAt: new Date(),
    };

    await this.save();
    return this.presets[index];
  }

  /**
   * Delete a preset
   */
  async deletePreset(id: string): Promise<boolean> {
    await this.load();

    const index = this.presets.findIndex(preset => preset.id === id);
    if (index === -1) return false;

    this.presets.splice(index, 1);

    // Remove from stats
    this.stats = this.stats.filter(stat => stat.presetId !== id);

    await this.save();
    return true;
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<PresetCategory[]> {
    await this.load();
    return [...this.categories];
  }

  /**
   * Create a new category
   */
  async createCategory(
    category: Omit<PresetCategory, "id">,
  ): Promise<PresetCategory> {
    await this.load();

    const newCategory: PresetCategory = {
      ...category,
      id: this.generateId(),
    };

    this.categories.push(newCategory);
    await this.save();

    return newCategory;
  }

  /**
   * Record preset usage
   */
  async recordUsage(presetId: string): Promise<void> {
    await this.load();

    const existingStat = this.stats.find(stat => stat.presetId === presetId);
    if (existingStat) {
      existingStat.usageCount++;
      existingStat.lastUsed = new Date();
    } else {
      this.stats.push({
        presetId,
        usageCount: 1,
        lastUsed: new Date(),
      });
    }

    // Update preset usage count
    const preset = this.presets.find(p => p.id === presetId);
    if (preset) {
      preset.usageCount++;
      preset.updatedAt = new Date();
    }

    await this.save();
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(): Promise<PresetUsageStats[]> {
    await this.load();
    return [...this.stats].sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string): Promise<boolean> {
    await this.load();

    const preset = this.presets.find(p => p.id === id);
    if (!preset) return false;

    preset.isFavorite = !preset.isFavorite;
    preset.updatedAt = new Date();

    await this.save();
    return preset.isFavorite;
  }

  /**
   * Search presets by query
   */
  async searchPresets(query: string): Promise<Preset[]> {
    await this.load();

    const lowercaseQuery = query.toLowerCase();
    return this.presets.filter(
      preset =>
        preset.name.toLowerCase().includes(lowercaseQuery) ||
        preset.description.toLowerCase().includes(lowercaseQuery) ||
        preset.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)),
    );
  }

  /**
   * Get favorite presets
   */
  async getFavorites(): Promise<Preset[]> {
    await this.load();
    return this.presets.filter(preset => preset.isFavorite);
  }

  /**
   * Process preset prompt with variables
   */
  processPrompt(preset: Preset, variables: Record<string, any> = {}): string {
    let prompt = preset.prompt;

    // Replace variables in the prompt
    preset.variables.forEach(variable => {
      const value = variables[variable.name] || variable.defaultValue || "";
      const regex = new RegExp(`\\$\\{${variable.name}\\}`, "g");
      prompt = prompt.replace(regex, value);
    });

    return prompt;
  }

  /**
   * Validate preset variables
   */
  validateVariables(
    preset: Preset,
    variables: Record<string, any>,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    preset.variables.forEach(variable => {
      const value = variables[variable.name];

      if (variable.required && (!value || value.toString().trim() === "")) {
        errors.push(`${variable.label} is required`);
      }

      if (value) {
        // Type-specific validation
        switch (variable.type) {
          case "number":
            if (isNaN(Number(value))) {
              errors.push(`${variable.label} must be a number`);
            } else {
              const num = Number(value);
              if (
                variable.validation?.min !== undefined &&
                num < variable.validation.min
              ) {
                errors.push(
                  `${variable.label} must be at least ${variable.validation.min}`,
                );
              }
              if (
                variable.validation?.max !== undefined &&
                num > variable.validation.max
              ) {
                errors.push(
                  `${variable.label} must be at most ${variable.validation.max}`,
                );
              }
            }
            break;
          case "string":
            if (
              variable.validation?.pattern &&
              !new RegExp(variable.validation.pattern).test(value)
            ) {
              errors.push(`${variable.label} format is invalid`);
            }
            break;
        }
      }
    });

    return { valid: errors.length === 0, errors };
  }

  /**
   * Export presets to JSON
   */
  async exportPresets(): Promise<string> {
    await this.load();
    const collection: PresetCollection = {
      presets: this.presets,
      categories: this.categories,
      stats: this.stats,
    };
    return JSON.stringify(collection, null, 2);
  }

  /**
   * Import presets from JSON
   */
  async importPresets(
    jsonData: string,
  ): Promise<{ imported: number; skipped: number }> {
    await this.load();

    try {
      const collection: PresetCollection = JSON.parse(jsonData);
      let imported = 0;
      let skipped = 0;

      // Import categories
      if (collection.categories) {
        for (const category of collection.categories) {
          if (!this.categories.find(c => c.id === category.id)) {
            this.categories.push(category);
            imported++;
          } else {
            skipped++;
          }
        }
      }

      // Import presets
      if (collection.presets) {
        for (const preset of collection.presets) {
          if (!this.presets.find(p => p.id === preset.id)) {
            this.presets.push(preset);
            imported++;
          } else {
            skipped++;
          }
        }
      }

      await this.save();
      return { imported, skipped };
    } catch (error) {
      throw new Error("Invalid preset data format");
    }
  }

  /**
   * Clear all presets and reset to defaults
   */
  async resetToDefaults(): Promise<void> {
    this.presets = [];
    this.categories = [];
    this.stats = [];

    this.initializeDefaultCategories();
    this.initializeDefaultPresets();

    await this.save();
  }

  /**
   * Initialize default categories
   */
  private initializeDefaultCategories(): void {
    this.categories = [
      {
        id: "development",
        name: "Development",
        icon: "hammer.fill",
        color: "#2563eb",
        description: "Code development and programming tasks",
      },
      {
        id: "analysis",
        name: "Analysis",
        icon: "chart.bar.fill",
        color: "#dc2626",
        description: "Code analysis and review tasks",
      },
      {
        id: "documentation",
        name: "Documentation",
        icon: "doc.text.fill",
        color: "#16a34a",
        description: "Documentation and writing tasks",
      },
      {
        id: "testing",
        name: "Testing",
        icon: "checkmark.circle.fill",
        color: "#ca8a04",
        description: "Testing and quality assurance tasks",
      },
      {
        id: "deployment",
        name: "Deployment",
        icon: "arrow.up.circle.fill",
        color: "#7c3aed",
        description: "Deployment and DevOps tasks",
      },
    ];
  }

  /**
   * Initialize default presets
   */
  private initializeDefaultPresets(): void {
    const now = new Date();

    this.presets = [
      {
        id: "code-review-basic",
        name: "Basic Code Review",
        description: "Perform a basic code review of the provided files",
        category: "analysis",
        prompt:
          "Please review the following code for:\n\n1. Code quality and best practices\n2. Potential bugs or issues\n3. Performance considerations\n4. Security vulnerabilities\n5. Readability and maintainability\n\nProvide specific recommendations for improvements.",
        variables: [],
        tags: ["review", "quality", "bugs"],
        usageCount: 0,
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "feature-implementation",
        name: "Feature Implementation",
        description: "Implement a new feature with proper structure",
        category: "development",
        prompt:
          'Implement a new feature called "${featureName}" with the following requirements:\n\n${requirements}\n\nPlease provide:\n1. Implementation plan\n2. Code structure\n3. Error handling\n4. Testing strategy\n\nFocus on clean, maintainable code following best practices.',
        variables: [
          {
            name: "featureName",
            label: "Feature Name",
            type: "string",
            required: true,
          },
          {
            name: "requirements",
            label: "Requirements",
            type: "string",
            required: true,
          },
        ],
        tags: ["feature", "implementation", "planning"],
        usageCount: 0,
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "bug-fix",
        name: "Bug Fix Analysis",
        description: "Analyze and fix a reported bug",
        category: "development",
        prompt:
          'I have a bug described as: "${bugDescription}"\n\nThe expected behavior is: ${expectedBehavior}\n\nCurrent behavior: ${currentBehavior}\n\nPlease help me:\n1. Identify the root cause\n2. Propose a fix\n3. Suggest testing steps to verify the fix\n4. Consider edge cases',
        variables: [
          {
            name: "bugDescription",
            label: "Bug Description",
            type: "string",
            required: true,
          },
          {
            name: "expectedBehavior",
            label: "Expected Behavior",
            type: "string",
            required: true,
          },
          {
            name: "currentBehavior",
            label: "Current Behavior",
            type: "string",
            required: true,
          },
        ],
        tags: ["bug", "fix", "debugging"],
        usageCount: 0,
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "unit-test-writing",
        name: "Unit Test Writing",
        description: "Write comprehensive unit tests for a function/class",
        category: "testing",
        prompt:
          "Write comprehensive unit tests for the following ${componentType}:\n\n${componentCode}\n\nPlease include:\n1. Happy path tests\n2. Edge cases\n3. Error conditions\n4. Mocking/stubbing where appropriate\n5. Test coverage considerations\n\nUse ${testingFramework} testing framework.",
        variables: [
          {
            name: "componentType",
            label: "Component Type",
            type: "select",
            options: ["function", "class", "module", "component"],
            defaultValue: "function",
            required: true,
          },
          {
            name: "componentCode",
            label: "Component Code",
            type: "string",
            required: true,
          },
          {
            name: "testingFramework",
            label: "Testing Framework",
            type: "select",
            options: ["Jest", "Mocha", "Jasmine", "Vitest", "Other"],
            defaultValue: "Jest",
            required: true,
          },
        ],
        tags: ["testing", "unit-tests", "coverage"],
        usageCount: 0,
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "api-documentation",
        name: "API Documentation",
        description: "Generate comprehensive API documentation",
        category: "documentation",
        prompt:
          "Generate comprehensive API documentation for the following ${apiType}:\n\n${apiCode}\n\nPlease include:\n1. Endpoint descriptions\n2. Parameter specifications\n3. Response formats\n4. Error codes\n5. Usage examples\n6. Authentication requirements\n\nFormat the documentation in ${format} style.",
        variables: [
          {
            name: "apiType",
            label: "API Type",
            type: "select",
            options: ["REST API", "GraphQL API", "WebSocket API", "RPC API"],
            defaultValue: "REST API",
            required: true,
          },
          {
            name: "apiCode",
            label: "API Code/Specification",
            type: "string",
            required: true,
          },
          {
            name: "format",
            label: "Documentation Format",
            type: "select",
            options: ["OpenAPI/Swagger", "Markdown", "HTML", "Plain Text"],
            defaultValue: "Markdown",
            required: true,
          },
        ],
        tags: ["api", "documentation", "swagger"],
        usageCount: 0,
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const presetManager = PresetManager.getInstance();

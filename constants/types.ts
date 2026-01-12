/**
 * ==========================================
 * Jules API型定義 (厳密な型付け！)
 * ==========================================
 */

// APIのエラーレスポンス
export interface ApiError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

// ソース (GitHubリポジトリなど)
export interface Source {
  name: string; // "sources/github/..."
  displayName?: string;
  id?: string;
  githubRepo?: {
    owner: string;
    repo: string;
    isPrivate?: boolean;
    defaultBranch?: {
      displayName: string;
    };
  };
}

// セッション (タスクの単位)
export interface Session {
  name: string; // "sessions/..."
  title?: string;
  state: "STATE_UNSPECIFIED" | "ACTIVE" | "COMPLETED" | "FAILED";
  createTime: string;
  updateTime: string;
}

// プランステップ
export interface PlanStep {
  id?: string;
  title: string;
  description?: string;
  state?: string;
  index?: number;
}

// Bashアウトプット
export interface BashOutput {
  command: string;
  output?: string;
  exitCode?: number;
}

// アーティファクト
export interface Artifact {
  bashOutput?: BashOutput;
  changeSet?: {
    source: string;
    gitPatch?: {
      unidiffPatch: string;
      baseCommitId?: string;
    };
  };
}

// アクティビティ (セッション内のイベント) - 実際のAPI構造
export interface Activity {
  name: string;
  id: string;
  createTime: string;

  // originator: "agent" | "user"
  originator: "agent" | "user";

  // エージェントからのメッセージ
  agentMessaged?: {
    agentMessage: string;
  };

  // ユーザーからのメッセージ
  userMessaged?: {
    userMessage: string;
  };

  // 進捗更新
  progressUpdated?: {
    title?: string;
    description?: string;
  };

  // プラン生成
  planGenerated?: {
    plan: {
      id: string;
      steps?: PlanStep[];
    };
  };

  // プラン承認
  planApproved?: {
    planId: string;
  };

  // プラン承認リクエスト
  planApprovalRequested?: {
    planId: string;
  };

  // アーティファクト（bashOutput等）
  artifacts?: Artifact[];

  // タイトル（オプション）
  title?: string;
}

// APIレスポンスのラッパー
export interface ListSourcesResponse {
  sources?: Source[];
  nextPageToken?: string;
}

export interface ListSessionsResponse {
  sessions?: Session[];
  nextPageToken?: string;
}

export interface ListActivitiesResponse {
  activities?: Activity[];
  nextPageToken?: string;
}

// アプリのビュー状態
export type ViewState =
  | "SESSIONS"
  | "SETTINGS"
  | "CREATE_SESSION"
  | "SESSION_DETAIL";

// ==========================================
// Enhanced Caching System Types
// ==========================================

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  compressed?: boolean;
  checksum?: string;
}

export interface CacheOptions {
  ttl?: number;
  compress?: boolean;
  priority?: "low" | "normal" | "high";
  tags?: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  compressionRatio: number;
  memoryUsage: number;
  persistentUsage: number;
}

export interface CacheConfig {
  memorySize: number; // Max memory cache size in MB
  persistentSize: number; // Max persistent cache size in MB
  compressionEnabled: boolean;
  backgroundSync: boolean;
  defaultTTL: number; // Default TTL in milliseconds
}

// ==========================================
// Preset System Types
// ==========================================

export interface PresetVariable {
  name: string;
  type: "string" | "number" | "boolean" | "select";
  label: string;
  description?: string;
  defaultValue?: any;
  options?: string[];
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface PresetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  variables: PresetVariable[];
  tags: string[];
  usageCount: number;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  author?: string;
}

export interface PresetUsageStats {
  presetId: string;
  usageCount: number;
  lastUsed: Date;
  averageRating?: number;
}

export interface PresetCollection {
  presets: Preset[];
  categories: PresetCategory[];
  stats: PresetUsageStats[];
}

// ==========================================
// Enhanced Settings System Types
// ==========================================

export interface SettingOption {
  label: string;
  value: any;
  description?: string;
  icon?: string;
}

export interface ValidationRule {
  type: "required" | "min" | "max" | "pattern" | "custom";
  value?: any;
  message: string;
}

export interface SettingsItem {
  id: string;
  type: "toggle" | "select" | "input" | "slider" | "button" | "group";
  title: string;
  description?: string;
  value: any;
  defaultValue: any;
  options?: SettingOption[];
  validation?: ValidationRule[];
  dependencies?: string[]; // Other setting IDs this depends on
  requiresRestart?: boolean;
  category: string;
  advanced?: boolean;
}

export interface SettingsSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  items: SettingsItem[];
  requiresRestart?: boolean;
  advanced?: boolean;
}

export interface SettingsGroup {
  sections: SettingsSection[];
  version: string;
  lastModified: Date;
}

// ==========================================
// Performance Monitoring Types
// ==========================================

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  metadata: Record<string, any>;
}

export interface ApiCallStats {
  endpoint: string;
  method: string;
  callCount: number;
  averageDuration: number;
  successRate: number;
  lastCalled: Date;
}

export interface MemoryStats {
  used: number;
  total: number;
  peak: number;
  garbageCollections: number;
}

export interface UserEngagementStats {
  sessionCount: number;
  averageSessionDuration: number;
  featureUsage: Record<string, number>;
  presetUsage: Record<string, number>;
}

export interface AnalyticsData {
  presetUsage: PresetUsageStats[];
  cacheStats: CacheStats;
  apiStats: ApiCallStats[];
  memoryStats: MemoryStats;
  engagementStats: UserEngagementStats;
  timeRange: {
    start: Date;
    end: Date;
  };
}

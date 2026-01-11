# Jules Mobile Client - Developer Documentation

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [GitHub Integration Architecture](#github-integration-architecture)
- [API Reference](#api-reference)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)
- [Testing Strategy](#testing-strategy)
- [Performance Optimization](#performance-optimization)
- [Security Best Practices](#security-best-practices)
- [Deployment Guide](#deployment-guide)
- [Contributing Guidelines](#contributing-guidelines)

## Architecture Overview

### Project Structure

```
jules-mobile-client/
├── app/                    # Expo Router screens and navigation
│   ├── (tabs)/            # Main tab navigation
│   ├── session/[id].tsx   # Dynamic session routes
│   ├── create-session.tsx # Session creation flow
│   └── _layout.tsx        # Root layout components
├── components/             # Reusable UI components
│   ├── jules/             # Jules-specific components
│   ├── github/            # GitHub integration components
│   └── ui/                # Generic UI components
├── constants/              # Application constants and types
│   ├── types.ts           # TypeScript type definitions
│   ├── theme.ts           # Theme and styling constants
│   └── github-context.tsx # GitHub integration context
├── hooks/                  # Custom React hooks
│   ├── use-jules-api.ts   # Jules API integration
│   ├── use-github-api.ts  # GitHub API integration
│   └── use-secure-storage.ts # Secure data storage
├── utils/                  # Utility functions
│   └── performance.ts     # Performance monitoring utilities
├── docs/                   # Documentation
└── __tests__/             # Test files
```

### Technology Stack

| Layer                | Technology                          | Purpose                                     |
| -------------------- | ----------------------------------- | ------------------------------------------- |
| **Framework**        | React Native + Expo                 | Cross-platform mobile development           |
| **Routing**          | Expo Router                         | File-based routing system                   |
| **State Management** | React Context + Custom Hooks        | Application state management                |
| **Styling**          | React Native StyleSheet             | Component styling                           |
| **API Client**       | @octokit/rest                       | GitHub API integration                      |
| **Storage**          | expo-secure-store                   | Secure data storage                         |
| **Testing**          | Jest + React Native Testing Library | Unit and integration testing                |
| **Build Tool**       | Bun                                 | Fast JavaScript runtime and package manager |

### Design Patterns

#### 1. Context Provider Pattern

```typescript
// Centralized state management for GitHub integration
const GithubProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(githubReducer, initialState);

  return (
    <GithubContext.Provider value={{ ...state, dispatch }}>
      {children}
    </GithubContext.Provider>
  );
};
```

#### 2. Custom Hook Pattern

```typescript
// Encapsulated business logic in custom hooks
export const useGithubApi = () => {
  const { token } = useSecureStorage();
  const octokit = useMemo(() => new Octokit({ auth: token }), [token]);

  const getUserRepos = useCallback(async () => {
    const response = await octokit.rest.repos.listForAuthenticatedUser();
    return response.data;
  }, [octokit]);

  return { getUserRepos /* other methods */ };
};
```

#### 3. Component Composition

```typescript
// Reusable components with composition
const RepositoryCard: React.FC<RepositoryCardProps> = ({ repository }) => {
  return (
    <Card>
      <RepositoryHeader repository={repository} />
      <RepositoryDetails repository={repository} />
      <RepositoryActions repository={repository} />
    </Card>
  );
};
```

## GitHub Integration Architecture

### Integration Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Repository List │  │ Workflow Dashboard│  │ PR Analyzer  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ useGithubApi    │  │ useWorkflow     │  │ usePRAnalysis│ │
│  │ useRepository   │  │ useNotifications│  │ useSync      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Octokit Client  │  │ SecureStore     │  │ Cache Manager│ │
│  │ API Endpoints   │  │ Local Storage   │  │ Performance  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    External APIs                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ GitHub REST API │  │ GitHub Webhooks │  │ Jules API    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Integration Points

#### 1. Authentication Flow

```typescript
// Secure token management
const authenticateWithGithub = async (token: string): Promise<boolean> => {
  try {
    // Validate token with GitHub API
    const response = await octokit.rest.users.getAuthenticated();

    // Store token securely
    await SecureStore.setItemAsync("github_token", token);

    // Update context state
    dispatch({ type: "SET_AUTHENTICATED", payload: true });

    return true;
  } catch (error) {
    console.error("GitHub authentication failed:", error);
    return false;
  }
};
```

#### 2. Repository Synchronization

```typescript
// Intelligent caching and sync
const syncRepository = async (owner: string, repo: string) => {
  const cacheKey = `repo_${owner}_${repo}`;

  // Check cache first
  const cached = await cacheManager.get(cacheKey);
  if (cached && !isCacheExpired(cached)) {
    return cached.data;
  }

  // Fetch from API
  const data = await octokit.rest.repos.get({ owner, repo });

  // Store in cache
  await cacheManager.set(cacheKey, data, CACHE_TTL);

  return data;
};
```

#### 3. Real-time Updates

```typescript
// Webhook event handling
const handleWebhookEvent = (event: WebhookEvent) => {
  switch (event.type) {
    case "push":
      dispatch({ type: "REPO_UPDATED", payload: event.payload });
      break;
    case "workflow_run.completed":
      dispatch({ type: "WORKFLOW_COMPLETED", payload: event.payload });
      break;
    // Handle other event types
  }
};
```

## API Reference

### GitHub API Integration

#### Core API Methods

##### Repository Operations

```typescript
interface GithubApi {
  // List user repositories
  getUserRepos(options?: {
    perPage?: number;
    page?: number;
    visibility?: "all" | "public" | "private";
  }): Promise<Repository[]>;

  // Get repository details
  getRepoDetails(owner: string, repo: string): Promise<Repository>;

  // Search repositories
  searchRepositories(
    query: string,
    options?: {
      perPage?: number;
      page?: number;
    },
  ): Promise<Repository[]>;

  // Get repository README
  getRepoReadme(owner: string, repo: string): Promise<string>;
}
```

##### Workflow Operations

```typescript
interface WorkflowApi {
  // List workflows for a repository
  getWorkflows(owner: string, repo: string): Promise<Workflow[]>;

  // Get workflow runs
  getWorkflowRuns(
    owner: string,
    repo: string,
    options?: {
      workflowId?: number;
      perPage?: number;
      page?: number;
      status?: "completed" | "in_progress" | "queued";
    },
  ): Promise<WorkflowRun[]>;

  // Get workflow run details
  getWorkflowRunDetails(
    owner: string,
    repo: string,
    runId: number,
  ): Promise<WorkflowRun>;

  // Get workflow run logs
  getWorkflowRunLogs(
    owner: string,
    repo: string,
    runId: number,
  ): Promise<string>;

  // Get workflow jobs
  getWorkflowJobs(
    owner: string,
    repo: string,
    runId: number,
  ): Promise<WorkflowJob[]>;
}
```

##### Pull Request Operations

```typescript
interface PullRequestApi {
  // List pull requests
  getPullRequests(
    owner: string,
    repo: string,
    options?: {
      state?: "open" | "closed" | "all";
      perPage?: number;
      page?: number;
    },
  ): Promise<PullRequest[]>;

  // Get pull request details
  getPullRequest(
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<PullRequest>;

  // Get pull request diff
  getPullRequestDiff(
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<string>;

  // Create pull request review
  createPullRequestReview(
    owner: string,
    repo: string,
    prNumber: number,
    review: {
      body: string;
      event?: "APPROVE" | "REQUEST_CHANGES" | "COMMENT";
    },
  ): Promise<Review>;

  // Comment on pull request
  createPullRequestComment(
    owner: string,
    repo: string,
    prNumber: number,
    body: string,
  ): Promise<Comment>;
}
```

### Jules API Integration

#### Session Management

```typescript
interface JulesApi {
  // List sessions
  getSessions(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Session[]>;

  // Create session
  createSession(session: {
    prompt: string;
    repository?: string;
    branch?: string;
  }): Promise<Session>;

  // Get session details
  getSession(sessionId: string): Promise<Session>;

  // Get session activities
  getSessionActivities(
    sessionId: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<Activity[]>;

  // Approve session plan
  approveSessionPlan(sessionId: string, planId: string): Promise<void>;
}
```

### Custom Hooks API

#### useGithubApi Hook

```typescript
interface UseGithubApiReturn {
  // State
  isLoading: boolean;
  error: string | null;

  // Repository operations
  getUserRepos: (options?: RepoOptions) => Promise<Repository[]>;
  getRepoDetails: (owner: string, repo: string) => Promise<Repository>;
  searchRepositories: (query: string) => Promise<Repository[]>;

  // Workflow operations
  getWorkflows: (owner: string, repo: string) => Promise<Workflow[]>;
  getWorkflowRuns: (
    owner: string,
    repo: string,
    workflowId?: number,
  ) => Promise<WorkflowRun[]>;
  getWorkflowRunLogs: (
    owner: string,
    repo: string,
    runId: number,
  ) => Promise<string>;

  // Pull request operations
  getPullRequests: (owner: string, repo: string) => Promise<PullRequest[]>;
  getPullRequest: (
    owner: string,
    repo: string,
    prNumber: number,
  ) => Promise<PullRequest>;

  // URL parsing
  parseGithubUrl: (url: string) => GithubUrlData | null;
}
```

#### useRepositorySync Hook

```typescript
interface UseRepositorySyncReturn {
  // State
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;

  // Sync operations
  syncRepository: (owner: string, repo: string) => Promise<void>;
  syncAllRepositories: () => Promise<void>;
  startBackgroundSync: () => void;
  stopBackgroundSync: () => void;

  // Repository health
  checkRepositoryHealth: (
    owner: string,
    repo: string,
  ) => Promise<RepositoryHealth>;
}
```

#### useNotifications Hook

```typescript
interface UseNotificationsReturn {
  // State
  notifications: Notification[];
  unreadCount: number;
  isNotificationsEnabled: boolean;

  // Notification operations
  requestPermissions: () => Promise<boolean>;
  scheduleNotification: (notification: Notification) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;

  // Preferences
  setNotificationPreferences: (
    preferences: NotificationPreferences,
  ) => Promise<void>;
  getNotificationPreferences: () => Promise<NotificationPreferences>;
}
```

## Component Architecture

### Component Hierarchy

```
App
├── GithubProvider
│   ├── MainLayout
│   │   ├── TabNavigator
│   │   │   ├── RepositoriesTab
│   │   │   │   ├── RepositoryList
│   │   │   │   ├── RepositoryCard
│   │   │   │   └── RepositorySyncManager
│   │   │   ├── SessionsTab
│   │   │   │   ├── SessionList
│   │   │   │   ├── SessionCard
│   │   │   │   └── SessionCreator
│   │   │   ├── WorkflowsTab
│   │   │   │   ├── WorkflowDashboard
│   │   │   │   ├── WorkflowCard
│   │   │   │   └── WorkflowLogsViewer
│   │   │   └── SettingsTab
│   │   │       ├── GithubSettings
│   │   │       ├── NotificationSettings
│   │   │       └── PerformanceSettings
│   │   ├── SessionDetail
│   │   │   ├── SessionHeader
│   │   │   ├── ActivityList
│   │   │   └── ActivityItem
│   │   ├── GithubSessionCreator
│   │   │   ├── UrlInput
│   │   │   ├── RepositorySelector
│   │   │   └── BranchSelector
│   │   └── PullRequestAnalyzer
│   │       ├── PrList
│   │       ├── PrCard
│   │       └── AnalysisResults
│   └── NotificationsCenter
│       ├── NotificationList
│       ├── NotificationItem
│       └── NotificationSettings
```

### Component Patterns

#### 1. Container/Presentational Pattern

```typescript
// Container component (business logic)
const RepositoryListContainer: React.FC = () => {
  const { repositories, isLoading, error, refresh } = useGithubApi();

  return (
    <RepositoryListPresenter
      repositories={repositories}
      isLoading={isLoading}
      error={error}
      onRefresh={refresh}
    />
  );
};

// Presentational component (UI only)
const RepositoryListPresenter: React.FC<RepositoryListProps> = ({
  repositories,
  isLoading,
  error,
  onRefresh
}) => {
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={onRefresh} />;

  return (
    <FlatList
      data={repositories}
      renderItem={({ item }) => <RepositoryCard repository={item} />}
      onRefresh={onRefresh}
      refreshing={isLoading}
    />
  );
};
```

#### 2. Render Props Pattern

```typescript
// Component that provides data via render prop
const DataProvider: React.FC<DataProviderProps> = ({ children, fetchData }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData().then(setData).finally(() => setLoading(false));
  }, []);

  return children({ data, loading });
};

// Usage with render prop
<DataProvider fetchData={() => api.getRepositories()}>
  {({ data, loading }) => (
    <RepositoryList repositories={data} loading={loading} />
  )}
</DataProvider>
```

#### 3. Higher-Order Component Pattern

```typescript
// HOC for loading states
const withLoadingState = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P & { isLoading?: boolean }) => {
    if (props.isLoading) {
      return <LoadingSpinner />;
    }
    return <Component {...props} />;
  };
};

// Usage
const RepositoryListWithLoading = withLoadingState(RepositoryList);
```

### Custom Components

#### RepositoryCard Component

```typescript
interface RepositoryCardProps {
  repository: Repository;
  onPress?: (repository: Repository) => void;
  onSync?: (repository: Repository) => void;
  showSyncStatus?: boolean;
}

const RepositoryCard: React.FC<RepositoryCardProps> = ({
  repository,
  onPress,
  onSync,
  showSyncStatus = true
}) => {
  const { colors } = useTheme();
  const { isSyncing, lastSyncTime } = useRepositorySync();

  return (
    <Card style={styles.card} onPress={() => onPress?.(repository)}>
      <View style={styles.header}>
        <Text style={styles.title}>{repository.name}</Text>
        {showSyncStatus && (
          <SyncStatusIndicator
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
          />
        )}
      </View>

      {repository.description && (
        <Text style={styles.description} numberOfLines={2}>
          {repository.description}
        </Text>
      )}

      <View style={styles.meta}>
        <Text style={styles.language}>{repository.language}</Text>
        <Text style={styles.stars}>⭐ {repository.stargazers_count}</Text>
        <Text style={styles.forks}>🍴 {repository.forks_count}</Text>
      </View>

      {onSync && (
        <Button
          title="Sync Now"
          onPress={() => onSync(repository)}
          disabled={isSyncing}
        />
      )}
    </Card>
  );
};
```

#### WorkflowCard Component

```typescript
interface WorkflowCardProps {
  workflow: Workflow;
  onRun?: (workflow: Workflow) => void;
  onDetails?: (workflow: Workflow) => void;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({
  workflow,
  onRun,
  onDetails
}) => {
  const { colors } = useTheme();
  const { latestRun } = useWorkflowRuns(workflow.id);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{workflow.name}</Text>
        <WorkflowStatusBadge status={latestRun?.status} />
      </View>

      <Text style={styles.description}>
        {workflow.description || 'No description'}
      </Text>

      <View style={styles.actions}>
        <Button
          title="View Details"
          onPress={() => onDetails?.(workflow)}
        />
        {onRun && (
          <Button
            title="Run Workflow"
            onPress={() => onRun(workflow)}
            variant="primary"
          />
        )}
      </View>
    </Card>
  );
};
```

## State Management

### Context Architecture

#### GithubContext Provider

```typescript
interface GithubContextValue {
  // State
  isGithubConnected: boolean;
  repositories: Repository[];
  workflows: Workflow[];
  pullRequests: PullRequest[];

  // API Integration
  api: ReturnType<typeof useGithubApi>;

  // Webhook Integration
  webhooks: ReturnType<typeof useGithubWebhooks>;

  // Deep Linking
  deepLinking: ReturnType<typeof useGithubDeepLinking>;

  // Session Management
  session: ReturnType<typeof useGithubSession>;

  // Actions
  connectGithub: (token: string) => Promise<boolean>;
  disconnectGithub: () => void;
  refreshData: () => Promise<void>;
}

const GithubContext = createContext<GithubContextValue | undefined>(undefined);

export const GithubProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(githubReducer, initialState);

  const api = useGithubApi();
  const webhooks = useGithubWebhooks();
  const deepLinking = useGithubDeepLinking();
  const session = useGithubSession();

  const connectGithub = useCallback(async (token: string) => {
    const success = await api.authenticate(token);
    if (success) {
      dispatch({ type: 'CONNECT', payload: { token } });
    }
    return success;
  }, [api]);

  const disconnectGithub = useCallback(() => {
    dispatch({ type: 'DISCONNECT' });
  }, []);

  const value = {
    ...state,
    api,
    webhooks,
    deepLinking,
    session,
    connectGithub,
    disconnectGithub,
  };

  return (
    <GithubContext.Provider value={value}>
      {children}
    </GithubContext.Provider>
  );
};
```

### State Management Patterns

#### 1. Reducer Pattern

```typescript
type GithubAction =
  | { type: "CONNECT"; payload: { token: string } }
  | { type: "DISCONNECT" }
  | { type: "SET_REPOSITORIES"; payload: Repository[] }
  | { type: "SET_WORKFLOWS"; payload: Workflow[] }
  | { type: "SET_PULL_REQUESTS"; payload: PullRequest[] }
  | { type: "SET_ERROR"; payload: string };

const githubReducer = (
  state: GithubState,
  action: GithubAction,
): GithubState => {
  switch (action.type) {
    case "CONNECT":
      return { ...state, isGithubConnected: true, token: action.payload.token };
    case "DISCONNECT":
      return { ...state, isGithubConnected: false, token: null };
    case "SET_REPOSITORIES":
      return { ...state, repositories: action.payload };
    case "SET_WORKFLOWS":
      return { ...state, workflows: action.payload };
    case "SET_PULL_REQUESTS":
      return { ...state, pullRequests: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
};
```

#### 2. State Synchronization

```typescript
// Sync state between multiple sources
const useSynchronizedState = <T>(
  initialState: T,
  storageKey: string,
): [T, (value: T) => void] => {
  const [state, setState] = useState<T>(initialState);

  // Load from storage on mount
  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        const stored = await SecureStore.getItemAsync(storageKey);
        if (stored) {
          setState(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Failed to load state from storage:", error);
      }
    };

    loadFromStorage();
  }, [storageKey]);

  // Save to storage on change
  const setValue = useCallback(
    (value: T) => {
      setState(value);
      SecureStore.setItemAsync(storageKey, JSON.stringify(value));
    },
    [storageKey],
  );

  return [state, setValue];
};
```

#### 3. Derived State

```typescript
// Compute derived state from multiple sources
const useDerivedState = (repositories: Repository[], workflows: Workflow[]) => {
  const repositoryStats = useMemo(() => {
    return {
      total: repositories.length,
      public: repositories.filter(r => !r.private).length,
      private: repositories.filter(r => r.private).length,
      languages: Array.from(new Set(repositories.map(r => r.language))),
    };
  }, [repositories]);

  const workflowStats = useMemo(() => {
    return {
      total: workflows.length,
      active: workflows.filter(w => w.state === "active").length,
      disabled: workflows.filter(w => w.state === "disabled").length,
    };
  }, [workflows]);

  return {
    repositoryStats,
    workflowStats,
  };
};
```

## Testing Strategy

### Test Structure

```
__tests__/
├── unit/
│   ├── hooks/
│   │   ├── use-github-api.test.ts
│   │   ├── use-repository-sync.test.ts
│   │   ├── use-notifications.test.ts
│   │   └── use-pull-request-analysis.test.ts
│   ├── components/
│   │   ├── repository-card.test.tsx
│   │   ├── workflow-dashboard.test.tsx
│   │   └── github-session-creator.test.tsx
│   └── utils/
│       └── performance.test.ts
├── integration/
│   ├── github-api.test.ts
│   ├── workflow-integration.test.ts
│   └── session-integration.test.ts
├── e2e/
│   └── user-journeys.test.tsx
├── accessibility/
│   └── accessibility.test.tsx
└── security/
    └── security.test.ts
```

### Unit Testing

#### Hook Testing

```typescript
describe("useGithubApi", () => {
  let mockOctokit: jest.Mocked<Octokit>;

  beforeEach(() => {
    mockOctokit = {
      rest: {
        repos: {
          listForAuthenticatedUser: jest.fn(),
          get: jest.fn(),
        },
        actions: {
          listRepoWorkflows: jest.fn(),
          listWorkflowRuns: jest.fn(),
        },
      },
    } as any;

    // Mock the hook
    jest.mock("@/hooks/use-github-api", () => ({
      useGithubApi: () => ({
        getUserRepos: jest.fn(),
        getRepoDetails: jest.fn(),
        getWorkflows: jest.fn(),
        isLoading: false,
        error: null,
      }),
    }));
  });

  it("should fetch user repositories", async () => {
    const mockRepos = [{ id: 1, name: "test-repo" }];
    const { result } = renderHook(() => useGithubApi());

    const repos = await result.current.getUserRepos();

    expect(repos).toEqual(mockRepos);
  });

  it("should handle API errors gracefully", async () => {
    const { result } = renderHook(() => useGithubApi());

    await expect(result.current.getUserRepos()).rejects.toThrow();
    expect(result.current.error).toBeTruthy();
  });
});
```

#### Component Testing

```typescript
describe('RepositoryCard', () => {
  const mockRepository = {
    id: 1,
    name: 'test-repo',
    description: 'Test repository',
    language: 'TypeScript',
    stargazers_count: 100,
    forks_count: 50,
  };

  it('should render repository information', () => {
    const { getByText } = render(
      <RepositoryCard repository={mockRepository} />
    );

    expect(getByText('test-repo')).toBeTruthy();
    expect(getByText('Test repository')).toBeTruthy();
    expect(getByText('TypeScript')).toBeTruthy();
    expect(getByText('⭐ 100')).toBeTruthy();
  });

  it('should call onPress when card is pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <RepositoryCard repository={mockRepository} onPress={onPress} />
    );

    fireEvent.press(getByTestId('repository-card'));
    expect(onPress).toHaveBeenCalledWith(mockRepository);
  });
});
```

### Integration Testing

#### API Integration Tests

```typescript
describe("GitHub API Integration", () => {
  it("should handle real API responses", async () => {
    // Use real API with test token
    const api = new Octokit({ auth: process.env.TEST_GITHUB_TOKEN });

    const response = await api.rest.repos.get({
      owner: "test-org",
      repo: "test-repo",
    });

    expect(response.status).toBe(200);
    expect(response.data.name).toBe("test-repo");
  });

  it("should handle rate limiting", async () => {
    const api = new Octokit({ auth: process.env.TEST_GITHUB_TOKEN });

    // Make multiple requests to trigger rate limiting
    const promises = Array.from({ length: 100 }, () =>
      api.rest.repos.listForAuthenticatedUser(),
    );

    const results = await Promise.allSettled(promises);
    const rateLimited = results.filter(
      r => r.status === "rejected" && (r.reason as any)?.status === 403,
    );

    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

### End-to-End Testing

#### User Journey Tests

```typescript
describe("GitHub Integration User Journeys", () => {
  it("should complete repository selection to session creation", async () => {
    // Navigate to repositories tab
    await element(by.id("repositories-tab")).tap();

    // Wait for repositories to load
    await expect(element(by.id("repository-list"))).toBeVisible();

    // Select a repository
    await element(by.id("repository-card-1")).tap();

    // Navigate to session creation
    await element(by.id("create-session-button")).tap();

    // Fill session details
    await element(by.id("session-prompt-input")).typeText("Test session");
    await element(by.id("create-session-submit")).tap();

    // Verify session was created
    await expect(element(by.id("session-detail"))).toBeVisible();
  });

  it("should handle workflow monitoring", async () => {
    // Navigate to workflows tab
    await element(by.id("workflows-tab")).tap();

    // Select a workflow
    await element(by.id("workflow-card-1")).tap();

    // Start workflow run
    await element(by.id("run-workflow-button")).tap();

    // Monitor status updates
    await expect(element(by.id("workflow-status-running"))).toBeVisible();

    // Wait for completion
    await waitFor(element(by.id("workflow-status-completed")))
      .toBeVisible()
      .withTimeout(30000);
  });
});
```

### Performance Testing

#### Performance Benchmarks

```typescript
describe('Performance Tests', () => {
  it('should handle large repository lists efficiently', async () => {
    const startTime = performance.now();

    // Render 1000 repository cards
    const { rerender } = render(
      <FlatList
        data={mockRepositories.slice(0, 1000)}
        renderItem={({ item }) => <RepositoryCard repository={item} />}
        keyExtractor={(item) => item.id.toString()}
      />
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render in under 1 second
    expect(renderTime).toBeLessThan(1000);
  });

  it('should cache API responses effectively', async () => {
    const api = useGithubApi();

    // First call
    const startTime1 = performance.now();
    await api.getUserRepos();
    const endTime1 = performance.now();

    // Second call (should be cached)
    const startTime2 = performance.now();
    await api.getUserRepos();
    const endTime2 = performance.now();

    const firstCallTime = endTime1 - startTime1;
    const secondCallTime = endTime2 - startTime2;

    // Second call should be significantly faster
    expect(secondCallTime).toBeLessThan(firstCallTime * 0.5);
  });
});
```

## Performance Optimization

### Caching Strategy

#### Multi-Level Caching

```typescript
class CacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private maxMemorySize = 100;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, value: any, ttl: number = this.defaultTTL) {
    // Memory cache
    if (this.memoryCache.size >= this.maxMemorySize) {
      this.evictOldest();
    }

    this.memoryCache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });

    // Persistent cache for important data
    if (this.isImportantData(key)) {
      SecureStore.setItemAsync(
        `cache_${key}`,
        JSON.stringify({
          value,
          timestamp: Date.now(),
          ttl,
        }),
      );
    }
  }

  get(key: string): any | null {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.value;
    }

    // Check persistent cache
    const persistentEntry = this.getPersistentEntry(key);
    if (persistentEntry && !this.isExpired(persistentEntry)) {
      this.memoryCache.set(key, persistentEntry);
      return persistentEntry.value;
    }

    return null;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictOldest() {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }
}
```

### Memory Management

#### Memory Optimization

```typescript
class MemoryManager {
  private cleanupTasks: Array<() => void> = [];
  private memoryThreshold = 100 * 1024 * 1024; // 100MB

  registerCleanupTask(task: () => void) {
    this.cleanupTasks.push(task);
  }

  cleanup() {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error("Cleanup task failed:", error);
      }
    });

    this.cleanupTasks = [];
  }

  checkMemoryUsage() {
    if (this.getMemoryUsage() > this.memoryThreshold) {
      console.warn("High memory usage detected, triggering cleanup");
      this.cleanup();
    }
  }

  private getMemoryUsage(): number {
    // Implementation depends on platform
    // This is a simplified example
    return (performance as any).memory?.usedJSHeapSize || 0;
  }
}
```

### Network Optimization

#### Request Optimization

```typescript
class NetworkOptimizer {
  private requestQueue: Request[] = [];
  private isProcessing = false;
  private maxConcurrentRequests = 5;

  async queueRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        request,
        resolve,
        reject,
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const batch = this.requestQueue.splice(0, this.maxConcurrentRequests);

      await Promise.allSettled(
        batch.map(async ({ request, resolve, reject }) => {
          try {
            const result = await request();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }),
      );
    }

    this.isProcessing = false;
  }
}
```

### Rendering Optimization

#### Virtualization

```typescript
const OptimizedList = ({ data, renderItem, itemHeight }: OptimizedListProps) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const startIndex = Math.floor(offsetY / itemHeight);
    const endIndex = startIndex + Math.ceil(windowHeight / itemHeight) + 10;

    setVisibleRange({ start: startIndex, end: endIndex });
  }, [itemHeight]);

  const visibleData = useMemo(() => {
    return data.slice(visibleRange.start, visibleRange.end);
  }, [data, visibleRange]);

  return (
    <ScrollView onScroll={handleScroll} scrollEventThrottle={16}>
      <View style={{ height: data.length * itemHeight }}>
        {visibleData.map((item, index) => (
          <View
            key={item.id}
            style={{
              position: 'absolute',
              top: (visibleRange.start + index) * itemHeight,
              height: itemHeight,
              width: '100%',
            }}
          >
            {renderItem(item)}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};
```

## Security Best Practices

### Data Security

#### Secure Storage

```typescript
class SecureDataManager {
  private encryptionKey = "app-encryption-key";

  async storeSecurely(key: string, data: any): Promise<void> {
    try {
      // Encrypt data before storage
      const encryptedData = await this.encrypt(JSON.stringify(data));

      // Store in secure storage
      await SecureStore.setItemAsync(key, encryptedData);
    } catch (error) {
      console.error("Failed to store data securely:", error);
      throw new Error("Data storage failed");
    }
  }

  async retrieveSecurely(key: string): Promise<any> {
    try {
      const encryptedData = await SecureStore.getItemAsync(key);
      if (!encryptedData) {
        return null;
      }

      // Decrypt data
      const decryptedData = await this.decrypt(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error("Failed to retrieve data securely:", error);
      throw new Error("Data retrieval failed");
    }
  }

  private async encrypt(data: string): Promise<string> {
    // Implementation using crypto library
    return data; // Simplified for example
  }

  private async decrypt(data: string): Promise<string> {
    // Implementation using crypto library
    return data; // Simplified for example
  }
}
```

### Input Validation

#### Input Sanitization

```typescript
class InputValidator {
  static validateGithubUrl(url: string): boolean {
    const githubUrlPattern =
      /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+/;
    return githubUrlPattern.test(url);
  }

  static sanitizeRepositoryName(name: string): string {
    // Remove special characters and limit length
    return name.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100);
  }

  static validateToken(token: string): boolean {
    // Basic token format validation
    const tokenPattern = /^[a-zA-Z0-9]{40}$/;
    return tokenPattern.test(token);
  }

  static sanitizeHtml(content: string): string {
    // Remove potentially dangerous HTML
    return content.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      "",
    );
  }
}
```

### API Security

#### Rate Limiting

```typescript
class ApiRateLimiter {
  private requestCounts = new Map<string, number[]>();
  private maxRequests = 100;
  private timeWindow = 60000; // 1 minute

  async checkRateLimit(identifier: string): Promise<boolean> {
    const now = Date.now();
    const counts = this.requestCounts.get(identifier) || [];

    // Remove old timestamps
    const recentCounts = counts.filter(
      timestamp => now - timestamp < this.timeWindow,
    );

    if (recentCounts.length >= this.maxRequests) {
      return false; // Rate limit exceeded
    }

    // Add current request
    recentCounts.push(now);
    this.requestCounts.set(identifier, recentCounts);

    return true;
  }

  async executeWithRateLimit<T>(
    identifier: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    if (!(await this.checkRateLimit(identifier))) {
      throw new Error("Rate limit exceeded");
    }

    return operation();
  }
}
```

### Error Handling

#### Secure Error Handling

```typescript
class SecureErrorHandler {
  static handleApiError(error: any): void {
    // Don't expose sensitive information in error messages
    if (error.response?.status === 401) {
      throw new Error("Authentication failed");
    } else if (error.response?.status === 403) {
      throw new Error("Access denied");
    } else if (error.response?.status >= 500) {
      throw new Error("Server error occurred");
    } else {
      throw new Error("An error occurred");
    }
  }

  static logError(error: Error, context?: string): void {
    // Log errors securely without exposing sensitive data
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId(),
    };

    // Send to secure logging service
    this.sendToLoggingService(errorInfo);
  }

  private static getCurrentUserId(): string | null {
    // Implementation to get current user ID
    return null;
  }

  private static async sendToLoggingService(errorInfo: any): Promise<void> {
    // Implementation to send to secure logging service
  }
}
```

## Deployment Guide

### Environment Setup

#### Development Environment

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.development
# Edit .env.development with your API keys

# Start development server
bun start
```

#### Production Environment

```bash
# Install production dependencies
bun install --production

# Set up production environment variables
cp .env.example .env.production
# Edit .env.production with production API keys

# Build for production
bun build:android
bun build:ios
```

### Build Configuration

#### EAS Build Configuration

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m1-medium"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### CI/CD Pipeline

#### GitHub Actions Workflow

```yaml
name: Build and Deploy
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - run: bun install
      - run: bun test
      - run: bun lint
      - run: bun typecheck

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - run: bun install
      - run: bun build:android
      - run: bun build:ios
      - uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: build/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: build-artifacts
          path: build/
      - name: Deploy to stores
        run: |
          # Deployment logic here
```

### Monitoring and Analytics

#### Performance Monitoring

```typescript
class AppMonitor {
  private metrics: MetricsCollector;

  constructor() {
    this.metrics = new MetricsCollector();
  }

  trackPageView(pageName: string) {
    this.metrics.increment("page_views", { page: pageName });
  }

  trackApiCall(endpoint: string, duration: number, success: boolean) {
    this.metrics.histogram("api_duration", duration, { endpoint });
    this.metrics.increment("api_calls", {
      endpoint,
      success: success.toString(),
    });
  }

  trackError(error: Error, context: string) {
    this.metrics.increment("errors", {
      error_type: error.constructor.name,
      context,
    });
  }

  trackUserAction(action: string, properties?: Record<string, any>) {
    this.metrics.increment("user_actions", { action, ...properties });
  }
}
```

## Contributing Guidelines

### Code Style

#### TypeScript Guidelines

```typescript
// Use strict typing
interface Repository {
  id: number;
  name: string;
  description?: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  private: boolean;
}

// Use proper error handling
const fetchRepository = async (
  owner: string,
  repo: string,
): Promise<Repository> => {
  try {
    const response = await octokit.rest.repos.get({ owner, repo });
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new RepositoryError(`Failed to fetch repository: ${error.message}`);
    }
    throw new RepositoryError("Unknown error occurred");
  }
};

// Use memoization for expensive calculations
const useExpensiveCalculation = (data: Data[]) => {
  return useMemo(() => {
    return data.reduce((acc, item) => {
      // Expensive calculation
      return acc + item.value * Math.random();
    }, 0);
  }, [data]);
};
```

#### Component Guidelines

```typescript
// Use functional components with TypeScript
interface Props {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
}

const Button: React.FC<Props> = ({ title, onPress, disabled = false }) => {
  const handlePress = useCallback(() => {
    if (!disabled && onPress) {
      onPress();
    }
  }, [onPress, disabled]);

  return (
    <TouchableOpacity onPress={handlePress} disabled={disabled}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
};

// Use proper prop validation
Button.propTypes = {
  title: PropTypes.string.isRequired,
  onPress: PropTypes.func,
  disabled: PropTypes.bool,
};
```

### Testing Guidelines

#### Test Structure

```typescript
// Group related tests
describe("Github Integration", () => {
  // Setup and teardown
  beforeEach(() => {
    // Setup code
  });

  afterEach(() => {
    // Cleanup code
  });

  // Test suites for different features
  describe("Repository Operations", () => {
    it("should fetch repositories successfully", async () => {
      // Test implementation
    });

    it("should handle authentication errors", async () => {
      // Test implementation
    });
  });

  describe("Workflow Operations", () => {
    // Workflow tests
  });
});
```

#### Mocking Guidelines

```typescript
// Mock external dependencies
jest.mock("@octokit/rest", () => {
  return {
    Octokit: jest.fn().mockImplementation(() => ({
      rest: {
        repos: {
          listForAuthenticatedUser: jest.fn(),
          get: jest.fn(),
        },
      },
    })),
  };
});

// Mock hooks
jest.mock("@/hooks/use-github-api", () => ({
  useGithubApi: () => ({
    getUserRepos: jest.fn(),
    getRepoDetails: jest.fn(),
    isLoading: false,
    error: null,
  }),
}));
```

### Pull Request Guidelines

#### PR Template

```markdown
## Summary

Brief description of changes made.

## Test plan

- [ ] All tests pass
- [ ] New functionality tested
- [ ] Edge cases covered
- [ ] Performance impact assessed

## Documentation

- [ ] Code comments added where needed
- [ ] Documentation updated
- [ ] Changelog entry added

## Breaking Changes

- [ ] No breaking changes
- [ ] Breaking changes documented
```

### Code Review Process

#### Review Checklist

- [ ] Code follows TypeScript and React best practices
- [ ] Tests are comprehensive and passing
- [ ] Performance impact is minimal
- [ ] Security considerations are addressed
- [ ] Documentation is updated
- [ ] No breaking changes or properly documented

#### Review Guidelines

1. **Functionality**: Does the code work as intended?
2. **Quality**: Is the code clean, readable, and maintainable?
3. **Testing**: Are tests comprehensive and do they pass?
4. **Performance**: Does the code perform well?
5. **Security**: Are security best practices followed?
6. **Documentation**: Is the code properly documented?

---

**Last Updated**: January 2026
**Version**: 1.0.0
**Maintainer**: Jules Mobile Client Team

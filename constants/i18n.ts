/**
 * 多言語対応 (i18n) - 日本語 / 英語
 */

type TranslationKey = keyof typeof translations.ja;

const translations = {
  ja: {
    // Common
    loading: "読み込み中...",
    error: "エラー",
    save: "保存する",
    cancel: "キャンセル",
    close: "閉じる",
    refresh: "更新",

    // Sessions
    sessions: "セッション",
    sessionsTitle: "Jules Client",
    noSessions: "まだセッションがないよ",
    noSessionsHint: "右下のボタンから新しいタスクを作ろう！",
    noApiKey: "APIキーが設定されていないよ",
    noApiKeyHint: "Settingsタブでキーを入力してね！",

    // Session Detail
    noActivities: "アクティビティがないよ",
    replyPlaceholder: "Julesに返信...",
    planSummary: "Plan Summary",
    toolLabel: "Tool",
    outputLabel: "Output",
    detailedInfo: "Detailed Info",
    hide: "Hide",

    // Settings
    settings: "設定",
    apiKeyLabel: "Jules API Key",
    apiKeyPlaceholder: "AIzaSy...",
    apiKeyHint:
      "Google Cloud Console または Jules Settings で取得したキーを入力してね。",
    darkMode: "ダークモード",
    savedSuccess: "APIキーをセキュアに保存したよ！",
    savedError: "保存に失敗しちゃった...",
    securityHint:
      "APIキーはexpo-secure-storeでセキュアに保存されるよ。でも、他人と共有するデバイスでは気をつけてね！",
    hint: "ヒント",
    github_tokenlabel: "Github Token",
    github_tokenhint: "Enter the key from Github Settings.",

    // Create Session
    newTask: "新規タスク",
    selectRepo: "1. リポジトリを選んでね (Source)",
    selectPlaceholder: "タップして選択...",
    noSourcesFound:
      "ソースが見つからないよ。GitHub Appのインストールが必要かも。",
    promptLabel: "2. Julesへのお願い (Prompt)",
    promptPlaceholder: "例: mainブランチのバグを直して！新しい機能を追加して！",
    startSession: "セッションを開始する",
    inputError: "リポジトリを選んで、依頼内容を書いてね！",
    createSuccess: "セッションを作成したよ！",
    processing: "処理中...",
    createGithubSession: "Create GitHub Session",
    // Session States
    stateActive: "処理中",
    stateCompleted: "完了",
    stateFailed: "失敗",
    stateUnknown: "作成中",

    // Licenses
    licenses: "オープンソースライセンス",
    licensesDescription:
      "このアプリは以下のオープンソースライブラリを使用しています。各ライブラリをタップするとGitHubリポジトリを開きます。",

    // API Errors
    apiKeyNotSet: "APIキーが設定されていないよ！設定画面で入力してね。",
    apiError: "APIエラー",
    fetchSourcesFailed: "ソースの取得に失敗したよ",
    fetchSessionsFailed: "セッションの取得に失敗したよ",
    fetchActivitiesFailed: "チャット履歴が見れなかったよ...",
    approvePlanFailed: "プランの承認に失敗したよ",
    createSessionFailed: "セッションが作れなかったよ",
    loadingMore: "さらに読み込み中...",

    repos: " リポジトリ",

    // GitHub Session Creator
    enterGithubUrl: "GitHub URLを入力してね",
    enterGithubUrlDescription: "解析したいリポジトリのURLを入力してください。",
    invalidGithubUrl: "無効なGitHub URLだよ",
    failedToLoadRepository: "リポジトリの読み込みに失敗したよ",
    enterPrompt: "プロンプトを入力してね",
    noRepositorySelected: "リポジトリが選択されていないよ",
    success: "成功",
    sessionCreatedSuccessfully: "セッションを作成したよ！",
    failedToCreateSession: "セッションの作成に失敗したよ",
    pasteUrlFromClipboard: "クリップボードからURLを貼り付けました",
    info: "情報",
    next: "次へ",
    back: "戻る",
    selectTemplate: "テンプレートを選択",
    selectTemplateDescription: "タスクに最適なテンプレートを選んでください。",
    customizePrompt: "プロンプトをカスタマイズ",
    customizePromptDescription: "Julesへの指示を詳しく教えてください。",
    enterYourPrompt: "ここに指示を入力...",
    branch: "ブランチ",
    confirmSession: "セッションを確認",
    confirmSessionDescription: "以下の内容でセッションを開始しますか？",
    repository: "リポジトリ",
    prompt: "プロンプト",
    creating: "作成中...",
    createSession: "セッションを作成",

    // GitHub URL Handler
    noValidGithubUrl: "有効なGitHub URLが見つからないよ",
    confirmLaunch: "セッションを開始しますか？",
    launch: "開始",
    urlCopiedToClipboard: "URLをクリップボードにコピーしたよ",
    pullRequest: "プルリクエスト",
    issue: "イシュー",
    workflow: "ワークフロー",
    githubUrlDetected: "GitHub URLを検出したよ",
    whatWouldYouLikeToDo: "何をしたいですか？",
    launchJulesSession: "Julesセッションを開始",
    openInBrowser: "ブラウザで開く",
    copyUrl: "URLをコピー",
    repositoryContext: "リポジトリコンテキスト",
    repositoryContextDescription:
      "このリポジトリで新しいセッションを開始します。",
    pullRequestContext: "プルリクエストコンテキスト",
    pullRequestContextDescription: "このプルリクエストを分析します。",
    workflowContext: "ワークフローコンテキスト",
    workflowContextDescription: "このワークフロー実行を確認します。",
    noGithubUrl: "GitHub URLなし",
    received: "受信済み",
    setupInstructions: "セットアップ手順",
    webhookSetupInstructions:
      "GitHubリポジリの設定で、ペイロードURLをこのアプリのエンドポイントに、コンテンツタイプをapplication/jsonに設定し、シークレットを入力してください。",
    enterWebhookSecret: "Webhookシークレットを入力してください",
    webhookSecretUpdated: "Webhookシークレットを更新しました",
    webhookTestProcessed: "テストWebhookを処理しました",
    webhookManagement: "Webhook管理",
    webhookManagementDescription: "リポジトリのリアルタイム更新を管理します。",
    webhookStatus: "Webhook状態",
    enabled: "有効",
    disabled: "無効",
    webhookConfiguration: "Webhook設定",
    webhookSecret: "Webhookシークレット",
    updateSecret: "シークレットを更新",
    testWebhook: "Webhookをテスト",
    trackedEvents: "追跡イベント",
    pushEvents: "プッシュイベント",
    pullRequestEvents: "プルリクエストイベント",
    workflowEvents: "ワークフローイベント",
    repositoryEvents: "リポジトリイベント",
    recentEvents: "最近のイベント",
  },
  en: {
    // Common
    loading: "Loading...",
    error: "Error",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    refresh: "Refresh",

    // Sessions
    sessions: "Sessions",
    sessionsTitle: "Jules Client",
    noSessions: "No sessions yet",
    noSessionsHint: "Tap the button below to create a new task!",
    noApiKey: "API key not set",
    noApiKeyHint: "Enter your key in Settings tab!",
    createGithubSession: "Create GitHub Session",

    // Session Detail
    noActivities: "No activities",
    replyPlaceholder: "Reply to Jules...",
    planSummary: "Plan Summary",
    toolLabel: "Tool",
    outputLabel: "Output",
    detailedInfo: "Detailed Info",
    hide: "Hide",

    // Settings
    settings: "Settings",
    apiKeyLabel: "Jules API Key",
    apiKeyPlaceholder: "AIzaSy...",
    apiKeyHint: "Enter the key from Google Cloud Console or Jules Settings.",
    darkMode: "Dark Mode",
    savedSuccess: "API key saved securely!",
    savedError: "Failed to save...",
    securityHint:
      "API key is stored securely with expo-secure-store. Be careful on shared devices!",
    hint: "Hint",
    github_tokenlabel: "Github Token",
    github_tokenhint: "Enter the key from Github Settings.",

    // Create Session
    newTask: "New Task",
    selectRepo: "1. Select Repository (Source)",
    selectPlaceholder: "Tap to select...",
    noSourcesFound: "No sources found. You may need to install the GitHub App.",
    promptLabel: "2. Your Request (Prompt)",
    promptPlaceholder: "e.g., Fix the bug in main branch! Add new features!",
    startSession: "Start Session",
    inputError: "Please select a repository and enter your request!",
    createSuccess: "Session created!",
    processing: "Processing...",

    // Session States
    stateActive: "Processing",
    stateCompleted: "Completed",
    stateFailed: "Failed",
    stateUnknown: "Creating",

    // Licenses
    licenses: "Open Source Licenses",
    licensesDescription:
      "This app uses the following open source libraries. Tap each library to open its GitHub repository.",

    // API Errors
    apiKeyNotSet: "API key not set! Enter it in Settings.",
    apiError: "API Error",
    fetchSourcesFailed: "Failed to fetch sources",
    fetchSessionsFailed: "Failed to fetch sessions",
    fetchActivitiesFailed: "Failed to fetch chat history...",
    approvePlanFailed: "Failed to approve plan",
    createSessionFailed: "Failed to create session",
    loadingMore: "Loading more...",

    repos: " Repositories",

    // GitHub Session Creator
    enterGithubUrl: "Enter GitHub URL",
    enterGithubUrlDescription:
      "Please enter the URL of the repository you want to analyze.",
    invalidGithubUrl: "Invalid GitHub URL",
    failedToLoadRepository: "Failed to load repository",
    enterPrompt: "Enter prompt",
    noRepositorySelected: "No repository selected",
    success: "Success",
    sessionCreatedSuccessfully: "Session created successfully!",
    failedToCreateSession: "Failed to create session",
    pasteUrlFromClipboard: "Pasted URL from clipboard",
    info: "Info",
    next: "Next",
    back: "Back",
    selectTemplate: "Select Template",
    selectTemplateDescription: "Choose a template that best fits your task.",
    customizePrompt: "Customize Prompt",
    customizePromptDescription: "Provide detailed instructions for Jules.",
    enterYourPrompt: "Enter your instructions here...",
    branch: "Branch",
    confirmSession: "Confirm Session",
    confirmSessionDescription:
      "Do you want to start a session with these details?",
    repository: "Repository",
    prompt: "Prompt",
    creating: "Creating...",
    createSession: "Create Session",

    // GitHub URL Handler
    noValidGithubUrl: "No valid GitHub URL found",
    confirmLaunch: "Do you want to start a session?",
    launch: "Launch",
    urlCopiedToClipboard: "URL copied to clipboard",
    pullRequest: "Pull Request",
    issue: "Issue",
    workflow: "Workflow",
    githubUrlDetected: "GitHub URL Detected",
    whatWouldYouLikeToDo: "What would you like to do?",
    launchJulesSession: "Launch Jules Session",
    openInBrowser: "Open in Browser",
    copyUrl: "Copy URL",
    repositoryContext: "Repository Context",
    repositoryContextDescription: "Start a new session with this repository.",
    pullRequestContext: "Pull Request Context",
    pullRequestContextDescription: "Analyze this pull request.",
    workflowContext: "Workflow Context",
    workflowContextDescription: "Review this workflow run.",
    noGithubUrl: "No GitHub URL",
    noGithubUrlDescription: "No valid GitHub URL found in clipboard.",
    received: "Received",
    setupInstructions: "Setup Instructions",
    webhookSetupInstructions:
      "In your GitHub repository settings, set the Payload URL to this app's endpoint, content type to application/json, and enter the secret.",
    enterWebhookSecret: "Please enter a webhook secret",
    webhookSecretUpdated: "Webhook secret updated successfully",
    webhookTestProcessed: "Test webhook processed",
    webhookManagement: "Webhook Management",
    webhookManagementDescription:
      "Manage real-time updates for your repositories.",
    webhookStatus: "Webhook Status",
    enabled: "Enabled",
    disabled: "Disabled",
    webhookConfiguration: "Webhook Configuration",
    webhookSecret: "Webhook Secret",
    updateSecret: "Update Secret",
    testWebhook: "Test Webhook",
    trackedEvents: "Tracked Events",
    pushEvents: "Push Events",
    pullRequestEvents: "Pull Request Events",
    workflowEvents: "Workflow Events",
    repositoryEvents: "Repository Events",
    recentEvents: "Recent Events",
  },
};

export type Language = "ja" | "en";

let currentLanguage: Language = "ja";

export function setLanguage(lang: Language) {
  currentLanguage = lang;
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function t(
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  let translation =
    translations[currentLanguage][key] || translations.en[key] || key;

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      translation = translation.replace(`{${k}}`, String(v));
    });
  }

  return translation;
}

export { translations };

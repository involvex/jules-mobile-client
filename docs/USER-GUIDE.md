# Jules Mobile Client - User Guide

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [GitHub Integration](#github-integration)
- [Core Features](#core-features)
- [Session Management](#session-management)
- [Settings & Configuration](#settings--configuration)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

## Overview

The Jules Mobile Client is a powerful React Native application that provides seamless integration with Google's Jules AI coding assistant and GitHub. It enables developers to manage coding sessions, monitor GitHub repositories, analyze pull requests, and receive real-time notifications - all from their mobile devices.

### Key Features

- **Jules AI Integration**: Create and manage AI-powered coding sessions
- **GitHub Integration**: Full GitHub repository management and monitoring
- **Real-time Notifications**: Stay updated with repository events and workflow status
- **Pull Request Analysis**: AI-powered code review and analysis
- **Repository Synchronization**: Automatic sync with intelligent caching
- **Cross-platform**: Works on iOS and Android with dark/light theme support

## Getting Started

### Installation

1. **Download the App**
   - iOS: Available on the App Store
   - Android: Available on Google Play Store
   - Web: Accessible via browser at [app.jules.dev](https://app.jules.dev)

2. **Initial Setup**
   - Open the app and grant necessary permissions
   - Navigate to Settings to configure your API keys
   - Set up GitHub integration if desired

### Prerequisites

- **Jules API Key**: Required for AI coding assistant features
  - Obtain from [Google Cloud Console](https://console.cloud.google.com/)
  - Or from your Jules account settings
- **GitHub Token** (Optional): Required for GitHub integration
  - Generate from [GitHub Settings](https://github.com/settings/tokens)
  - Recommended scopes: `repo`, `workflow`, `admin:repo_hook`, `read:org`

## GitHub Integration

### Setting Up GitHub Integration

1. **Navigate to Settings**
   - Open the app and go to the Settings tab
   - Scroll to the GitHub section

2. **Enter GitHub Token**
   - Paste your GitHub personal access token
   - Ensure the token has the required scopes
   - Save the configuration

3. **Verify Connection**
   - The app will validate your token
   - You'll see a success message if authentication works
   - Your repositories will appear in the Repositories tab

### GitHub Features Overview

#### Repository Management

- **Browse Repositories**: View all your repositories in one place
- **Repository Details**: Access README, languages, contributors, and more
- **Search Repositories**: Find repositories by name or description
- **Repository Sync**: Automatic synchronization with configurable intervals

#### Session Creation from GitHub

- **URL-based Sessions**: Create sessions directly from GitHub URLs
- **Repository Context**: Sessions include repository metadata and context
- **Branch Selection**: Choose specific branches for your coding sessions
- **Smart Templates**: Repository-specific prompt templates

#### Workflow Monitoring

- **Workflow Dashboard**: Monitor GitHub Actions workflows in real-time
- **Run History**: View complete workflow run history
- **Log Viewing**: Access detailed workflow execution logs
- **Status Updates**: Real-time status changes and notifications

#### Pull Request Analysis

- **PR Listing**: View all pull requests across your repositories
- **AI Analysis**: Get AI-powered code review and suggestions
- **Metrics**: View complexity scores and review time estimates
- **Review Workflow**: Approve, comment, and manage PR reviews

#### Notifications System

- **Real-time Alerts**: Push notifications for repository events
- **Customizable Preferences**: Configure notification types and timing
- **Notification History**: View and manage all notifications
- **Smart Filtering**: Filter notifications by repository and event type

### Deep Linking with GitHub

The app supports deep linking for seamless GitHub integration:

#### Supported URL Formats

- Repository URLs: `https://github.com/user/repo`
- Pull Request URLs: `https://github.com/user/repo/pull/123`
- Issue URLs: `https://github.com/user/repo/issues/456`
- Workflow URLs: `https://github.com/user/repo/actions/runs/789`

#### Using Deep Links

1. Copy any GitHub URL
2. Open the Jules Mobile Client
3. Use "Create Session from URL" feature
4. The app will parse the URL and create an appropriate session

## Core Features

### Jules AI Sessions

#### Creating a New Session

1. Navigate to the Sessions tab
2. Tap the "+" button to create a new session
3. Enter your task description
4. Optionally select a repository context
5. Choose a branch if working with a specific repository
6. Tap "Create Session" to start

#### Session Management

- **View Active Sessions**: See all ongoing coding sessions
- **Session Details**: View complete chat history and progress
- **Approve Plans**: Review and approve AI-generated implementation plans
- **Session Completion**: Mark sessions as completed when finished

#### Session Features

- **Real-time Chat**: Live interaction with Jules AI
- **Markdown Support**: Rich text formatting with syntax highlighting
- **Code Blocks**: View and interact with generated code
- **Activity History**: Complete session timeline

### Repository Synchronization

#### Automatic Sync

- **Background Sync**: Automatic synchronization every 5 minutes (configurable)
- **Smart Caching**: Intelligent cache invalidation based on repository changes
- **Offline Support**: Full functionality without internet connection
- **Conflict Resolution**: Automatic handling of local vs remote changes

#### Manual Sync

- **Sync Now**: Trigger immediate synchronization
- **Sync Status**: View current sync status and last sync time
- **Health Checks**: Monitor repository accessibility and health

### Notifications

#### Notification Types

- **Workflow Events**: Workflow run completions, failures, and status changes
- **Pull Request Events**: New PRs, comments, reviews, and merges
- **Repository Events**: Push events, issues, and repository changes
- **System Events**: App updates, sync completions, and errors

#### Notification Preferences

- **Event Filtering**: Choose which events trigger notifications
- **Quiet Hours**: Set time periods when notifications are disabled
- **Push vs Local**: Configure push notifications vs local notifications
- **Repository Filtering**: Enable/disable notifications per repository

## Session Management

### Creating Sessions

#### From Scratch

1. Go to Sessions tab
2. Tap "+" button
3. Enter task description
4. Configure session settings
5. Start the session

#### From GitHub Context

1. Navigate to Repositories tab
2. Select a repository
3. Choose a branch
4. Enter task description
5. Create session with repository context

#### From URL

1. Copy a GitHub URL
2. Use "Create Session from URL" feature
3. The app parses the URL and creates context
4. Review and confirm session creation

### Session Lifecycle

#### Session States

- **Creating**: Session is being initialized
- **Active**: Session is running and interactive
- **Waiting for Approval**: AI has generated a plan awaiting approval
- **Completed**: Session has finished successfully
- **Failed**: Session encountered an error

#### Session Actions

- **Approve Plan**: Confirm AI-generated implementation plan
- **View Progress**: Monitor session progress and activities
- **Complete Session**: Mark session as finished
- **Delete Session**: Remove session from history

### Session Context

#### Repository Context

When creating sessions with repository context:

- Repository metadata is included in the session
- AI has access to repository structure and files
- Branch-specific context is maintained
- Relevant files and directories are considered

#### Branch Management

- **Branch Selection**: Choose specific branches for sessions
- **Branch Switching**: Change branches during session creation
- **Branch Information**: View branch details and recent commits

## Settings & Configuration

### API Configuration

#### Jules API Key

- **Required**: Yes, for all AI features
- **Storage**: Securely stored using Expo Secure Store
- **Validation**: Automatically validated on save
- **Error Handling**: Clear error messages for invalid keys

#### GitHub Token

- **Required**: Optional, for GitHub integration features
- **Scopes**: `repo`, `workflow`, `admin:repo_hook`, `read:org`
- **Validation**: Token permissions are verified
- **Security**: Encrypted storage with proper access controls

### App Preferences

#### Theme Settings

- **Dark/Light Mode**: System preference or manual selection
- **Theme Colors**: Customizable color schemes
- **Font Size**: Adjustable text sizes for accessibility
- **High Contrast**: Support for high contrast accessibility mode

#### Performance Settings

- **Sync Intervals**: Configure repository sync frequency
- **Cache Management**: Control cache size and behavior
- **Background Sync**: Enable/disable background synchronization
- **Data Usage**: Optimize for performance vs data usage

#### Notification Settings

- **Push Notifications**: Enable/disable push notifications
- **Notification Sounds**: Configure notification sounds
- **Vibration**: Enable/disable notification vibration
- **Badge Count**: Show notification count on app icon

### GitHub Integration Settings

#### Repository Preferences

- **Auto-sync**: Enable automatic repository synchronization
- **Sync Frequency**: Configure sync intervals (1-60 minutes)
- **Offline Mode**: Enable offline repository access
- **Repository Filters**: Choose which repositories to sync

#### Workflow Preferences

- **Auto-monitor**: Enable automatic workflow monitoring
- **Log Retention**: Configure how long to keep workflow logs
- **Status Updates**: Real-time vs periodic status updates
- **Failure Alerts**: Configure alerts for workflow failures

#### PR Analysis Settings

- **Auto-analysis**: Enable automatic PR analysis
- **Analysis Depth**: Configure analysis thoroughness
- **Review Integration**: Enable GitHub review workflow integration
- **Comment Templates**: Customize review comment templates

## Troubleshooting

### Common Issues

#### Authentication Problems

**Issue**: "Invalid API Key" or "Authentication Failed"
**Solutions**:

1. Verify your Jules API key is correct
2. Check if the key has expired
3. Ensure proper permissions for GitHub token
4. Try regenerating the API key

#### Sync Issues

**Issue**: Repository data not updating
**Solutions**:

1. Check internet connection
2. Verify GitHub token permissions
3. Try manual sync from repository settings
4. Check sync interval settings

#### Notification Problems

**Issue**: Not receiving notifications
**Solutions**:

1. Check notification permissions in app settings
2. Verify push notification settings
3. Check quiet hours configuration
4. Ensure device is online

#### Performance Issues

**Issue**: App running slowly or freezing
**Solutions**:

1. Clear app cache and data
2. Restart the app
3. Check available device storage
4. Update to latest app version

### Error Recovery

#### Network Errors

- **Offline Mode**: App continues to work with cached data
- **Auto-retry**: Failed operations are automatically retried
- **Error Messages**: Clear error messages with recovery suggestions
- **Connection Status**: Visual indicators for connection status

#### Sync Conflicts

- **Automatic Resolution**: Most conflicts are resolved automatically
- **Manual Override**: Option to force sync or keep local changes
- **Conflict History**: View and manage sync conflicts
- **Backup**: Local backups before major sync operations

#### App Crashes

- **Error Reporting**: Automatic error reporting for debugging
- **Crash Recovery**: App attempts to recover from crashes
- **Safe Mode**: Option to run in safe mode with minimal features
- **Reset Options**: Reset app settings or clear all data

### Getting Help

#### In-App Support

- **Help Center**: Access help documentation from Settings
- **Feedback**: Submit feedback directly from the app
- **Bug Reports**: Report bugs with automatic error details

#### Online Resources

- **Documentation**: Comprehensive documentation at docs.jules.dev
- **Community**: Join the community forum for support
- **GitHub Issues**: Report issues on the GitHub repository
- **Email Support**: Contact support@jules.dev

## FAQ

### General Questions

**Q: Is the Jules Mobile Client free?**
A: Yes, the basic version is free. Some advanced features may require a subscription.

**Q: Do I need a Jules account to use the app?**
A: Yes, you need a Jules API key which requires a Jules account.

**Q: Is my data secure?**
A: Yes, all sensitive data is encrypted and stored securely using industry-standard practices.

**Q: Can I use the app without GitHub integration?**
A: Yes, GitHub integration is optional. You can use all Jules AI features without GitHub.

### GitHub Integration

**Q: What GitHub permissions does the app need?**
A: The app requires `repo`, `workflow`, `admin:repo_hook`, and `read:org` scopes for full functionality.

**Q: Can I revoke the GitHub token?**
A: Yes, you can revoke the token from GitHub settings and remove it from the app.

**Q: How often does the app sync with GitHub?**
A: By default, every 5 minutes, but this is configurable from 1-60 minutes.

**Q: Does the app work with GitHub Enterprise?**
A: Currently, only GitHub.com is supported. GitHub Enterprise support is planned for future releases.

### Session Management

**Q: How many sessions can I have active at once?**
A: You can have multiple sessions active simultaneously, limited only by your Jules account plan.

**Q: Can I export session data?**
A: Yes, you can export session chat history and code blocks.

**Q: What happens if I lose internet connection during a session?**
A: The session continues locally and syncs when connection is restored.

**Q: Can I share sessions with team members?**
A: Session sharing is not currently available but is planned for future releases.

### Performance and Storage

**Q: How much storage does the app use?**
A: Storage usage depends on the number of repositories and sessions. Typically 50-200MB for active users.

**Q: Can I clear app cache without losing data?**
A: Yes, clearing cache only removes temporary files, not your sessions or settings.

**Q: Does the app work offline?**
A: Yes, most features work offline with cached data. Real-time features require internet connection.

**Q: How can I improve app performance?**
A: Try clearing cache, reducing sync frequency, or updating to the latest version.

### Notifications

**Q: Can I customize notification sounds?**
A: Yes, notification sounds can be customized in the app settings.

**Q: Why am I not receiving push notifications?**
A: Check notification permissions, internet connection, and push notification settings.

**Q: Can I filter notifications by repository?**
A: Yes, you can enable/disable notifications for specific repositories.

**Q: Do notifications work when the app is closed?**
A: Yes, push notifications work even when the app is not running.

## Support and Feedback

### Contact Information

- **Email**: support@jules.dev
- **Website**: [jules.dev](https://jules.dev)
- **GitHub**: [github.com/jules-mobile-client](https://github.com/jules-mobile-client)
- **Documentation**: [docs.jules.dev](https://docs.jules.dev)

### Community

- **Forum**: [community.jules.dev](https://community.jules.dev)
- **Discord**: Join our Discord server for real-time support
- **Twitter**: Follow [@julesmobile](https://twitter.com/julesmobile) for updates

### Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to contribute to the project.

---

**Last Updated**: January 2026
**Version**: 1.0.0
**Compatibility**: iOS 14+, Android 8.0+, Web (modern browsers)

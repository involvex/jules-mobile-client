# GitHub Integration

This document describes the GitHub integration features in the Jules Mobile Client.

## Overview

The GitHub integration provides seamless connectivity between the Jules Mobile Client and GitHub repositories, enabling users to:

- Browse and manage GitHub repositories
- Create sessions directly from GitHub URLs
- Monitor repository events and workflows
- Integrate with GitHub Actions and pull requests

## Features

### Repository Management

- **Repository Listing**: View all repositories you have access to
- **Repository Details**: Get detailed information about specific repositories
- **Repository Search**: Search across GitHub repositories
- **Repository Context**: Use repository context in Jules sessions

### URL Handling and Deep Linking

- **GitHub URL Parsing**: Automatically parse GitHub URLs
- **Deep Linking**: Launch the app with GitHub URLs
- **Session Creation**: Create Jules sessions from GitHub URLs
- **URL Validation**: Validate and sanitize GitHub URLs

### Webhook Integration

- **Event Handling**: Handle GitHub webhook events
- **Real-time Updates**: Get real-time updates from GitHub
- **Event Filtering**: Filter events by type and repository
- **Security**: Verify webhook signatures for security

### Session Context Enhancement

- **Repository-specific Templates**: Use predefined templates for different types of work
- **Branch Management**: Select and manage branches for sessions
- **GitHub Context**: Include repository metadata in session creation
- **Smart Session Creation**: Automatically configure sessions based on GitHub context

### Workflow Integration

- **Workflow Monitoring**: Monitor GitHub Actions workflows
- **Workflow Logs**: Access workflow execution logs
- **Workflow Status**: Track workflow status in real-time
- **Workflow Inspection**: Inspect workflow details and artifacts

## Setup

### GitHub Token Configuration

To use the GitHub integration, you need to configure a GitHub token:

1. Go to **Settings** in the Jules Mobile Client
2. Navigate to the **GitHub** section
3. Enter your GitHub personal access token
4. Save the configuration

### Required Scopes

Your GitHub token should have the following scopes:

- `repo` - Full control of private repositories
- `workflow` - Update GitHub Action workflows
- `admin:repo_hook` - Manage repository hooks
- `read:org` - Read organization and team membership

## Usage

### Creating Sessions from GitHub URLs

You can create Jules sessions directly from GitHub URLs:

1. Copy a GitHub URL (repository, pull request, issue, etc.)
2. Open the Jules Mobile Client
3. Use the "Create Session from URL" feature
4. The app will parse the URL and create a session with the appropriate context

### Session Creation with GitHub Context

The enhanced session creation flow includes:

1. **URL Input**: Enter or paste a GitHub URL
2. **Template Selection**: Choose from repository-specific templates
3. **Branch Configuration**: Select the branch for the session
4. **Prompt Customization**: Customize the session prompt
5. **Session Launch**: Create and launch the session

### Monitoring Repository Events

The integration can monitor various GitHub events:

- **Push Events**: Code pushes to repositories
- **Pull Request Events**: Pull request creation, updates, and merges
- **Issue Events**: Issue creation and updates
- **Workflow Events**: GitHub Actions workflow runs

### Webhook Configuration

To set up webhooks for your repositories:

1. Go to your repository settings on GitHub
2. Navigate to **Webhooks**
3. Add a new webhook with the Jules Mobile Client endpoint
4. Configure the events you want to monitor
5. Set up signature verification for security

## API Reference

### GitHub API Integration

The integration uses the GitHub REST API for all operations. Key endpoints include:

- `GET /user/repos` - List user repositories
- `GET /repos/{owner}/{repo}` - Get repository details
- `GET /repos/{owner}/{repo}/actions/workflows` - List workflows
- `GET /repos/{owner}/{repo}/actions/runs` - List workflow runs
- `GET /repos/{owner}/{repo}/pulls` - List pull requests

### Webhook Events

Supported webhook events include:

- `repository` - Repository creation and deletion
- `push` - Code pushes
- `pull_request` - Pull request events
- `workflow_run` - Workflow run events
- `issues` - Issue events

## Components

### Core Hooks

- `useGithubApi` - Main GitHub API integration
- `useGithubWebhooks` - Webhook event handling
- `useGithubDeepLinking` - URL parsing and deep linking
- `useGithubSession` - Session creation with GitHub context

### UI Components

- `WebhookManagement` - Webhook configuration interface
- `GithubSessionCreator` - Session creation wizard
- `GithubUrlHandler` - URL handling and session launching

### Context Providers

- `GithubProvider` - Centralized GitHub integration state
- Convenience hooks for specific functionality areas

## Security

### Token Security

GitHub tokens are stored securely using the Expo Secure Store. The app follows security best practices:

- Tokens are encrypted at rest
- Tokens are only used for GitHub API calls
- Token validation is performed on startup

### Webhook Security

Webhook endpoints are secured with:

- Signature verification using the webhook secret
- HTTPS-only communication
- Rate limiting to prevent abuse
- Input validation and sanitization

## Testing

The integration includes comprehensive tests:

- **Unit Tests**: Individual function testing
- **Integration Tests**: End-to-end workflow testing
- **Mock Data**: Test data for various scenarios
- **Error Scenarios**: Testing error conditions and edge cases

Run tests with:

```bash
npm test
```

## Current Status

### ✅ Completed Features (Phase 1 & 2)

1. **Core API Integration**
   - ✅ GitHub API authentication with Octokit
   - ✅ Repository operations (list, search, details)
   - ✅ Error handling and rate limiting
   - ✅ Secure token storage

2. **URL Handling and Deep Linking**
   - ✅ GitHub URL parsing for all formats
   - ✅ Deep linking support with custom URL scheme
   - ✅ URL validation and sanitization
   - ✅ Clipboard integration

3. **Webhook Integration**
   - ✅ Webhook creation and management
   - ✅ Event filtering and processing
   - ✅ Security validation with signatures
   - ✅ Webhook configuration UI

4. **Session Context Enhancement**
   - ✅ Repository-specific prompt templates
   - ✅ GitHub context integration in session creation
   - ✅ Branch selection and management
   - ✅ Session creation from GitHub URLs
   - ✅ Enhanced session creator UI

5. **Testing and Documentation**
   - ✅ Comprehensive unit tests
   - ✅ Integration tests
   - ✅ Error handling tests
   - ✅ Updated documentation

### 🚧 In Progress (Phase 3)

1. **Workflow API Integration**
   - 🔄 Workflow listing and monitoring
   - 🔄 Workflow run history and logs
   - 🔄 Real-time workflow status updates
   - 🔄 Workflow inspection UI components

### ✅ Implemented (Phase 4)

1. **Repository Synchronization**
   - ✅ Intelligent cache invalidation
   - ✅ Background sync with configurable intervals
   - ✅ Conflict resolution for local vs remote changes
   - ✅ Offline support with local storage
   - ✅ Repository health monitoring

2. **Pull Request Analysis**
   - ✅ AI-powered code change analysis
   - ✅ Automated PR review capabilities
   - ✅ PR comment and approval workflows
   - ✅ PR diff analysis and code review suggestions
   - ✅ PR status tracking and monitoring

3. **Notifications System**
   - ✅ Push notifications for repository events
   - ✅ Notification preferences and filtering
   - ✅ Notification history and management
   - ✅ Real-time alerts for workflow status changes
   - ✅ In-app notification center

### 📊 Features Overview

| Feature Category          | Status      | Description                                         |
| ------------------------- | ----------- | --------------------------------------------------- |
| **Authentication**        | ✅ Complete | GitHub API token management and validation          |
| **Repository Management** | ✅ Complete | Repository listing, search, and details             |
| **Session Context**       | ✅ Complete | Repository-specific templates and branch management |
| **URL Handling**          | ✅ Complete | Deep linking for GitHub URLs                        |
| **Webhook Integration**   | ✅ Complete | Real-time event handling infrastructure             |
| **Workflow Management**   | ✅ Complete | Workflow listing, monitoring, and log viewing       |
| **Repository Sync**       | ✅ Complete | Background synchronization with conflict resolution |
| **PR Analysis**           | ✅ Complete | AI-powered pull request analysis and review         |
| **Notifications**         | ✅ Complete | Comprehensive notification system with preferences  |

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure your GitHub token has the required scopes
2. **Rate Limiting**: GitHub API has rate limits; the app handles this automatically
3. **Webhook Delivery**: Ensure your webhook URL is accessible and uses HTTPS
4. **URL Parsing**: Verify that GitHub URLs are in the correct format

### Debug Information

Enable debug logging to troubleshoot issues:

```typescript
// Add to app configuration
console.log("GitHub Integration Debug Mode");
```

### Support

For issues and questions:

1. Check the GitHub repository for known issues
2. Review the API documentation
3. Check rate limit status
4. Verify token permissions

## Future Enhancements

Planned features include:

- GitHub Enterprise support
- Advanced analytics and reporting
- Template system for common workflows
- Batch operations on multiple repositories
- Integration with other development tools

## Contributing

To contribute to the GitHub integration:

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This integration is part of the Jules Mobile Client and is licensed under the same terms as the main project.

# GitHub Workflow Integration

This document describes the comprehensive GitHub workflow integration implemented in the Jules Mobile Client.

## Overview

The workflow integration provides users with a complete workflow inspection system that allows them to:

- View all workflows in a repository
- Monitor workflow runs in real-time
- View detailed logs with syntax highlighting
- Get notifications for workflow status changes
- Access workflow run details and job information

## Architecture

### Core Components

#### 1. API Integration (`hooks/use-github-api.ts`)

The main hook that provides all GitHub API functionality:

**Key Features:**

- Authentication with GitHub tokens
- Workflow listing and details fetching
- Workflow run monitoring
- Logs retrieval and processing
- Repository operations

**Main Methods:**

- `getWorkflows(owner, repo)` - Fetch all workflows for a repository
- `getWorkflowRuns(owner, repo, workflowId?, perPage?, page?)` - Get workflow runs
- `getWorkflowRunLogs(owner, repo, runId)` - Download workflow logs
- `getWorkflowRunDetails(owner, repo, runId)` - Get detailed run information
- `getWorkflowJobs(owner, repo, runId)` - Get job information for a run

#### 2. Real-time Updates (`hooks/use-workflow-updates.ts`)

Provides real-time monitoring and notifications for workflow status changes:

**Key Features:**

- Polling for workflow status changes
- Detection of new workflow runs
- Status change notifications
- Completion tracking
- Automatic cleanup and memory management

**Main Methods:**

- `startPolling(owner, repo, intervalMs)` - Start monitoring workflows
- `stopPolling()` - Stop monitoring and cleanup
- `getUpdatesForWorkflow(workflowId)` - Get updates for specific workflow
- `getRecentUpdates(limit)` - Get recent updates across all workflows
- `clearUpdates()` - Clear all notifications

#### 3. UI Components

##### Workflow Dashboard (`components/github/workflow-dashboard.tsx`)

Main interface for workflow inspection:

- Horizontal list of active workflows
- Vertical list of recent workflow runs
- Real-time updates feed
- Integration with real-time updates

##### Workflow Card (`components/github/workflow-card.tsx`)

Individual workflow representation:

- Status indicators with color coding
- Workflow name and path display
- Update count and recent status
- Interactive selection

##### Workflow Run Card (`components/github/workflow-run-card.tsx`)

Individual workflow run display:

- Run status and conclusion
- Branch and event information
- Start and completion times
- Run ID and commit SHA

##### Workflow Run Details Modal (`components/github/workflow-run-details.tsx`)

Comprehensive run information:

- Tabbed interface (Details, Jobs, Logs)
- Run metadata and information
- Job list with status
- Action buttons (Cancel, Retry)
- Full logs viewer integration

##### Workflow Logs Viewer (`components/github/workflow-logs-viewer.tsx`)

Syntax-highlighted log display:

- Auto-refresh for in-progress runs
- Language detection for syntax highlighting
- Timestamp formatting
- Dark/light theme support

##### Workflow Job Card (`components/github/workflow-job-card.tsx`)

Individual job information:

- Job status and duration
- Step-by-step breakdown
- Start and completion times
- Status indicators for each step

##### Workflow Notifications (`components/github/workflow-notifications.tsx`)

Real-time notification system:

- Haptic feedback for important events
- Auto-hide after 5 seconds
- Notification history
- Clear all functionality

## Usage Examples

### Basic Workflow Monitoring

```typescript
import { useGithubApi, useWorkflowUpdates } from '@/hooks';

function WorkflowMonitor({ owner, repo }) {
  const { getWorkflows, getWorkflowRuns } = useGithubApi();
  const { startPolling, stopPolling, getRecentUpdates } = useWorkflowUpdates();

  useEffect(() => {
    // Start monitoring
    startPolling(owner, repo, 30000); // Poll every 30 seconds

    return () => stopPolling();
  }, [owner, repo]);

  const loadWorkflows = async () => {
    const workflows = await getWorkflows(owner, repo);
    const runs = await getWorkflowRuns(owner, repo);
    // Process data...
  };

  const updates = getRecentUpdates(10);

  return (
    <WorkflowDashboard
      owner={owner}
      repo={repo}
      updates={updates}
    />
  );
}
```

### Logs Viewing

```typescript
function LogsViewer({ owner, repo, runId }) {
  return (
    <WorkflowLogsViewer
      owner={owner}
      repo={repo}
      runId={runId}
    />
  );
}
```

### Notifications

```typescript
function App() {
  return (
    <View>
      {/* Your main app content */}
      <WorkflowNotifications
        owner="owner"
        repo="repo"
        enabled={true}
      />
    </View>
  );
}
```

## Configuration

### Polling Intervals

The real-time updates system supports configurable polling intervals:

```typescript
// Poll every 10 seconds (more frequent)
startPolling(owner, repo, 10000);

// Poll every 60 seconds (less frequent)
startPolling(owner, repo, 60000);
```

**Recommendations:**

- Development: 10-30 seconds
- Production: 30-60 seconds
- Battery saving: 60+ seconds

### Notification Settings

Notifications can be enabled/disabled globally:

```typescript
<WorkflowNotifications
  owner="owner"
  repo="repo"
  enabled={userSettings.enableNotifications}
/>
```

## Performance Considerations

### Memory Management

The integration includes automatic cleanup:

- Polling intervals are cleared on unmount
- Update history is limited to prevent memory leaks
- Component state is properly managed

### Network Optimization

- API calls are debounced to prevent excessive requests
- Only necessary data is fetched (lazy loading)
- Caching is implemented where appropriate

### Mobile Optimization

- Components are optimized for mobile screens
- Touch interactions are properly handled
- Performance is monitored and optimized

## Error Handling

### API Errors

All API calls include proper error handling:

```typescript
try {
  const workflows = await getWorkflows(owner, repo);
  // Process successful response
} catch (error) {
  console.error("Failed to fetch workflows:", error);
  // Handle error gracefully
}
```

### Network Issues

The system handles:

- Network timeouts
- Authentication errors
- Rate limiting
- Invalid responses

### User Experience

- Loading states are shown during API calls
- Error messages are user-friendly
- Fallback behavior is implemented

## Testing

### Unit Tests

Comprehensive test coverage includes:

- API hook functionality
- Real-time update logic
- Error handling scenarios
- Component rendering

### Integration Tests

Tests verify:

- End-to-end workflow monitoring
- Real-time update accuracy
- Notification system reliability
- Performance under load

## Future Enhancements

### Planned Features

1. **WebSocket Support**: Replace polling with real-time WebSocket connections
2. **Advanced Filtering**: Filter workflows by status, branch, or time range
3. **Custom Dashboards**: User-configurable workflow dashboards
4. **Export Functionality**: Export logs and reports
5. **Team Notifications**: Team-wide notification settings

### Performance Improvements

1. **Smart Polling**: Adjust polling frequency based on activity
2. **Background Sync**: Sync data when app is in background
3. **Data Compression**: Compress large log files
4. **Caching Strategy**: Implement intelligent caching

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Verify GitHub token has correct permissions
2. **Rate Limiting**: Implement exponential backoff for API calls
3. **Network Timeouts**: Increase timeout values for slow connections
4. **Memory Leaks**: Ensure proper cleanup in component lifecycle

### Debug Mode

Enable debug logging:

```typescript
// Add to your component
useEffect(() => {
  console.log("Workflow updates:", getRecentUpdates());
}, [getRecentUpdates]);
```

## Security Considerations

### Token Security

- GitHub tokens are stored securely using Expo Secure Store
- Tokens are never logged or exposed in the UI
- Authentication is validated before API calls

### Data Privacy

- Only necessary repository data is fetched
- User data is not stored or transmitted
- All API calls use HTTPS

## Support

For issues or questions about the workflow integration:

1. Check the troubleshooting section above
2. Review the test files for usage examples
3. Examine the component source code for implementation details
4. Create an issue with detailed reproduction steps

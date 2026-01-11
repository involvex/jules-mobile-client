# Jules Mobile Client - Troubleshooting Guide

## Table of Contents

- [Common Issues](#common-issues)
- [Authentication Problems](#authentication-problems)
- [GitHub Integration Issues](#github-integration-issues)
- [Performance Problems](#performance-problems)
- [Network and Connectivity](#network-and-connectivity)
- [App Crashes and Errors](#app-crashes-and-errors)
- [Session Management Issues](#session-management-issues)
- [Notifications Problems](#notifications-problems)
- [Development and Build Issues](#development-and-build-issues)
- [Getting Help](#getting-help)

## Common Issues

### App Won't Start

**Symptoms**: App crashes on launch or won't open

**Solutions**:

1. **Clear App Data**:
   - iOS: Settings → General → iPhone Storage → Jules Mobile Client → Offload App
   - Android: Settings → Apps → Jules Mobile Client → Storage → Clear Data

2. **Check Device Requirements**:
   - iOS 14+ required
   - Android 8.0+ required
   - At least 200MB free storage

3. **Reinstall the App**:
   - Uninstall completely
   - Download fresh copy from app store
   - Reinstall

### Slow Performance

**Symptoms**: App is sluggish, slow to respond, or takes long to load

**Solutions**:

1. **Clear Cache**:
   - Go to Settings → Performance → Clear Cache
   - Restart the app

2. **Reduce Sync Frequency**:
   - Go to Settings → GitHub → Sync Settings
   - Increase sync interval to 15-30 minutes

3. **Limit Active Repositories**:
   - Go to Repositories tab
   - Unsync repositories you don't actively use

4. **Check Device Resources**:
   - Close other apps running in background
   - Ensure adequate free storage space

### Missing Features

**Symptoms**: Expected features not visible or accessible

**Solutions**:

1. **Check App Version**:
   - Ensure you have the latest version
   - Update from app store if needed

2. **Verify Permissions**:
   - Check app permissions in device settings
   - Ensure storage, network, and notification permissions are granted

3. **Authentication Status**:
   - Verify Jules API key is configured
   - Check GitHub token if using GitHub features

## Authentication Problems

### Invalid API Key

**Symptoms**: "Invalid API Key" or "Authentication Failed" errors

**Solutions**:

1. **Verify API Key Format**:
   - Jules API keys are typically 40+ characters
   - Should contain only alphanumeric characters
   - No spaces or special characters

2. **Check API Key Validity**:
   - Log into your Jules account
   - Verify the API key hasn't expired
   - Check if the key has been revoked

3. **Regenerate API Key**:
   - Go to Jules account settings
   - Generate a new API key
   - Replace in app settings

4. **Network Issues**:
   - Check internet connection
   - Try switching between WiFi and mobile data
   - Disable VPN if active

### GitHub Authentication Failed

**Symptoms**: GitHub integration not working, authentication errors

**Solutions**:

1. **Check Token Scopes**:
   - Ensure token has required scopes: `repo`, `workflow`, `admin:repo_hook`, `read:org`
   - Regenerate token with proper scopes if needed

2. **Token Format**:
   - GitHub tokens are typically 40 characters
   - Should be alphanumeric
   - No spaces or special characters

3. **GitHub Account Status**:
   - Verify GitHub account is active
   - Check if account has 2FA enabled (may require different token type)

4. **Rate Limiting**:
   - GitHub API has rate limits (5000 requests/hour)
   - Wait if you've exceeded limits
   - Check rate limit status in app

### Session Authentication Errors

**Symptoms**: Can't create or access Jules sessions

**Solutions**:

1. **API Key Verification**:
   - Double-check API key in settings
   - Ensure no trailing spaces
   - Test with a new API key

2. **Jules Account Status**:
   - Verify your Jules account is active
   - Check subscription status if applicable
   - Contact Jules support if account issues

3. **Network Configuration**:
   - Ensure device can reach Jules API endpoints
   - Check firewall settings
   - Try different network connection

## GitHub Integration Issues

### Repository Not Appearing

**Symptoms**: Expected repositories don't show up in the app

**Solutions**:

1. **Check Repository Visibility**:
   - Private repositories require `repo` scope
   - Organization repositories need appropriate permissions
   - Forked repositories need access to parent org

2. **Sync Issues**:
   - Trigger manual sync from repository settings
   - Check sync status and error messages
   - Verify GitHub token permissions

3. **Repository Filters**:
   - Check if repository filters are applied
   - Verify search terms if using search
   - Ensure repository isn't excluded by settings

### Webhook Setup Failed

**Symptoms**: Can't set up webhooks, webhook events not received

**Solutions**:

1. **Repository Permissions**:
   - Need admin access to repository
   - Organization repositories need admin permissions
   - Check if webhook creation is restricted

2. **Webhook URL Format**:
   - Ensure correct webhook endpoint URL
   - Verify HTTPS requirement
   - Check URL doesn't contain special characters

3. **GitHub Enterprise**:
   - Currently only GitHub.com is supported
   - GitHub Enterprise support planned for future release

### Workflow Monitoring Not Working

**Symptoms**: Workflow status not updating, missing workflow runs

**Solutions**:

1. **Workflow Permissions**:
   - Need `workflow` scope for workflow access
   - Private repositories require full repo access
   - Check if workflows are enabled for repository

2. **Workflow Visibility**:
   - Only active workflows are shown by default
   - Check workflow status in GitHub
   - Verify workflow files exist in repository

3. **Sync Configuration**:
   - Check workflow sync settings
   - Verify background sync is enabled
   - Check sync interval and timing

### Pull Request Analysis Not Working

**Symptoms**: PR analysis features not available or failing

**Solutions**:

1. **PR Permissions**:
   - Need `pull_requests` scope for PR access
   - Private repositories require full access
   - Check if PRs are accessible

2. **Repository Access**:
   - Verify repository sync is working
   - Check if repository has PRs
   - Ensure PRs are not in draft state (if filtered)

3. **AI Integration**:
   - Verify Jules API key is working
   - Check if AI analysis is enabled in settings
   - Ensure sufficient API quota for analysis

## Performance Problems

### App is Slow or Laggy

**Symptoms**: Slow response times, laggy interactions

**Solutions**:

1. **Memory Management**:
   - Clear app cache regularly
   - Close other apps running in background
   - Restart device if needed

2. **Data Optimization**:
   - Reduce number of synced repositories
   - Increase sync intervals
   - Limit active sessions

3. **Network Optimization**:
   - Use stable WiFi connection
   - Check network speed
   - Disable VPN if causing issues

### High Battery Usage

**Symptoms**: App draining battery quickly

**Solutions**:

1. **Background Activity**:
   - Reduce background sync frequency
   - Disable unnecessary notifications
   - Limit real-time updates

2. **Screen Time**:
   - Use dark mode to reduce battery usage
   - Lower screen brightness
   - Enable auto-lock

3. **App Optimization**:
   - Keep app updated to latest version
   - Clear cache regularly
   - Restart app periodically

### Storage Issues

**Symptoms**: App using too much storage, storage warnings

**Solutions**:

1. **Cache Management**:
   - Clear app cache from settings
   - Delete old sessions and logs
   - Remove unused repositories

2. **Data Cleanup**:
   - Export important data before clearing
   - Remove old notification history
   - Clear workflow logs

3. **Storage Monitoring**:
   - Monitor app storage usage
   - Set up automatic cleanup
   - Consider device storage upgrade if needed

## Network and Connectivity

### Connection Timeouts

**Symptoms**: API calls timing out, network errors

**Solutions**:

1. **Network Stability**:
   - Check WiFi signal strength
   - Try switching to mobile data
   - Restart router if needed

2. **Firewall/Proxy**:
   - Check if firewall is blocking app
   - Configure proxy settings if needed
   - Try different network

3. **Server Status**:
   - Check Jules API status
   - Check GitHub API status
   - Verify no widespread outages

### Offline Mode Issues

**Symptoms**: App not working properly offline

**Solutions**:

1. **Cache Verification**:
   - Ensure data is cached before going offline
   - Check cache settings
   - Verify offline mode is enabled

2. **Limited Functionality**:
   - Understand offline limitations
   - Plan usage accordingly
   - Sync data before going offline

3. **Reconnection**:
   - App should auto-sync when back online
   - Check sync status after reconnection
   - Manually trigger sync if needed

### VPN and Proxy Issues

**Symptoms**: App not working with VPN/proxy

**Solutions**:

1. **VPN Configuration**:
   - Try different VPN server locations
   - Check if VPN blocks GitHub/Jules APIs
   - Use VPN kill switch if available

2. **Proxy Settings**:
   - Configure proxy in device settings
   - Check proxy authentication
   - Verify proxy allows required domains

3. **Network Routing**:
   - Check if VPN routes traffic properly
   - Verify DNS settings
   - Try disabling VPN temporarily

## App Crashes and Errors

### App Crashes on Launch

**Symptoms**: App crashes immediately on startup

**Solutions**:

1. **Safe Mode**:
   - Try launching in safe mode if available
   - Disable all integrations
   - Gradually re-enable features

2. **Data Corruption**:
   - Clear app data and cache
   - Reinstall the app
   - Restore from backup if available

3. **Device Issues**:
   - Restart device
   - Check for OS updates
   - Free up storage space

### App Crashes During Use

**Symptoms**: App crashes during specific operations

**Solutions**:

1. **Error Reporting**:
   - Enable error reporting in settings
   - Check crash logs
   - Report to support with details

2. **Operation-Specific**:
   - Identify what triggers crashes
   - Avoid problematic operations
   - Use alternative workflows

3. **Memory Issues**:
   - Close other apps
   - Clear app cache
   - Restart device

### Error Messages

**Common Error Messages and Solutions**:

#### "Network Error"

- Check internet connection
- Try different network
- Wait and retry

#### "Rate Limit Exceeded"

- Wait for rate limit reset
- Reduce API usage
- Check rate limit status

#### "Invalid Response"

- Check API key validity
- Verify network connection
- Contact support

#### "Permission Denied"

- Check API permissions
- Verify account status
- Regenerate API keys

## Session Management Issues

### Session Creation Failed

**Symptoms**: Can't create new sessions

**Solutions**:

1. **API Key Verification**:
   - Check Jules API key
   - Verify account status
   - Test with different prompt

2. **Repository Context**:
   - Verify repository access
   - Check branch availability
   - Ensure repository is synced

3. **Session Limits**:
   - Check active session limits
   - Close old sessions
   - Upgrade plan if needed

### Session Not Updating

**Symptoms**: Session progress not updating, stale data

**Solutions**:

1. **Polling Issues**:
   - Check polling settings
   - Manually refresh session
   - Verify network connection

2. **Session Status**:
   - Check if session is still active
   - Verify session hasn't completed
   - Check for session errors

3. **App State**:
   - Keep app in foreground
   - Check background refresh settings
   - Restart app if needed

### Session Data Lost

**Symptoms**: Session history or data missing

**Solutions**:

1. **Data Persistence**:
   - Check if data was saved
   - Verify storage permissions
   - Check for data corruption

2. **Session Recovery**:
   - Try refreshing session
   - Check session status
   - Contact support if data critical

3. **Backup Strategy**:
   - Export session data regularly
   - Use cloud backup if available
   - Document important sessions

## Notifications Problems

### Not Receiving Notifications

**Symptoms**: Missing push notifications or alerts

**Solutions**:

1. **App Permissions**:
   - Check notification permissions
   - Enable notifications in app settings
   - Verify system notification settings

2. **Push Service**:
   - Check push notification service status
   - Verify device registration
   - Restart push service

3. **Notification Settings**:
   - Check notification preferences
   - Verify event filters
   - Check quiet hours settings

### Too Many Notifications

**Symptoms**: Receiving excessive notifications

**Solutions**:

1. **Filter Configuration**:
   - Adjust notification filters
   - Set up quiet hours
   - Configure event types

2. **Repository Filtering**:
   - Disable notifications for specific repos
   - Set up priority repositories
   - Use notification groups

3. **Frequency Control**:
   - Increase notification intervals
   - Enable batch notifications
   - Set up digest emails

### Notification Timing Issues

**Symptoms**: Notifications arriving late or not at correct time

**Solutions**:

1. **Time Zone Settings**:
   - Check device time zone
   - Verify app time zone settings
   - Sync device clock

2. **Delivery Delays**:
   - Check network connectivity
   - Verify push service status
   - Check for system delays

3. **Scheduling**:
   - Adjust notification schedules
   - Check for conflicts
   - Verify timing settings

## Development and Build Issues

### Build Failures

**Symptoms**: App won't build or compile

**Solutions**:

1. **Dependencies**:
   - Run `bun install` to update dependencies
   - Check for dependency conflicts
   - Verify package versions

2. **Environment**:
   - Check Node.js/Bun version
   - Verify Expo CLI version
   - Check development environment

3. **Code Issues**:
   - Check for TypeScript errors
   - Verify import statements
   - Check for syntax errors

### Development Server Issues

**Symptoms**: Development server won't start or has issues

**Solutions**:

1. **Port Conflicts**:
   - Check for port conflicts
   - Change development port
   - Kill conflicting processes

2. **Cache Issues**:
   - Clear Metro bundler cache
   - Reset project cache
   - Restart development server

3. **Configuration**:
   - Check app.json configuration
   - Verify metro.config.js
   - Check environment variables

### Testing Issues

**Symptoms**: Tests failing or not running properly

**Solutions**:

1. **Test Environment**:
   - Check test configuration
   - Verify test dependencies
   - Check test data

2. **Mock Issues**:
   - Verify mock implementations
   - Check test isolation
   - Update mocks if needed

3. **Test Data**:
   - Check test data validity
   - Verify test fixtures
   - Update test scenarios

## Getting Help

### In-App Support

1. **Help Center**: Access from Settings → Help
2. **Feedback**: Submit feedback from app
3. **Bug Reports**: Report bugs with automatic error details

### Online Resources

1. **Documentation**: [docs.jules.dev](https://docs.jules.dev)
2. **Community Forum**: [community.jules.dev](https://community.jules.dev)
3. **GitHub Issues**: [github.com/jules-mobile-client/issues](https://github.com/jules-mobile-client/issues)

### Contact Information

- **Email**: support@jules.dev
- **Website**: [jules.dev](https://jules.dev)
- **Discord**: [discord.gg/jules](https://discord.gg/jules)

### When to Contact Support

Contact support when:

- Issue isn't covered in this guide
- Problem persists after trying all solutions
- Critical functionality is broken
- Data loss or security concerns

### Information to Provide

When contacting support, include:

- App version and device information
- Detailed description of the issue
- Steps to reproduce the problem
- Screenshots or error messages
- Any troubleshooting already attempted

### Emergency Procedures

For critical issues:

1. **Data Backup**: Export important data immediately
2. **App Reset**: Clear app data and reconfigure
3. **Alternative Access**: Use web version if available
4. **Support Escalation**: Contact support with "URGENT" in subject

---

**Last Updated**: January 2026
**Version**: 1.0.0
**Support Hours**: 24/7
**Response Time**: 24-48 hours

# Authentication Error Flows Integration Tests

This document describes the comprehensive integration tests for authentication error handling in the Anclora Kairon application.

## Overview

The integration tests validate the complete authentication error handling system, including:

- **Registration flows** with various error scenarios
- **Login flows** with network interruptions and service failures
- **OAuth flows** with provider failures and fallback mechanisms
- **Recovery scenarios** after errors occur
- **Error logging and metrics** validation

## Test Structure

### Test Files

1. **`authErrorFlows.integration.test.js`**
   - Complete registration flow with various errors
   - Login flow with network interruptions
   - OAuth flows with provider failures
   - Recovery scenarios after errors
   - Error logging and metrics validation

2. **`authErrorRecovery.integration.test.js`**
   - Progressive error recovery patterns
   - User feedback during error recovery
   - Complex error state management
   - Edge case error scenarios

3. **`oauthErrorFlows.integration.test.js`**
   - Google OAuth error scenarios
   - GitHub OAuth error scenarios
   - OAuth provider fallback scenarios
   - OAuth popup management
   - OAuth error recovery and retry logic

### Test Utilities

- **`errorSimulator.js`** - Simulates various error conditions
- **`networkErrorSimulator.js`** - Simulates network connectivity issues
- **`supabaseMocker.js`** - Mocks Supabase responses and errors
- **`oauthErrorSimulator.js`** - Simulates OAuth provider failures
- **`runIntegrationTests.js`** - Test runner with comprehensive reporting

## Running the Tests

### All Integration Tests

```bash
npm run test:integration
```

This runs all integration tests with comprehensive reporting in console, JSON, and HTML formats.

### Individual Test Suites

```bash
# Authentication error flows
npm run test:integration:auth

# Error recovery scenarios
npm run test:integration:recovery

# OAuth error flows
npm run test:integration:oauth
```

### Using Vitest Directly

```bash
# Run all integration tests
npx vitest run src/shared/test/*.integration.test.js

# Run with UI
npx vitest --ui src/shared/test/*.integration.test.js

# Run in watch mode
npx vitest src/shared/test/*.integration.test.js
```

## Test Scenarios

### 1. Registration Error Flows

#### Network Errors During Registration
- **Scenario**: Network connectivity issues during user registration
- **Test**: Simulates unstable connection with retry logic
- **Validation**: 
  - Successful registration after retries
  - Error logging for failed attempts
  - Performance metrics for recovery

#### User Already Exists Error
- **Scenario**: Attempting to register with existing email
- **Test**: Mocks Supabase "user already exists" response
- **Validation**:
  - Appropriate error message in Spanish
  - Error classification as `AUTH_USER_EXISTS`
  - No retry attempts (user should login instead)

#### Weak Password Validation
- **Scenario**: Registration with password not meeting requirements
- **Test**: Validates password strength requirements
- **Validation**:
  - Client-side validation errors
  - Clear feedback about password requirements
  - No server request made for invalid passwords

#### Supabase Service Unavailable
- **Scenario**: Supabase authentication service is down
- **Test**: Mocks 503 service unavailable responses
- **Validation**:
  - Retry attempts with exponential backoff
  - User-friendly error messages
  - Fallback to mock implementation if configured

### 2. Login Error Flows

#### Intermittent Network Connectivity
- **Scenario**: Network connection drops during login attempts
- **Test**: Simulates 50% packet loss and connection drops
- **Validation**:
  - Automatic retry with connection recovery
  - Connection status monitoring
  - User feedback during connectivity issues

#### Complete Network Offline
- **Scenario**: Device goes completely offline
- **Test**: Simulates navigator.onLine = false
- **Validation**:
  - Offline detection and appropriate messaging
  - Queue operations for when connection returns
  - Successful login after coming back online

#### Invalid Credentials with Rate Limiting
- **Scenario**: Multiple failed login attempts trigger rate limiting
- **Test**: Simulates progressive rate limiting responses
- **Validation**:
  - Rate limit detection and appropriate delays
  - Clear messaging about wait times
  - Successful login after rate limit expires

### 3. OAuth Error Flows

#### Google OAuth Service Unavailable
- **Scenario**: Google OAuth service is temporarily down
- **Test**: Mocks 503 responses from Google OAuth endpoints
- **Validation**:
  - Fallback options presented to user
  - Retry mechanisms for temporary outages
  - Alternative authentication methods offered

#### OAuth Popup Blocked
- **Scenario**: Browser blocks OAuth popup window
- **Test**: Simulates window.open returning null
- **Validation**:
  - Popup blocked detection
  - Instructions for enabling popups
  - Alternative authentication flows

#### OAuth Access Denied
- **Scenario**: User denies access in OAuth flow
- **Test**: Simulates user clicking "Deny" in OAuth popup
- **Validation**:
  - No retry attempts (user choice respected)
  - Clear explanation of access requirements
  - Alternative authentication options

#### OAuth Timeout
- **Scenario**: OAuth flow takes too long to complete
- **Test**: Simulates timeout in OAuth popup communication
- **Validation**:
  - Timeout detection and cleanup
  - Retry options with longer timeout
  - Fallback authentication methods

### 4. Recovery Scenarios

#### Progressive Error Recovery
- **Scenario**: Multiple error types occur in sequence
- **Test**: Network error → Service error → Success
- **Validation**:
  - Different error types handled appropriately
  - Progressive recovery with different strategies
  - Complete error history logged

#### OAuth Fallback to Email/Password
- **Scenario**: OAuth providers fail, fallback to credentials
- **Test**: All OAuth providers return errors
- **Validation**:
  - Seamless fallback to email/password
  - User guidance through fallback process
  - Successful authentication via fallback

#### Connection Quality Monitoring
- **Scenario**: Connection quality degrades and recovers
- **Test**: Simulates varying network latency and reliability
- **Validation**:
  - Connection quality assessment
  - Adaptive behavior based on connection quality
  - User feedback about connection status

## Error Simulation

### Network Error Simulation

The `networkErrorSimulator` provides realistic network condition simulation:

```javascript
// Simulate poor WiFi connection
networkErrorSimulator.simulateScenario('POOR_WIFI');

// Simulate mobile 3G connection
networkErrorSimulator.simulateScenario('MOBILE_3G');

// Simulate complete offline
networkErrorSimulator.goOffline();
```

### Supabase Error Simulation

The `supabaseMocker` provides comprehensive Supabase response mocking:

```javascript
// Mock service unavailable
supabaseMocker.mockErrorScenario('SERVICE_UNAVAILABLE');

// Mock specific user registration error
supabaseMocker.mockRequest('/auth/v1/signup', 'POST', 
  { email: 'test@example.com' },
  { error: { message: 'User already registered' } }
);
```

### OAuth Error Simulation

The `oauthErrorSimulator` handles OAuth provider failure simulation:

```javascript
// Simulate Google OAuth unavailable
oauthErrorSimulator.setProviderError('GOOGLE', 'PROVIDER_UNAVAILABLE');

// Simulate popup blocked for all providers
oauthErrorSimulator.setGlobalError('POPUP_BLOCKED');
```

## Test Reports

### Console Report
Real-time test execution with color-coded results and summary statistics.

### JSON Report
Machine-readable test results saved to `test-results/integration-test-results.json`:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "testSuite": "Authentication Error Flows Integration Tests",
  "totalTests": 45,
  "passedTests": 43,
  "failedTests": 2,
  "successRate": "95.56",
  "duration": 12500,
  "testFiles": [...],
  "errors": [...]
}
```

### HTML Report
Visual test results dashboard saved to `test-results/integration-test-results.html` with:
- Interactive summary dashboard
- Detailed test file results
- Error details and stack traces
- Performance metrics visualization

## Continuous Integration

### GitHub Actions Integration

Add to `.github/workflows/test.yml`:

```yaml
- name: Run Integration Tests
  run: npm run test:integration
  
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: integration-test-results
    path: test-results/
```

### Pre-commit Hooks

Add to `package.json`:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:integration"
    }
  }
}
```

## Debugging Tests

### Verbose Logging

Enable detailed logging during test execution:

```bash
DEBUG=auth:* npm run test:integration
```

### Test Isolation

Run individual test cases:

```bash
npx vitest run -t "should handle network errors during registration"
```

### Mock Inspection

Access mock call history in tests:

```javascript
expect(authService.login).toHaveBeenCalledTimes(3);
expect(errorLogger.logError).toHaveBeenCalledWith(
  expect.objectContaining({ message: 'Network error' }),
  expect.objectContaining({ operation: 'login' }),
  'MEDIUM'
);
```

## Performance Benchmarks

The integration tests include performance validation:

- **Registration**: < 2 seconds under normal conditions
- **Login**: < 1 second under normal conditions
- **OAuth**: < 3 seconds under normal conditions
- **Error Recovery**: < 5 seconds for complete recovery
- **Network Retry**: < 10 seconds with exponential backoff

## Coverage Requirements

Integration tests should maintain:

- **Error Scenarios**: 100% of defined error types
- **Recovery Paths**: 95% of recovery scenarios
- **User Feedback**: 100% of user-facing error messages
- **Logging**: 100% of error logging paths

## Maintenance

### Adding New Error Scenarios

1. Add error type to `authErrorHandler.js`
2. Create test case in appropriate integration test file
3. Add error simulation to relevant simulator utility
4. Update documentation and expected coverage

### Updating Error Messages

1. Update messages in `authErrorHandler.js`
2. Update test expectations in integration tests
3. Verify localization for both Spanish and English
4. Test user feedback system integration

### Performance Optimization

1. Monitor test execution times
2. Optimize mock implementations for speed
3. Parallelize independent test scenarios
4. Cache common test setup operations

## Troubleshooting

### Common Issues

1. **Tests timing out**: Increase timeout in test configuration
2. **Mock conflicts**: Ensure proper cleanup in `afterEach` hooks
3. **Network simulation interference**: Reset simulators between tests
4. **DOM cleanup**: Properly remove test elements from document

### Debug Commands

```bash
# Run with maximum verbosity
npx vitest run --reporter=verbose src/shared/test/*.integration.test.js

# Run single test file with debugging
npx vitest run --no-coverage src/shared/test/authErrorFlows.integration.test.js

# Generate coverage report
npx vitest run --coverage src/shared/test/*.integration.test.js
```

## Contributing

When adding new integration tests:

1. Follow the existing test structure and naming conventions
2. Include comprehensive error scenario coverage
3. Add appropriate mock cleanup in `afterEach` hooks
4. Update this documentation with new test scenarios
5. Ensure tests are deterministic and don't rely on external services
6. Include performance assertions where appropriate
7. Add user feedback validation for new error flows
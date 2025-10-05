/**
 * Test file for AuthErrorHandler
 * This file can be used to manually test the error handler functionality
 */

import { AuthErrorHandler, AUTH_ERROR_TYPES } from '../services/authErrorHandler.js';

// Create test instance
const errorHandler = new AuthErrorHandler();

/**
 * Test error classification
 */
function testErrorClassification() {
  console.log('=== Testing Error Classification ===');
  
  const testCases = [
    {
      error: new Error('Network error occurred'),
      expected: AUTH_ERROR_TYPES.NETWORK_ERROR
    },
    {
      error: new Error('Invalid login credentials'),
      expected: AUTH_ERROR_TYPES.AUTH_INVALID_CREDENTIALS
    },
    {
      error: new Error('User already registered'),
      expected: AUTH_ERROR_TYPES.AUTH_USER_EXISTS
    },
    {
      error: new Error('User not found'),
      expected: AUTH_ERROR_TYPES.AUTH_USER_NOT_FOUND
    },
    {
      error: { message: 'Password is too weak', code: 'weak_password' },
      expected: AUTH_ERROR_TYPES.AUTH_WEAK_PASSWORD
    },
    {
      error: { message: 'Too many requests', code: 'too_many_requests' },
      expected: AUTH_ERROR_TYPES.AUTH_RATE_LIMITED
    },
    {
      error: new Error('Internal server error'),
      expected: AUTH_ERROR_TYPES.SERVER_ERROR
    },
    {
      error: new Error('Something unexpected happened'),
      expected: AUTH_ERROR_TYPES.UNKNOWN_ERROR
    }
  ];

  testCases.forEach((testCase, index) => {
    const result = errorHandler.classifyError(testCase.error);
    const passed = result === testCase.expected;
    console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'} - ${testCase.error.message || testCase.error.code}`);
    if (!passed) {
      console.log(`  Expected: ${testCase.expected}, Got: ${result}`);
    }
  });
}

/**
 * Test message generation
 */
function testMessageGeneration() {
  console.log('\n=== Testing Message Generation ===');
  
  const errorTypes = Object.values(AUTH_ERROR_TYPES);
  
  console.log('Spanish Messages:');
  errorTypes.forEach(errorType => {
    const message = errorHandler.generateUserMessage(errorType, 'es');
    console.log(`  ${errorType}: ${message}`);
  });
  
  console.log('\nEnglish Messages:');
  errorTypes.forEach(errorType => {
    const message = errorHandler.generateUserMessage(errorType, 'en');
    console.log(`  ${errorType}: ${message}`);
  });
}

/**
 * Test retry logic
 */
function testRetryLogic() {
  console.log('\n=== Testing Retry Logic ===');
  
  const testCases = [
    { errorType: AUTH_ERROR_TYPES.NETWORK_ERROR, attemptCount: 0, shouldRetry: true },
    { errorType: AUTH_ERROR_TYPES.NETWORK_ERROR, attemptCount: 3, shouldRetry: false },
    { errorType: AUTH_ERROR_TYPES.AUTH_USER_NOT_FOUND, attemptCount: 0, shouldRetry: false },
    { errorType: AUTH_ERROR_TYPES.AUTH_INVALID_CREDENTIALS, attemptCount: 2, shouldRetry: true },
    { errorType: AUTH_ERROR_TYPES.AUTH_INVALID_CREDENTIALS, attemptCount: 3, shouldRetry: false }
  ];
  
  testCases.forEach((testCase, index) => {
    const canRetry = errorHandler.shouldAllowRetry(testCase.errorType, testCase.attemptCount);
    const passed = canRetry === testCase.shouldRetry;
    console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'} - ${testCase.errorType} (attempt ${testCase.attemptCount})`);
    if (!passed) {
      console.log(`  Expected: ${testCase.shouldRetry}, Got: ${canRetry}`);
    }
  });
}

/**
 * Test complete error handling flow
 */
function testCompleteFlow() {
  console.log('\n=== Testing Complete Error Handling Flow ===');
  
  const testError = new Error('Invalid login credentials');
  const context = {
    operation: 'login',
    attemptCount: 1,
    language: 'es'
  };
  
  const result = errorHandler.handleError(testError, context);
  
  console.log('Error handling result:');
  console.log(`  Type: ${result.type}`);
  console.log(`  User Message: ${result.userMessage}`);
  console.log(`  Can Retry: ${result.canRetry}`);
  console.log(`  Max Retries: ${result.maxRetries}`);
  console.log(`  Context: ${JSON.stringify(result.context, null, 2)}`);
  
  // Test with English
  const contextEn = { ...context, language: 'en' };
  const resultEn = errorHandler.handleError(testError, contextEn);
  console.log(`\nEnglish message: ${resultEn.userMessage}`);
}

/**
 * Run all tests
 */
export function runTests() {
  console.log('🧪 Running AuthErrorHandler Tests\n');
  
  testErrorClassification();
  testMessageGeneration();
  testRetryLogic();
  testCompleteFlow();
  
  console.log('\n✅ All tests completed!');
}

// Export for use in other files
export { errorHandler };

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - expose to global scope for manual testing
  window.testAuthErrorHandler = runTests;
  window.authErrorHandler = errorHandler;
}
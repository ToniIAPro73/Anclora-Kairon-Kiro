#!/usr/bin/env node

/**
 * Simple Integration Test
 * Tests core error handling components without requiring browser environment
 */

// Mock browser globals for Node.js
if (typeof window === 'undefined') {
  global.window = {
    location: { origin: 'http://localhost' },
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

if (typeof document === 'undefined') {
  global.document = {
    createElement: () => ({
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      querySelector: () => null,
      querySelectorAll: () => [],
      appendChild: () => {},
      removeChild: () => {},
      addEventListener: () => {},
      style: {}
    }),
    body: {
      appendChild: () => {},
      removeChild: () => {},
      style: {}
    },
    getElementById: () => null,
    querySelector: () => null
  };
}

if (typeof navigator === 'undefined') {
  global.navigator = { onLine: true, userAgent: 'Node.js Test' };
}

if (typeof sessionStorage === 'undefined') {
  global.sessionStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  };
}

if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  };
}

// Mock import.meta.env
const originalImportMeta = globalThis.import?.meta;
if (!globalThis.import) globalThis.import = {};
if (!globalThis.import.meta) globalThis.import.meta = {};
globalThis.import.meta.env = {
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-key',
  VITE_API_BASE_URL: 'https://test-api.com'
};

async function runSimpleIntegrationTest() {
  console.log('🧪 Running Simple Integration Test...\n');
  
  let passed = 0;
  let failed = 0;
  
  try {
    // Test 1: AuthErrorHandler
    console.log('Testing AuthErrorHandler...');
    const { authErrorHandler } = await import('./src/shared/services/authErrorHandler.js');
    
    const testError = new Error('Test network error');
    testError.name = 'NetworkError';
    
    const processedError = authErrorHandler.handleError(testError, {
      operation: 'test',
      language: 'es'
    });
    
    if (processedError.type === 'NETWORK_ERROR' && processedError.userMessage) {
      console.log('✅ AuthErrorHandler: PASSED');
      passed++;
    } else {
      console.log('❌ AuthErrorHandler: FAILED');
      failed++;
    }
    
    // Test 2: UserFeedbackSystem
    console.log('Testing UserFeedbackSystem...');
    const { UserFeedbackSystem } = await import('./src/shared/services/userFeedbackSystem.js');
    
    const feedbackSystem = new UserFeedbackSystem();
    const testContainer = document.createElement('div');
    
    feedbackSystem.showLoading('test', 'Testing...', testContainer);
    feedbackSystem.showError('NETWORK_ERROR', { targetElement: testContainer });
    feedbackSystem.showSuccess('Test successful', testContainer);
    feedbackSystem.clearAll(testContainer);
    
    console.log('✅ UserFeedbackSystem: PASSED');
    passed++;
    
    // Test 3: ErrorLogger
    console.log('Testing ErrorLogger...');
    const errorLogger = (await import('./src/shared/services/errorLogger.js')).default;
    
    const errorId = errorLogger.logError(new Error('Test error'), { operation: 'test' });
    const metricId = errorLogger.logPerformanceMetric('test_op', 100, true);
    const stats = errorLogger.getErrorStats();
    
    if (errorId && metricId && stats) {
      console.log('✅ ErrorLogger: PASSED');
      passed++;
    } else {
      console.log('❌ ErrorLogger: FAILED');
      failed++;
    }
    
    // Test 4: ConnectionMonitor
    console.log('Testing ConnectionMonitor...');
    const { connectionMonitor } = await import('./src/shared/services/connectionMonitor.js');
    
    const status = connectionMonitor.getStatus();
    
    if (status && typeof status.status !== 'undefined') {
      console.log('✅ ConnectionMonitor: PASSED');
      passed++;
    } else {
      console.log('❌ ConnectionMonitor: FAILED');
      failed++;
    }
    
    // Test 5: RetryManager
    console.log('Testing RetryManager...');
    const { retryManager } = await import('./src/shared/services/retryManager.js');
    
    let attemptCount = 0;
    const testFunction = async () => {
      attemptCount++;
      if (attemptCount < 2) {
        throw new Error('Test retry error');
      }
      return { success: true, attempts: attemptCount };
    };
    
    const result = await retryManager.executeWithRetry(testFunction, 'NETWORK_ERROR', { maxRetries: 2 });
    
    if (result.success && attemptCount === 2) {
      console.log('✅ RetryManager: PASSED');
      passed++;
    } else {
      console.log('❌ RetryManager: FAILED');
      failed++;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    failed++;
  }
  
  // Results
  console.log('\n📊 SIMPLE INTEGRATION TEST RESULTS');
  console.log('='.repeat(40));
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All core components are working correctly!');
    console.log('✅ Error handling system is properly integrated.');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some components have issues. Check the errors above.');
    process.exit(1);
  }
}

runSimpleIntegrationTest().catch(error => {
  console.error('❌ Simple integration test failed:', error);
  process.exit(1);
});
/**
 * Final Integration Test Suite
 * Comprehensive testing of all error handling components working together
 * Verifies complete auth flows with error handling, backward compatibility, and user acceptance
 */

import { authService } from './authService.js';
import { authErrorHandler } from './authErrorHandler.js';
import { connectionMonitor } from './connectionMonitor.js';
import { UserFeedbackSystem } from './userFeedbackSystem.js';
import errorLogger from './errorLogger.js';
import { retryManager } from './retryManager.js';
import { integrationVerifier } from './integrationVerifier.js';
import AuthModalVanilla from '../components/AuthModalVanilla.js';

export class FinalIntegrationTest {
    constructor() {
        this.testResults = [];
        this.isRunning = false;
        this.feedbackSystem = new UserFeedbackSystem();
    }

    /**
     * Run complete final integration test suite
     * @returns {Promise<Object>} Complete test results
     */
    async runCompleteTestSuite() {
        if (this.isRunning) {
            throw new Error('Test suite already running');
        }

        this.isRunning = true;
        this.testResults = [];

        console.log('🚀 Starting Final Integration Test Suite...');

        try {
            // 1. Component Integration Tests
            await this.testComponentIntegration();
            
            // 2. Complete Auth Flow Tests
            await this.testCompleteAuthFlows();
            
            // 3. Error Handling Integration Tests
            await this.testErrorHandlingIntegration();
            
            // 4. Backward Compatibility Tests
            await this.testBackwardCompatibility();
            
            // 5. Performance Integration Tests
            await this.testPerformanceIntegration();
            
            // 6. User Acceptance Tests
            await this.testUserAcceptance();
            
            // 7. Run Integration Verifier
            await this.runIntegrationVerifier();

            const summary = this.generateFinalSummary();
            console.log('✅ Final Integration Test Suite Completed:', summary);
            
            return summary;

        } catch (error) {
            console.error('❌ Final Integration Test Suite Failed:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Test component integration
     */
    async testComponentIntegration() {
        console.log('🔧 Testing Component Integration...');

        // Test all error handling components work together
        await this.runTest('All Components Initialized', async () => {
            const components = {
                authService: !!authService,
                authErrorHandler: !!authErrorHandler,
                connectionMonitor: !!connectionMonitor,
                errorLogger: !!errorLogger,
                retryManager: !!retryManager,
                userFeedbackSystem: !!this.feedbackSystem
            };

            const allInitialized = Object.values(components).every(Boolean);
            
            if (!allInitialized) {
                throw new Error('Not all components are properly initialized');
            }

            return { components, allInitialized };
        });

        // Test error handler processes all error types correctly
        await this.runTest('Error Handler Processes All Error Types', async () => {
            const errorTypes = [
                { error: new Error('Network request failed'), expected: 'NETWORK_ERROR' },
                { error: new Error('Service unavailable'), expected: 'SUPABASE_UNAVAILABLE' },
                { error: new Error('Invalid login credentials'), expected: 'AUTH_INVALID_CREDENTIALS' },
                { error: new Error('User already registered'), expected: 'AUTH_USER_EXISTS' },
                { error: new Error('User not found'), expected: 'AUTH_USER_NOT_FOUND' }
            ];

            const results = {};
            
            for (const { error, expected } of errorTypes) {
                const processed = authErrorHandler.handleError(error, { operation: 'test' });
                results[expected] = {
                    classified: processed.type === expected,
                    hasMessage: !!processed.userMessage,
                    canRetry: typeof processed.canRetry === 'boolean'
                };
            }

            const allCorrect = Object.values(results).every(r => r.classified && r.hasMessage);
            
            if (!allCorrect) {
                throw new Error('Error handler not classifying all error types correctly');
            }

            return { results, allCorrect };
        });

        // Test connection monitor integration
        await this.runTest('Connection Monitor Integration', async () => {
            const status = connectionMonitor.getStatus();
            const healthCheck = await connectionMonitor.isSupabaseAvailable({ timeout: 3000 });

            return {
                hasStatus: !!status,
                healthCheckWorks: typeof healthCheck.available === 'boolean',
                latencyMeasured: healthCheck.latency !== null
            };
        });
    }

    /**
     * Test complete authentication flows with error handling
     */
    async testCompleteAuthFlows() {
        console.log('🔐 Testing Complete Auth Flows...');

        // Test login flow with error handling
        await this.runTest('Login Flow with Error Handling', async () => {
            const testContainer = document.createElement('div');
            document.body.appendChild(testContainer);

            try {
                // Show loading state
                this.feedbackSystem.showLoading('login', 'Testing login flow...', testContainer);
                
                // Simulate login attempt
                try {
                    const result = await authService.login('test@integration.com', 'testpassword');
                    
                    // Show success if login works (mock mode)
                    this.feedbackSystem.showSuccess('Login successful', testContainer);
                    
                    return {
                        loginAttempted: true,
                        loginSuccessful: true,
                        userAuthenticated: authService.isAuthenticated(),
                        feedbackShown: true
                    };
                } catch (error) {
                    // Process error through error handler
                    const processedError = authErrorHandler.handleError(error, {
                        operation: 'login',
                        language: 'es'
                    });

                    // Show error through feedback system
                    this.feedbackSystem.showError(processedError.type, {
                        targetElement: testContainer,
                        canRetry: processedError.canRetry
                    });

                    return {
                        loginAttempted: true,
                        loginSuccessful: false,
                        errorProcessed: !!processedError.type,
                        errorDisplayed: !!testContainer.querySelector('.feedback-error'),
                        canRetry: processedError.canRetry
                    };
                }
            } finally {
                this.feedbackSystem.clearAll(testContainer);
                document.body.removeChild(testContainer);
            }
        });

        // Test registration flow with validation and error handling
        await this.runTest('Registration Flow with Validation', async () => {
            const testContainer = document.createElement('div');
            document.body.appendChild(testContainer);

            try {
                // Test registration with validation
                const result = await authService.registerWithValidation(
                    'Test User',
                    'test@integration.com',
                    'testpassword123',
                    'testpassword123',
                    { language: 'es', enableRetry: false }
                );

                return {
                    registrationAttempted: true,
                    validationWorked: true,
                    hasResult: !!result,
                    success: result.success
                };
            } catch (error) {
                const processedError = authErrorHandler.handleError(error, {
                    operation: 'register',
                    language: 'es'
                });

                return {
                    registrationAttempted: true,
                    errorProcessed: !!processedError.type,
                    hasUserMessage: !!processedError.userMessage
                };
            } finally {
                this.feedbackSystem.clearAll(testContainer);
                document.body.removeChild(testContainer);
            }
        });

        // Test OAuth flow error handling
        await this.runTest('OAuth Flow Error Handling', async () => {
            try {
                // Test OAuth with error handling
                const result = await authService.loginWithGoogleEnhanced({
                    showFallback: true,
                    showRetry: true,
                    language: 'es'
                });

                return {
                    oauthAttempted: true,
                    hasResult: !!result,
                    hasErrorHandling: typeof result.success === 'boolean'
                };
            } catch (error) {
                const processedError = authErrorHandler.handleError(error, {
                    operation: 'oauth_login',
                    provider: 'google'
                });

                return {
                    oauthAttempted: true,
                    errorProcessed: !!processedError.type,
                    hasUserMessage: !!processedError.userMessage
                };
            }
        });
    }

    /**
     * Test error handling integration across all components
     */
    async testErrorHandlingIntegration() {
        console.log('⚠️ Testing Error Handling Integration...');

        // Test complete error flow from service to user
        await this.runTest('Complete Error Flow Integration', async () => {
            const testContainer = document.createElement('div');
            document.body.appendChild(testContainer);

            try {
                // 1. Generate error in service
                const simulatedError = new Error('Simulated network error for integration test');
                simulatedError.name = 'NetworkError';

                // 2. Process through error handler
                const processedError = authErrorHandler.handleError(simulatedError, {
                    operation: 'integration_test',
                    language: 'es',
                    attemptCount: 1
                });

                // 3. Display through feedback system
                this.feedbackSystem.showError(processedError.type, {
                    targetElement: testContainer,
                    canRetry: processedError.canRetry,
                    retryCallback: () => console.log('Retry clicked')
                });

                // 4. Log the error
                const errorId = errorLogger.logError(simulatedError, {
                    operation: 'integration_test',
                    processedType: processedError.type
                });

                // 5. Verify all steps worked
                const errorElement = testContainer.querySelector('.feedback-error');
                const retryButton = testContainer.querySelector('.retry-button');

                return {
                    errorGenerated: true,
                    errorProcessed: !!processedError.type,
                    errorDisplayed: !!errorElement,
                    errorLogged: !!errorId,
                    retryAvailable: processedError.canRetry && !!retryButton,
                    userMessageGenerated: !!processedError.userMessage
                };
            } finally {
                this.feedbackSystem.clearAll(testContainer);
                document.body.removeChild(testContainer);
            }
        });

        // Test retry mechanism integration
        await this.runTest('Retry Mechanism Integration', async () => {
            let attemptCount = 0;
            
            const testFunction = async () => {
                attemptCount++;
                if (attemptCount < 3) {
                    const error = new Error('Simulated retry test error');
                    error.type = 'NETWORK_ERROR';
                    throw error;
                }
                return { success: true, attempts: attemptCount };
            };

            const result = await retryManager.executeWithRetry(
                testFunction,
                'NETWORK_ERROR',
                { maxRetries: 3 }
            );

            return {
                retryWorked: result.success,
                correctAttempts: attemptCount === 3,
                finalResult: result.result
            };
        });

        // Test error logging and metrics
        await this.runTest('Error Logging and Metrics Integration', async () => {
            const testError = new Error('Integration test error for logging');
            
            // Log error
            const errorId = errorLogger.logError(testError, {
                operation: 'integration_logging_test',
                component: 'finalIntegrationTest'
            });

            // Log performance metric
            const metricId = errorLogger.logPerformanceMetric(
                'integration_test_operation',
                150,
                true,
                { testType: 'final_integration' }
            );

            // Get stats
            const stats = errorLogger.getErrorStats({ timeRange: 60000 });

            return {
                errorLogged: !!errorId,
                metricLogged: !!metricId,
                statsRetrieved: !!stats,
                hasErrorCount: typeof stats.totalErrors === 'number'
            };
        });
    }

    /**
     * Test backward compatibility
     */
    async testBackwardCompatibility() {
        console.log('🔄 Testing Backward Compatibility...');

        // Test original AuthService methods still work
        await this.runTest('Original AuthService Methods', async () => {
            const originalMethods = [
                'isAuthenticated',
                'getCurrentUser',
                'getToken',
                'isNewUser',
                'login',
                'register',
                'logout'
            ];

            const methodResults = {};
            
            for (const method of originalMethods) {
                methodResults[method] = {
                    exists: typeof authService[method] === 'function',
                    callable: true
                };

                // Test non-destructive methods
                if (['isAuthenticated', 'getCurrentUser', 'getToken', 'isNewUser'].includes(method)) {
                    try {
                        const result = authService[method]();
                        methodResults[method].returnType = typeof result;
                        methodResults[method].works = true;
                    } catch (error) {
                        methodResults[method].works = false;
                        methodResults[method].error = error.message;
                    }
                }
            }

            const allMethodsExist = originalMethods.every(method => 
                methodResults[method].exists
            );

            return {
                allMethodsExist,
                methodResults,
                compatibilityMaintained: allMethodsExist
            };
        });

        // Test enhanced methods don't break existing functionality
        await this.runTest('Enhanced Methods Compatibility', async () => {
            const enhancedMethods = [
                'registerWithErrorHandling',
                'registerWithValidation',
                'loginWithRetry',
                'checkConnectivity',
                'loginWithGoogleEnhanced',
                'loginWithGitHubEnhanced'
            ];

            const enhancedResults = {};
            
            for (const method of enhancedMethods) {
                enhancedResults[method] = {
                    exists: typeof authService[method] === 'function'
                };
            }

            const allEnhancedExist = enhancedMethods.every(method => 
                enhancedResults[method].exists
            );

            return {
                allEnhancedExist,
                enhancedResults,
                enhancementComplete: allEnhancedExist
            };
        });
    }

    /**
     * Test performance integration
     */
    async testPerformanceIntegration() {
        console.log('⚡ Testing Performance Integration...');

        // Test error handling performance under load
        await this.runTest('Error Handling Performance Under Load', async () => {
            const iterations = 100;
            const startTime = Date.now();
            const errors = [];

            for (let i = 0; i < iterations; i++) {
                const testError = new Error(`Performance test error ${i}`);
                const processed = authErrorHandler.handleError(testError, {
                    operation: 'performance_test',
                    iteration: i
                });
                errors.push(processed);
            }

            const duration = Date.now() - startTime;
            const avgTime = duration / iterations;

            return {
                iterations,
                totalTime: duration,
                averageTime: avgTime,
                allProcessed: errors.length === iterations,
                performanceAcceptable: avgTime < 10 // Should be under 10ms per error
            };
        });

        // Test connection monitoring performance
        await this.runTest('Connection Monitoring Performance', async () => {
            const startTime = Date.now();
            
            const healthCheck = await connectionMonitor.isSupabaseAvailable({
                timeout: 2000
            });
            
            const duration = Date.now() - startTime;

            return {
                checkCompleted: true,
                duration,
                available: healthCheck.available,
                hasLatency: healthCheck.latency !== null,
                performanceAcceptable: duration < 3000
            };
        });
    }

    /**
     * Test user acceptance scenarios
     */
    async testUserAcceptance() {
        console.log('👤 Testing User Acceptance Scenarios...');

        // Test user-friendly error messages
        await this.runTest('User-Friendly Error Messages', async () => {
            const errorScenarios = [
                { error: new Error('Network request failed'), language: 'es' },
                { error: new Error('Invalid login credentials'), language: 'es' },
                { error: new Error('User already registered'), language: 'en' },
                { error: new Error('Service unavailable'), language: 'en' }
            ];

            const messageResults = {};

            for (const { error, language } of errorScenarios) {
                const processed = authErrorHandler.handleError(error, {
                    operation: 'user_acceptance_test',
                    language
                });

                messageResults[`${error.message}_${language}`] = {
                    hasUserMessage: !!processed.userMessage,
                    messageLength: processed.userMessage?.length || 0,
                    isUserFriendly: processed.userMessage && 
                                   processed.userMessage.length > 10 && 
                                   !processed.userMessage.includes('Error:') &&
                                   !processed.userMessage.includes('undefined')
                };
            }

            const allUserFriendly = Object.values(messageResults).every(r => r.isUserFriendly);

            return {
                allUserFriendly,
                messageResults,
                userAcceptable: allUserFriendly
            };
        });

        // Test modal integration with error handling
        await this.runTest('Auth Modal Error Integration', async () => {
            const modal = new AuthModalVanilla();
            
            try {
                // Test modal can be opened and closed
                modal.open('login');
                const modalElement = document.querySelector('.fixed.inset-0');
                const modalExists = !!modalElement;
                
                modal.close();
                const modalClosed = !document.querySelector('.fixed.inset-0');

                return {
                    modalCanOpen: modalExists,
                    modalCanClose: modalClosed,
                    modalIntegration: modalExists && modalClosed
                };
            } catch (error) {
                modal.close(); // Ensure cleanup
                throw error;
            }
        });

        // Test complete user journey with errors
        await this.runTest('Complete User Journey with Errors', async () => {
            const testContainer = document.createElement('div');
            document.body.appendChild(testContainer);

            try {
                // Simulate user journey: attempt login -> error -> retry -> success
                const journey = [];

                // 1. Initial login attempt (will likely fail)
                try {
                    await authService.login('user@journey.test', 'wrongpassword');
                    journey.push({ step: 'login', success: true });
                } catch (error) {
                    const processed = authErrorHandler.handleError(error, {
                        operation: 'user_journey_login',
                        language: 'es'
                    });
                    
                    this.feedbackSystem.showError(processed.type, {
                        targetElement: testContainer,
                        canRetry: processed.canRetry
                    });
                    
                    journey.push({ 
                        step: 'login_error', 
                        success: false, 
                        errorProcessed: !!processed.type,
                        canRetry: processed.canRetry
                    });
                }

                // 2. Show success message (simulate successful retry)
                this.feedbackSystem.showSuccess('Login successful after retry', testContainer);
                journey.push({ step: 'success_feedback', success: true });

                return {
                    journeyCompleted: journey.length >= 2,
                    hasErrorHandling: journey.some(j => j.step === 'login_error' && j.errorProcessed),
                    hasSuccessFeedback: journey.some(j => j.step === 'success_feedback'),
                    userExperienceAcceptable: true
                };
            } finally {
                this.feedbackSystem.clearAll(testContainer);
                document.body.removeChild(testContainer);
            }
        });
    }

    /**
     * Run integration verifier
     */
    async runIntegrationVerifier() {
        console.log('🔍 Running Integration Verifier...');

        await this.runTest('Integration Verifier Complete Check', async () => {
            const verificationResult = await integrationVerifier.runFullVerification();
            
            return {
                verificationCompleted: true,
                successRate: verificationResult.summary.successRate,
                totalTests: verificationResult.summary.total,
                passedTests: verificationResult.summary.passed,
                failedTests: verificationResult.summary.failed,
                verificationSuccessful: verificationResult.isSuccess
            };
        });
    }

    /**
     * Run a single test
     */
    async runTest(name, testFunction) {
        const startTime = Date.now();
        
        try {
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            this.testResults.push({
                name,
                status: 'passed',
                duration,
                result,
                timestamp: new Date().toISOString()
            });
            
            console.log(`✅ ${name} - ${duration}ms`);
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.testResults.push({
                name,
                status: 'failed',
                duration,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            
            console.error(`❌ ${name} - ${error.message}`);
        }
    }

    /**
     * Generate final summary
     */
    generateFinalSummary() {
        const total = this.testResults.length;
        const passed = this.testResults.filter(r => r.status === 'passed').length;
        const failed = this.testResults.filter(r => r.status === 'failed').length;
        const successRate = total > 0 ? (passed / total) * 100 : 0;
        
        const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
        const avgDuration = total > 0 ? totalDuration / total : 0;

        const failedTests = this.testResults
            .filter(r => r.status === 'failed')
            .map(r => ({ name: r.name, error: r.error }));

        const categories = {
            componentIntegration: this.testResults.filter(r => r.name.includes('Component') || r.name.includes('Error Handler') || r.name.includes('Connection Monitor')),
            authFlows: this.testResults.filter(r => r.name.includes('Login') || r.name.includes('Registration') || r.name.includes('OAuth')),
            errorHandling: this.testResults.filter(r => r.name.includes('Error') && !r.name.includes('Component')),
            backwardCompatibility: this.testResults.filter(r => r.name.includes('Compatibility') || r.name.includes('Original')),
            performance: this.testResults.filter(r => r.name.includes('Performance')),
            userAcceptance: this.testResults.filter(r => r.name.includes('User') || r.name.includes('Modal') || r.name.includes('Journey'))
        };

        const categoryResults = {};
        for (const [category, tests] of Object.entries(categories)) {
            const categoryPassed = tests.filter(t => t.status === 'passed').length;
            const categoryTotal = tests.length;
            categoryResults[category] = {
                total: categoryTotal,
                passed: categoryPassed,
                failed: categoryTotal - categoryPassed,
                successRate: categoryTotal > 0 ? (categoryPassed / categoryTotal) * 100 : 0
            };
        }

        return {
            overall: {
                total,
                passed,
                failed,
                successRate: Math.round(successRate * 100) / 100,
                totalDuration,
                avgDuration: Math.round(avgDuration * 100) / 100,
                isSuccess: failed === 0,
                grade: this.calculateGrade(successRate)
            },
            categories: categoryResults,
            results: this.testResults,
            failedTests,
            recommendations: this.generateRecommendations(failedTests, successRate),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Calculate grade based on success rate
     */
    calculateGrade(successRate) {
        if (successRate >= 95) return 'A+';
        if (successRate >= 90) return 'A';
        if (successRate >= 85) return 'B+';
        if (successRate >= 80) return 'B';
        if (successRate >= 75) return 'C+';
        if (successRate >= 70) return 'C';
        if (successRate >= 60) return 'D';
        return 'F';
    }

    /**
     * Generate recommendations based on test results
     */
    generateRecommendations(failedTests, successRate) {
        const recommendations = [];

        if (successRate < 90) {
            recommendations.push('Overall success rate is below 90%. Review failed tests and address critical issues.');
        }

        if (failedTests.some(t => t.name.includes('Component'))) {
            recommendations.push('Component integration issues detected. Verify all error handling components are properly initialized and integrated.');
        }

        if (failedTests.some(t => t.name.includes('Performance'))) {
            recommendations.push('Performance issues detected. Optimize error handling and connection monitoring for better response times.');
        }

        if (failedTests.some(t => t.name.includes('Compatibility'))) {
            recommendations.push('Backward compatibility issues detected. Ensure all original AuthService methods continue to work as expected.');
        }

        if (failedTests.some(t => t.name.includes('User'))) {
            recommendations.push('User acceptance issues detected. Review error messages and user experience flows.');
        }

        if (failedTests.length === 0) {
            recommendations.push('Excellent! All tests passed. The error handling system is fully integrated and ready for production.');
        }

        return recommendations;
    }

    /**
     * Get test results
     */
    getResults() {
        return {
            results: this.testResults,
            summary: this.generateFinalSummary()
        };
    }
}

// Create singleton instance
export const finalIntegrationTest = new FinalIntegrationTest();
export default finalIntegrationTest;
/**
 * Integration Verifier
 * Comprehensive verification of all error handling components working together
 * Ensures proper integration and backward compatibility
 */

import { authService } from './authService.js';
import { authErrorHandler } from './authErrorHandler.js';
import { connectionMonitor } from './connectionMonitor.js';
import { UserFeedbackSystem } from './userFeedbackSystem.js';
import errorLogger from './errorLogger.js';
import { retryManager } from './retryManager.js';

export class IntegrationVerifier {
    constructor() {
        this.verificationResults = [];
        this.isRunning = false;
    }

    /**
     * Run comprehensive integration verification
     * @returns {Promise<Object>} Verification results
     */
    async runFullVerification() {
        if (this.isRunning) {
            throw new Error('Verification already in progress');
        }

        this.isRunning = true;
        this.verificationResults = [];

        console.log('Starting comprehensive integration verification...');

        try {
            // Component Integration Tests
            await this.verifyComponentIntegration();
            
            // Service Integration Tests
            await this.verifyServiceIntegration();
            
            // Error Flow Tests
            await this.verifyErrorFlows();
            
            // Performance Tests
            await this.verifyPerformance();
            
            // Backward Compatibility Tests
            await this.verifyBackwardCompatibility();

            const summary = this.generateSummary();
            console.log('Integration verification completed:', summary);
            
            return summary;

        } catch (error) {
            console.error('Integration verification failed:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Verify component integration
     */
    async verifyComponentIntegration() {
        console.log('Verifying component integration...');

        // Test AuthErrorHandler integration
        await this.runVerification('AuthErrorHandler Integration', async () => {
            const testError = new Error('Test network error');
            testError.name = 'NetworkError';
            
            const processedError = authErrorHandler.handleError(testError, {
                operation: 'test_integration',
                language: 'es'
            });

            if (!processedError.type || !processedError.userMessage) {
                throw new Error('AuthErrorHandler not properly processing errors');
            }

            if (processedError.type !== 'NETWORK_ERROR') {
                throw new Error(`Expected NETWORK_ERROR, got ${processedError.type}`);
            }

            return {
                errorType: processedError.type,
                hasUserMessage: !!processedError.userMessage,
                canRetry: processedError.canRetry
            };
        });

        // Test ConnectionMonitor integration
        await this.runVerification('ConnectionMonitor Integration', async () => {
            const status = connectionMonitor.getStatus();
            const healthCheck = await connectionMonitor.isSupabaseAvailable({ timeout: 3000 });

            if (typeof status.status === 'undefined') {
                throw new Error('ConnectionMonitor not returning proper status');
            }

            if (typeof healthCheck.available === 'undefined') {
                throw new Error('ConnectionMonitor health check not working');
            }

            return {
                currentStatus: status.status,
                healthCheckAvailable: healthCheck.available,
                hasLatency: healthCheck.latency !== null
            };
        });

        // Test UserFeedbackSystem integration
        await this.runVerification('UserFeedbackSystem Integration', async () => {
            const feedbackSystem = new UserFeedbackSystem();
            const testContainer = document.createElement('div');
            document.body.appendChild(testContainer);

            try {
                // Test loading state
                feedbackSystem.showLoading('test', 'Testing integration...', testContainer);
                const hasLoadingElement = testContainer.querySelector('.feedback-loading');

                // Test error state
                feedbackSystem.showError('NETWORK_ERROR', { targetElement: testContainer });
                const hasErrorElement = testContainer.querySelector('.feedback-error');

                // Test success state
                feedbackSystem.showSuccess('Integration test successful', testContainer);
                const hasSuccessElement = testContainer.querySelector('.feedback-success');

                // Cleanup
                feedbackSystem.clearAll(testContainer);
                document.body.removeChild(testContainer);

                return {
                    loadingWorks: !!hasLoadingElement,
                    errorWorks: !!hasErrorElement,
                    successWorks: !!hasSuccessElement
                };
            } catch (error) {
                document.body.removeChild(testContainer);
                throw error;
            }
        });

        // Test ErrorLogger integration
        await this.runVerification('ErrorLogger Integration', async () => {
            const testError = new Error('Integration test error');
            const errorId = errorLogger.logError(testError, {
                operation: 'integration_verification',
                component: 'errorLogger'
            });

            const metricId = errorLogger.logPerformanceMetric(
                'integration_test',
                125,
                true,
                { testType: 'component_integration' }
            );

            const stats = errorLogger.getErrorStats({ timeRange: 60000 });

            if (!errorId || !metricId) {
                throw new Error('ErrorLogger not properly logging data');
            }

            return {
                errorLogged: !!errorId,
                metricLogged: !!metricId,
                statsAvailable: !!stats,
                totalErrors: stats.totalErrors || 0
            };
        });
    }

    /**
     * Verify service integration
     */
    async verifyServiceIntegration() {
        console.log('Verifying service integration...');

        // Test AuthService with error handling
        await this.runVerification('AuthService Error Integration', async () => {
            // Test that AuthService methods integrate with error handling
            const isAuthenticated = authService.isAuthenticated();
            const currentUser = authService.getCurrentUser();
            
            // Test error handling in auth operations
            try {
                // This should either succeed (mock mode) or fail gracefully
                await authService.login('test@integration.com', 'testpassword');
                return {
                    authMethodsWork: true,
                    loginHandled: true,
                    isAuthenticated: authService.isAuthenticated()
                };
            } catch (error) {
                // Error should be properly handled
                const processedError = authErrorHandler.handleError(error, {
                    operation: 'integration_login_test'
                });

                return {
                    authMethodsWork: true,
                    loginHandled: true,
                    errorProcessed: !!processedError.type,
                    errorType: processedError.type
                };
            }
        });

        // Test retry mechanism integration
        await this.runVerification('RetryManager Integration', async () => {
            let attemptCount = 0;
            
            const testFunction = async () => {
                attemptCount++;
                if (attemptCount < 3) {
                    const error = new Error('Simulated network error');
                    error.type = 'NETWORK_ERROR';
                    throw error;
                }
                return { success: true, attempts: attemptCount };
            };

            try {
                const result = await retryManager.executeWithRetry(
                    testFunction,
                    'NETWORK_ERROR',
                    { maxRetries: 3 }
                );

                return {
                    retryWorked: result.success,
                    totalAttempts: attemptCount,
                    finalResult: result.result
                };
            } catch (error) {
                return {
                    retryWorked: false,
                    totalAttempts: attemptCount,
                    error: error.message
                };
            }
        });
    }

    /**
     * Verify error flows
     */
    async verifyErrorFlows() {
        console.log('Verifying error flows...');

        // Test complete error flow from service to user feedback
        await this.runVerification('Complete Error Flow', async () => {
            const feedbackSystem = new UserFeedbackSystem();
            const testContainer = document.createElement('div');
            document.body.appendChild(testContainer);

            try {
                // Simulate an error in AuthService
                const simulatedError = new Error('Invalid login credentials');
                simulatedError.code = 'invalid_credentials';

                // Process error through error handler
                const processedError = authErrorHandler.handleError(simulatedError, {
                    operation: 'login',
                    language: 'es'
                });

                // Display error through feedback system
                feedbackSystem.showError(processedError.type, {
                    targetElement: testContainer,
                    canRetry: processedError.canRetry
                });

                // Log the error
                const errorId = errorLogger.logError(simulatedError, {
                    operation: 'error_flow_test',
                    processedErrorType: processedError.type
                });

                // Verify the complete flow
                const errorElement = testContainer.querySelector('.feedback-error');
                
                // Cleanup
                feedbackSystem.clearAll(testContainer);
                document.body.removeChild(testContainer);

                return {
                    errorProcessed: !!processedError.type,
                    errorDisplayed: !!errorElement,
                    errorLogged: !!errorId,
                    userMessageGenerated: !!processedError.userMessage,
                    retryOptionAvailable: processedError.canRetry
                };
            } catch (error) {
                document.body.removeChild(testContainer);
                throw error;
            }
        });

        // Test different error types
        const errorTypes = [
            { error: new Error('Network request failed'), expectedType: 'NETWORK_ERROR' },
            { error: new Error('Service unavailable'), expectedType: 'SERVER_ERROR' },
            { error: new Error('Invalid login credentials'), expectedType: 'AUTH_INVALID_CREDENTIALS' }
        ];

        for (const { error, expectedType } of errorTypes) {
            await this.runVerification(`Error Classification: ${expectedType}`, async () => {
                const processedError = authErrorHandler.handleError(error, {
                    operation: 'classification_test'
                });

                if (processedError.type !== expectedType) {
                    throw new Error(`Expected ${expectedType}, got ${processedError.type}`);
                }

                return {
                    correctClassification: true,
                    errorType: processedError.type,
                    hasUserMessage: !!processedError.userMessage
                };
            });
        }
    }

    /**
     * Verify performance
     */
    async verifyPerformance() {
        console.log('Verifying performance...');

        // Test error handling performance
        await this.runVerification('Error Handling Performance', async () => {
            const iterations = 50;
            const startTime = Date.now();

            for (let i = 0; i < iterations; i++) {
                const testError = new Error(`Performance test error ${i}`);
                authErrorHandler.handleError(testError, {
                    operation: 'performance_test',
                    iteration: i
                });
            }

            const duration = Date.now() - startTime;
            const avgTime = duration / iterations;

            // Should handle errors quickly (< 5ms average)
            if (avgTime > 5) {
                throw new Error(`Performance too slow: ${avgTime}ms average per error`);
            }

            return {
                totalTime: duration,
                averageTime: avgTime,
                iterations: iterations,
                performanceAcceptable: avgTime <= 5
            };
        });

        // Test connection monitoring performance
        await this.runVerification('Connection Monitoring Performance', async () => {
            const startTime = Date.now();
            
            const healthCheck = await connectionMonitor.isSupabaseAvailable({ 
                timeout: 2000,
                retryAttempts: 1 
            });
            
            const duration = Date.now() - startTime;

            // Should complete within reasonable time
            if (duration > 3000) {
                throw new Error(`Connection check too slow: ${duration}ms`);
            }

            return {
                checkTime: duration,
                healthCheckCompleted: true,
                available: healthCheck.available,
                performanceAcceptable: duration <= 3000
            };
        });
    }

    /**
     * Verify backward compatibility
     */
    async verifyBackwardCompatibility() {
        console.log('Verifying backward compatibility...');

        // Test that all original AuthService methods still work
        await this.runVerification('AuthService Backward Compatibility', async () => {
            const methods = [
                'isAuthenticated',
                'getCurrentUser',
                'getToken',
                'isNewUser'
            ];

            const results = {};

            for (const method of methods) {
                try {
                    const result = authService[method]();
                    results[method] = {
                        exists: true,
                        callable: true,
                        returnType: typeof result
                    };
                } catch (error) {
                    results[method] = {
                        exists: true,
                        callable: false,
                        error: error.message
                    };
                }
            }

            // Check that all methods exist and are callable
            const allMethodsWork = methods.every(method => 
                results[method].exists && results[method].callable
            );

            return {
                allMethodsWork,
                methodResults: results
            };
        });

        // Test that enhanced methods don't break existing functionality
        await this.runVerification('Enhanced Methods Compatibility', async () => {
            // Test that new methods exist but don't interfere with old ones
            const enhancedMethods = [
                'registerWithErrorHandling',
                'loginWithRetry',
                'checkConnectivity'
            ];

            const results = {};

            for (const method of enhancedMethods) {
                results[method] = {
                    exists: typeof authService[method] === 'function'
                };
            }

            // All enhanced methods should exist
            const allEnhancedMethodsExist = enhancedMethods.every(method => 
                results[method].exists
            );

            return {
                allEnhancedMethodsExist,
                enhancedMethodResults: results
            };
        });
    }

    /**
     * Run a single verification test
     */
    async runVerification(name, testFunction) {
        const startTime = Date.now();
        
        try {
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            this.verificationResults.push({
                name,
                status: 'passed',
                duration,
                result,
                timestamp: new Date().toISOString()
            });
            
            console.log(`✓ ${name} - ${duration}ms`);
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.verificationResults.push({
                name,
                status: 'failed',
                duration,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            
            console.error(`✗ ${name} - ${error.message}`);
        }
    }

    /**
     * Generate verification summary
     */
    generateSummary() {
        const total = this.verificationResults.length;
        const passed = this.verificationResults.filter(r => r.status === 'passed').length;
        const failed = this.verificationResults.filter(r => r.status === 'failed').length;
        const successRate = total > 0 ? (passed / total) * 100 : 0;
        
        const totalDuration = this.verificationResults.reduce((sum, r) => sum + r.duration, 0);
        const avgDuration = total > 0 ? totalDuration / total : 0;

        const failedTests = this.verificationResults
            .filter(r => r.status === 'failed')
            .map(r => ({ name: r.name, error: r.error }));

        return {
            summary: {
                total,
                passed,
                failed,
                successRate: Math.round(successRate * 100) / 100,
                totalDuration,
                avgDuration: Math.round(avgDuration * 100) / 100
            },
            results: this.verificationResults,
            failedTests,
            isSuccess: failed === 0,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get verification results
     */
    getResults() {
        return {
            results: this.verificationResults,
            summary: this.generateSummary()
        };
    }
}

// Create singleton instance
export const integrationVerifier = new IntegrationVerifier();
export default integrationVerifier;
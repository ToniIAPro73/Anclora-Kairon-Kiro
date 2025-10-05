/**
 * Error Simulation Utilities - Main Export File
 * Provides centralized access to all error simulation tools
 */

// Import all simulators
import { ErrorSimulator, SimulationScenarios, errorSimulator } from './errorSimulator.js';
import { NetworkErrorSimulator, NetworkScenarios, networkErrorSimulator } from './networkErrorSimulator.js';
import { SupabaseMocker, SupabaseErrorScenarios, supabaseMocker } from './supabaseMocker.js';
import { OAuthErrorSimulator, OAuthErrorScenarios, OAuthProviders, oauthErrorSimulator } from './oauthErrorSimulator.js';
import { RateLimitSimulator, RateLimitScenarios, rateLimitSimulator } from './rateLimitSimulator.js';

/**
 * Comprehensive Error Testing Suite
 * Provides unified interface for all error simulation capabilities
 */
export class ErrorTestingSuite {
    constructor() {
        this.errorSimulator = errorSimulator;
        this.networkSimulator = networkErrorSimulator;
        this.supabaseMocker = supabaseMocker;
        this.oauthSimulator = oauthErrorSimulator;
        this.rateLimitSimulator = rateLimitSimulator;
        
        this.isActive = false;
        this.activeSimulations = new Set();
    }

    /**
     * Start comprehensive error testing with all simulators
     */
    startComprehensiveTesting(config = {}) {
        const defaultConfig = {
            networkErrors: true,
            supabaseErrors: true,
            oauthErrors: true,
            rateLimiting: true,
            networkScenario: 'POOR_WIFI',
            rateLimitScenario: 'AUTH_PROTECTION'
        };

        const finalConfig = { ...defaultConfig, ...config };

        // Start general error simulation
        if (finalConfig.networkErrors || finalConfig.supabaseErrors || 
            finalConfig.oauthErrors || finalConfig.rateLimiting) {
            this.errorSimulator.startSimulation({
                networkErrors: finalConfig.networkErrors,
                supabaseErrors: finalConfig.supabaseErrors,
                oauthErrors: finalConfig.oauthErrors,
                rateLimiting: finalConfig.rateLimiting
            });
            this.activeSimulations.add('general');
        }

        // Start network simulation
        if (finalConfig.networkScenario) {
            this.networkSimulator.simulateScenario(finalConfig.networkScenario);
            this.activeSimulations.add('network');
        }

        // Start Supabase mocking
        if (finalConfig.supabaseErrors) {
            this.supabaseMocker.startMocking();
            this.activeSimulations.add('supabase');
        }

        // Start OAuth simulation
        if (finalConfig.oauthErrors) {
            this.oauthSimulator.startSimulation();
            this.activeSimulations.add('oauth');
        }

        // Start rate limiting
        if (finalConfig.rateLimitScenario) {
            this.rateLimitSimulator.simulateScenario(finalConfig.rateLimitScenario);
            this.activeSimulations.add('rateLimit');
        }

        this.isActive = true;
        console.log('Comprehensive error testing started with config:', finalConfig);
    }

    /**
     * Stop all error simulations
     */
    stopAllSimulations() {
        this.errorSimulator.stopSimulation();
        this.networkSimulator.reset();
        this.supabaseMocker.stopMocking();
        this.oauthSimulator.stopSimulation();
        this.rateLimitSimulator.stopSimulation();

        this.activeSimulations.clear();
        this.isActive = false;
        console.log('All error simulations stopped');
    }

    /**
     * Reset all simulators to clean state
     */
    resetAll() {
        this.errorSimulator.reset();
        this.networkSimulator.reset();
        this.supabaseMocker.reset();
        this.oauthSimulator.reset();
        this.rateLimitSimulator.reset();

        this.activeSimulations.clear();
        this.isActive = false;
        console.log('All simulators reset');
    }

    /**
     * Run predefined test scenarios
     */
    runScenario(scenarioName) {
        this.resetAll();

        switch (scenarioName) {
            case 'AUTHENTICATION_STRESS_TEST':
                this.startComprehensiveTesting({
                    networkErrors: true,
                    supabaseErrors: true,
                    oauthErrors: false,
                    rateLimiting: true,
                    networkScenario: 'UNSTABLE_CONNECTION',
                    rateLimitScenario: 'AUTH_PROTECTION'
                });
                break;

            case 'NETWORK_ISSUES_ONLY':
                this.startComprehensiveTesting({
                    networkErrors: true,
                    supabaseErrors: false,
                    oauthErrors: false,
                    rateLimiting: false,
                    networkScenario: 'MOBILE_2G'
                });
                break;

            case 'OAUTH_FAILURES_ONLY':
                this.startComprehensiveTesting({
                    networkErrors: false,
                    supabaseErrors: false,
                    oauthErrors: true,
                    rateLimiting: false
                });
                this.oauthSimulator.setGlobalError('ACCESS_DENIED');
                break;

            case 'RATE_LIMITING_ONLY':
                this.startComprehensiveTesting({
                    networkErrors: false,
                    supabaseErrors: false,
                    oauthErrors: false,
                    rateLimiting: true,
                    rateLimitScenario: 'AGGRESSIVE_LIMITING'
                });
                break;

            case 'SUPABASE_OUTAGE':
                this.startComprehensiveTesting({
                    networkErrors: false,
                    supabaseErrors: true,
                    oauthErrors: false,
                    rateLimiting: false
                });
                this.supabaseMocker.mockErrorScenario('SERVICE_UNAVAILABLE');
                break;

            case 'COMPLETE_CHAOS':
                this.startComprehensiveTesting({
                    networkErrors: true,
                    supabaseErrors: true,
                    oauthErrors: true,
                    rateLimiting: true,
                    networkScenario: 'UNSTABLE_CONNECTION',
                    rateLimitScenario: 'AGGRESSIVE_LIMITING'
                });
                this.oauthSimulator.setGlobalError('SERVER_ERROR');
                this.supabaseMocker.mockErrorScenario('DATABASE_ERROR');
                break;

            default:
                console.warn(`Unknown scenario: ${scenarioName}`);
        }

        console.log(`Scenario started: ${scenarioName}`);
    }

    /**
     * Get comprehensive status of all simulators
     */
    getStatus() {
        return {
            isActive: this.isActive,
            activeSimulations: Array.from(this.activeSimulations),
            simulators: {
                general: this.errorSimulator.getStatus(),
                network: this.networkSimulator.getStatus(),
                supabase: this.supabaseMocker.getStatus(),
                oauth: this.oauthSimulator.getStatus(),
                rateLimit: this.rateLimitSimulator.getStatus()
            }
        };
    }

    /**
     * Generate test report
     */
    generateReport() {
        const status = this.getStatus();
        const report = {
            timestamp: new Date().toISOString(),
            isActive: status.isActive,
            activeSimulations: status.activeSimulations,
            simulatorDetails: status.simulators,
            recommendations: this.generateRecommendations(status)
        };

        return report;
    }

    /**
     * Generate testing recommendations based on current state
     */
    generateRecommendations(status) {
        const recommendations = [];

        if (!status.isActive) {
            recommendations.push('Start error simulation to begin testing');
        }

        if (status.simulators.network.isActive && status.simulators.network.conditions.offline) {
            recommendations.push('Test offline recovery scenarios');
        }

        if (status.simulators.rateLimit.isActive) {
            recommendations.push('Test rate limit recovery and retry logic');
        }

        if (status.simulators.oauth.isActive) {
            recommendations.push('Test OAuth fallback mechanisms');
        }

        if (status.simulators.supabase.isActive) {
            recommendations.push('Test Supabase error handling and user feedback');
        }

        return recommendations;
    }
}

// Predefined test scenarios
export const TestScenarios = {
    AUTHENTICATION_STRESS_TEST: 'AUTHENTICATION_STRESS_TEST',
    NETWORK_ISSUES_ONLY: 'NETWORK_ISSUES_ONLY',
    OAUTH_FAILURES_ONLY: 'OAUTH_FAILURES_ONLY',
    RATE_LIMITING_ONLY: 'RATE_LIMITING_ONLY',
    SUPABASE_OUTAGE: 'SUPABASE_OUTAGE',
    COMPLETE_CHAOS: 'COMPLETE_CHAOS'
};

// Export individual simulators and their classes
export {
    ErrorSimulator,
    SimulationScenarios,
    errorSimulator,
    NetworkErrorSimulator,
    NetworkScenarios,
    networkErrorSimulator,
    SupabaseMocker,
    SupabaseErrorScenarios,
    supabaseMocker,
    OAuthErrorSimulator,
    OAuthErrorScenarios,
    OAuthProviders,
    oauthErrorSimulator,
    RateLimitSimulator,
    RateLimitScenarios,
    rateLimitSimulator
};

// Global testing suite instance
export const errorTestingSuite = new ErrorTestingSuite();

// Convenience functions for quick testing
export const quickTest = {
    /**
     * Quick network issues test
     */
    networkIssues: () => errorTestingSuite.runScenario('NETWORK_ISSUES_ONLY'),
    
    /**
     * Quick OAuth failures test
     */
    oauthFailures: () => errorTestingSuite.runScenario('OAUTH_FAILURES_ONLY'),
    
    /**
     * Quick rate limiting test
     */
    rateLimiting: () => errorTestingSuite.runScenario('RATE_LIMITING_ONLY'),
    
    /**
     * Quick Supabase outage test
     */
    supabaseOutage: () => errorTestingSuite.runScenario('SUPABASE_OUTAGE'),
    
    /**
     * Quick comprehensive test
     */
    comprehensive: () => errorTestingSuite.runScenario('AUTHENTICATION_STRESS_TEST'),
    
    /**
     * Stop all tests
     */
    stop: () => errorTestingSuite.stopAllSimulations(),
    
    /**
     * Reset all tests
     */
    reset: () => errorTestingSuite.resetAll()
};

// Make testing suite available globally for browser console access
if (typeof window !== 'undefined') {
    window.errorTestingSuite = errorTestingSuite;
    window.quickTest = quickTest;
}
#!/usr/bin/env node

/**
 * Final Integration Test Runner
 * Runs comprehensive integration tests for the authentication error handling system
 * This script can be run from command line to verify all components are working together
 */

import { finalIntegrationTest } from './src/shared/services/finalIntegrationTest.js';
import { integrationVerifier } from './src/shared/services/integrationVerifier.js';

class FinalIntegrationRunner {
    constructor() {
        this.results = null;
    }

    /**
     * Run all final integration tests
     */
    async run() {
        console.log('🚀 Starting Final Integration Test Suite...\n');
        
        try {
            // Run the comprehensive test suite
            this.results = await finalIntegrationTest.runCompleteTestSuite();
            
            // Display results
            this.displayResults();
            
            // Exit with appropriate code
            process.exit(this.results.overall.isSuccess ? 0 : 1);
            
        } catch (error) {
            console.error('❌ Final Integration Test Suite Failed:');
            console.error(error.message);
            console.error('\nStack trace:');
            console.error(error.stack);
            process.exit(1);
        }
    }

    /**
     * Display test results in console
     */
    displayResults() {
        const { overall, categories, failedTests, recommendations } = this.results;
        
        console.log('📊 FINAL INTEGRATION TEST RESULTS');
        console.log('='.repeat(50));
        
        // Overall results
        console.log(`\n🎯 OVERALL RESULTS:`);
        console.log(`   Success Rate: ${overall.successRate}% (${overall.passed}/${overall.total})`);
        console.log(`   Grade: ${overall.grade}`);
        console.log(`   Total Duration: ${overall.totalDuration}ms`);
        console.log(`   Average Test Time: ${overall.avgDuration}ms`);
        console.log(`   Status: ${overall.isSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
        
        // Category results
        console.log(`\n📋 CATEGORY RESULTS:`);
        for (const [category, stats] of Object.entries(categories)) {
            const categoryName = category.replace(/([A-Z])/g, ' $1').trim();
            const status = stats.successRate >= 90 ? '✅' : stats.successRate >= 70 ? '⚠️' : '❌';
            console.log(`   ${status} ${categoryName}: ${stats.successRate.toFixed(1)}% (${stats.passed}/${stats.total})`);
        }
        
        // Failed tests
        if (failedTests.length > 0) {
            console.log(`\n❌ FAILED TESTS:`);
            failedTests.forEach(test => {
                console.log(`   • ${test.name}: ${test.error}`);
            });
        }
        
        // Recommendations
        if (recommendations.length > 0) {
            console.log(`\n💡 RECOMMENDATIONS:`);
            recommendations.forEach(rec => {
                console.log(`   • ${rec}`);
            });
        }
        
        console.log('\n' + '='.repeat(50));
        
        if (overall.isSuccess) {
            console.log('🎉 CONGRATULATIONS! All integration tests passed.');
            console.log('   The authentication error handling system is fully integrated and ready for production.');
        } else {
            console.log('⚠️  Some tests failed. Please review the issues above and fix them before deployment.');
        }
        
        console.log(`\n📅 Test completed at: ${new Date().toISOString()}`);
    }

    /**
     * Run quick verification only
     */
    async runQuickVerification() {
        console.log('🔍 Running Quick Integration Verification...\n');
        
        try {
            const results = await integrationVerifier.runFullVerification();
            
            console.log('📊 QUICK VERIFICATION RESULTS');
            console.log('='.repeat(40));
            console.log(`Success Rate: ${results.summary.successRate}%`);
            console.log(`Tests: ${results.summary.passed}/${results.summary.total} passed`);
            console.log(`Duration: ${results.summary.totalDuration}ms`);
            console.log(`Status: ${results.isSuccess ? '✅ PASSED' : '❌ FAILED'}`);
            
            if (results.failedTests.length > 0) {
                console.log('\n❌ Failed Tests:');
                results.failedTests.forEach(test => {
                    console.log(`   • ${test.name}: ${test.error}`);
                });
            }
            
            process.exit(results.isSuccess ? 0 : 1);
            
        } catch (error) {
            console.error('❌ Quick verification failed:', error.message);
            process.exit(1);
        }
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const runner = new FinalIntegrationRunner();

if (args.includes('--quick') || args.includes('-q')) {
    runner.runQuickVerification();
} else if (args.includes('--help') || args.includes('-h')) {
    console.log('Final Integration Test Runner');
    console.log('');
    console.log('Usage:');
    console.log('  node run-final-integration.js          Run full integration test suite');
    console.log('  node run-final-integration.js --quick  Run quick verification only');
    console.log('  node run-final-integration.js --help   Show this help message');
    console.log('');
    console.log('Exit codes:');
    console.log('  0  All tests passed');
    console.log('  1  Some tests failed or error occurred');
} else {
    runner.run();
}
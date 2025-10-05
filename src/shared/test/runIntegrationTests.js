/**
 * Integration Test Runner for Authentication Error Flows
 * Executes all integration tests and provides comprehensive reporting
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Test configuration
 */
const TEST_CONFIG = {
  testFiles: [
    'src/shared/test/authErrorFlows.integration.test.js',
    'src/shared/test/authErrorRecovery.integration.test.js',
    'src/shared/test/oauthErrorFlows.integration.test.js'
  ],
  outputDir: 'test-results',
  reportFormats: ['json', 'html', 'console'],
  timeout: 30000, // 30 seconds per test
  retries: 2
};

/**
 * Test result aggregator
 */
class TestResultAggregator {
  constructor() {
    this.results = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      duration: 0,
      testFiles: [],
      errors: [],
      coverage: null
    };
    this.startTime = Date.now();
  }

  addTestFile(filePath, result) {
    this.results.testFiles.push({
      file: filePath,
      ...result
    });
    
    this.results.totalTests += result.totalTests || 0;
    this.results.passedTests += result.passedTests || 0;
    this.results.failedTests += result.failedTests || 0;
    this.results.skippedTests += result.skippedTests || 0;
    
    if (result.errors) {
      this.results.errors.push(...result.errors);
    }
  }

  finalize() {
    this.results.duration = Date.now() - this.startTime;
    this.results.successRate = this.results.totalTests > 0 
      ? (this.results.passedTests / this.results.totalTests * 100).toFixed(2)
      : 0;
  }

  getResults() {
    return this.results;
  }
}

/**
 * Test reporter
 */
class TestReporter {
  constructor(config) {
    this.config = config;
  }

  generateConsoleReport(results) {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 AUTHENTICATION ERROR FLOWS INTEGRATION TEST RESULTS');
    console.log('='.repeat(80));
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Tests: ${results.totalTests}`);
    console.log(`   ✅ Passed: ${results.passedTests}`);
    console.log(`   ❌ Failed: ${results.failedTests}`);
    console.log(`   ⏭️  Skipped: ${results.skippedTests}`);
    console.log(`   📈 Success Rate: ${results.successRate}%`);
    console.log(`   ⏱️  Duration: ${(results.duration / 1000).toFixed(2)}s`);

    if (results.testFiles.length > 0) {
      console.log(`\n📁 Test Files:`);
      results.testFiles.forEach(file => {
        const status = file.failedTests > 0 ? '❌' : '✅';
        console.log(`   ${status} ${file.file}`);
        console.log(`      Tests: ${file.totalTests}, Passed: ${file.passedTests}, Failed: ${file.failedTests}`);
        if (file.duration) {
          console.log(`      Duration: ${(file.duration / 1000).toFixed(2)}s`);
        }
      });
    }

    if (results.errors.length > 0) {
      console.log(`\n🚨 Errors (${results.errors.length}):`);
      results.errors.slice(0, 5).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.message}`);
        if (error.stack) {
          console.log(`      ${error.stack.split('\n')[1]?.trim()}`);
        }
      });
      
      if (results.errors.length > 5) {
        console.log(`   ... and ${results.errors.length - 5} more errors`);
      }
    }

    console.log('\n' + '='.repeat(80));
    
    if (results.failedTests === 0) {
      console.log('🎉 All integration tests passed! Authentication error handling is working correctly.');
    } else {
      console.log('⚠️  Some integration tests failed. Please review the errors above.');
    }
    
    console.log('='.repeat(80) + '\n');
  }

  generateJsonReport(results) {
    const jsonReport = {
      timestamp: new Date().toISOString(),
      testSuite: 'Authentication Error Flows Integration Tests',
      ...results
    };

    const reportPath = join(this.config.outputDir, 'integration-test-results.json');
    writeFileSync(reportPath, JSON.stringify(jsonReport, null, 2));
    console.log(`📄 JSON report saved to: ${reportPath}`);
  }

  generateHtmlReport(results) {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authentication Error Flows Integration Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2c3e50; }
        .metric-label { color: #7f8c8d; margin-top: 5px; }
        .success { color: #27ae60; }
        .error { color: #e74c3c; }
        .warning { color: #f39c12; }
        .test-files { margin-bottom: 30px; }
        .test-file { background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 6px; border-left: 4px solid #3498db; }
        .test-file.failed { border-left-color: #e74c3c; }
        .test-file.passed { border-left-color: #27ae60; }
        .errors { background: #fdf2f2; padding: 20px; border-radius: 6px; border: 1px solid #fecaca; }
        .error-item { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Authentication Error Flows Integration Test Results</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value">${results.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value success">${results.passedTests}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value error">${results.failedTests}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value warning">${results.skippedTests}</div>
                <div class="metric-label">Skipped</div>
            </div>
            <div class="metric">
                <div class="metric-value ${results.successRate >= 90 ? 'success' : results.successRate >= 70 ? 'warning' : 'error'}">${results.successRate}%</div>
                <div class="metric-label">Success Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value">${(results.duration / 1000).toFixed(2)}s</div>
                <div class="metric-label">Duration</div>
            </div>
        </div>

        <div class="test-files">
            <h2>📁 Test Files</h2>
            ${results.testFiles.map(file => `
                <div class="test-file ${file.failedTests > 0 ? 'failed' : 'passed'}">
                    <h3>${file.file}</h3>
                    <p>Tests: ${file.totalTests} | Passed: ${file.passedTests} | Failed: ${file.failedTests}</p>
                    ${file.duration ? `<p>Duration: ${(file.duration / 1000).toFixed(2)}s</p>` : ''}
                </div>
            `).join('')}
        </div>

        ${results.errors.length > 0 ? `
            <div class="errors">
                <h2>🚨 Errors (${results.errors.length})</h2>
                ${results.errors.slice(0, 10).map((error, index) => `
                    <div class="error-item">
                        <strong>${index + 1}. ${error.message}</strong>
                        ${error.stack ? `<pre style="margin-top: 10px; font-size: 12px; color: #666;">${error.stack}</pre>` : ''}
                    </div>
                `).join('')}
                ${results.errors.length > 10 ? `<p>... and ${results.errors.length - 10} more errors</p>` : ''}
            </div>
        ` : ''}
    </div>
</body>
</html>`;

    const reportPath = join(this.config.outputDir, 'integration-test-results.html');
    writeFileSync(reportPath, htmlTemplate);
    console.log(`📄 HTML report saved to: ${reportPath}`);
  }

  generateReports(results) {
    // Ensure output directory exists
    try {
      execSync(`mkdir -p ${this.config.outputDir}`, { stdio: 'ignore' });
    } catch (error) {
      // Directory might already exist
    }

    if (this.config.reportFormats.includes('console')) {
      this.generateConsoleReport(results);
    }

    if (this.config.reportFormats.includes('json')) {
      this.generateJsonReport(results);
    }

    if (this.config.reportFormats.includes('html')) {
      this.generateHtmlReport(results);
    }
  }
}

/**
 * Test runner
 */
class IntegrationTestRunner {
  constructor(config) {
    this.config = config;
    this.aggregator = new TestResultAggregator();
    this.reporter = new TestReporter(config);
  }

  async runTestFile(filePath) {
    console.log(`\n🧪 Running tests in: ${filePath}`);
    
    try {
      const startTime = Date.now();
      
      // Run vitest for specific file
      const command = `npx vitest run "${filePath}" --reporter=json --timeout=${this.config.timeout}`;
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const duration = Date.now() - startTime;
      
      // Parse vitest JSON output
      let testResult;
      try {
        const lines = output.split('\n');
        const jsonLine = lines.find(line => line.trim().startsWith('{'));
        testResult = JSON.parse(jsonLine);
      } catch (parseError) {
        console.warn(`⚠️  Could not parse test output for ${filePath}`);
        testResult = {
          totalTests: 0,
          passedTests: 0,
          failedTests: 1,
          skippedTests: 0,
          errors: [{ message: 'Failed to parse test results', stack: parseError.stack }]
        };
      }
      
      testResult.duration = duration;
      this.aggregator.addTestFile(filePath, testResult);
      
      const status = testResult.failedTests > 0 ? '❌' : '✅';
      console.log(`${status} ${filePath} - ${testResult.passedTests}/${testResult.totalTests} passed (${(duration / 1000).toFixed(2)}s)`);
      
      return testResult;
      
    } catch (error) {
      console.error(`❌ Error running tests in ${filePath}:`, error.message);
      
      const errorResult = {
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        skippedTests: 0,
        duration: 0,
        errors: [{ message: error.message, stack: error.stack }]
      };
      
      this.aggregator.addTestFile(filePath, errorResult);
      return errorResult;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Authentication Error Flows Integration Tests...');
    console.log(`📁 Test files: ${this.config.testFiles.length}`);
    console.log(`⏱️  Timeout: ${this.config.timeout}ms per test`);
    console.log(`🔄 Retries: ${this.config.retries}`);
    
    // Run each test file
    for (const testFile of this.config.testFiles) {
      let attempts = 0;
      let lastError = null;
      
      while (attempts <= this.config.retries) {
        try {
          await this.runTestFile(testFile);
          break; // Success, no need to retry
        } catch (error) {
          attempts++;
          lastError = error;
          
          if (attempts <= this.config.retries) {
            console.log(`🔄 Retrying ${testFile} (attempt ${attempts + 1}/${this.config.retries + 1})`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        }
      }
      
      if (attempts > this.config.retries && lastError) {
        console.error(`❌ ${testFile} failed after ${this.config.retries} retries`);
      }
    }
    
    // Finalize results
    this.aggregator.finalize();
    const results = this.aggregator.getResults();
    
    // Generate reports
    this.reporter.generateReports(results);
    
    return results;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const runner = new IntegrationTestRunner(TEST_CONFIG);
    const results = await runner.runAllTests();
    
    // Exit with appropriate code
    process.exit(results.failedTests > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('💥 Fatal error running integration tests:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { IntegrationTestRunner, TestResultAggregator, TestReporter };
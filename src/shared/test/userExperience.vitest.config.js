/**
 * Vitest Configuration for User Experience Tests
 * Specialized configuration for UX testing with DOM simulation and performance monitoring
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Test environment setup
    environment: 'jsdom',
    setupFiles: ['./src/shared/test/setup.js'],
    
    // Test file patterns
    include: [
      'src/shared/test/userExperience.test.js',
      'src/shared/test/**/*.ux.test.js'
    ],
    
    // Test execution settings
    testTimeout: 10000, // 10 seconds for UX tests that may include delays
    hookTimeout: 5000,
    
    // Coverage settings for UX components
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/shared/services/userFeedbackSystem.js',
        'src/shared/services/authErrorHandler.js',
        'src/shared/components/AuthModalVanilla.js'
      ],
      exclude: [
        'src/shared/test/**',
        'node_modules/**',
        'dist/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Performance monitoring
    benchmark: {
      include: ['**/*.{bench,benchmark}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['node_modules', 'dist', '.git'],
      reporters: ['default', 'json']
    },
    
    // Global test configuration
    globals: true,
    
    // Mock configuration for UX testing
    deps: {
      inline: ['@testing-library/jest-dom']
    },
    
    // Test reporter configuration
    reporter: [
      'default',
      'json',
      'html',
      ['junit', { outputFile: 'test-results/ux-tests.xml' }]
    ],
    
    // Output directory for test results
    outputFile: {
      json: 'test-results/ux-test-results.json',
      html: 'test-results/ux-test-report.html'
    }
  },
  
  // Resolve configuration for imports
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../../src'),
      '@shared': resolve(__dirname, '../'),
      '@test': resolve(__dirname, './')
    }
  },
  
  // Define global constants for testing
  define: {
    __TEST_ENV__: true,
    __UX_TEST_MODE__: true
  }
});
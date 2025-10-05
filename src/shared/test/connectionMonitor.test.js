/**
 * Unit tests for ConnectionMonitor
 * Tests connectivity detection with mocked network conditions,
 * event emission for connection changes, and latency measurement accuracy
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Supabase first
vi.mock('../config/supabase.js', () => ({
  supabase: {
    auth: {
      getSession: vi.fn()
    }
  }
}));

// Now import the ConnectionMonitor
import { ConnectionMonitor, CONNECTION_STATUS } from '../services/connectionMonitor.js';
import { supabase } from '../config/supabase.js';

describe('ConnectionMonitor', () => {
  let connectionMonitor;
  let mockCallback;

  beforeEach(() => {
    vi.clearAllMocks();
    connectionMonitor = new ConnectionMonitor();
    mockCallback = vi.fn();
    
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    connectionMonitor.stopMonitoring();
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(connectionMonitor.status).toBe(CONNECTION_STATUS.UNKNOWN);
      expect(connectionMonitor.latency).toBeNull();
      expect(connectionMonitor.lastCheck).toBeNull();
      expect(connectionMonitor.isMonitoring).toBe(false);
      expect(connectionMonitor.config.checkIntervalMs).toBe(30000);
      expect(connectionMonitor.config.timeoutMs).toBe(10000);
    });

    it('should detect Supabase availability correctly', () => {
      expect(connectionMonitor.isSupabaseEnabled).toBe(true);
    });
  });

  describe('Connectivity Detection with Mocked Network Conditions', () => {
    describe('Successful Connection', () => {
      beforeEach(() => {
        supabase.auth.getSession.mockResolvedValue({
          data: { session: { user: { id: '123' } } }
        });
      });

      it('should detect successful connection', async () => {
        const result = await connectionMonitor.isSupabaseAvailable();

        expect(result.available).toBe(true);
        expect(result.latency).toBeGreaterThanOrEqual(0);
        expect(result.timestamp).toBeDefined();
        expect(result.supabaseEnabled).toBe(true);
      });

      it('should measure latency accurately for successful connections', async () => {
        // Mock a specific delay
        supabase.auth.getSession.mockImplementation(() => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({ data: { session: null } });
            }, 50);
          });
        });

        const result = await connectionMonitor.getConnectionLatency({ samples: 1 });

        expect(result.success).toBe(true);
        expect(result.latency.average).toBeGreaterThan(0);
        expect(result.latency.average).toBeLessThan(200);
        expect(result.quality).toBe('excellent');
      });

      it('should calculate latency statistics correctly with multiple samples', async () => {
        // Mock varying delays
        let callCount = 0;
        supabase.auth.getSession.mockImplementation(() => {
          return new Promise(resolve => {
            const delays = [10, 20, 30];
            setTimeout(() => {
              resolve({ data: { session: null } });
            }, delays[callCount++ % delays.length]);
          });
        });

        const result = await connectionMonitor.getConnectionLatency({ samples: 3 });

        expect(result.success).toBe(true);
        expect(result.latency.samples).toHaveLength(3);
        expect(result.latency.minimum).toBeLessThanOrEqual(result.latency.average);
        expect(result.latency.maximum).toBeGreaterThanOrEqual(result.latency.average);
        expect(result.successfulSamples).toBe(3);
        expect(result.totalSamples).toBe(3);
      });
    });

    describe('Network Errors', () => {
      it('should detect network timeout errors', async () => {
        supabase.auth.getSession.mockImplementation(() => {
          return new Promise(() => {
            // Never resolve to simulate timeout
          });
        });

        const result = await connectionMonitor.isSupabaseAvailable({ timeout: 50, retryAttempts: 1 });

        expect(result.available).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error.message).toContain('timeout');
        expect(result.attempts).toBe(1);
      });

      it('should detect connection refused errors', async () => {
        const connectionError = new Error('Connection refused');
        connectionError.code = 'ECONNREFUSED';
        supabase.auth.getSession.mockRejectedValue(connectionError);

        const result = await connectionMonitor.isSupabaseAvailable();

        expect(result.available).toBe(false);
        expect(result.error).toBe(connectionError);
        expect(result.timestamp).toBeDefined();
      });

      it('should handle DNS resolution failures', async () => {
        const dnsError = new Error('getaddrinfo ENOTFOUND');
        dnsError.code = 'ENOTFOUND';
        supabase.auth.getSession.mockRejectedValue(dnsError);

        const result = await connectionMonitor.isSupabaseAvailable();

        expect(result.available).toBe(false);
        expect(result.error).toBe(dnsError);
      });

      it('should handle intermittent connectivity issues', async () => {
        let callCount = 0;
        supabase.auth.getSession.mockImplementation(() => {
          callCount++;
          if (callCount <= 2) {
            return Promise.reject(new Error('Network error'));
          }
          return Promise.resolve({ data: { session: null } });
        });

        const result = await connectionMonitor.isSupabaseAvailable({ retryAttempts: 3 });

        expect(result.available).toBe(true);
        expect(result.attempt).toBe(3);
        expect(supabase.auth.getSession).toHaveBeenCalledTimes(3);
      });
    });

    describe('Mock Mode (Supabase Disabled)', () => {
      beforeEach(() => {
        connectionMonitor.isSupabaseEnabled = false;
      });

      it('should simulate successful connection in mock mode', async () => {
        const result = await connectionMonitor.isSupabaseAvailable();

        expect(result.available).toBe(true);
        expect(result.latency).toBeGreaterThan(0);
        expect(result.supabaseEnabled).toBe(false);
      });

      it('should simulate latency measurements in mock mode', async () => {
        const result = await connectionMonitor.getConnectionLatency({ samples: 2 });

        expect(result.success).toBe(true);
        expect(result.latency.samples).toHaveLength(2);
        expect(result.latency.average).toBeGreaterThan(0);
        expect(result.latency.average).toBeLessThan(300); // Mock range is 50-150ms
      });
    });

    describe('Retry Logic with Exponential Backoff', () => {
      it('should implement exponential backoff for retries', async () => {
        const networkError = new Error('Network error');
        supabase.auth.getSession.mockRejectedValue(networkError);

        const delaySpy = vi.spyOn(connectionMonitor, 'delay').mockResolvedValue();

        await connectionMonitor.isSupabaseAvailable({ retryAttempts: 3 });

        expect(delaySpy).toHaveBeenCalledTimes(2); // 2 delays for 3 attempts
        expect(delaySpy).toHaveBeenNthCalledWith(1, 1000); // 2^0 * 1000
        expect(delaySpy).toHaveBeenNthCalledWith(2, 2000); // 2^1 * 1000
      });

      it('should not retry on successful first attempt', async () => {
        supabase.auth.getSession.mockResolvedValue({ data: { session: null } });

        const delaySpy = vi.spyOn(connectionMonitor, 'delay').mockResolvedValue();

        const result = await connectionMonitor.isSupabaseAvailable({ retryAttempts: 3 });

        expect(result.available).toBe(true);
        expect(result.attempt).toBe(1);
        expect(delaySpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('Event Emission for Connection Changes', () => {
    describe('Event Registration and Unregistration', () => {
      it('should register event listeners correctly', () => {
        const unsubscribe = connectionMonitor.onConnectionChange('statusChange', mockCallback);

        expect(typeof unsubscribe).toBe('function');
        expect(connectionMonitor.eventListeners.get('statusChange')).toContain(mockCallback);
      });

      it('should unregister event listeners correctly', () => {
        const unsubscribe = connectionMonitor.onConnectionChange('statusChange', mockCallback);
        
        unsubscribe();

        expect(connectionMonitor.eventListeners.get('statusChange')).not.toContain(mockCallback);
      });

      it('should handle multiple listeners for the same event', () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();

        connectionMonitor.onConnectionChange('statusChange', callback1);
        connectionMonitor.onConnectionChange('statusChange', callback2);

        const listeners = connectionMonitor.eventListeners.get('statusChange');
        expect(listeners.size).toBe(2);
        expect(listeners).toContain(callback1);
        expect(listeners).toContain(callback2);
      });
    });

    describe('Status Change Events', () => {
      it('should emit statusChange event when status changes from UNKNOWN to CONNECTED', async () => {
        supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
        
        connectionMonitor.onConnectionChange('statusChange', mockCallback);

        await connectionMonitor.checkConnectivity();

        expect(mockCallback).toHaveBeenCalledWith({
          from: CONNECTION_STATUS.UNKNOWN,
          to: CONNECTION_STATUS.CONNECTED,
          timestamp: expect.any(String),
          result: expect.any(Object)
        });
      });

      it('should emit statusChange event when status changes from CONNECTED to DISCONNECTED', async () => {
        // First establish connection
        supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
        await connectionMonitor.checkConnectivity();

        // Then simulate disconnection
        supabase.auth.getSession.mockRejectedValue(new Error('Network error'));
        connectionMonitor.onConnectionChange('statusChange', mockCallback);

        await connectionMonitor.checkConnectivity();

        // Should emit both CHECKING and final DISCONNECTED status
        expect(mockCallback).toHaveBeenCalledTimes(2);
        expect(mockCallback).toHaveBeenNthCalledWith(2, {
          from: CONNECTION_STATUS.CONNECTED,
          to: CONNECTION_STATUS.DISCONNECTED,
          timestamp: expect.any(String),
          result: expect.any(Object)
        });
      });

      it('should emit CHECKING status but not final status when result remains the same', async () => {
        supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
        
        // First check
        await connectionMonitor.checkConnectivity();
        
        // Register listener after first check
        connectionMonitor.onConnectionChange('statusChange', mockCallback);
        
        // Second check with same result
        await connectionMonitor.checkConnectivity();

        // Should only emit CHECKING status, not final status since it didn't change
        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith({
          from: CONNECTION_STATUS.CONNECTED,
          to: CONNECTION_STATUS.CHECKING,
          timestamp: expect.any(String)
        });
      });

      it('should emit CHECKING status during connectivity check', async () => {
        supabase.auth.getSession.mockImplementation(() => {
          return new Promise(resolve => {
            setTimeout(() => resolve({ data: { session: null } }), 10);
          });
        });

        connectionMonitor.onConnectionChange('statusChange', mockCallback);

        await connectionMonitor.checkConnectivity();

        // Should have emitted both CHECKING and final status
        expect(mockCallback).toHaveBeenCalledTimes(2);
        expect(mockCallback).toHaveBeenNthCalledWith(1, {
          from: CONNECTION_STATUS.UNKNOWN,
          to: CONNECTION_STATUS.CHECKING,
          timestamp: expect.any(String)
        });
        expect(mockCallback).toHaveBeenNthCalledWith(2, {
          from: CONNECTION_STATUS.UNKNOWN,
          to: CONNECTION_STATUS.CONNECTED,
          timestamp: expect.any(String),
          result: expect.any(Object)
        });
      });
    });

    describe('Connectivity Check Events', () => {
      it('should emit connectivityCheck event on every check', async () => {
        supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
        
        connectionMonitor.onConnectionChange('connectivityCheck', mockCallback);

        await connectionMonitor.checkConnectivity();

        expect(mockCallback).toHaveBeenCalledWith({
          status: CONNECTION_STATUS.CONNECTED,
          available: true,
          latency: expect.any(Number),
          quality: expect.any(String),
          timestamp: expect.any(String),
          healthCheck: expect.any(Object),
          latencyCheck: expect.any(Object)
        });
      });

      it('should emit connectivityCheck event even when status does not change', async () => {
        supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
        
        // First check
        await connectionMonitor.checkConnectivity();
        
        // Register listener
        connectionMonitor.onConnectionChange('connectivityCheck', mockCallback);
        
        // Second check
        await connectionMonitor.checkConnectivity();

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
          status: CONNECTION_STATUS.CONNECTED,
          available: true
        }));
      });
    });

    describe('Error Handling in Event Listeners', () => {
      it('should handle errors in event listeners gracefully', async () => {
        const errorCallback = vi.fn(() => {
          throw new Error('Listener error');
        });
        const normalCallback = vi.fn();

        connectionMonitor.onConnectionChange('statusChange', errorCallback);
        connectionMonitor.onConnectionChange('statusChange', normalCallback);

        supabase.auth.getSession.mockResolvedValue({ data: { session: null } });

        await connectionMonitor.checkConnectivity();

        expect(errorCallback).toHaveBeenCalled();
        expect(normalCallback).toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
          'Error in connection monitor event listener:',
          expect.any(Error)
        );
      });
    });
  });

  describe('Latency Measurement Accuracy', () => {
    describe('Single Latency Measurements', () => {
      it('should measure latency accurately for fast connections', async () => {
        supabase.auth.getSession.mockImplementation(() => {
          return new Promise(resolve => {
            setTimeout(() => resolve({ data: { session: null } }), 10);
          });
        });

        const result = await connectionMonitor.measureLatency(1000);

        expect(result.success).toBe(true);
        expect(result.latency).toBeGreaterThan(0);
        expect(result.latency).toBeLessThan(100);
      });

      it('should measure latency accurately for slow connections', async () => {
        supabase.auth.getSession.mockImplementation(() => {
          return new Promise(resolve => {
            setTimeout(() => resolve({ data: { session: null } }), 100);
          });
        });

        const result = await connectionMonitor.measureLatency(1000);

        expect(result.success).toBe(true);
        expect(result.latency).toBeGreaterThan(50);
        expect(result.latency).toBeLessThan(200);
      });

      it('should handle timeout in latency measurement', async () => {
        supabase.auth.getSession.mockImplementation(() => {
          return new Promise(() => {
            // Never resolve to simulate timeout
          });
        });

        const result = await connectionMonitor.measureLatency(50);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error.message).toContain('timeout');
        expect(result.latency).toBeGreaterThanOrEqual(50);
      });
    });

    describe('Connection Quality Assessment', () => {
      it('should assess excellent quality for low latency', () => {
        const quality = connectionMonitor.assessConnectionQuality(50);
        expect(quality).toBe('excellent');
      });

      it('should assess good quality for moderate latency', () => {
        const quality = connectionMonitor.assessConnectionQuality(200);
        expect(quality).toBe('good');
      });

      it('should assess fair quality for higher latency', () => {
        const quality = connectionMonitor.assessConnectionQuality(500);
        expect(quality).toBe('fair');
      });

      it('should assess poor quality for high latency', () => {
        const quality = connectionMonitor.assessConnectionQuality(2000);
        expect(quality).toBe('poor');
      });

      it('should assess very poor quality for very high latency', () => {
        const quality = connectionMonitor.assessConnectionQuality(6000);
        expect(quality).toBe('very_poor');
      });
    });

    describe('Multiple Sample Latency Measurements', () => {
      it('should handle mixed success and failure samples', async () => {
        let callCount = 0;
        supabase.auth.getSession.mockImplementation(() => {
          callCount++;
          if (callCount === 2) {
            return Promise.reject(new Error('Network error'));
          }
          return new Promise(resolve => {
            setTimeout(() => resolve({ data: { session: null } }), 10);
          });
        });

        const result = await connectionMonitor.getConnectionLatency({ samples: 3 });

        expect(result.success).toBe(true);
        expect(result.successfulSamples).toBe(2);
        expect(result.totalSamples).toBe(3);
        expect(result.errors).toHaveLength(1);
        expect(result.latency.samples).toHaveLength(2);
      });

      it('should fail when all samples fail', async () => {
        supabase.auth.getSession.mockRejectedValue(new Error('Network error'));

        const result = await connectionMonitor.getConnectionLatency({ samples: 3 });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.samples).toBe(3);
      });

      it('should calculate statistics correctly with varying latencies', async () => {
        const latencies = [10, 20, 30];
        let callCount = 0;
        
        supabase.auth.getSession.mockImplementation(() => {
          return new Promise(resolve => {
            setTimeout(() => resolve({ data: { session: null } }), latencies[callCount++]);
          });
        });

        const result = await connectionMonitor.getConnectionLatency({ samples: 3 });

        expect(result.success).toBe(true);
        expect(result.latency.minimum).toBeGreaterThanOrEqual(10);
        expect(result.latency.maximum).toBeGreaterThanOrEqual(30);
        expect(result.latency.average).toBeGreaterThan(15);
        expect(result.latency.samples).toHaveLength(3);
      });
    });

    describe('Mock Mode Latency', () => {
      beforeEach(() => {
        connectionMonitor.isSupabaseEnabled = false;
      });

      it('should generate realistic mock latencies', async () => {
        const results = [];
        
        for (let i = 0; i < 10; i++) {
          const result = await connectionMonitor.measureLatency(1000);
          results.push(result.latency);
        }

        // All latencies should be in the expected range (50-150ms + processing time)
        results.forEach(latency => {
          expect(latency).toBeGreaterThan(40);
          expect(latency).toBeLessThan(200);
        });

        // Should have some variation
        const min = Math.min(...results);
        const max = Math.max(...results);
        expect(max - min).toBeGreaterThan(10);
      });
    });
  });

  describe('Monitoring Lifecycle', () => {
    it('should start monitoring correctly', () => {
      connectionMonitor.startMonitoring();

      expect(connectionMonitor.isMonitoring).toBe(true);
      expect(connectionMonitor.checkInterval).toBeDefined();
    });

    it('should not start monitoring if already active', () => {
      connectionMonitor.startMonitoring();
      const firstInterval = connectionMonitor.checkInterval;
      
      connectionMonitor.startMonitoring();
      
      expect(connectionMonitor.checkInterval).toBe(firstInterval);
      expect(console.warn).toHaveBeenCalledWith('Connection monitoring is already active');
    });

    it('should stop monitoring correctly', () => {
      connectionMonitor.startMonitoring();
      connectionMonitor.stopMonitoring();

      expect(connectionMonitor.isMonitoring).toBe(false);
      expect(connectionMonitor.checkInterval).toBeNull();
    });

    it('should perform periodic checks when monitoring', async () => {
      vi.useFakeTimers();
      supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
      
      const checkSpy = vi.spyOn(connectionMonitor, 'checkConnectivity').mockResolvedValue({
        status: 'CONNECTED',
        available: true
      });
      
      connectionMonitor.startMonitoring({ checkIntervalMs: 1000 });

      // Fast-forward time
      vi.advanceTimersByTime(2500);

      expect(checkSpy).toHaveBeenCalledTimes(3); // Initial + 2 periodic
      
      vi.useRealTimers();
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration correctly', () => {
      const newConfig = {
        checkIntervalMs: 60000,
        timeoutMs: 15000,
        maxLatencyMs: 8000
      };

      connectionMonitor.updateConfig(newConfig);

      expect(connectionMonitor.config.checkIntervalMs).toBe(60000);
      expect(connectionMonitor.config.timeoutMs).toBe(15000);
      expect(connectionMonitor.config.maxLatencyMs).toBe(8000);
      expect(connectionMonitor.config.retryAttempts).toBe(3); // Should keep existing values
    });

    it('should restart monitoring when interval changes', () => {
      connectionMonitor.startMonitoring();
      const stopSpy = vi.spyOn(connectionMonitor, 'stopMonitoring');
      const startSpy = vi.spyOn(connectionMonitor, 'startMonitoring');

      connectionMonitor.updateConfig({ checkIntervalMs: 60000 });

      expect(stopSpy).toHaveBeenCalled();
      expect(startSpy).toHaveBeenCalled();
    });
  });

  describe('Status and Statistics', () => {
    it('should return correct status information', () => {
      connectionMonitor.status = CONNECTION_STATUS.CONNECTED;
      connectionMonitor.latency = 150;
      connectionMonitor.lastCheck = '2023-01-01T00:00:00.000Z';

      const status = connectionMonitor.getStatus();

      expect(status).toEqual({
        status: CONNECTION_STATUS.CONNECTED,
        latency: 150,
        quality: 'good',
        lastCheck: '2023-01-01T00:00:00.000Z',
        isMonitoring: false,
        supabaseEnabled: true
      });
    });

    it('should return correct statistics', () => {
      connectionMonitor.onConnectionChange('statusChange', mockCallback);
      connectionMonitor.onConnectionChange('connectivityCheck', vi.fn());

      const stats = connectionMonitor.getStatistics();

      expect(stats).toEqual({
        status: CONNECTION_STATUS.UNKNOWN,
        latency: null,
        quality: null,
        lastCheck: null,
        isMonitoring: false,
        supabaseEnabled: true,
        config: connectionMonitor.config,
        eventListenerCount: 2
      });
    });
  });
});
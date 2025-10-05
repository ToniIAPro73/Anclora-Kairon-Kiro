/**
 * Network Error Simulation Utilities
 * Specialized tools for simulating various network conditions and connectivity issues
 */

export class NetworkErrorSimulator {
    constructor() {
        this.originalFetch = window.fetch;
        this.originalXMLHttpRequest = window.XMLHttpRequest;
        this.isActive = false;
        this.networkConditions = {
            offline: false,
            slowConnection: false,
            intermittentConnection: false,
            highLatency: false,
            packetLoss: false
        };
        this.latencyMs = 0;
        this.packetLossRate = 0;
        this.connectionDropRate = 0;
    }

    /**
     * Simulate offline condition
     */
    goOffline() {
        this.networkConditions.offline = true;
        this.setupNetworkInterception();
        
        // Also trigger offline events
        window.dispatchEvent(new Event('offline'));
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: false
        });
        
        console.log('Network simulation: OFFLINE');
    }

    /**
     * Simulate coming back online
     */
    goOnline() {
        this.networkConditions.offline = false;
        
        // Trigger online events
        window.dispatchEvent(new Event('online'));
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true
        });
        
        console.log('Network simulation: ONLINE');
    }

    /**
     * Simulate slow connection with specified speed
     * @param {number} bytesPerSecond - Connection speed in bytes per second
     */
    simulateSlowConnection(bytesPerSecond = 1024) { // Default: 1KB/s
        this.networkConditions.slowConnection = true;
        this.connectionSpeed = bytesPerSecond;
        this.setupNetworkInterception();
        
        console.log(`Network simulation: SLOW CONNECTION (${bytesPerSecond} bytes/s)`);
    }

    /**
     * Simulate high latency connection
     * @param {number} latencyMs - Latency in milliseconds
     */
    simulateHighLatency(latencyMs = 2000) {
        this.networkConditions.highLatency = true;
        this.latencyMs = latencyMs;
        this.setupNetworkInterception();
        
        console.log(`Network simulation: HIGH LATENCY (${latencyMs}ms)`);
    }

    /**
     * Simulate packet loss
     * @param {number} lossRate - Packet loss rate (0-1)
     */
    simulatePacketLoss(lossRate = 0.1) {
        this.networkConditions.packetLoss = true;
        this.packetLossRate = lossRate;
        this.setupNetworkInterception();
        
        console.log(`Network simulation: PACKET LOSS (${lossRate * 100}%)`);
    }

    /**
     * Simulate intermittent connection drops
     * @param {number} dropRate - Connection drop rate (0-1)
     */
    simulateIntermittentConnection(dropRate = 0.2) {
        this.networkConditions.intermittentConnection = true;
        this.connectionDropRate = dropRate;
        this.setupNetworkInterception();
        
        console.log(`Network simulation: INTERMITTENT CONNECTION (${dropRate * 100}% drop rate)`);
    }

    /**
     * Setup network interception based on current conditions
     */
    setupNetworkInterception() {
        if (this.isActive) return;
        
        this.isActive = true;
        window.fetch = this.createNetworkAwareFetch();
        
        console.log('Network interception active');
    }

    /**
     * Create network-aware fetch function
     */
    createNetworkAwareFetch() {
        return async (url, options = {}) => {
            // Check if offline
            if (this.networkConditions.offline) {
                throw new Error('Network request failed: offline');
            }

            // Simulate packet loss
            if (this.networkConditions.packetLoss && Math.random() < this.packetLossRate) {
                throw new Error('Network request failed: packet loss');
            }

            // Simulate intermittent connection drops
            if (this.networkConditions.intermittentConnection && Math.random() < this.connectionDropRate) {
                throw new Error('Network request failed: connection dropped');
            }

            // Add latency
            if (this.networkConditions.highLatency && this.latencyMs > 0) {
                await this.delay(this.latencyMs);
            }

            try {
                const response = await this.originalFetch(url, options);
                
                // Simulate slow connection by throttling response
                if (this.networkConditions.slowConnection) {
                    return this.throttleResponse(response);
                }
                
                return response;
            } catch (error) {
                // Add network-specific error information
                error.networkSimulated = true;
                error.networkConditions = { ...this.networkConditions };
                throw error;
            }
        };
    }

    /**
     * Throttle response based on connection speed
     */
    async throttleResponse(response) {
        if (!response.body) return response;

        const reader = response.body.getReader();
        const chunks = [];
        let totalSize = 0;

        // Read all chunks
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            chunks.push(value);
            totalSize += value.length;
            
            // Simulate delay based on connection speed
            const delayMs = (value.length / this.connectionSpeed) * 1000;
            await this.delay(delayMs);
        }

        // Reconstruct response with throttled data
        const throttledBody = new Uint8Array(totalSize);
        let offset = 0;
        for (const chunk of chunks) {
            throttledBody.set(chunk, offset);
            offset += chunk.length;
        }

        return new Response(throttledBody, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        });
    }

    /**
     * Utility function to create delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Reset all network conditions
     */
    reset() {
        this.networkConditions = {
            offline: false,
            slowConnection: false,
            intermittentConnection: false,
            highLatency: false,
            packetLoss: false
        };
        
        this.latencyMs = 0;
        this.packetLossRate = 0;
        this.connectionDropRate = 0;
        
        if (this.isActive) {
            window.fetch = this.originalFetch;
            this.isActive = false;
        }
        
        // Restore online status
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true
        });
        
        console.log('Network simulation reset');
    }

    /**
     * Get current network simulation status
     */
    getStatus() {
        return {
            isActive: this.isActive,
            conditions: { ...this.networkConditions },
            latencyMs: this.latencyMs,
            packetLossRate: this.packetLossRate,
            connectionDropRate: this.connectionDropRate,
            connectionSpeed: this.connectionSpeed || null
        };
    }

    /**
     * Simulate specific network scenarios
     */
    simulateScenario(scenario) {
        this.reset();
        
        switch (scenario) {
            case 'MOBILE_3G':
                this.simulateSlowConnection(50 * 1024); // 50KB/s
                this.simulateHighLatency(300);
                break;
                
            case 'MOBILE_2G':
                this.simulateSlowConnection(5 * 1024); // 5KB/s
                this.simulateHighLatency(800);
                this.simulatePacketLoss(0.05);
                break;
                
            case 'POOR_WIFI':
                this.simulateSlowConnection(100 * 1024); // 100KB/s
                this.simulateHighLatency(200);
                this.simulateIntermittentConnection(0.1);
                break;
                
            case 'UNSTABLE_CONNECTION':
                this.simulateHighLatency(1000);
                this.simulatePacketLoss(0.15);
                this.simulateIntermittentConnection(0.25);
                break;
                
            case 'OFFLINE':
                this.goOffline();
                break;
                
            default:
                console.warn(`Unknown network scenario: ${scenario}`);
        }
        
        console.log(`Network scenario activated: ${scenario}`);
    }
}

// Predefined network scenarios
export const NetworkScenarios = {
    MOBILE_3G: 'MOBILE_3G',
    MOBILE_2G: 'MOBILE_2G', 
    POOR_WIFI: 'POOR_WIFI',
    UNSTABLE_CONNECTION: 'UNSTABLE_CONNECTION',
    OFFLINE: 'OFFLINE'
};

// Global instance
export const networkErrorSimulator = new NetworkErrorSimulator();
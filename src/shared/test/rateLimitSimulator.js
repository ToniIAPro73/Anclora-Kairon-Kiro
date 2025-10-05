/**
 * Rate Limiting Simulation Utilities
 * Tools for simulating various rate limiting scenarios and API throttling conditions
 */

export class RateLimitSimulator {
    constructor() {
        this.originalFetch = window.fetch;
        this.isActive = false;
        this.requestCounts = new Map();
        this.rateLimitConfigs = new Map();
        this.globalConfig = null;
        this.requestLog = [];
    }

    /**
     * Start rate limiting simulation
     */
    startSimulation() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.setupRateLimitInterception();
        
        console.log('Rate limiting simulation activated');
    }

    /**
     * Stop rate limiting simulation
     */
    stopSimulation() {
        if (!this.isActive) return;
        
        this.isActive = false;
        window.fetch = this.originalFetch;
        
        console.log('Rate limiting simulation deactivated');
    }

    /**
     * Setup rate limiting interception
     */
    setupRateLimitInterception() {
        window.fetch = this.createRateLimitedFetch();
    }

    /**
     * Create rate-limited fetch function
     */
    createRateLimitedFetch() {
        return async (url, options = {}) => {
            // Log the request
            this.logRequest(url, options);
            
            // Check rate limits
            const rateLimitResponse = this.checkRateLimit(url, options);
            if (rateLimitResponse) {
                return rateLimitResponse;
            }
            
            // Proceed with original request
            return this.originalFetch(url, options);
        };
    }

    /**
     * Check if request should be rate limited
     */
    checkRateLimit(url, options) {
        const endpoint = this.getEndpointKey(url, options);
        const config = this.getRateLimitConfig(endpoint);
        
        if (!config) return null;
        
        const now = Date.now();
        const windowStart = now - config.windowMs;
        
        // Get or initialize request count for this endpoint
        if (!this.requestCounts.has(endpoint)) {
            this.requestCounts.set(endpoint, []);
        }
        
        const requests = this.requestCounts.get(endpoint);
        
        // Remove old requests outside the window
        const recentRequests = requests.filter(timestamp => timestamp > windowStart);
        this.requestCounts.set(endpoint, recentRequests);
        
        // Check if limit exceeded
        if (recentRequests.length >= config.maxRequests) {
            return this.createRateLimitResponse(config, recentRequests);
        }
        
        // Add current request to count
        recentRequests.push(now);
        
        return null;
    }

    /**
     * Get endpoint key for rate limiting
     */
    getEndpointKey(url, options) {
        const method = options.method || 'GET';
        
        // Extract base endpoint from URL
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            
            // Group similar endpoints
            const normalizedPath = pathname
                .replace(/\/\d+/g, '/:id') // Replace numeric IDs
                .replace(/\/[a-f0-9-]{36}/g, '/:uuid') // Replace UUIDs
                .replace(/\/[a-f0-9]{24}/g, '/:objectid'); // Replace ObjectIDs
            
            return `${method}:${normalizedPath}`;
        } catch (e) {
            return `${method}:${url}`;
        }
    }

    /**
     * Get rate limit configuration for endpoint
     */
    getRateLimitConfig(endpoint) {
        // Check for specific endpoint config
        if (this.rateLimitConfigs.has(endpoint)) {
            return this.rateLimitConfigs.get(endpoint);
        }
        
        // Check for pattern matches
        for (const [pattern, config] of this.rateLimitConfigs.entries()) {
            if (pattern.includes('*') && this.matchesPattern(endpoint, pattern)) {
                return config;
            }
        }
        
        // Return global config if set
        return this.globalConfig;
    }

    /**
     * Check if endpoint matches pattern
     */
    matchesPattern(endpoint, pattern) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(endpoint);
    }

    /**
     * Create rate limit response
     */
    createRateLimitResponse(config, recentRequests) {
        const now = Date.now();
        const oldestRequest = Math.min(...recentRequests);
        const resetTime = oldestRequest + config.windowMs;
        const retryAfter = Math.ceil((resetTime - now) / 1000);
        
        const responseBody = {
            error: 'Rate limit exceeded',
            message: `Too many requests. Limit: ${config.maxRequests} per ${config.windowMs / 1000} seconds`,
            retry_after: retryAfter,
            limit: config.maxRequests,
            remaining: 0,
            reset: resetTime
        };
        
        return new Response(JSON.stringify(responseBody), {
            status: 429,
            statusText: 'Too Many Requests',
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': retryAfter.toString(),
                'X-RateLimit-Limit': config.maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': resetTime.toString(),
                'X-RateLimit-Window': config.windowMs.toString()
            }
        });
    }

    /**
     * Log request for debugging
     */
    logRequest(url, options) {
        this.requestLog.push({
            timestamp: Date.now(),
            url,
            method: options.method || 'GET',
            endpoint: this.getEndpointKey(url, options)
        });
        
        // Keep only recent logs (last 1000 requests)
        if (this.requestLog.length > 1000) {
            this.requestLog = this.requestLog.slice(-1000);
        }
    }

    /**
     * Configure rate limit for specific endpoint
     */
    setEndpointLimit(endpoint, maxRequests, windowMs) {
        this.rateLimitConfigs.set(endpoint, {
            maxRequests,
            windowMs,
            endpoint
        });
        
        console.log(`Rate limit set for ${endpoint}: ${maxRequests} requests per ${windowMs}ms`);
    }

    /**
     * Configure global rate limit
     */
    setGlobalLimit(maxRequests, windowMs) {
        this.globalConfig = {
            maxRequests,
            windowMs,
            endpoint: 'GLOBAL'
        };
        
        console.log(`Global rate limit set: ${maxRequests} requests per ${windowMs}ms`);
    }

    /**
     * Configure rate limit by pattern
     */
    setPatternLimit(pattern, maxRequests, windowMs) {
        this.rateLimitConfigs.set(pattern, {
            maxRequests,
            windowMs,
            endpoint: pattern
        });
        
        console.log(`Rate limit set for pattern ${pattern}: ${maxRequests} requests per ${windowMs}ms`);
    }

    /**
     * Simulate common rate limiting scenarios
     */
    simulateScenario(scenario) {
        this.clearLimits();
        
        switch (scenario) {
            case 'STRICT_API':
                // Very strict API limits
                this.setGlobalLimit(10, 60000); // 10 requests per minute
                this.setEndpointLimit('POST:*', 5, 60000); // 5 POST requests per minute
                break;
                
            case 'AUTH_PROTECTION':
                // Protect authentication endpoints
                this.setPatternLimit('*auth*', 5, 300000); // 5 auth requests per 5 minutes
                this.setPatternLimit('*login*', 3, 300000); // 3 login attempts per 5 minutes
                this.setPatternLimit('*register*', 2, 600000); // 2 registrations per 10 minutes
                break;
                
            case 'BURST_PROTECTION':
                // Prevent burst attacks
                this.setGlobalLimit(100, 60000); // 100 requests per minute
                this.setPatternLimit('POST:*', 20, 60000); // 20 POST requests per minute
                break;
                
            case 'AGGRESSIVE_LIMITING':
                // Very aggressive rate limiting
                this.setGlobalLimit(5, 60000); // 5 requests per minute
                this.setEndpointLimit('POST:*', 2, 60000); // 2 POST requests per minute
                break;
                
            case 'OAUTH_PROTECTION':
                // Protect OAuth endpoints
                this.setPatternLimit('*oauth*', 10, 300000); // 10 OAuth requests per 5 minutes
                this.setPatternLimit('*token*', 5, 300000); // 5 token requests per 5 minutes
                break;
                
            case 'GRADUAL_LIMITING':
                // Gradual rate limiting (different limits for different endpoints)
                this.setGlobalLimit(50, 60000); // 50 requests per minute globally
                this.setPatternLimit('GET:*', 100, 60000); // 100 GET requests per minute
                this.setPatternLimit('POST:*', 20, 60000); // 20 POST requests per minute
                this.setPatternLimit('PUT:*', 10, 60000); // 10 PUT requests per minute
                this.setPatternLimit('DELETE:*', 5, 60000); // 5 DELETE requests per minute
                break;
                
            default:
                console.warn(`Unknown rate limiting scenario: ${scenario}`);
        }
        
        console.log(`Rate limiting scenario activated: ${scenario}`);
    }

    /**
     * Clear all rate limit configurations
     */
    clearLimits() {
        this.rateLimitConfigs.clear();
        this.globalConfig = null;
        this.requestCounts.clear();
        
        console.log('All rate limits cleared');
    }

    /**
     * Get current request counts
     */
    getRequestCounts() {
        const counts = {};
        const now = Date.now();
        
        for (const [endpoint, requests] of this.requestCounts.entries()) {
            const config = this.getRateLimitConfig(endpoint);
            if (config) {
                const windowStart = now - config.windowMs;
                const recentRequests = requests.filter(timestamp => timestamp > windowStart);
                counts[endpoint] = {
                    current: recentRequests.length,
                    limit: config.maxRequests,
                    remaining: Math.max(0, config.maxRequests - recentRequests.length),
                    resetTime: recentRequests.length > 0 ? Math.min(...recentRequests) + config.windowMs : null
                };
            }
        }
        
        return counts;
    }

    /**
     * Get rate limit status for specific endpoint
     */
    getEndpointStatus(endpoint) {
        const config = this.getRateLimitConfig(endpoint);
        if (!config) return null;
        
        const now = Date.now();
        const requests = this.requestCounts.get(endpoint) || [];
        const windowStart = now - config.windowMs;
        const recentRequests = requests.filter(timestamp => timestamp > windowStart);
        
        return {
            endpoint,
            current: recentRequests.length,
            limit: config.maxRequests,
            remaining: Math.max(0, config.maxRequests - recentRequests.length),
            resetTime: recentRequests.length > 0 ? Math.min(...recentRequests) + config.windowMs : null,
            isLimited: recentRequests.length >= config.maxRequests
        };
    }

    /**
     * Get request log for debugging
     */
    getRequestLog(limit = 100) {
        return this.requestLog.slice(-limit);
    }

    /**
     * Clear request log
     */
    clearRequestLog() {
        this.requestLog = [];
    }

    /**
     * Get current simulation status
     */
    getStatus() {
        return {
            isActive: this.isActive,
            globalConfig: this.globalConfig,
            endpointConfigs: Object.fromEntries(this.rateLimitConfigs),
            requestCounts: this.getRequestCounts(),
            totalRequests: this.requestLog.length
        };
    }

    /**
     * Reset all rate limiting state
     */
    reset() {
        this.stopSimulation();
        this.clearLimits();
        this.clearRequestLog();
    }
}

// Predefined rate limiting scenarios
export const RateLimitScenarios = {
    STRICT_API: 'STRICT_API',
    AUTH_PROTECTION: 'AUTH_PROTECTION',
    BURST_PROTECTION: 'BURST_PROTECTION',
    AGGRESSIVE_LIMITING: 'AGGRESSIVE_LIMITING',
    OAUTH_PROTECTION: 'OAUTH_PROTECTION',
    GRADUAL_LIMITING: 'GRADUAL_LIMITING'
};

// Global instance
export const rateLimitSimulator = new RateLimitSimulator();
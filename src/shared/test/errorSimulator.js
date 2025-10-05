/**
 * Error Simulation Utilities for Testing Authentication Error Handling
 * Provides tools to simulate various error conditions for comprehensive testing
 */

export class ErrorSimulator {
    constructor() {
        this.originalFetch = window.fetch;
        this.isSimulating = false;
        this.simulationConfig = {
            networkErrors: false,
            supabaseErrors: false,
            oauthErrors: false,
            rateLimiting: false
        };
        this.requestCount = 0;
        this.rateLimitConfig = {
            maxRequests: 5,
            windowMs: 60000, // 1 minute
            resetTime: null
        };
    }

    /**
     * Start error simulation with specified configuration
     * @param {Object} config - Simulation configuration
     */
    startSimulation(config = {}) {
        this.simulationConfig = { ...this.simulationConfig, ...config };
        this.isSimulating = true;
        this.requestCount = 0;
        this.rateLimitConfig.resetTime = Date.now() + this.rateLimitConfig.windowMs;
        
        // Override fetch to simulate errors
        window.fetch = this.createMockFetch();
        
        console.log('Error simulation started with config:', this.simulationConfig);
    }

    /**
     * Stop error simulation and restore original fetch
     */
    stopSimulation() {
        this.isSimulating = false;
        window.fetch = this.originalFetch;
        this.requestCount = 0;
        console.log('Error simulation stopped');
    }

    /**
     * Create mock fetch function that simulates various error conditions
     */
    createMockFetch() {
        return async (url, options = {}) => {
            // Check if we should simulate errors for this request
            if (!this.isSimulating) {
                return this.originalFetch(url, options);
            }

            const isSupabaseRequest = url.includes('supabase') || url.includes('auth');
            const isOAuthRequest = url.includes('oauth') || url.includes('google') || url.includes('github');

            // Simulate network errors
            if (this.simulationConfig.networkErrors) {
                const networkError = this.simulateNetworkError();
                if (networkError) {
                    throw networkError;
                }
            }

            // Simulate rate limiting
            if (this.simulationConfig.rateLimiting) {
                const rateLimitResponse = this.simulateRateLimit();
                if (rateLimitResponse) {
                    return rateLimitResponse;
                }
            }

            // Simulate Supabase errors
            if (this.simulationConfig.supabaseErrors && isSupabaseRequest) {
                const supabaseError = this.simulateSupabaseError(url, options);
                if (supabaseError) {
                    return supabaseError;
                }
            }

            // Simulate OAuth errors
            if (this.simulationConfig.oauthErrors && isOAuthRequest) {
                const oauthError = this.simulateOAuthError(url, options);
                if (oauthError) {
                    return oauthError;
                }
            }

            // If no simulation triggered, use original fetch
            return this.originalFetch(url, options);
        };
    }

    /**
     * Simulate various network error conditions
     */
    simulateNetworkError() {
        const errorTypes = [
            'CONNECTION_REFUSED',
            'TIMEOUT',
            'DNS_FAILURE',
            'NETWORK_UNREACHABLE'
        ];

        const randomType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
        
        switch (randomType) {
            case 'CONNECTION_REFUSED':
                const connectionError = new Error('Failed to fetch');
                connectionError.name = 'TypeError';
                connectionError.code = 'ECONNREFUSED';
                return connectionError;
                
            case 'TIMEOUT':
                const timeoutError = new Error('Request timeout');
                timeoutError.name = 'TimeoutError';
                timeoutError.code = 'TIMEOUT';
                return timeoutError;
                
            case 'DNS_FAILURE':
                const dnsError = new Error('DNS resolution failed');
                dnsError.name = 'TypeError';
                dnsError.code = 'ENOTFOUND';
                return dnsError;
                
            case 'NETWORK_UNREACHABLE':
                const networkError = new Error('Network unreachable');
                networkError.name = 'TypeError';
                networkError.code = 'ENETUNREACH';
                return networkError;
                
            default:
                return null;
        }
    }

    /**
     * Simulate Supabase-specific error responses
     */
    simulateSupabaseError(url, options) {
        const errorScenarios = [
            'SERVICE_UNAVAILABLE',
            'DATABASE_ERROR',
            'AUTH_SERVICE_DOWN',
            'INVALID_API_KEY',
            'QUOTA_EXCEEDED'
        ];

        const scenario = errorScenarios[Math.floor(Math.random() * errorScenarios.length)];
        
        switch (scenario) {
            case 'SERVICE_UNAVAILABLE':
                return new Response(
                    JSON.stringify({
                        error: 'Service Unavailable',
                        message: 'Supabase service is temporarily unavailable'
                    }),
                    {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: {
                            'Content-Type': 'application/json',
                            'Retry-After': '60'
                        }
                    }
                );
                
            case 'DATABASE_ERROR':
                return new Response(
                    JSON.stringify({
                        error: 'Database Error',
                        message: 'Database connection failed'
                    }),
                    {
                        status: 500,
                        statusText: 'Internal Server Error',
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
                
            case 'AUTH_SERVICE_DOWN':
                return new Response(
                    JSON.stringify({
                        error: 'Authentication Service Unavailable',
                        message: 'Auth service is currently down for maintenance'
                    }),
                    {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
                
            case 'INVALID_API_KEY':
                return new Response(
                    JSON.stringify({
                        error: 'Invalid API Key',
                        message: 'The provided API key is invalid or expired'
                    }),
                    {
                        status: 401,
                        statusText: 'Unauthorized',
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
                
            case 'QUOTA_EXCEEDED':
                return new Response(
                    JSON.stringify({
                        error: 'Quota Exceeded',
                        message: 'API quota has been exceeded'
                    }),
                    {
                        status: 429,
                        statusText: 'Too Many Requests',
                        headers: {
                            'Content-Type': 'application/json',
                            'Retry-After': '3600'
                        }
                    }
                );
                
            default:
                return null;
        }
    }

    /**
     * Simulate OAuth provider error responses
     */
    simulateOAuthError(url, options) {
        const oauthErrors = [
            'PROVIDER_UNAVAILABLE',
            'INVALID_CLIENT_ID',
            'ACCESS_DENIED',
            'INVALID_SCOPE',
            'SERVER_ERROR'
        ];

        const errorType = oauthErrors[Math.floor(Math.random() * oauthErrors.length)];
        
        switch (errorType) {
            case 'PROVIDER_UNAVAILABLE':
                return new Response(
                    JSON.stringify({
                        error: 'service_unavailable',
                        error_description: 'OAuth provider is temporarily unavailable'
                    }),
                    {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
                
            case 'INVALID_CLIENT_ID':
                return new Response(
                    JSON.stringify({
                        error: 'invalid_client',
                        error_description: 'Invalid client ID or client secret'
                    }),
                    {
                        status: 401,
                        statusText: 'Unauthorized',
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
                
            case 'ACCESS_DENIED':
                return new Response(
                    JSON.stringify({
                        error: 'access_denied',
                        error_description: 'User denied access to the application'
                    }),
                    {
                        status: 403,
                        statusText: 'Forbidden',
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
                
            case 'INVALID_SCOPE':
                return new Response(
                    JSON.stringify({
                        error: 'invalid_scope',
                        error_description: 'The requested scope is invalid or unknown'
                    }),
                    {
                        status: 400,
                        statusText: 'Bad Request',
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
                
            case 'SERVER_ERROR':
                return new Response(
                    JSON.stringify({
                        error: 'server_error',
                        error_description: 'OAuth provider encountered an internal error'
                    }),
                    {
                        status: 500,
                        statusText: 'Internal Server Error',
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
                
            default:
                return null;
        }
    }

    /**
     * Simulate rate limiting responses
     */
    simulateRateLimit() {
        this.requestCount++;
        
        // Reset counter if window has passed
        if (Date.now() > this.rateLimitConfig.resetTime) {
            this.requestCount = 1;
            this.rateLimitConfig.resetTime = Date.now() + this.rateLimitConfig.windowMs;
        }
        
        if (this.requestCount > this.rateLimitConfig.maxRequests) {
            const resetIn = Math.ceil((this.rateLimitConfig.resetTime - Date.now()) / 1000);
            
            return new Response(
                JSON.stringify({
                    error: 'Rate Limit Exceeded',
                    message: `Too many requests. Try again in ${resetIn} seconds.`,
                    retry_after: resetIn
                }),
                {
                    status: 429,
                    statusText: 'Too Many Requests',
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': resetIn.toString(),
                        'X-RateLimit-Limit': this.rateLimitConfig.maxRequests.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': this.rateLimitConfig.resetTime.toString()
                    }
                }
            );
        }
        
        return null;
    }

    /**
     * Get current simulation status
     */
    getStatus() {
        return {
            isSimulating: this.isSimulating,
            config: this.simulationConfig,
            requestCount: this.requestCount,
            rateLimitReset: this.rateLimitConfig.resetTime
        };
    }

    /**
     * Reset simulation state
     */
    reset() {
        this.stopSimulation();
        this.simulationConfig = {
            networkErrors: false,
            supabaseErrors: false,
            oauthErrors: false,
            rateLimiting: false
        };
        this.requestCount = 0;
        this.rateLimitConfig.resetTime = null;
    }
}

// Predefined simulation scenarios for common testing cases
export const SimulationScenarios = {
    NETWORK_ISSUES: {
        networkErrors: true,
        supabaseErrors: false,
        oauthErrors: false,
        rateLimiting: false
    },
    
    SUPABASE_DOWN: {
        networkErrors: false,
        supabaseErrors: true,
        oauthErrors: false,
        rateLimiting: false
    },
    
    OAUTH_FAILURES: {
        networkErrors: false,
        supabaseErrors: false,
        oauthErrors: true,
        rateLimiting: false
    },
    
    RATE_LIMITED: {
        networkErrors: false,
        supabaseErrors: false,
        oauthErrors: false,
        rateLimiting: true
    },
    
    ALL_ERRORS: {
        networkErrors: true,
        supabaseErrors: true,
        oauthErrors: true,
        rateLimiting: true
    },
    
    INTERMITTENT_ISSUES: {
        networkErrors: true,
        supabaseErrors: true,
        oauthErrors: false,
        rateLimiting: false
    }
};

// Global instance for easy access
export const errorSimulator = new ErrorSimulator();
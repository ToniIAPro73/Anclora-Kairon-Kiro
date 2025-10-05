/**
 * Supabase Response Mocking Utilities
 * Provides comprehensive mocking for Supabase authentication responses and errors
 */

export class SupabaseMocker {
    constructor() {
        this.originalFetch = window.fetch;
        this.isActive = false;
        this.mockResponses = new Map();
        this.requestLog = [];
        this.defaultResponses = this.setupDefaultResponses();
    }

    /**
     * Setup default mock responses for common Supabase operations
     */
    setupDefaultResponses() {
        return {
            // Successful responses
            signUp: {
                success: {
                    user: {
                        id: 'mock-user-id-123',
                        email: 'test@example.com',
                        email_confirmed_at: null,
                        created_at: new Date().toISOString()
                    },
                    session: null
                }
            },
            
            signIn: {
                success: {
                    user: {
                        id: 'mock-user-id-123',
                        email: 'test@example.com',
                        email_confirmed_at: new Date().toISOString(),
                        created_at: new Date().toISOString()
                    },
                    session: {
                        access_token: 'mock-access-token',
                        refresh_token: 'mock-refresh-token',
                        expires_in: 3600,
                        token_type: 'bearer'
                    }
                }
            },
            
            signOut: {
                success: {}
            },
            
            getUser: {
                success: {
                    user: {
                        id: 'mock-user-id-123',
                        email: 'test@example.com',
                        email_confirmed_at: new Date().toISOString()
                    }
                }
            },

            // Error responses
            errors: {
                invalidCredentials: {
                    error: {
                        message: 'Invalid login credentials',
                        status: 400
                    }
                },
                
                userNotFound: {
                    error: {
                        message: 'User not found',
                        status: 404
                    }
                },
                
                userAlreadyExists: {
                    error: {
                        message: 'User already registered',
                        status: 422
                    }
                },
                
                weakPassword: {
                    error: {
                        message: 'Password should be at least 6 characters',
                        status: 422
                    }
                },
                
                emailNotConfirmed: {
                    error: {
                        message: 'Email not confirmed',
                        status: 400
                    }
                },
                
                rateLimited: {
                    error: {
                        message: 'Too many requests',
                        status: 429
                    }
                },
                
                serviceUnavailable: {
                    error: {
                        message: 'Service temporarily unavailable',
                        status: 503
                    }
                },
                
                databaseError: {
                    error: {
                        message: 'Database connection failed',
                        status: 500
                    }
                },
                
                invalidApiKey: {
                    error: {
                        message: 'Invalid API key',
                        status: 401
                    }
                }
            }
        };
    }

    /**
     * Start mocking Supabase responses
     */
    startMocking() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.requestLog = [];
        window.fetch = this.createMockFetch();
        
        console.log('Supabase mocking activated');
    }

    /**
     * Stop mocking and restore original fetch
     */
    stopMocking() {
        if (!this.isActive) return;
        
        this.isActive = false;
        window.fetch = this.originalFetch;
        
        console.log('Supabase mocking deactivated');
    }

    /**
     * Create mock fetch function for Supabase requests
     */
    createMockFetch() {
        return async (url, options = {}) => {
            // Log the request
            this.logRequest(url, options);
            
            // Check if this is a Supabase request
            if (!this.isSupabaseRequest(url)) {
                return this.originalFetch(url, options);
            }

            // Get mock response for this request
            const mockResponse = this.getMockResponse(url, options);
            if (mockResponse) {
                return mockResponse;
            }

            // Fallback to original fetch if no mock defined
            return this.originalFetch(url, options);
        };
    }

    /**
     * Check if URL is a Supabase request
     */
    isSupabaseRequest(url) {
        return url.includes('supabase') || 
               url.includes('/auth/') ||
               url.includes('/rest/') ||
               url.includes('/realtime/');
    }

    /**
     * Log request for debugging
     */
    logRequest(url, options) {
        this.requestLog.push({
            timestamp: new Date().toISOString(),
            url,
            method: options.method || 'GET',
            headers: options.headers || {},
            body: options.body
        });
    }

    /**
     * Get mock response for a request
     */
    getMockResponse(url, options) {
        const method = options.method || 'GET';
        const body = options.body ? JSON.parse(options.body) : null;
        
        // Check for custom mock responses first
        const customKey = this.generateRequestKey(url, method, body);
        if (this.mockResponses.has(customKey)) {
            return this.createResponse(this.mockResponses.get(customKey));
        }

        // Check for auth endpoints
        if (url.includes('/auth/v1/signup')) {
            return this.handleSignUp(body);
        }
        
        if (url.includes('/auth/v1/token') && method === 'POST') {
            return this.handleSignIn(body);
        }
        
        if (url.includes('/auth/v1/logout')) {
            return this.handleSignOut();
        }
        
        if (url.includes('/auth/v1/user') && method === 'GET') {
            return this.handleGetUser();
        }

        return null;
    }

    /**
     * Handle sign up requests
     */
    handleSignUp(body) {
        if (!body || !body.email || !body.password) {
            return this.createErrorResponse(this.defaultResponses.errors.weakPassword, 422);
        }

        // Simulate user already exists
        if (body.email === 'existing@example.com') {
            return this.createErrorResponse(this.defaultResponses.errors.userAlreadyExists, 422);
        }

        // Simulate weak password
        if (body.password.length < 6) {
            return this.createErrorResponse(this.defaultResponses.errors.weakPassword, 422);
        }

        return this.createResponse(this.defaultResponses.signUp.success);
    }

    /**
     * Handle sign in requests
     */
    handleSignIn(body) {
        if (!body || !body.email || !body.password) {
            return this.createErrorResponse(this.defaultResponses.errors.invalidCredentials, 400);
        }

        // Simulate invalid credentials
        if (body.email === 'invalid@example.com' || body.password === 'wrongpassword') {
            return this.createErrorResponse(this.defaultResponses.errors.invalidCredentials, 400);
        }

        // Simulate user not found
        if (body.email === 'notfound@example.com') {
            return this.createErrorResponse(this.defaultResponses.errors.userNotFound, 404);
        }

        // Simulate email not confirmed
        if (body.email === 'unconfirmed@example.com') {
            return this.createErrorResponse(this.defaultResponses.errors.emailNotConfirmed, 400);
        }

        return this.createResponse(this.defaultResponses.signIn.success);
    }

    /**
     * Handle sign out requests
     */
    handleSignOut() {
        return this.createResponse(this.defaultResponses.signOut.success);
    }

    /**
     * Handle get user requests
     */
    handleGetUser() {
        return this.createResponse(this.defaultResponses.getUser.success);
    }

    /**
     * Create a Response object from mock data
     */
    createResponse(data, status = 200) {
        return new Response(JSON.stringify(data), {
            status,
            statusText: status === 200 ? 'OK' : 'Error',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Create an error Response object
     */
    createErrorResponse(errorData, status) {
        return new Response(JSON.stringify(errorData), {
            status,
            statusText: 'Error',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Generate a unique key for request mocking
     */
    generateRequestKey(url, method, body) {
        const bodyStr = body ? JSON.stringify(body) : '';
        return `${method}:${url}:${bodyStr}`;
    }

    /**
     * Set custom mock response for specific request
     */
    mockRequest(url, method, body, response) {
        const key = this.generateRequestKey(url, method, body);
        this.mockResponses.set(key, response);
    }

    /**
     * Mock specific error scenarios
     */
    mockErrorScenario(scenario) {
        switch (scenario) {
            case 'SERVICE_UNAVAILABLE':
                this.mockAllRequests(this.defaultResponses.errors.serviceUnavailable, 503);
                break;
                
            case 'DATABASE_ERROR':
                this.mockAllRequests(this.defaultResponses.errors.databaseError, 500);
                break;
                
            case 'INVALID_API_KEY':
                this.mockAllRequests(this.defaultResponses.errors.invalidApiKey, 401);
                break;
                
            case 'RATE_LIMITED':
                this.mockAllRequests(this.defaultResponses.errors.rateLimited, 429);
                break;
                
            default:
                console.warn(`Unknown error scenario: ${scenario}`);
        }
    }

    /**
     * Mock all requests with the same response
     */
    mockAllRequests(response, status = 200) {
        // Override the mock fetch to always return this response
        const originalMockFetch = this.createMockFetch();
        
        window.fetch = async (url, options = {}) => {
            this.logRequest(url, options);
            
            if (this.isSupabaseRequest(url)) {
                return status >= 400 ? 
                    this.createErrorResponse(response, status) :
                    this.createResponse(response, status);
            }
            
            return this.originalFetch(url, options);
        };
    }

    /**
     * Clear all custom mock responses
     */
    clearMocks() {
        this.mockResponses.clear();
        if (this.isActive) {
            window.fetch = this.createMockFetch();
        }
    }

    /**
     * Get request log for debugging
     */
    getRequestLog() {
        return [...this.requestLog];
    }

    /**
     * Clear request log
     */
    clearRequestLog() {
        this.requestLog = [];
    }

    /**
     * Get current mocking status
     */
    getStatus() {
        return {
            isActive: this.isActive,
            mockCount: this.mockResponses.size,
            requestCount: this.requestLog.length
        };
    }

    /**
     * Reset all mocking state
     */
    reset() {
        this.stopMocking();
        this.clearMocks();
        this.clearRequestLog();
    }
}

// Predefined error scenarios
export const SupabaseErrorScenarios = {
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    DATABASE_ERROR: 'DATABASE_ERROR',
    INVALID_API_KEY: 'INVALID_API_KEY',
    RATE_LIMITED: 'RATE_LIMITED'
};

// Global instance
export const supabaseMocker = new SupabaseMocker();
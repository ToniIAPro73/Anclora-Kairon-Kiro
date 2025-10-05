/**
 * OAuth Error Simulation Utilities
 * Specialized tools for simulating OAuth provider failures and error conditions
 */

export class OAuthErrorSimulator {
    constructor() {
        this.originalFetch = window.fetch;
        this.originalOpen = window.open;
        this.isActive = false;
        this.errorScenarios = new Map();
        this.popupWindows = new Set();
        this.oauthCallbacks = new Map();
    }

    /**
     * Start OAuth error simulation
     */
    startSimulation() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.setupOAuthInterception();
        
        console.log('OAuth error simulation activated');
    }

    /**
     * Stop OAuth error simulation
     */
    stopSimulation() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.restoreOriginalMethods();
        this.closeAllPopups();
        
        console.log('OAuth error simulation deactivated');
    }

    /**
     * Setup OAuth request interception
     */
    setupOAuthInterception() {
        // Override fetch for OAuth API calls
        window.fetch = this.createOAuthAwareFetch();
        
        // Override window.open for OAuth popups
        window.open = this.createOAuthAwareOpen();
    }

    /**
     * Restore original methods
     */
    restoreOriginalMethods() {
        window.fetch = this.originalFetch;
        window.open = this.originalOpen;
    }

    /**
     * Create OAuth-aware fetch function
     */
    createOAuthAwareFetch() {
        return async (url, options = {}) => {
            // Check if this is an OAuth-related request
            if (this.isOAuthRequest(url)) {
                const errorResponse = this.getOAuthErrorResponse(url, options);
                if (errorResponse) {
                    return errorResponse;
                }
            }
            
            return this.originalFetch(url, options);
        };
    }

    /**
     * Create OAuth-aware window.open function
     */
    createOAuthAwareOpen() {
        return (url, name, features) => {
            if (this.isOAuthPopupRequest(url)) {
                return this.simulateOAuthPopup(url, name, features);
            }
            
            return this.originalOpen(url, name, features);
        };
    }

    /**
     * Check if URL is an OAuth request
     */
    isOAuthRequest(url) {
        return url.includes('oauth') ||
               url.includes('google') ||
               url.includes('github') ||
               url.includes('facebook') ||
               url.includes('twitter') ||
               url.includes('linkedin') ||
               url.includes('auth/v1/authorize');
    }

    /**
     * Check if URL is an OAuth popup request
     */
    isOAuthPopupRequest(url) {
        return this.isOAuthRequest(url) && 
               (url.includes('authorize') || url.includes('login'));
    }

    /**
     * Get OAuth error response based on configured scenarios
     */
    getOAuthErrorResponse(url, options) {
        const provider = this.detectOAuthProvider(url);
        const scenario = this.errorScenarios.get(provider) || this.errorScenarios.get('ALL');
        
        if (!scenario) return null;
        
        return this.createOAuthErrorResponse(scenario, provider);
    }

    /**
     * Detect OAuth provider from URL
     */
    detectOAuthProvider(url) {
        if (url.includes('google')) return 'GOOGLE';
        if (url.includes('github')) return 'GITHUB';
        if (url.includes('facebook')) return 'FACEBOOK';
        if (url.includes('twitter')) return 'TWITTER';
        if (url.includes('linkedin')) return 'LINKEDIN';
        return 'UNKNOWN';
    }

    /**
     * Create OAuth error response
     */
    createOAuthErrorResponse(scenario, provider) {
        const errorResponses = {
            PROVIDER_UNAVAILABLE: {
                error: 'service_unavailable',
                error_description: `${provider} OAuth service is temporarily unavailable`,
                error_uri: 'https://docs.oauth.provider.com/errors#service_unavailable'
            },
            
            INVALID_CLIENT: {
                error: 'invalid_client',
                error_description: 'Invalid client ID or client secret',
                error_uri: 'https://docs.oauth.provider.com/errors#invalid_client'
            },
            
            ACCESS_DENIED: {
                error: 'access_denied',
                error_description: 'User denied access to the application',
                error_uri: 'https://docs.oauth.provider.com/errors#access_denied'
            },
            
            INVALID_SCOPE: {
                error: 'invalid_scope',
                error_description: 'The requested scope is invalid or unknown',
                error_uri: 'https://docs.oauth.provider.com/errors#invalid_scope'
            },
            
            SERVER_ERROR: {
                error: 'server_error',
                error_description: 'OAuth provider encountered an internal error',
                error_uri: 'https://docs.oauth.provider.com/errors#server_error'
            },
            
            TEMPORARILY_UNAVAILABLE: {
                error: 'temporarily_unavailable',
                error_description: 'OAuth service is temporarily overloaded or under maintenance',
                error_uri: 'https://docs.oauth.provider.com/errors#temporarily_unavailable'
            },
            
            INVALID_REQUEST: {
                error: 'invalid_request',
                error_description: 'The request is missing required parameters or is malformed',
                error_uri: 'https://docs.oauth.provider.com/errors#invalid_request'
            },
            
            UNSUPPORTED_RESPONSE_TYPE: {
                error: 'unsupported_response_type',
                error_description: 'The authorization server does not support this response type',
                error_uri: 'https://docs.oauth.provider.com/errors#unsupported_response_type'
            }
        };

        const errorData = errorResponses[scenario];
        if (!errorData) return null;

        const statusCodes = {
            PROVIDER_UNAVAILABLE: 503,
            INVALID_CLIENT: 401,
            ACCESS_DENIED: 403,
            INVALID_SCOPE: 400,
            SERVER_ERROR: 500,
            TEMPORARILY_UNAVAILABLE: 503,
            INVALID_REQUEST: 400,
            UNSUPPORTED_RESPONSE_TYPE: 400
        };

        return new Response(JSON.stringify(errorData), {
            status: statusCodes[scenario] || 400,
            statusText: 'OAuth Error',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    }

    /**
     * Simulate OAuth popup behavior
     */
    simulateOAuthPopup(url, name, features) {
        const provider = this.detectOAuthProvider(url);
        const scenario = this.errorScenarios.get(provider) || this.errorScenarios.get('ALL');
        
        // Create mock popup window
        const mockPopup = this.createMockPopup(url, scenario, provider);
        this.popupWindows.add(mockPopup);
        
        // Simulate popup behavior based on scenario
        setTimeout(() => {
            this.handlePopupScenario(mockPopup, scenario, provider);
        }, 1000); // Simulate loading time
        
        return mockPopup;
    }

    /**
     * Create mock popup window object
     */
    createMockPopup(url, scenario, provider) {
        const mockPopup = {
            location: { href: url },
            closed: false,
            close: function() {
                this.closed = true;
            },
            focus: function() {},
            blur: function() {},
            postMessage: function(message, origin) {
                // Simulate cross-origin messaging
                if (window.onmessage) {
                    window.onmessage({
                        data: message,
                        origin: origin,
                        source: this
                    });
                }
            }
        };
        
        // Add event listener capabilities
        mockPopup.addEventListener = function(event, callback) {
            if (event === 'beforeunload') {
                this._beforeUnloadCallback = callback;
            }
        };
        
        return mockPopup;
    }

    /**
     * Handle popup scenario based on error type
     */
    handlePopupScenario(popup, scenario, provider) {
        switch (scenario) {
            case 'ACCESS_DENIED':
                // Simulate user denying access
                this.simulateUserDenial(popup, provider);
                break;
                
            case 'PROVIDER_UNAVAILABLE':
            case 'SERVER_ERROR':
            case 'TEMPORARILY_UNAVAILABLE':
                // Simulate provider error page
                this.simulateProviderError(popup, scenario, provider);
                break;
                
            case 'INVALID_CLIENT':
                // Simulate invalid client error
                this.simulateInvalidClient(popup, provider);
                break;
                
            case 'POPUP_BLOCKED':
                // Simulate popup being blocked
                this.simulatePopupBlocked(popup);
                break;
                
            case 'NETWORK_ERROR':
                // Simulate network error in popup
                this.simulateNetworkError(popup);
                break;
                
            default:
                // Default to successful flow (for testing recovery)
                this.simulateSuccessfulAuth(popup, provider);
        }
    }

    /**
     * Simulate user denying access
     */
    simulateUserDenial(popup, provider) {
        const errorUrl = `${popup.location.href}?error=access_denied&error_description=User+denied+access`;
        popup.location.href = errorUrl;
        
        // Simulate callback with error
        setTimeout(() => {
            this.triggerOAuthCallback('access_denied', 'User denied access to the application');
            popup.close();
        }, 500);
    }

    /**
     * Simulate provider error
     */
    simulateProviderError(popup, scenario, provider) {
        const errorMessages = {
            PROVIDER_UNAVAILABLE: `${provider} is temporarily unavailable`,
            SERVER_ERROR: `${provider} encountered an internal error`,
            TEMPORARILY_UNAVAILABLE: `${provider} is under maintenance`
        };
        
        const errorUrl = `${popup.location.href}?error=server_error&error_description=${encodeURIComponent(errorMessages[scenario])}`;
        popup.location.href = errorUrl;
        
        setTimeout(() => {
            this.triggerOAuthCallback('server_error', errorMessages[scenario]);
            popup.close();
        }, 1000);
    }

    /**
     * Simulate invalid client error
     */
    simulateInvalidClient(popup, provider) {
        const errorUrl = `${popup.location.href}?error=invalid_client&error_description=Invalid+client+ID`;
        popup.location.href = errorUrl;
        
        setTimeout(() => {
            this.triggerOAuthCallback('invalid_client', 'Invalid client ID or client secret');
            popup.close();
        }, 500);
    }

    /**
     * Simulate popup being blocked
     */
    simulatePopupBlocked(popup) {
        // Immediately close the popup to simulate blocking
        popup.closed = true;
        
        // Trigger popup blocked error
        setTimeout(() => {
            this.triggerOAuthCallback('popup_blocked', 'Popup was blocked by browser');
        }, 100);
    }

    /**
     * Simulate network error in popup
     */
    simulateNetworkError(popup) {
        popup.location.href = 'about:blank';
        
        setTimeout(() => {
            this.triggerOAuthCallback('network_error', 'Network error occurred during OAuth flow');
            popup.close();
        }, 2000);
    }

    /**
     * Simulate successful authentication (for testing recovery)
     */
    simulateSuccessfulAuth(popup, provider) {
        const successUrl = `${popup.location.href}?code=mock_auth_code_123&state=mock_state`;
        popup.location.href = successUrl;
        
        setTimeout(() => {
            this.triggerOAuthCallback('success', 'Authentication successful', {
                code: 'mock_auth_code_123',
                state: 'mock_state'
            });
            popup.close();
        }, 1500);
    }

    /**
     * Trigger OAuth callback
     */
    triggerOAuthCallback(type, message, data = null) {
        const callbackData = {
            type,
            message,
            data,
            timestamp: new Date().toISOString()
        };
        
        // Trigger custom event
        window.dispatchEvent(new CustomEvent('oauth-callback', {
            detail: callbackData
        }));
        
        // Also trigger message event for compatibility
        window.dispatchEvent(new MessageEvent('message', {
            data: callbackData,
            origin: window.location.origin
        }));
    }

    /**
     * Configure error scenario for specific provider
     */
    setProviderError(provider, scenario) {
        this.errorScenarios.set(provider, scenario);
        console.log(`OAuth error scenario set: ${provider} -> ${scenario}`);
    }

    /**
     * Configure error scenario for all providers
     */
    setGlobalError(scenario) {
        this.errorScenarios.set('ALL', scenario);
        console.log(`Global OAuth error scenario set: ${scenario}`);
    }

    /**
     * Clear error scenarios
     */
    clearErrorScenarios() {
        this.errorScenarios.clear();
        console.log('OAuth error scenarios cleared');
    }

    /**
     * Close all popup windows
     */
    closeAllPopups() {
        this.popupWindows.forEach(popup => {
            if (!popup.closed) {
                popup.close();
            }
        });
        this.popupWindows.clear();
    }

    /**
     * Get current simulation status
     */
    getStatus() {
        return {
            isActive: this.isActive,
            errorScenarios: Object.fromEntries(this.errorScenarios),
            activePopups: this.popupWindows.size
        };
    }

    /**
     * Reset all OAuth simulation state
     */
    reset() {
        this.stopSimulation();
        this.clearErrorScenarios();
        this.closeAllPopups();
    }
}

// Predefined OAuth error scenarios
export const OAuthErrorScenarios = {
    PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
    INVALID_CLIENT: 'INVALID_CLIENT',
    ACCESS_DENIED: 'ACCESS_DENIED',
    INVALID_SCOPE: 'INVALID_SCOPE',
    SERVER_ERROR: 'SERVER_ERROR',
    TEMPORARILY_UNAVAILABLE: 'TEMPORARILY_UNAVAILABLE',
    INVALID_REQUEST: 'INVALID_REQUEST',
    UNSUPPORTED_RESPONSE_TYPE: 'UNSUPPORTED_RESPONSE_TYPE',
    POPUP_BLOCKED: 'POPUP_BLOCKED',
    NETWORK_ERROR: 'NETWORK_ERROR'
};

// OAuth providers
export const OAuthProviders = {
    GOOGLE: 'GOOGLE',
    GITHUB: 'GITHUB',
    FACEBOOK: 'FACEBOOK',
    TWITTER: 'TWITTER',
    LINKEDIN: 'LINKEDIN'
};

// Global instance
export const oauthErrorSimulator = new OAuthErrorSimulator();
/**
 * ErrorLogger - Sistema de logging de errores para autenticación
 * Maneja el registro de errores, métricas de rendimiento y estadísticas
 */

class ErrorLogger {
    constructor() {
        this.errors = [];
        this.performanceMetrics = [];
        this.remoteLoggingConfig = null;
        this.maxLocalLogs = 1000; // Límite de logs locales para evitar memory leaks
        
        // Niveles de severidad
        this.SEVERITY_LEVELS = {
            LOW: 'low',
            MEDIUM: 'medium',
            HIGH: 'high',
            CRITICAL: 'critical'
        };
        
        // Inicializar almacenamiento local si está disponible
        this.initializeStorage();
    }

    /**
     * Inicializar el sistema de almacenamiento local
     */
    initializeStorage() {
        try {
            if (typeof localStorage !== 'undefined') {
                const storedErrors = localStorage.getItem('anclora_error_logs');
                if (storedErrors) {
                    this.errors = JSON.parse(storedErrors).slice(-this.maxLocalLogs);
                }
                
                const storedMetrics = localStorage.getItem('anclora_performance_metrics');
                if (storedMetrics) {
                    this.performanceMetrics = JSON.parse(storedMetrics).slice(-this.maxLocalLogs);
                }
            }
        } catch (error) {
            console.warn('Error initializing ErrorLogger storage:', error);
        }
    }

    /**
     * Registrar un error con contexto y nivel de severidad
     * @param {Error|string} error - El error a registrar
     * @param {Object} context - Contexto adicional del error
     * @param {string} severity - Nivel de severidad (low, medium, high, critical)
     */
    logError(error, context = {}, severity = this.SEVERITY_LEVELS.MEDIUM) {
        try {
            const errorEntry = {
                id: this.generateId(),
                timestamp: new Date().toISOString(),
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : null,
                severity: severity,
                context: this.sanitizeContext(context),
                userAgent: navigator.userAgent,
                url: window.location.href,
                sessionId: this.getSessionId()
            };

            // Agregar a la lista local
            this.errors.push(errorEntry);
            
            // Mantener solo los últimos logs para evitar memory leaks
            if (this.errors.length > this.maxLocalLogs) {
                this.errors = this.errors.slice(-this.maxLocalLogs);
            }

            // Persistir en localStorage
            this.persistToLocalStorage('anclora_error_logs', this.errors);

            // Log a consola según severidad
            this.logToConsole(errorEntry);

            // Enviar a logging remoto si está configurado
            if (this.remoteLoggingConfig) {
                this.sendToRemoteLogging(errorEntry);
            }

            return errorEntry.id;
        } catch (loggingError) {
            console.error('Error in ErrorLogger.logError:', loggingError);
        }
    }

    /**
     * Registrar métricas de rendimiento para operaciones
     * @param {string} operation - Nombre de la operación
     * @param {number} duration - Duración en milisegundos
     * @param {boolean} success - Si la operación fue exitosa
     * @param {Object} additionalData - Datos adicionales de la métrica
     */
    logPerformanceMetric(operation, duration, success, additionalData = {}) {
        try {
            const metricEntry = {
                id: this.generateId(),
                timestamp: new Date().toISOString(),
                operation: operation,
                duration: duration,
                success: success,
                additionalData: this.sanitizeContext(additionalData),
                sessionId: this.getSessionId()
            };

            // Agregar a la lista local
            this.performanceMetrics.push(metricEntry);
            
            // Mantener solo las últimas métricas
            if (this.performanceMetrics.length > this.maxLocalLogs) {
                this.performanceMetrics = this.performanceMetrics.slice(-this.maxLocalLogs);
            }

            // Persistir en localStorage
            this.persistToLocalStorage('anclora_performance_metrics', this.performanceMetrics);

            // Log a consola en modo debug
            if (process.env.NODE_ENV === 'development') {
                console.debug(`Performance: ${operation} - ${duration}ms - ${success ? 'SUCCESS' : 'FAILED'}`);
            }

            // Enviar a logging remoto si está configurado
            if (this.remoteLoggingConfig) {
                this.sendMetricToRemoteLogging(metricEntry);
            }

            return metricEntry.id;
        } catch (loggingError) {
            console.error('Error in ErrorLogger.logPerformanceMetric:', loggingError);
        }
    }

    /**
     * Obtener estadísticas de errores para análisis
     * @param {Object} options - Opciones de filtrado
     * @returns {Object} Estadísticas de errores
     */
    getErrorStats(options = {}) {
        try {
            const { 
                timeRange = 24 * 60 * 60 * 1000, // 24 horas por defecto
                severity = null,
                operation = null 
            } = options;

            const cutoffTime = new Date(Date.now() - timeRange);
            
            // Filtrar errores según criterios
            let filteredErrors = this.errors.filter(error => {
                const errorTime = new Date(error.timestamp);
                if (errorTime < cutoffTime) return false;
                if (severity && error.severity !== severity) return false;
                if (operation && error.context.operation !== operation) return false;
                return true;
            });

            // Calcular estadísticas
            const stats = {
                totalErrors: filteredErrors.length,
                errorsBySeverity: this.groupBy(filteredErrors, 'severity'),
                errorsByOperation: this.groupBy(filteredErrors, error => error.context.operation || 'unknown'),
                errorsByHour: this.groupErrorsByTimeInterval(filteredErrors, 'hour'),
                mostCommonErrors: this.getMostCommonErrors(filteredErrors),
                timeRange: {
                    from: cutoffTime.toISOString(),
                    to: new Date().toISOString()
                }
            };

            // Agregar métricas de rendimiento si están disponibles
            const filteredMetrics = this.performanceMetrics.filter(metric => {
                const metricTime = new Date(metric.timestamp);
                return metricTime >= cutoffTime;
            });

            stats.performanceStats = {
                totalOperations: filteredMetrics.length,
                successRate: this.calculateSuccessRate(filteredMetrics),
                averageDuration: this.calculateAverageDuration(filteredMetrics),
                operationStats: this.groupBy(filteredMetrics, 'operation')
            };

            return stats;
        } catch (error) {
            console.error('Error in ErrorLogger.getErrorStats:', error);
            return {
                totalErrors: 0,
                error: 'Failed to generate stats'
            };
        }
    }

    /**
     * Configurar logging remoto opcional
     * @param {Object} config - Configuración del logging remoto
     */
    configureRemoteLogging(config) {
        try {
            this.remoteLoggingConfig = {
                endpoint: config.endpoint,
                apiKey: config.apiKey,
                batchSize: config.batchSize || 10,
                flushInterval: config.flushInterval || 30000, // 30 segundos
                enabled: config.enabled !== false
            };

            // Iniciar flush periódico si está habilitado
            if (this.remoteLoggingConfig.enabled) {
                this.startPeriodicFlush();
            }

            console.log('Remote logging configured successfully');
        } catch (error) {
            console.error('Error configuring remote logging:', error);
        }
    }

    /**
     * Limpiar logs antiguos para mantener el rendimiento
     * @param {number} maxAge - Edad máxima en milisegundos
     */
    cleanupOldLogs(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 días por defecto
        try {
            const cutoffTime = new Date(Date.now() - maxAge);
            
            this.errors = this.errors.filter(error => {
                return new Date(error.timestamp) >= cutoffTime;
            });
            
            this.performanceMetrics = this.performanceMetrics.filter(metric => {
                return new Date(metric.timestamp) >= cutoffTime;
            });

            // Actualizar localStorage
            this.persistToLocalStorage('anclora_error_logs', this.errors);
            this.persistToLocalStorage('anclora_performance_metrics', this.performanceMetrics);

            console.log(`Cleaned up logs older than ${maxAge}ms`);
        } catch (error) {
            console.error('Error cleaning up old logs:', error);
        }
    }

    // Métodos privados

    /**
     * Generar ID único para logs
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Obtener o generar session ID
     */
    getSessionId() {
        if (!this.sessionId) {
            this.sessionId = sessionStorage.getItem('anclora_session_id') || this.generateId();
            sessionStorage.setItem('anclora_session_id', this.sessionId);
        }
        return this.sessionId;
    }

    /**
     * Sanitizar contexto para evitar datos sensibles
     */
    sanitizeContext(context) {
        const sanitized = { ...context };
        
        // Remover campos sensibles
        const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });

        // Limitar tamaño del contexto
        const contextString = JSON.stringify(sanitized);
        if (contextString.length > 5000) {
            return { ...sanitized, _truncated: true, _originalSize: contextString.length };
        }

        return sanitized;
    }

    /**
     * Log a consola según severidad
     */
    logToConsole(errorEntry) {
        const message = `[${errorEntry.severity.toUpperCase()}] ${errorEntry.message}`;
        
        switch (errorEntry.severity) {
            case this.SEVERITY_LEVELS.CRITICAL:
                console.error(message, errorEntry);
                break;
            case this.SEVERITY_LEVELS.HIGH:
                console.error(message, errorEntry.context);
                break;
            case this.SEVERITY_LEVELS.MEDIUM:
                console.warn(message, errorEntry.context);
                break;
            case this.SEVERITY_LEVELS.LOW:
                console.log(message, errorEntry.context);
                break;
            default:
                console.log(message, errorEntry.context);
        }
    }

    /**
     * Persistir datos en localStorage
     */
    persistToLocalStorage(key, data) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, JSON.stringify(data));
            }
        } catch (error) {
            console.warn('Failed to persist to localStorage:', error);
        }
    }

    /**
     * Enviar error a logging remoto
     */
    async sendToRemoteLogging(errorEntry) {
        if (!this.remoteLoggingConfig || !this.remoteLoggingConfig.enabled) {
            return;
        }

        try {
            const response = await fetch(this.remoteLoggingConfig.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.remoteLoggingConfig.apiKey}`
                },
                body: JSON.stringify({
                    type: 'error',
                    data: errorEntry
                })
            });

            if (!response.ok) {
                console.warn('Failed to send error to remote logging:', response.status);
            }
        } catch (error) {
            console.warn('Error sending to remote logging:', error);
        }
    }

    /**
     * Enviar métrica a logging remoto
     */
    async sendMetricToRemoteLogging(metricEntry) {
        if (!this.remoteLoggingConfig || !this.remoteLoggingConfig.enabled) {
            return;
        }

        try {
            const response = await fetch(this.remoteLoggingConfig.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.remoteLoggingConfig.apiKey}`
                },
                body: JSON.stringify({
                    type: 'metric',
                    data: metricEntry
                })
            });

            if (!response.ok) {
                console.warn('Failed to send metric to remote logging:', response.status);
            }
        } catch (error) {
            console.warn('Error sending metric to remote logging:', error);
        }
    }

    /**
     * Iniciar flush periódico para logging remoto
     */
    startPeriodicFlush() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }

        this.flushInterval = setInterval(() => {
            this.flushToRemoteLogging();
        }, this.remoteLoggingConfig.flushInterval);
    }

    /**
     * Flush batch de logs a logging remoto
     */
    async flushToRemoteLogging() {
        // Implementación de batch flush si es necesario
        // Por ahora enviamos logs individuales
    }

    /**
     * Agrupar elementos por una propiedad
     */
    groupBy(array, keyOrFunction) {
        return array.reduce((groups, item) => {
            const key = typeof keyOrFunction === 'function' ? keyOrFunction(item) : item[keyOrFunction];
            groups[key] = groups[key] || [];
            groups[key].push(item);
            return groups;
        }, {});
    }

    /**
     * Agrupar errores por intervalo de tiempo
     */
    groupErrorsByTimeInterval(errors, interval = 'hour') {
        const groups = {};
        
        errors.forEach(error => {
            const date = new Date(error.timestamp);
            let key;
            
            switch (interval) {
                case 'hour':
                    key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
                    break;
                case 'day':
                    key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                    break;
                default:
                    key = date.toISOString();
            }
            
            groups[key] = (groups[key] || 0) + 1;
        });
        
        return groups;
    }

    /**
     * Obtener errores más comunes
     */
    getMostCommonErrors(errors, limit = 10) {
        const errorCounts = {};
        
        errors.forEach(error => {
            const key = error.message;
            errorCounts[key] = (errorCounts[key] || 0) + 1;
        });
        
        return Object.entries(errorCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([message, count]) => ({ message, count }));
    }

    /**
     * Calcular tasa de éxito de métricas
     */
    calculateSuccessRate(metrics) {
        if (metrics.length === 0) return 0;
        const successCount = metrics.filter(m => m.success).length;
        return (successCount / metrics.length) * 100;
    }

    /**
     * Calcular duración promedio de operaciones
     */
    calculateAverageDuration(metrics) {
        if (metrics.length === 0) return 0;
        const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
        return totalDuration / metrics.length;
    }
}

// Crear instancia singleton
const errorLogger = new ErrorLogger();

export default errorLogger;
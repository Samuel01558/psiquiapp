/**
 * Sistema de Logging Profesional para PsiquiApp
 * Utiliza Winston para logging estructurado
 */

const winston = require('winston');
const path = require('path');

// Formato personalizado para logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato para consola (más legible)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = '\n' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Crear el logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'psiquiapp' },
  transports: [
    // Errores en archivo separado
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Todos los logs en combined.log
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// En development, también log a consola con formato legible
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

// Método auxiliar para registrar requests HTTP
logger.logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
};

// Método para errores de base de datos
logger.dbError = (operation, error, details = {}) => {
  logger.error(`Database Error: ${operation}`, {
    error: error.message,
    code: error.code,
    errno: error.errno,
    sqlMessage: error.sqlMessage,
    sql: error.sql,
    ...details
  });
};

// Método para errores de autenticación
logger.authError = (type, details = {}) => {
  logger.warn(`Authentication Error: ${type}`, details);
};

// Método para eventos de seguridad
logger.security = (event, details = {}) => {
  logger.warn(`Security Event: ${event}`, details);
};

module.exports = logger;

const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');

/**
 * 이 코드는 Winston 로깅 시스템을 구성하는 고급 설정 파일입니다. 파일 회전, 민감 정보 마스킹, 디버그 로그,
 * JSON 포맷, 컬러 콘솔 출력, 환경 변수 기반 설정 등 실제 서비스에서 유용한 기능들이 모두 포함돼 있습니다.
 */
const { redactFormat, redactMessage, debugTraverse, jsonTruncateFormat } = require('./parsers');

const logDir = path.join(__dirname, '..', 'logs');

const { NODE_ENV, DEBUG_LOGGING = true, CONSOLE_JSON = false, DEBUG_CONSOLE = false } = process.env;

const useConsoleJson =
  (typeof CONSOLE_JSON === 'string' && CONSOLE_JSON?.toLowerCase() === 'true') ||
  CONSOLE_JSON === true;

const useDebugConsole =
  (typeof DEBUG_CONSOLE === 'string' && DEBUG_CONSOLE?.toLowerCase() === 'true') ||
  DEBUG_CONSOLE === true;

const useDebugLogging =
  (typeof DEBUG_LOGGING === 'string' && DEBUG_LOGGING?.toLowerCase() === 'true') ||
  DEBUG_LOGGING === true;

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  activity: 6,
  silly: 7,
};

winston.addColors({
  info: 'green', // fontStyle color
  warn: 'italic yellow',
  error: 'red',
  debug: 'blue',
});

const level = () => {
  const env = NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

const fileFormat = winston.format.combine(
  redactFormat(),
  winston.format.timestamp({ format: () => new Date().toISOString() }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  // redactErrors(),
);

const transports = [
  new winston.transports.DailyRotateFile({
    level: 'error',
    filename: `${logDir}/error-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat,
  }),
];

if (useDebugLogging) {
  transports.push(
    new winston.transports.DailyRotateFile({
      level: 'debug',
      filename: `${logDir}/debug-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(fileFormat, debugTraverse),
    }),
  );
}

const consoleFormat = winston.format.combine(
  redactFormat(),
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  // redactErrors(),
  winston.format.printf((info) => {
    const message = `${info.timestamp} ${info.level}: ${info.message}`;
    if (info.level.includes('error')) {
      return redactMessage(message);
    }

    return message;
  }),
);

// Determine console log level
let consoleLogLevel = 'info';
if (useDebugConsole) {
  consoleLogLevel = 'debug';
}

if (useDebugConsole) {
  transports.push(
    new winston.transports.Console({
      level: consoleLogLevel,
      format: useConsoleJson
        ? winston.format.combine(fileFormat, jsonTruncateFormat(), winston.format.json())
        : winston.format.combine(fileFormat, debugTraverse),
    }),
  );
} else if (useConsoleJson) {
  transports.push(
    new winston.transports.Console({
      level: consoleLogLevel,
      format: winston.format.combine(fileFormat, jsonTruncateFormat(), winston.format.json()),
    }),
  );
} else {
  transports.push(
    new winston.transports.Console({
      level: consoleLogLevel,
      format: consoleFormat,
    }),
  );
}

const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

module.exports = logger;

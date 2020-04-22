import winston from 'winston';
import { VorpalTransport } from './vorpalTransport';

const format = winston.format;
const customFormat = format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`);
const levelFormat = format(info => {
    info.level = `[${info.level}]`;
    return info;
});

export const logger = winston.createLogger({
    level: 'silly',
    format: format.combine(
        format.timestamp({ format: 'D/M/YYYY HH:mm:ss' }),
        levelFormat(),
        format.colorize(),
        customFormat
    ),
    transports: [new VorpalTransport(), new winston.transports.File({ filename: 'combined.log', level: 'silly' })],
    exceptionHandlers: [new winston.transports.File({ filename: 'exceptions.log' })],
});

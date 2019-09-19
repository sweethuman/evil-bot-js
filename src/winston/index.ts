import winston, { silly } from 'winston';
import { VorpalTransport } from './vorpalTransport';

export const logger = winston.createLogger({
    level: 'silly',
    transports: [new VorpalTransport()],
});

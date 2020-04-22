import i18next from 'i18next';
import { logger } from './winston';
import Backend from 'i18next-node-fs-backend';
import * as path from 'path';
console.log(process.cwd());
i18next.use(Backend).init(
    {
        fallbackLng: 'en',
        ns: ['common', 'twitch'],
        defaultNS: 'common',
        lng: 'en',
        debug: true,
        backend: {
            loadPath: path.join(process.cwd(), `./language/{{lng}}/{{ns}}.json`),
        },
    },
    (err, t) => {
        logger.silly(err);
        logger.silly('init');
    }
);

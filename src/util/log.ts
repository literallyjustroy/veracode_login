import log4js from 'log4js';
import 'source-map-support/register'; // Error handling showing typescript lines

log4js.configure({
    appenders: {
        console: { type: 'stdout', layout: { type: 'colored' } },
        logFile: { type: 'file', filename: 'logs/log.log' }
    },
    categories: {
        default: { appenders: ['logFile', 'console'], level: 'debug' },
    }
});

export const log = log4js.getLogger('default');

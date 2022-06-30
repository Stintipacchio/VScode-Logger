'use babel';

import os from 'os';
const SimpleNodeLogger = require('simple-node-logger'),
    opts = {
        logFilePath: os.homedir() + '/VScode_logger.log',
        timestampFormat:'YYYY-MM-DD HH:mm:ss'
    };
let log = SimpleNodeLogger.createSimpleFileLogger(opts);

export default class CollectorLogger {
    // Create a warn message
    static warn(msg) {
        log.log('warn',msg);
    }
    // Create a error message
    static error(msg) {
        log.log('error',msg);
    }
    // Create a information message
    static info(msg) {
        log.info(msg);
    }
}

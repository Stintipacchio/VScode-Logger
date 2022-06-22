'use babel';

let home = require('user-home');
const SimpleNodeLogger = require('simple-node-logger'),
    opts = {
        logFilePath: home+'/atom_logger.log',
        timestampFormat:'YYYY-MM-DD HH:mm:ss'
    }
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

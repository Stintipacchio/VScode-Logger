'use babel';

let home = require('user-home');
const SimpleNodeLogger = require('simple-node-logger'),
    opts = {
        logFilePath: home+'/atom_logger.log',
        timestampFormat:'YYYY-MM-DD HH:mm:ss'
    }
let log = SimpleNodeLogger.createSimpleFileLogger(opts);

export default class CollectorLogger {
    // Crea un messaggio di warn
    static warn(msg) {
        log.log('warn',msg);
    }
    // Crea un messaggio di errore
    static error(msg) {
        log.log('error',msg);
    }
    // Crea un messaggio di informazione
    static info(msg) {
        log.info(msg);
    }
}

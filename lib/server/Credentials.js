'use babel';

import atomLogger from "../atom-logger";

export default class Credentials {

	constructor() {
		this.prot = atomLogger.config.protocol;
		this.addr = atomLogger.config.serverAddress;
		this.email = atomLogger.config.email;
		this.pass = atomLogger.config.password;
	}
}

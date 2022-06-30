'use babel';

import VScodeLogger from '../VScode-logger.js';

export default class Metric {

	constructor(id, fileName, startDate, endDate, activity_type, value, session) {
		this.id = id;
		this.tabName = fileName;
		if(!startDate) startDate = new Date().toISOString();
		this.startDate = startDate;
		this.endDate = endDate;
		if(!session) session = VScodeLogger.session;
		this.session = session;
		if(!activity_type) activity_type = "tab_name";
		this.activity_type = activity_type;
		if(!value) value = "";
		this.value = value;
	}

	finish() {
		if(!this.session) this.session = VScodeLogger.session;
		this.endDate = new Date().toISOString();
	}
}

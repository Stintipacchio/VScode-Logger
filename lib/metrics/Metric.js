'use babel';

import atomLogger from '../atom-logger.js';

export default class Metric {

	constructor(id, fileName, startDate, endDate, activity_type, value, session) {
		this.id = id;
		this.tabName = fileName;
		if(!startDate) startDate = new Date().toISOString();
		this.startDate = startDate;
		this.endDate = endDate;
		if(!session) session = atomLogger.session;
		this.session = session;
		if(!activity_type) activity_type = "VScode_tab_name";
		this.activity_type = activity_type;
		if(!value) value = "";
		this.value = value;
	}

	finish() {
		if(!this.session) this.session = atomLogger.session;
		this.endDate = new Date().toISOString();
	}
}

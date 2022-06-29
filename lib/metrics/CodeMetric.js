'use babel';

var difflib = require('jsdifflib');
import Metric from './Metric.js';

export default class CodeMetric extends Metric {

	constructor(name, source) {
		super(null, name);
		this.source = source;
		this.metrics = [];
	}

	// When the "finish" method is invoked on this type of object the changes are compared and the corresponding metrics returned
	async finish(newSource) {
		this.endDate = await new Date().toISOString();
		var sourceList = this.source.split("\n");
		var newSourceList = newSource.split("\n");

		var sm = await new difflib.SequenceMatcher(sourceList, newSourceList);

		sm.get_opcodes().forEach(async opcode => {
			switch(opcode[0]){
				case "insert": await this.metricInsert(opcode, newSourceList); break;
				case "delete": await this.metricDeleted(opcode, sourceList); break;
				case "replace": await this.metricReplaced(opcode, sourceList, newSourceList); break;
			}
		});

		return this.metrics;
	}

	//Return the added metrics
	async metricInsert(opcode, newSourceList){
		this.metrics.push(await new Metric(0, this.tabName, this.startDate, this.endDate,
			"VScode_lines_insert",
			opcode[4] - opcode[3],
			this.session));

		var newComments = await this.findComments(newSourceList, opcode[3], opcode[4]);
		if(newComments > 0){
			this.metrics.push(await new Metric(0, this.tabName, this.startDate, this.endDate,
				"VScode_comments_added",
				newComments,
				this.session));
		}

		var newTests = await this.findTests(newSourceList, opcode[3], opcode[4]);
		if(newTests > 0){
			this.metrics.push(await new Metric(0, this.tabName, this.startDate, this.endDate,
				"VScode_tests_added",
				newTests,
				this.session));
		}
	}
	// Return the metrics inherent to the lines, comments and tests that were deleted
	async metricDeleted(opcode, sourceList){
		this.metrics.push(await new Metric(0, this.tabName, this.startDate, this.endDate,
			"VScode_lines_deleted",
			opcode[2] - opcode[1],
			this.session));

		var oldComments = await this.findComments(sourceList, opcode[1], opcode[2]);
		if(oldComments > 0){
			this.metrics.push(await new Metric(0, this.tabName, this.startDate, this.endDate,
				"VScode_comments_deleted",
				oldComments,
				this.session));
		}

		var oldtests = await this.findTests(sourceList, opcode[1], opcode[2]);
		if(oldtests > 0){
			this.metrics.push(await new Metric(0, this.tabName, this.startDate, this.endDate,
				"VScode_tests_deleted",
				oldtests,
				this.session));
		}
	}
	// Return the metrics inherent to the lines, comments and tests that were modified
	async metricReplaced(opcode, sourceList, newSourceList){
		this.metrics.push(await new Metric(0, this.tabName, this.startDate, this.endDate,
			"VScode_lines_change",
			opcode[2] - opcode[1],
			this.session));

		var oldComments = await this.findComments(sourceList, opcode[1], opcode[2]);
		var newComments = await this.findComments(newSourceList, opcode[3], opcode[4]);

		if(oldComments > newComments){
			this.metrics.push(await new Metric(0, this.tabName, this.startDate, this.endDate,
				"VScode_comments_deleted",
				oldComments - newComments,
				this.session));
		}else if(newComments > oldComments){
			this.metrics.push(await new Metric(0, this.tabName, this.startDate, this.endDate,
				"VScode_comments_added",
				newComments - oldComments,
				this.session));
		}

		var oldTests = await this.findTests(sourceList, opcode[1], opcode[2]);
		var newTests = await this.findTests(newSourceList, opcode[3], opcode[4]);

		if(oldTests > newTests){
			this.metrics.push(await new Metric(0, this.tabName, this.startDate, this.endDate,
				"VScode_tests_deleted",
				oldTests - newTests,
				this.session));
		}else if(newTests > oldTests){
			this.metrics.push(await new Metric(0, this.tabName, this.startDate, this.endDate,
				"VScode_tests_added",
				newTests - oldTests,
				this.session));
		}
	}

	// Return the number of comments in a file
	async findComments(lines, start, end) {
		var commentStrings = ["//", "%", "#", "*"];
		var amount = 0;
		for(var i=start; i<end; i++) {
			if (commentStrings.some(o => lines[i].includes(o))) {
				amount += 1;
			}
		}
		return amount;
	}

	// Return the number of tests in a file
	async findTests(lines, start, end){
		var testDeclarationStrings = ["@Test", "@Given", "@When", "@Then"];
		var amount = 0;
		for(var i=start; i<end; i++) {
			if (testDeclarationStrings.some(o => lines[i].includes(o))) {
				amount += 1;
			}
		}
		return amount;
	}
}

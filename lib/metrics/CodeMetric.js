'use babel';

var difflib = require('jsdifflib');
import Metric from './Metric.js';

export default class CodeMetric extends Metric {

	constructor(name, source) {
		super(null, name);
		this.source = source;
		this.metrics = [];
	}

	//Quando viene invocato il metodo finish su questo tipo di oggetto
	//vengono confrontate le modifiche e ritornate le metriche corrispondenti
	finish(newSource) {
		this.endDate = new Date().toISOString();
		var sourceList = this.source.split("\n");
		var newSourceList = newSource.split("\n");

		var sm = new difflib.SequenceMatcher(sourceList, newSourceList);

		sm.get_opcodes().forEach(opcode => {
			switch(opcode[0]){
				case "insert": this.metricInsert(opcode, newSourceList); break;
				case "delete": this.metricDeleted(opcode, sourceList); break;
				case "replace": this.metricReplaced(opcode, sourceList, newSourceList); break;
			}
		});

		return this.metrics;
	}

	//Questa funzione ritorna le metriche aggiunte
	metricInsert(opcode, newSourceList){
		this.metrics.push(new Metric(0, this.tabName, this.startDate, this.endDate,
			"VScode_lines_insert",
			opcode[4] - opcode[3],
			this.session));

		var newComments = this.findComments(newSourceList, opcode[3], opcode[4]);
		if(newComments > 0){
			this.metrics.push(new Metric(0, this.tabName, this.startDate, this.endDate,
				"VScode_comments_added",
				newComments,
				this.session));
		}

		var newTests = this.findTests(newSourceList, opcode[3], opcode[4]);
		if(newTests > 0){
			this.metrics.push(new Metric(0, this.tabName, this.startDate, this.endDate,
				"VScode_tests_added",
				newTests,
				this.session));
		}
	}

	//Questa funzione ritorna le metriche inerenti alle linee, commenti, test eliminati
	metricDeleted(opcode, sourceList){
		this.metrics.push(new Metric(0, this.tabName, this.startDate, this.endDate,
			"VScode_lines_deleted",
			opcode[2] - opcode[1],
			this.session));

		var oldComments = this.findComments(sourceList, opcode[1], opcode[2]);
		if(oldComments > 0){
			this.metrics.push(new Metric(0, this.tabName, this.startDate, this.endDate,
				"VScode_comments_deleted",
				oldComments,
				this.session));
		}

		var oldtests = this.findTests(sourceList, opcode[1], opcode[2]);
		if(oldtests > 0){
			this.metrics.push(new Metric(0, this.tabName, this.startDate, this.endDate,
				"VScode_tests_deleted",
				oldtests,
				this.session));
		}
	}
	//Questa funzione ritorna le metriche inerenti alle linee, commenti e test modificati
	metricReplaced(opcode, sourceList, newSourceList){
		this.metrics.push(new Metric(0, this.tabName, this.startDate, this.endDate,
			"VScode_lines_change",
			opcode[2] - opcode[1],
			this.session));

		var oldComments = this.findComments(sourceList, opcode[1], opcode[2]);
		var newComments = this.findComments(newSourceList, opcode[3], opcode[4]);

		if(oldComments > newComments){
			this.metrics.push(new Metric(0, this.tabName, this.startDate, this.endDate,
				"VScode_comments_deleted",
				oldComments - newComments,
				this.session));
		}else if(newComments > oldComments){
			this.metrics.push(new Metric(0, this.tabName, this.startDate, this.endDate,
				"VScode_comments_added",
				newComments - oldComments,
				this.session));
		}

		var oldTests = this.findTests(sourceList, opcode[1], opcode[2]);
		var newTests = this.findTests(newSourceList, opcode[3], opcode[4]);

		if(oldTests > newTests){
			this.metrics.push(new Metric(0, this.tabName, this.startDate, this.endDate,
				"VScode_tests_deleted",
				oldTests - newTests,
				this.session));
		}else if(newTests > oldTests){
			this.metrics.push(new Metric(0, this.tabName, this.startDate, this.endDate,
				"VScode_tests_added",
				newTests - oldTests,
				this.session));
		}
	}

	//Questa funzione ritorna il numero di commenti all'interno di un file
	findComments(lines, start, end) {
		var commentStrings = ["//", "%", "#", "*"];
		var amount = 0;
		for(var i=start; i<end; i++) {
			if (commentStrings.some(o => lines[i].includes(o))) {
				amount += 1;
			}
		}
		return amount;
	}

	//Questa funzione ritorna il numero di test all'interno di un file
	findTests(lines, start, end){
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

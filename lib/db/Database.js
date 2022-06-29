'use babel';

import * as vscode from 'vscode';
const sqlite3 = require('sqlite3').verbose();
import Metric from '../metrics/Metric.js';
import Session from '../metrics/Session.js';
import CollectorLogger from '../loggs/CollectorLogger.js';
import path from 'path';
export default class Database {

	constructor() {
		return new Promise(async (resolve, reject) => {
			try {
			await this.createTables();
			} catch (ex) {
				return reject(ex);
			}
			resolve(this);
		});
	}
	
    
	

	// Create a new connection SQLite database
	async newConnection() {
		var db = new sqlite3.Database(path.resolve('../', '.innometrics.db'), (err) => {
			if(err){
				CollectorLogger.error(err.toString());
				vscode.window.showErrorMessage(err.toString());
			}
		});
		return db;
	}

	// Deletes every table in local storage
	async dropTables(){
		let db = await this.newConnection();
		let sql = "DROP TABLE METRIC ";

		db.run(sql, [], (err) => {
			if(err){
				CollectorLogger.error(err.toString());
				vscode.window.showErrorMessage(err.toString());
			}
		});

		sql = "DROP TABLE TOKEN ";

		db.run(sql, [], (err) => {
			if(err){
				CollectorLogger.error(err.toString());
				vscode.window.showErrorMessage(err.toString());
			}
		});

		db.close();
	}

	// Creates tables in local store, if not created yet
	async createTables(){
		let db = await this.newConnection();
		console.log('CONNECTION TO DB COMPLETED');
		let sql =
			"CREATE TABLE IF NOT EXISTS METRIC " +
			"(ID INTEGER PRIMARY KEY," +
			" name           TEXT    NOT NULL, " +
			" start_date     varchar(50)     NOT NULL, " +
			" end_date       varchar(50)	NOT NULL, " +
			" ip_addr		 varchar(50), " +
			" activity_type		 varchar(50) NOT NULL, " +
			" value		 TEXT, " +
			"mac_addr 	 varchar(50));"

		db.run(sql, [], (err) => {
			if(err){
				CollectorLogger.error(err.toString());
				vscode.window.showErrorMessage(err.toString());
			}
		});

		sql =
			"CREATE TABLE IF NOT EXISTS TOKEN " +
			"(ID INTEGER PRIMARY KEY, " +
			"value varchar(100) NOT NULL, " +
			"addr varchar(100) NOT NULL);";

		db.run(sql, [], (err) => {
			if(err){
				vscode.window.showErrorMessage(err.toString());
				CollectorLogger.error(err.toString());
			}
		});

		db.close();
	}

	// Insert a new metric as a parameter to the database
	async insertNewMetric(metric) {
		let db = await this.newConnection();
		let sql = "INSERT INTO METRIC "
				+ "(name, start_date, end_date, ip_addr, mac_addr,"
				+ "activity_type, value) VALUES ('" +
				metric.tabName + "', '" +
				metric.startDate + "', '" +
				metric.endDate + "', '" +
				metric.session.ipAddr  + "', '" +
				metric.session.macAddr  + "', '" +
				metric.activity_type  + "', '" +
				metric.value  + "');";

		db.run(sql, [], (err) => {
			if(err){
				CollectorLogger.error(err.toString());
				vscode.window.showErrorMessage(err.toString());
			}
		});

		db.close();
	}

	// Return all the database metrics
	async getMetrics() {
		var metrics = [];
		let db = await new sqlite3.Database(path.resolve('../', '.innometrics.db'));
		let sql = "SELECT * FROM METRIC;";

		return new Promise((resolve, reject) => {
			db.all(sql, [], (err, rows) => {
				if(err){
					CollectorLogger.error(err.toString());
					vscode.window.showErrorMessage(err.toString())
					reject();
				}else{
					rows.forEach((row) => {
						metrics.push(new Metric(row.ID, row.name, row.start_date,
								row.end_date, row.activity_type, row.value,
								new Session(row.ip_addr, row.mac_addr)));
					});
					if (metrics[0]) resolve(metrics);
					else reject();
				}
			});

			db.close();
		});
	}

	// Delets the metrics passed as a parameter to the database
	async deleteMetrics(metrics) {
		if (!metrics.length) {
			return;
		}

		var ids = [];
		for (var i in metrics) {
			ids.push(metrics[i].id);
		}

		let db = await this.newConnection();
		let sql = "DELETE FROM METRIC WHERE id in (" +
				ids.toString() + ");";

		db.run(sql, [], (err) => {
			if(err){
				vscode.window.showErrorMessage(err.toString())
				CollectorLogger.error(err.toString());
			}
		});

		db.close();
	}

	// Saves the acces token to the database, the token will be reused to recconect to the database without credentials
	async saveToken(token, addr) {

		let db = await this.newConnection();

		let sql = "INSERT INTO TOKEN (value, addr) VALUES(?, ?);";
		db.all(sql, [token, addr], (err) => {
			if (err) {
				CollectorLogger.error(err.toString());
			}
		});

		db.close();
	}

	// Removes the acces token from the databse
  async deleteToken(){
		let db = await this.newConnection();
		let sql = "DELETE FROM TOKEN;"

		db.all(sql, [], (err) => {
			if (err) {
				CollectorLogger.error(err.toString());
			}
		});

		db.close();
	}

	//Funzione che ottiene il token di accesso dal database
	async getToken(addr) {
		let db = await new sqlite3.Database(path.resolve('../', '.innometrics.db'));

		let sql = "SELECT VALUE FROM TOKEN "
				+ "WHERE addr=? ORDER"
				+ " BY ID DESC LIMIT 1;";

		return new Promise((resolve, reject) => {
			db.all(sql, [addr], (err, rows) => {
				if(err){
					vscode.window.showErrorMessage(err.toString())
					CollectorLogger.error(err.toString());
					reject();
				}else if(rows.length){
					resolve(rows[0].value);
				}
				reject();
			});
			db.close();
		});
	}

	//Returns the last address the user has connected to
	async getAddr() {
		let db = await new sqlite3.Database(path.resolve('../', '.innometrics.db'));
		let sql = "SELECT ADDR FROM TOKEN "
				+ "ORDER "
				+ "BY ID DESC LIMIT 1;";

		return new Promise((resolve, reject) => {
			db.all(sql, [], (err, rows) => {
				if(err){
					vscode.window.showErrorMessage(err.toString());
					CollectorLogger.error(err.toString());
				}else if(rows.length){
					resolve(rows[0].addr);
				}

				resolve();
			});
			db.close();
		});
	}
}

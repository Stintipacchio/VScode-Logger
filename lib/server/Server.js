'use babel';

import * as vscode from 'vscode';
import VScodeLogger from '../VScode-logger.js';
import CollectorLogger from '../loggs/CollectorLogger.js';
import fetch from 'node-fetch';
import {FormData} from 'formdata-node';
import os from 'os';
import path from 'path';
import editJsonFile from 'edit-json-file';
var internet;
const checkInternetConnected = require('check-internet-connected');
checkInternetConnected()
  .then((result) => {
	internet = true;
  })
  .catch((ex) => {
	internet = false;
  });

export default class Server { 

	async authenticate(logged) {
		this.addr = VScodeLogger.config.protocol+VScodeLogger.config.serverAddress;
		let address_tmp = VScodeLogger.config.protocol+VScodeLogger.config.serverAddress;
		var email = VScodeLogger.config.email;
		var password = VScodeLogger.config.password;

		if (!this.addr || !email || !password) return null;
		vscode.window.showInformationMessage('Authenticating...');
		return new Promise(async (resolve, reject) => {

			await fetch(address_tmp + "/login", {
				method: 'POST',
				body: JSON.stringify({email: email, password: password}),
				headers: {
					'Content-Type': 'application/json'
				},
			})
			.then(response => {
				response.json()
					.then(data => ({ 
						data: data,
						status: response.status,
						headers: response.headers
					})
			).then(res =>{
			
				console.log('XMLHttpRequest loaded successfully');
				if (res.headers.get('Content-Type') !== 'application/json'){
					vscode.window.showErrorMessage("ERROR - Wrong server");
				}
				// Login succesfull
				else if (res.status === 200) {
					VScodeLogger.config.token = res.data.token;
					if(logged) VScodeLogger.db.saveToken(VScodeLogger.config.token, address_tmp);
					VScodeLogger.auth = true;
					vscode.window.showInformationMessage("Successfully Login");
					resolve(VScodeLogger.config.token);
				// Login failed
				}else{
					VScodeLogger.auth = false;
					VScodeLogger.config.remember = false;
					
					let configDirectory = "";
					if(os.type() === 'Linux'){ 
					  configDirectory = '/.config/Code/User';
					}
					else if(os.type() === 'Windows_NT'){
					  configDirectory = '/' + os.hostname() + '/%APPDATA%\Code\User';
					}
					else if(os.type() === 'Darwin'){
					  configDirectory = '/Library/Application\ Support/Code/User';
					}
			  
					let configFile = editJsonFile(path.resolve(os.homedir() + configDirectory, 'settings.json'), {
					  autosave: true
					});
					configFile.set("serverAddress", "://");
					configFile.set("email", "");
					configFile.set("password", "");
					configFile.set("rememberCredentials", false);
					vscode.window.showErrorMessage(res.data.message);
				}
			});
			})
			.catch(error => {
				let configDirectory = "";
				if(os.type() === 'Linux'){ 
				  configDirectory = '/.config/Code/User';
				}
				else if(os.type() === 'Windows_NT'){
				  configDirectory = '/' + os.hostname() + '/%APPDATA%\Code\User';
				}
				else if(os.type() === 'Darwin'){
				  configDirectory = '/Library/Application\ Support/Code/User';
				}
		  
				let configFile = editJsonFile(path.resolve(os.homedir() + configDirectory, 'settings.json'), {
				  autosave: true
				});
				configFile.set("serverAddress", "://");
				configFile.set("email", "");
				configFile.set("password", "");
				configFile.set("rememberCredentials", false);
				// No internet connection
				if (internet === false) {
					vscode.window.showErrorMessage('No internet available')
				// Other problems
				} else {
					vscode.window.showErrorMessage('Impossible to connect, likely invalid Server Address or protocol');
				}
				vscode.window.showInformationMessage('To retry the login close and re open the teardown menu');
			});
		});
	}

	async sendMetrics(metrics) {
		if (!VScodeLogger.config.token) return false;

		var activities = [];
		for (var i in metrics) {
			var metric = {};
			metric.executable_name = metrics[i].tabName;
			metric.start_time = metrics[i].startDate;
			metric.end_time = metrics[i].endDate;
			metric.ip_address = metrics[i].session.ipAddr;
			metric.mac_address = metrics[i].session.macAddr;
			metric.activity_type = metrics[i].activity_type;
			metric.value = metrics[i].value;
			activities.push(metric);
		}

		var json = JSON.stringify({activities: activities});
		var formData = new FormData(); // Currently empty
		formData.append("activity", json);

		return new Promise(async (resolve, reject) => {
			let address_tmp = VScodeLogger.config.protocol+VScodeLogger.config.serverAddress;
			await fetch(address_tmp + "/activity", {
				method: 'POST',
				body: formData,
				headers: {
					'Authorization': 'Token ' + VScodeLogger.config.token,

				},
			})
			.then(response => {
				response.json()
					.then(data => ({ 
						data: data,
						status: response.status,
						headers: response.headers
					})
			).then(res =>{
				// Upload metrics succesfull
				if (res.status == 200 || res.status == 201) {
					CollectorLogger.info('Metrics successfully sent to server!');
					resolve(true);
				// Upload metrics failed
				}else{
					CollectorLogger.warn('Unable to send metrics. ' + res.status);
					reject(false);
				}
			});
			})
			.catch(error => {
				// No internet connection
				if (internet === false) {
					CollectorLogger.error('Unable to send metrics, no internet available');
				}
				// Other problems
				else {
					CollectorLogger.error('Unable to send metrics, impossible to connect, likely invalid Server Address or protocol');
				}
				reject(false);
			});
		});
	}

	async getStatistics() {
	let address_tmp = VScodeLogger.config.protocol+VScodeLogger.config.serverAddress;
	let end = await new Date().toISOString();
    let count = await new Date();
    count.setDate(count.getDate() - 7);
		let start = count.toISOString();
		var params = "amount_to_return=10000&start_time="+start+"&end_time="+end;
		return new Promise(async (resolve, reject) => {
			await fetch(address_tmp + '/activity?' + params, {
				method: 'GET',
				headers: {
					'Authorization': 'Token ' + VScodeLogger.config.token,
					'Content-Type': 'application/json'
				},
			})
			.then(response => {
				response.json()
					.then(data => ({ 
						data: data,
						status: response.status,
						headers: response.headers
					})
			).then(res =>{
				// Download metrics succesfull
				if(res.status == 200){
					CollectorLogger.info('Metrics successfully fetched from the server!');
					resolve(res.data.activities);
				// Metriche not aviable or absent
				}else {
					CollectorLogger.warn('Unable to fetch metrics, ' + (res.status));
					reject();
				}
			})
			})
			.catch(error => {
				// No internet connection
				if (internet === false) {
					CollectorLogger.error('Unable to fetch metrics, no internet available.');
				}
				// Other problems
				else {
					CollectorLogger.error('Unable to fetch metrics, impossible to connect, likely invalid Server Address or protocol');
				}
				reject();
			});
		});
	}
}

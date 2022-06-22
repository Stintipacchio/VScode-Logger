'use babel';

const vscode = require('vscode');
import atomLogger from '../atom-logger.js';
import CollectorLogger from '../loggs/CollectorLogger.js';
const navigator = require('navigator');
import fetch from 'node-fetch';
import {FormData} from 'formdata-node';

export default class Server { 

	async authenticate(logged) {
		this.addr = atomLogger.config.protocol+atomLogger.config.serverAddress;
		let address_tmp = atomLogger.config.protocol+atomLogger.config.serverAddress;
		var email = atomLogger.config.email;
		var password = atomLogger.config.password;

		if (!this.addr || !email || !password) return null;
		console.log('Authenticating...');
		return new Promise(async (resolve, reject) => {

				await fetch(address_tmp + "/login", {
					method: 'POST',
					body: JSON.stringify({email: email, password: password}),
					headers: {
						'Content-Type': 'application/json'
					},
				})
				.then(response => 
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
						atomLogger.config.token = res.data.token;
						if(logged) atomLogger.db.saveToken(atomLogger.config.token, address_tmp);
						vscode.window.showInformationMessage("Successfully Login");
						resolve(atomLogger.config.token);
					// Login failed
					}else{
						vscode.window.showErrorMessage(res.data.message);
					}
				})
				.catch(error => {
					// No internet connection
					if (navigator.onLine === false) {
						vscode.window.showErrorMessage('No internet available')
					// Other problems
					} else {
						vscode.window.showErrorMessage('Impossible to connect');
					}
				}));
		})
		
	}

	async sendMetrics(metrics) {
		if (!atomLogger.config.token) return false;

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
			let address_tmp = atomLogger.config.protocol+atomLogger.config.serverAddress;
			await fetch(address_tmp + "/activity", {
				method: 'POST',
				body: formData,
				headers: {
					'Authorization': 'Token ' + atomLogger.config.token,

				},
			})
			.then(response => 
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
			})
			.catch(error => {
				// No internet connection
				if (navigator.onLine === false) {
					CollectorLogger.error('Unable to send metrics, no internet available');
				}
				// Other problems
				else {
					CollectorLogger.error('Unable to send metrics, impossible to connect');
				}
				reject(false);
			}));
		})
	}
S
	async getStatistics() {
	let address_tmp = atomLogger.config.protocol+atomLogger.config.serverAddress;
	let end = await new Date().toISOString();
    let count = await new Date();
    count.setDate(count.getDate() - 7);
		let start = count.toISOString();
		var params = "amount_to_return=10000&start_time="+start+"&end_time="+end;
		return new Promise(async (resolve, reject) => {
			await fetch(address_tmp + '/activity?' + params, {
				method: 'GET',
				headers: {
					'Authorization': 'Token ' + atomLogger.config.token,
					'Content-Type': 'application/json'
				},
			})
			.then(response => 
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
			.catch(error => {
				// No internet connection
				if (navigator.onLine === false) {
					CollectorLogger.error('Unable to fetch metrics, no internet available.');
				}
				// Other problems
				else {
					CollectorLogger.error('Unable to fetch metrics, impossible to connect.');
				}
				reject();
			}));
		})
	}
}

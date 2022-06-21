'use babel';

const vscode = require('vscode');
import atomLogger from '../atom-logger.js';
import CollectorLogger from '../loggs/CollectorLogger.js';
const navigator = require('navigator');
import fetch from 'node-fetch';
import {FormData} from 'formdata-node';

export default class Server { 

	//Funzione che date le credenziali dell'utente si collega al server
	async authenticate(logged) {
		this.addr = atomLogger.config.protocol+atomLogger.config.serverAddress;
		let address_tmp = atomLogger.config.protocol+atomLogger.config.serverAddress;
		var email = atomLogger.config.email;
		var password = atomLogger.config.password;

		if (!this.addr || !email || !password) return null;
		console.log('Authenticating...');
		return new Promise(async (resolve, reject) => {

				await fetch(address_tmp + "/login", {
					method: 'POST', // *GET, POST, PUT, DELETE, etc.
					body: JSON.stringify({email: email, password: password}), // body data type must match "Content-Type" header
					headers: {
						'Content-Type': 'application/json'
						// 'Content-Type': 'application/x-www-form-urlencoded',
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
					// Login eseguito con successo
					else if (res.status === 200) {
						atomLogger.config.token = res.data.token;
						if(logged) atomLogger.db.saveToken(atomLogger.config.token, address_tmp);
						vscode.window.showInformationMessage("Successfully Login");
						resolve(atomLogger.config.token);
					// Login fallito
					}else{
						vscode.window.showErrorMessage(res.data.message);
					}
				})
				.catch(error => {
					// Connessione assente
					if (navigator.onLine === false) {
						vscode.window.showErrorMessage('No internet available')
					// Altri problemi rilevati
					} else {
						vscode.window.showErrorMessage('Impossible to connect');
					}
				}));
		})
		
	}

	//Funzione che manda le metriche al server
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
				method: 'POST', // *GET, POST, PUT, DELETE, etc.
				body: formData, // body data type must match "Content-Type" header
				headers: {
					'Authorization': 'Token ' + atomLogger.config.token,
					// 'Content-Type': 'application/x-www-form-urlencoded',
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
				// Upload metriche andato a buon fine
				if (res.status == 200 || res.status == 201) {
					CollectorLogger.info('Metrics successfully sent to server!');
					resolve(true);
				// Upload metriche fallito
				}else{
					CollectorLogger.warn('Unable to send metrics. ' + res.status);
					reject(false);
				}
			})
			.catch(error => {
				// Connessione assente
				if (navigator.onLine === false) {
					CollectorLogger.error('Unable to send metrics, no internet available');
				}
				// Altri problemi di connessione al server
				else {
					CollectorLogger.error('Unable to send metrics, impossible to connect');
				}
				reject(false);
			}));
		})
	}

	//Funzione che ottiene le statistiche dal server
	async getStatistics() {
	let address_tmp = atomLogger.config.protocol+atomLogger.config.serverAddress;
	let end = await new Date().toISOString();
    let count = await new Date();
    count.setDate(count.getDate() - 7);
		let start = count.toISOString();
		var params = "amount_to_return=10000&start_time="+start+"&end_time="+end;
		return new Promise(async (resolve, reject) => {
			await fetch(address_tmp + '/activity?' + params, {
				method: 'GET', // *GET, POST, PUT, DELETE, etc.
				headers: {
					'Authorization': 'Token ' + atomLogger.config.token,
					'Content-Type': 'application/json'
					// 'Content-Type': 'application/x-www-form-urlencoded',
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
				// Download metriche andato a buon fine
				if(res.status == 200){
					CollectorLogger.info('Metrics successfully fetched from the server!');
					resolve(res.data.activities);
				// Metriche non disponibili/inesistenti
				}else {
					CollectorLogger.warn('Unable to fetch metrics, ' + (res.status));
					reject();
				}
			})
			.catch(error => {
				// Connessione assente
				if (navigator.onLine === false) {
					CollectorLogger.error('Unable to fetch metrics, no internet available.');
				}
				// Altri problemi di connessione al server
				else {
					CollectorLogger.error('Unable to fetch metrics, impossible to connect.');
				}
				reject();
			}));
		})
	}
}

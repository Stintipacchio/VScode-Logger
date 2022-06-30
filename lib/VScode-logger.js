'use babel';

import {homedir} from 'os';
import * as vscode from 'vscode';
import DashView from './dash-view.js';
import Database from './db/Database.js';
import Metric from './metrics/Metric.js';
import CodeMetric from './metrics/CodeMetric.js';
import Session from './metrics/Session.js';
import Server from './server/Server.js';
import GetNetworkAddress from './utils/GetNetworkAddress.js';
import fs from 'fs';
import path from 'path';
import editJsonFile from 'edit-json-file';

export default {
  dashView: null,
  panel: null,
  subscriptions: null,
  db: null,
  server: null,
  auth: null,
  unsentmetric: null,
  config: {
    serverAddress: null,
    email: null,
    password: null,
    protocol: null,
    refreshTime: null,
    remember: null,
    token: null,
  },
  
  async StartLogger(){
    await this.load_configs();
    
    this.dashView = await new DashView();
    this.db = await new Database();
    this.server = await new Server();
    
    if(this.config.remember === false) await this.db.deleteToken();

    await this.earlyStartup();

    if(this.config.remember === true){await this.authentication_routine();}

    let mode = "offline";
    if(this.auth) mode = "online";
    vscode.window.showInformationMessage("Logger started in " + mode + " mode");
  },

  async authentication_routine(){
    await this.load_configs();
    this.auth = false;
    await this.server.authenticate(this.config.remember).then(async () => {
      await this.server.getStatistics().then((stats)=>{
        this.dashView.refreshStats(stats);
      }, rejected => {});
      await this.sendOfflineData();
      this.inter = setInterval( async () => await this.sendOfflineData(), this.config.refreshTime*1000);
    });
  },

  async load_configs(){

    let rawConfigJSON = fs.readFileSync(homedir + '/.config/Code/User/settings.json', 'utf-8');
    let configJSON = JSON.parse(rawConfigJSON);
    console.log(configJSON);


      if(configJSON.rememberCredentials === true && configJSON.serverAddress !== "" && configJSON.email !== "" && configJSON.password !== "" && configJSON.refreshTime !== "" ){
        this.config.serverAddress = configJSON.serverAddress;
        this.config.email = configJSON.email;
        this.config.password = configJSON.password;
        this.config.protocol = configJSON.protocol;
        this.config.refreshTime = configJSON.refreshTime;
        this.config.remember = configJSON.rememberCredentials;
      }
      else { vscode.window.showErrorMessage("Inserted credentials format not valid"); }
  },

  async earlyStartup() {

    await this.db.getMetrics().then((metrics) => {
      this.unsentmetric = metrics.length;
    }, noMetrics => {
      this.unsentmetric = "0";
    });
    let address = GetNetworkAddress.getAddress().then((address) =>{
      this.session = new Session(address.ipAddr, address.macAddr);
      this.db.getAddr().then((add) => {
        this.server.addr = add;
        if(this.config.remember){
          this.db.getToken(add).then( async token => {
            this.server.token = token;
            await this.server.getStatistics().then( async stats =>{
              this.dashView.refreshStats(stats);
              await this.sendOfflineData();
              this.inter = setInterval( async () => await this.sendOfflineData(), this.config.refreshTime*1000);
            }, rejected => {
              vscode.window.showErrorMessage("VScode-LOGGER - Token expired, please log in");
              this.db.deleteToken();
            });
          }, noToken => {
          });
        }else{
          this.db.deleteToken();
        }
      });
    });
    this.codeMetrics = [];
    await this.addPageListener();
    if (vscode.window.activeTextEditor) {
      let url = vscode.window.activeTextEditor.document.fileName;
      let filename = url.substring(url.lastIndexOf('/')+1);
      this.addCodeListener(filename, vscode.window.activeTextEditor.document.getText(), vscode.window.activeTextEditor.document.fileName); //filename, fileText
    }
  },

  async sendOfflineData(){
		await this.db.getMetrics().then(async metrics =>{
      await this.server.sendMetrics(metrics).then( async sended => {
        await this.db.deleteMetrics(metrics);
        this.unsentmetric = '0';
        await this.server.getStatistics().then((stats) =>{
          this.dashView.refreshStats(stats); 
        });
      }, rejected => {
        this.server.token = null;
        this.db.deleteToken();
        clearInterval(this.interval);
      });
    }, noMetrics => {});
  },

	async storeNewMetric(name) {
		if (this.metric) {
			await this.metric.finish();
			await this.db.insertNewMetric(this.metric);
      this.unsentmetric++;
		}
		this.metric = new Metric(null, name);
	},

	async stopMetric() {
		if(this.metric != null){
			await this.metric.finish();
			await this.db.insertNewMetric(this.metric);
      this.unsentmetric++;
			this.metric = null;
		}
	},

	async storeNewCodeMetric(fileName, code) {
		var codeMetric = this.codeMetrics[fileName];
		if(codeMetric) {
			var metrics = await codeMetric.finish(code);
			for (var i in metrics) {
        await this.db.insertNewMetric(metrics[i]);
        this.unsentmetric++;
      }
		}
		this.codeMetrics[fileName] = await new CodeMetric(fileName, code);
	},

  async addPageListener() {
    //verify if the editor page is changed
    vscode.window.onDidChangeActiveTextEditor(async (workspace) => {
      if(workspace){ //check workspace is not empty
        let url = vscode.window.activeTextEditor.document.fileName;
        let filename = url.substring(url.lastIndexOf('/')+1);
        await this.storeNewMetric(filename); //filename
        await this.addCodeListener(filename, vscode.window.activeTextEditor.document.getText(), vscode.window.activeTextEditor.document.fileName); //filename, fileText
      }
    });
  },

  async addCodeListener(fileName, fileText, filepath) {
    var fun = async () => {
      await this.storeNewCodeMetric(fileName, fileText);
    };
    await fun();
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      if (document.fileName === filepath && document.getText() !== fileText) {
        fileText = await document.getText();
        await fun();
      }
  });
    
  },

  async logout() {
    if(this.config.token) {
      this.config.token = null;
      this.db.deleteToken();
      clearInterval(this.inter);
      let configDirectory = "";
      if(os.type() === 'Linux'){ 
        configDirectory = '/.config/Code/User';
      }
      else if(os.type() === 'Windows_NT'){
        configDirectory = '/%APPDATA%\Code\User';
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
      await this.load_configs();
      this.auth = false;
      vscode.window.showInformationMessage("Successfully Logout");
    }
  }
};

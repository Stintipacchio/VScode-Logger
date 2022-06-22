'use babel';

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
let home = require('user-home');
const vscode = require('vscode');
import DashView from './dash-view.js';
import Database from './db/Database.js';
import Metric from './metrics/Metric.js';
import CodeMetric from './metrics/CodeMetric.js';
import Session from './metrics/Session.js';
import Server from './server/Server.js';
import GetNetworkAddress from './utils/GetNetworkAddress.js';
import fs from 'fs';

export default {
  doctype: new JSDOM(
    `<!DOCTYPE html>

    <html lang="en">

    <head>
      <meta charset="UTF-8">

      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      
      <title>VScode-Logger</title>
    </head>

    <body>
    
    </body>

    </html>`
  ),
  dashView: null,
  panel: null,
  subscriptions: null,
  db:null,
  server:null,
  auth:null,
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
    
    await this.db.deleteToken();
    this.dashView.getElement()
    await this.earlyStartup();
    await this.server.authenticate(this.config.remember/*atom.config.get('atom-logger.remember')*/).then(async () => {
      this.auth = true;
      this.dashView.statsContainer.innerHTML = '';
      //this.dashView.createStats();
      await this.server.getStatistics().then((stats)=>{
        this.dashView.refreshStats(stats);
      }, rejected => {});
      await this.sendOfflineData();
      this.inter = setInterval( async () => await this.sendOfflineData(), this.config.refreshTime*1000);
    });
    vscode.window.showInformationMessage("Logger started");
  },

  async load_configs(){
    if(fs.existsSync(home + '/.VScode-Logger-config.txt')){
      let data = await fs.promises.readFile(home + '/.VScode-Logger-config.txt', 'utf-8');

      let lines_untrimmed = data.split('\n');
      let lines_trimmed = [];

      lines_untrimmed.forEach(function(line){ 
        line = line.replace(/\s/g, '');
        lines_trimmed.push(line);
      });

      console.log(lines_trimmed);

      this.config.serverAddress = lines_trimmed[0].split("serverAddress:").pop();
      this.config.email = lines_trimmed[1].split("email:").pop();
      this.config.password = lines_trimmed[2].split("password:").pop();
      this.config.protocol = lines_trimmed[3].split("protocol:").pop();
      this.config.refreshTime = lines_trimmed[4].split("refreshTime:").pop();
      this.config.remember = lines_trimmed[5].split("remember:").pop();

    }
    else {
      vscode.window.showErrorMessage("Configuration file not found");
      fs.writeFile(home + '/.VScode-Logger-config.txt',"serverAddress:\n" + "email:\n" + "password:\n" + "protocol: https\n" + "refreshTime: 100\n" + "remember: false\n", function (err) {
        if (err) throw err;
      vscode.window.showInformationMessage("Configuration file generated in home");
      });
    };
  },

  async earlyStartup() {

    await this.db.getMetrics().then((metrics) => {
      this.dashView.counter.textContent = metrics.length;
    }, noMetrics => {
      this.dashView.counter.textContent = "0";
    });
    this.dashView.timer.start();
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
    this.addPageListener();
    if (vscode.window.activeTextEditor) {
      this.addCodeListener(vscode.window.activeTextEditor.document.fileName, vscode.window.activeTextEditor.document.getText()); //filename, fileText
    }
  },

  async sendOfflineData(){
		await this.db.getMetrics().then(async metrics =>{
      await this.server.sendMetrics(metrics).then( async sended => {
        await this.db.deleteMetrics(metrics);
        this.dashView.counter.textContent = '0';
        await this.server.getStatistics().then((stats) =>{
          this.dashView.refreshStats(stats); 
        });
      }, rejected => {
        this.dashView.statsContainer.innerHTML = '';
        this.server.token = null;
        this.db.deleteToken();
        clearInterval(this.interval);
      });
    }, noMetrics => {});
  },

	async storeNewMetric(name) {
		if (this.metric) {
			this.metric.finish();
			await this.db.insertNewMetric(this.metric);
      this.dashView.counter.textContent++;
		}
		this.metric = new Metric(null, name);
	},

	async stopMetric() {
		if(this.metric != null){
			this.metric.finish();
			await this.db.insertNewMetric(this.metric);
      this.dashView.counter.textContent++;
			this.metric = null;
		}
	},

	async storeNewCodeMetric(fileName, code) {
		var codeMetric = this.codeMetrics[fileName];
		if(codeMetric) {
			var metrics = codeMetric.finish(code);
			for (var i in metrics) {
        await this.db.insertNewMetric(metrics[i]);
        this.dashView.counter.textContent++;
      }
		}
		this.codeMetrics[fileName] = new CodeMetric(fileName, code);
	},

  addPageListener() {
    //verify if the editor page is changed
    vscode.window.onDidChangeActiveTextEditor((workspace) => {
      if(workspace){ //check workspace is not empty
        let url = vscode.window.activeTextEditor.document.fileName;
        let filename = url.substring(url.lastIndexOf('/')+1);
        this.storeNewMetric(filename); //filename
        this.addCodeListener(filename, vscode.window.activeTextEditor.document.getText()); //filename, fileText
      }
    });
  },

  addCodeListener(fileName, fileText) {
    let url = fileName;
    let filename = url.substring(url.lastIndexOf('/')+1);
    var fun = () => {
      this.storeNewCodeMetric(filename, fileText);
    }
    fun();
    vscode.workspace.onDidSaveTextDocument(fun);
  },

  //DA CONTROLLARE
  logout() {
    if(this.server.token) {
      this.server.token = null;
      this.db.deleteToken();
      clearInterval(this.inter);
      this.dashView.statsContainer.innerHTML = '';
      vscode.window.showInformationMessage("Successfully Logout");
    }
  }

}

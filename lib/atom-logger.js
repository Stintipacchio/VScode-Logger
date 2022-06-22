'use babel';

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const vscode = require('vscode');
import DashView from './dash-view.js';
import Database from './db/Database.js';
import Metric from './metrics/Metric.js';
import CodeMetric from './metrics/CodeMetric.js';
import Session from './metrics/Session.js';
import Server from './server/Server.js';
import GetNetworkAddress from './utils/GetNetworkAddress.js';
import fs from 'fs/promises';
//import ChartView from './chart-view.js';
//import { CompositeDisposable } from 'atom';
/*
let tmp_workspace = '';
let tmp_save = '';
let tmp_editor_switch = '';

window.addEventListener('message', event => {
  if(event.data.workspace)tmp_workspace = event.data.workspace;
  if(event.data.save_data)tmp_save = event.data.save_data;
  if(event.data.editor_switch)tmp_editor_switch = event.data.editor_switch;
});
*/

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
/*
  activate(state) {

    this.dashView = new DashView();

    this.panel = atom.workspace.addRightPanel({
      item: this.dashView.getElement(),
      visible: false
     });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-logger:dashboard': () => this.showDash()
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-logger:logout': () => this.logout()
    }));

    this.earlyStartup();
  },



  deactivate() {
    this.panel.destroy();
    this.subscriptions.dispose();
    this.dashView.destroy();
  },

  serialize() {},

  showDash() {
    return (
      this.panel.isVisible() ?
      this.panel.hide() :
      this.panel.show()
    );
  },
  */
  
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
    console.log('Logger started');
    //console.log(this.doctype.window.document);
    //console.log(this.doctype.window.document.querySelector("p").textContent);
  },

/* CONTROLLARE SE SERVE
  consumeStatusBar (statusBar){
    let tile = document.createElement('div');
    tile.className = 'line-ending-tile inline-block';

    var name = document.createElement('a');
    name.textContent = 'Atom-Logger';

    this.icon = document.createElement('div');
    this.icon.className = 'icon icon-cloud-upload atom-logger-icon'
    tile.appendChild(this.icon);
    tile.appendChild(name);

    statusBar.addRightTile({item: tile, priority: 1});

    tile.addEventListener('click', () => {
      this.showDash();
    })
  },
*/
  async load_configs(){

    let data = await fs.readFile('./config.txt', 'utf-8');

    let lines = data.split('\n');

    this.config.serverAddress = lines[0].split("serverAddress: ").pop();
    this.config.email = lines[1].split("email: ").pop();
    this.config.password = lines[2].split("password: ").pop();
    this.config.protocol = lines[3].split("protocol: ").pop();
    this.config.refreshTime = lines[4].split("refreshTime: ").pop();
    this.config.remember = lines[5].split("remember: ").pop();

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
              //this.icon.classList.add('text-success');
              //this.dashView.createStats();
              this.dashView.refreshStats(stats);
              await this.sendOfflineData();
              this.inter = setInterval( async () => await this.sendOfflineData(), this.config.refreshTime*1000);
            }, rejected => {
              //this.icon.classList.add('text-error');
              //this.dashView.createWarning();
              vscode.window.showErrorMessage("VScode-LOGGER - Token expired, please log in");
              this.db.deleteToken();
            });
          }, noToken => {
            //this.icon.classList.add('text-error');
            //this.dashView.createWarning();
          });
        }else{
          this.db.deleteToken();
          //this.icon.classList.add('text-error');
          //this.dashView.createWarning();
        }
      });
    });
    this.codeMetrics = [];
    this.addPageListener();
    if (vscode.window.activeTextEditor) {
      this.addCodeListener(vscode.window.activeTextEditor.document.fileName, vscode.window.activeTextEditor.document.getText()); //filename, fileText
    }
    //this.addCommandsListener(); DA CONTROLLARE
    //this.addConfigListener();
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
        //this.icon.classList.remove('text-success');
        //this.icon.classList.add('text-error');
        //this.dashView.createWarning();
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
    //verifica se é stata cambiata pagina editor attraverso l'event listener
    vscode.window.onDidChangeActiveTextEditor((workspace) => {
      if(workspace){ //check workspace is not empty
        let url = vscode.window.activeTextEditor.document.fileName;
        let filename = url.substring(url.lastIndexOf('/')+1);
        //console.log(filename);
        //console.log(vscode.window.activeTextEditor.document.getText());
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

  /* DA CONTROLLARE SE SERVONO ENTRAMBE LE FUNZIONI
  
  addCommandsListener() {
    atom.commands.onDidDispatch((event) =>{ //da capire che cosa fá onDidDispatch
        if(!event.type.startsWith('core')){
          this.storeNewMetric(event.type);
        }
    })
  },
  
  addConfigListener() {
    atom.config.onDidChange('atom-logger.refreshTime', () => {//capire come impostare file di confugurazione estensione
      if(this.inter){
        clearInterval(this.inter);
        this.inter = setInterval( () => await this.sendOfflineData(), atom.config.get('atom-logger.refreshTime')*1000);
      }
    })
  },
*/ 

  logout() {
    if(this.server.token) {
      this.server.token = null;
      this.db.deleteToken();
      clearInterval(this.inter);
      this.dashView.statsContainer.innerHTML = '';
      //this.icon.classList.remove('text-success');
      //this.icon.classList.add('text-error');
      //this.dashView.createWarning();
      //this.dashView.element.removeChild(document.getElementById("buttons"));
      vscode.window.showInformationMessage("Successfully Logout");
    }
  }

}

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
let home = require('user-home');
import * as editJsonFile from 'edit-json-file';
import Stopwatch from '../lib/stopwatch.js';
import VScodeLogger from '../lib/VScode-logger.js';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let panel_created = false;
let activeLogger = false;

/* Creating a webview panel and setting the html content of the webview. */
async function activate(context: vscode.ExtensionContext) {
	const provider = new Logger(context);

	await VScodeLogger.StartLogger();
	activeLogger = true;
	if (!panel_created) {
		provider.loggerShow();
	}
	panel_created = true;

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(Logger.viewType, provider),
	);
}

class Logger implements vscode.WebviewViewProvider {

	public static readonly viewType = 'logger.loggerView';

	private _view?: vscode.WebviewView;

	public timer = new Stopwatch();

	constructor(
		private readonly _extensionContext: vscode.ExtensionContext,
		
	) { this.timer.start(); }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {

		this._view = webviewView;

		webviewView.webview.options =					
		{
			enableScripts: true,
			localResourceRoots: [vscode.Uri.file(path.join(this._extensionContext.extensionPath, 'node_modules'))]
		};

		// Handle messages from the webview
		webviewView.webview.onDidReceiveMessage(
			async message => {
			switch (message.command) {
				case 'credentials':
					if(message.remember){
						let configFile = editJsonFile(`./package.json`, {
							autosave: true
						});
						configFile.set("contributes.configuration.properties.serverAddress.default", message.server);
						configFile.set("contributes.configuration.properties.email.default", message.username);
						configFile.set("contributes.configuration.properties.password.default", message.password);
						configFile.set("contributes.configuration.properties.rememberCredentials.default", message.remember);
					}
					else{
						VScodeLogger.config.serverAddress = message.server;
						VScodeLogger.config.email = message.username;
						VScodeLogger.config.password = message.password;
						VScodeLogger.config.protocol = 'https';
						VScodeLogger.config.refreshTime = 100;
						VScodeLogger.config.remember = message.remember;
					}
					webviewloader();
					await VScodeLogger.authentication_routine();
					webviewloader();
				return;
				case 'logout':
					await VScodeLogger.logout();
					webviewloader();
				return;
			}
			},
			undefined,
			this._extensionContext.subscriptions
		);

		/* Setting the html content of the webview. */
		const webviewloader = () =>{
			webviewView.webview.html = this.getWebviewContent(webviewView.webview);
		};

		if (activeLogger) webviewloader();
		
		setInterval(() =>{ 
			webviewView.webview.postMessage({ 
				command: 'stopwatch',
				time: this.timer.clockvalue
			});
			if(activeLogger) {
				webviewloader();
			}
		}, 1000);
		
		webviewView.onDidDispose(() =>{
			panel_created = false;
			activeLogger = false;
		});
	}
	
	public loggerShow(){
		if (this._view){
			this._view.show?.(true);
		}
	}

	private getWebviewContent(webview: vscode.Webview) {
		const ChartJS_PATH = vscode.Uri.file(
			path.join(this._extensionContext.extensionPath, 'node_modules', 'chart.js', 'dist', 'Chart.js')
		);
		
		const ChartJS_URI = webview.asWebviewUri(ChartJS_PATH);
		
		let chartloader = ``;
		let formloader = ``;
		if (VScodeLogger.auth){
			chartloader = 
			`window.onload = function() {
				
		
				const CtxLines = document.getElementById('LinesCanvas');
		
				let LinesChartConfig = this.createConfig("Lines", [${VScodeLogger.dashView.lines.inserted}, ${VScodeLogger.dashView.lines.deleted}, ${VScodeLogger.dashView.lines.modified}], ['Inserted', 'Deleted', 'Modified']);
		
				let LinesChart = new Chart(CtxLines, LinesChartConfig);
		
		
		
				const CtxComments = document.getElementById('CommentsCanvas');
		
				let CommentsChartConfig = this.createConfig("Comments", [${VScodeLogger.dashView.comments.inserted}, ${VScodeLogger.dashView.comments.deleted}], ['Inserted', 'Deleted']);
		
				let CommentsChart = new Chart(CtxComments, CommentsChartConfig);
		
		
		
				const CtxTests = document.getElementById('TestsCanvas');
		
				let TestsChartConfig = this.createConfig("Tests", [${VScodeLogger.dashView.tests.inserted}, ${VScodeLogger.dashView.tests.deleted}], ['Inserted', 'Deleted']);
		
				let TestsChart = new Chart(CtxTests, TestsChartConfig);
				
			}`;

			formloader =
			`<label>Weekly Statistics</label>

			<canvas id="LinesCanvas"></canvas>

			<canvas id="CommentsCanvas"></canvas>
	
			<canvas id="TestsCanvas"></canvas>

			<script>

				const vscode = acquireVsCodeApi();

				async function logout(){
					await vscode.postMessage({
						command: 'logout',
					});
				}

			</script>

			<button onclick="logout()">Logout</button>`;
		}
		else {
			formloader = 
			`<script>
				const vscode = acquireVsCodeApi();

				async function send_credentials(username, password, remember, server){
					await vscode.postMessage({
						command: 'credentials',
						username: username,
						password: password,
						remember: remember,
						server: server
					});
				}

			</script>

			<form name="loginForm" onsubmit = 'send_credentials(loginForm.uname.value,loginForm.psw.value,loginForm.remember.checked,loginForm.srvadrr.value);'>
				<div class="container">

					<label for="uname"><b>Username</b></label><br>
					<input type="text" placeholder="Enter Username" name="uname" required>
				
					<br>

					<label for="psw"><b>Password</b></label><br>
					<input type="password" placeholder="Enter Password" name="psw" required>

					<br>

					<label for="srvadrr"><b>Server Address</b></label><br>
					<input type="text" placeholder="://internet.example.com" name="srvadrr" required>

					<br>

					<button type="submit">Login</button>

					<label>
					<input type="checkbox" checked="checked" name="remember"> Remember me
					</label>

				</div>
			</form>`;
		}

		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>VScode-Logger</title>
		</head>

		<script src="${ChartJS_URI}"></script>

		<script>

		${chartloader}

		function createConfig(title, DataValue, LabelsValue) {

			var conf = {
				type : 'doughnut',
				data : {
					labels : LabelsValue,
					datasets : [{
					data : DataValue,
					backgroundColor : ['#2ecc71', '#c0392b', '#f1c40f' ]
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: true,
					legend: {
					labels: {
						fontColor: '#95a5a6',
					},
					position: 'left'
					},
					title: {
					fontColor: '#95a5a6',
					display: true,
					text : title
					}
				}
			}
			return conf;
		}
		</script>

		<script>		
			window.addEventListener('message', event => {

				const message = event.data;

				switch (message.command) {
					case 'stopwatch':
						let stopwatch = message.time;
						document.getElementById("stopwatch").innerText = stopwatch;
					return;
				}
			});
		</script>

		<body>
		<div>DashBoard</div>
		<label>Current Session</label>
		<div>Unsent Metrics</div>
		<span>${VScodeLogger.unsentmetric}</span>
		<div>Session Time</div>
		<div id="stopwatch">00:00:00</div>

		${formloader}

		</body>

		</html>`;
		
	}
}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
};
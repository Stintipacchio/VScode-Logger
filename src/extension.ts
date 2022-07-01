// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
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

	private timer = new Stopwatch();

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
						let configDirectory = "";
						if(os.type() === 'Linux'){ 
							configDirectory = '/.config/Code/User';
						}
						else if(os.type() === 'Windows_NT'){
							configDirectory = '/' + path.join(os.hostname(), '..') + '/AppData/Roaming/Code/User';
						}
						else if(os.type() === 'Darwin'){
							configDirectory = '/Library/Application Support/Code/User';
						}

						let configFile = editJsonFile(path.resolve(os.homedir() + configDirectory, 'settings.json'), {
							autosave: true
						});
						configFile.set("serverAddress", "://" + message.server);
						configFile.set("email", message.username);
						configFile.set("password", message.password);
						configFile.set("protocol", message.protocol);
						configFile.set("refreshTime", message.refreshtime);
						configFile.set("rememberCredentials", message.remember);
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
					try{
						await VScodeLogger.authentication_routine();
					}catch(err){}
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
		const BootstrapIconsPATH = vscode.Uri.file(
			path.join(this._extensionContext.extensionPath, 'node_modules', 'vscode-icons', 'dist', 'index.js')
		);
		
		const ChartJS_URI = webview.asWebviewUri(ChartJS_PATH);

		const BootstrapIconsURI = webview.asWebviewUri(BootstrapIconsPATH);
		
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
			`<br/>

			<div style="text-align: center;">Weekly Statistics 
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bar-chart-line" viewBox="0 0 16 16">
					<path d="M11 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h1V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7h1V2zm1 12h2V2h-2v12zm-3 0V7H7v7h2zm-5 0v-3H2v3h2z"/>
				</svg>
		  	</div>

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

			<style>
			button {
				width: 50px;
				height: 25px;
				background-color: #EA2027;
				color: white;
				padding: 4px 2px;
				margin: 4px 0;
				border: none;
				border-radius: 4px;
				cursor: pointer;
				position: absolute;
				left: 40%;
			}
			</style>

			<button onclick="logout()">Logout</button>`;
		}
		else {
			formloader = 
			`<script>
				const vscode = acquireVsCodeApi();

				async function send_credentials(username, password, remember, refreshtime, protocol, server){
					await vscode.postMessage({
						command: 'credentials',
						username: username,
						password: password,
						remember: remember,
						refreshtime: refreshtime,
						protocol: protocol,
						server: server
					});
				}

			</script>

			<style>
			input[type=text], input[type=password], select {
				width: 170px;
				height: 25px;
				padding: 4px 4px;
				margin: 4px 0;
				display: inline-block;
				border: 1px solid #ccc;
				border-radius: 4px;
				box-sizing: border-box;
			}
			button[type=submit] {
				width: 50px;
				height: 25px;
				background-color: #4CAF50;
				color: white;
				padding: 4px 2px;
				margin: 4px 0;
				border: none;
				border-radius: 4px;
				cursor: pointer;
			}

			</style>

			<form name="loginForm" onsubmit = 'send_credentials(loginForm.uname.value,loginForm.psw.value,loginForm.remember.checked, loginForm.rfshtime.value, loginForm.proto.value, loginForm.srvadrr.value);'>
				<div class="container">

					<label for="uname"><b>Username</b></label><br>
					<input type="text" placeholder="Enter Username/mail" name="uname" required>
				
					<br>

					<label for="psw"><b>Password</b></label><br>
					<input type="password" placeholder="Enter Password" name="psw" required>

					<br>

					<label for="srvadrr"><b>Server Address</b></label><br>
					<input type="text" placeholder="internet.example.com" name="srvadrr" required>

					<br>

					<label for="rfshtime"><b>Refresh Time</b></label><br>
					<input type="text" value="100" name="rfshtime" required>

					<br>

					<label for="proto"><b>Protocol</b></label><br>
					<select type="text" value="https" name="proto" required>
						<option value="https">https</option>
						<option value="http">http</option>
					</select>

					<br>
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
		<script src="${BootstrapIconsURI}"></script>

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
		<div>Unsent Metrics: 
		<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" class="bi bi-journal-code" viewBox="0 0 16 16">
			<path fill-rule="evenodd" d="M8.646 5.646a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L10.293 8 8.646 6.354a.5.5 0 0 1 0-.708zm-1.292 0a.5.5 0 0 0-.708 0l-2 2a.5.5 0 0 0 0 .708l2 2a.5.5 0 0 0 .708-.708L5.707 8l1.647-1.646a.5.5 0 0 0 0-.708z"/>
			<path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z"/>
			<path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z"/>
		</svg>
		${VScodeLogger.unsentmetric}</div>
		<div>Session Time
			<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" class="bi bi-stopwatch" viewBox="0 0 16 16">
				<path d="M8.5 5.6a.5.5 0 1 0-1 0v2.9h-3a.5.5 0 0 0 0 1H8a.5.5 0 0 0 .5-.5V5.6z"/>
				<path d="M6.5 1A.5.5 0 0 1 7 .5h2a.5.5 0 0 1 0 1v.57c1.36.196 2.594.78 3.584 1.64a.715.715 0 0 1 .012-.013l.354-.354-.354-.353a.5.5 0 0 1 .707-.708l1.414 1.415a.5.5 0 1 1-.707.707l-.353-.354-.354.354a.512.512 0 0 1-.013.012A7 7 0 1 1 7 2.071V1.5a.5.5 0 0 1-.5-.5zM8 3a6 6 0 1 0 .001 12A6 6 0 0 0 8 3z"/>
			</svg>
		</div>
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
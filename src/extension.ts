// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
import atomLogger from '../lib/atom-logger.js';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
let panel: any;
let panel_created = false;
let activeLogger = false;
/**
 * @param {vscode.ExtensionContext} context
 */
/* Creating a webview panel and setting the html content of the webview. */
async function activate(context: any) {
/*
	const ChartJS_PATH = vscode.Uri.file(
		path.join(context.extensionPath, 'node_modules', 'chart.js', 'dist', 'chart.js')
	);
*/
	await atomLogger.StartLogger();
	let disposable = vscode.commands.registerCommand('vscode-logger.logger', async () => {
	activeLogger = true;
	if(!panel_created){
		panel = vscode.window.createWebviewPanel(
			'logger',
			'Logger',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'node_modules'))]
			}
		);
	}
	panel_created = true;

	//const ChartJS_URI = panel.webview.asWebviewUri(ChartJS_PATH);

	/* Setting the html content of the webview. */
	
	if(activeLogger) panel.webview.html = getWebviewContent();
	
	setInterval(function(){ 
		if(activeLogger) {
			panel.webview.html = getWebviewContent();
		}
	}, 1000);
	
	panel.onDidDispose(function(){
		panel_created = false;
		activeLogger = false;
	});
	
	// Handle messages from the webview
	/*panel.webview.onDidReceiveMessage(
		async message => {
		switch (message.command) {
			case 'alert':
				vscode.window.showErrorMessage(message.text);
			return;

			
			case 'workspace':
				let editor = vscode.window.activeTextEditor;
				let Text = editor.document.getText();
				await panel.webview.postMessage({ workspace: [vscode.window.activeTextEditor, vscode.window.activeTextEditor.document.fileName, Text] });
			return;
			
			case 'modules_loader':
				await panel.webview.postMessage({ modules: [sqlite3, chart, difflib, home, SimpleNodeLogger, network] });
			return;
			

		}
		},
		undefined,
		context.subscriptions
	);*/
	
	})
	context.subscriptions.push(disposable);
  }
//<meta http-equiv="Content-Security-Policy" content="default-src *; script-src *;">
function getWebviewContent() {
	//console.log(ChartJS_URI);
	//console.log(atomLogger.doctype.window.document.body.innerHTML);
	return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>VScode-Logger</title>
	</head>

	<body>
	${atomLogger.doctype.window.document.body.innerHTML}
	</body>

	</html>`;
  }

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
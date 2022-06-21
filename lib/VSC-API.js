'use babel';
// @ts-ignore
//const vscode = acquireVsCodeApi();

const vscode = require('vscode');
//const sleep = ms => new Promise(r => setTimeout(r, ms));

export default class VSCAPI {
    VSalert(message) {
        vscode.window.showErrorMessage(message);
    };

    VSsucces(message) {
        vscode.window.showInformationMessage(message);
    };
    
    /*
    async workspace() {
        vscode.postMessage({
            command: 'workspace',
        })
    }

    async modules_loader() {
        console.log('POSTING MODULES');
        vscode.postMessage({
            command: 'modules_loader',
        })
    }

    async module_waiter(modules){
        while(modules == '') {
            console.log('waiting for modules');
            await sleep(2000);
        }
    }
    */
}
'use babel';

import atomLogger from './atom-logger.js'
import Credentials from './server/Credentials.js';

export default class LoginView {

  constructor() {
    // Create root element
    this.element = atomLogger.doctype.window.document.createElement('atom-panel');
    this.element.className = 'modal';

    var inset = atomLogger.doctype.window.document.createElement('div');
    inset.classList.add('inset-panel');
    inset.classList.add('native-key-bindings');
    this.element.appendChild(inset);

    let title = atomLogger.doctype.window.document.createElement('div');
    title.className = 'panel-heading icon-person';
    title.textContent = ' Atom-Logger Login';
    inset.appendChild(title);

    let cross = atomLogger.doctype.window.document.createElement('button');
    cross.className = 'btn icon icon-x atom-logger-close';
    inset.appendChild(cross);

    let container = atomLogger.doctype.window.document.createElement('form');
    container.className = 'inline-block text-highlight';

    inset.appendChild(container);

    let username = atomLogger.doctype.window.document.createElement('input');
    username.className = 'input-text atom-logger-textfield';
    username.autofocus = true;
    username.tabIndex = 0;
    username.type = 'text';
    username.placeholder = 'E-mail';
    username.name = 'username';
    username.required = true;
    container.appendChild(username);

    let password = atomLogger.doctype.window.document.createElement('input');
    password.className = 'input-text atom-logger-textfield';
    password.tabIndex = 1;
    password.type = 'password';
    password.placeholder = 'Password';
    password.name = 'password';
    password.required = true;
    container.appendChild(password);

    let protocol = atomLogger.doctype.window.document.createElement('select');
    protocol.className = 'input-text atom-logger-select';
    let http = atomLogger.doctype.window.document.createElement('option');
    http.value='http://';
    http.innerHTML = 'HTTP';
    let https = atomLogger.doctype.window.document.createElement('option');
    https.value='https://';
    https.innerHTML = 'HTTPS';
    /*if (atom.config.get('atom-logger.protocol') == 'HTTP'){ //verify if the protocol is set to HTTP
      http.selected = true;
    }else{
      https.selected =true;
    }*/
    protocol.appendChild(http);
    protocol.appendChild(https);
    container.appendChild(protocol);

    let server = atomLogger.doctype.window.document.createElement('input');
    server.className = 'input-text atom-logger-textfieldServer';
    server.tabIndex = 2;
    server.type = 'server';
    server.placeholder = 'Server';
    //if (atom.config.get('atom-logger.serverAddress') != '') //verify if the server address is set
    //  server.value = atom.config.get('atom-logger.serverAddress');

    server.name = 'Server';
    server.required = true;
    container.appendChild(server);

    let submit = atomLogger.doctype.window.document.createElement('button');
    submit.className = 'btn atom-logger-button';
    submit.type = 'submit';
    submit.textContent = 'Login';
    container.appendChild(submit);

    this.element.addEventListener('submit', () =>{
      atomLogger.server.authenticate(new Credentials(), atomLogger.config.remember/*atom.config.get('atom-logger.remember')*/).then(() => {
        atomLogger.auth = true;
        //atom.config.set('atom-logger.protocol', protocol.value);//set the protocol
        //atom.config.set('atom-logger.serverAddress', server.value);//set the server address
        //atomLogger.icon.classList.remove('text-error');
        //atomLogger.icon.classList.add('text-success');
        atomLogger.dashView.loginPanel.remove();//CONTROLLARE SE VA USATO destroy()
        atomLogger.dashView.statsContainer.innerHTML = '';
        atomLogger.dashView.createStats();
        atomLogger.server.getStatistics().then((stats)=>{
          atomLogger.dashView.refreshStats(stats);
        }, rejected => {});
        atomLogger.sendOfflineData();
        atomLogger.inter = setInterval( () => atomLogger.sendOfflineData(), 100/*atom.config.get('atom-logger.refreshTime')*1000*/);
      })
    })

    cross.addEventListener('click', () => {
      atomLogger.dashView.loginPanel.remove();//CONTROLLARE SE VA USATO destroy()
      atomLogger.dashView.loginButton.disabled = false;
    })
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

}

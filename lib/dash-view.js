'use babel';
import Stopwatch from './stopwatch.js';
import atomLogger from './atom-logger.js';
//import LoginView from './login-view.js';
//import ChartView from './chart-view.js';

export default class DashView {

  constructor() {
    this.BODY_LOADER = atomLogger.doctype.window.document.body;

    this.stats_created = false;

    this.session = false;

    this.element = atomLogger.doctype.window.document.createElement('atom-panel');
    this.element.className = 'padded atom-logger';
    
    this.title = atomLogger.doctype.window.document.createElement('div');
    this.title.className = 'atom-logger-title icon-dashboard inline-block';
    this.title.textContent = ' VScode-Logger DashBoard';
    this.element.appendChild(this.title);

    let cross = atomLogger.doctype.window.document.createElement('div');
    cross.className = 'icon icon-x atom-logger-close-panel';
    this.element.appendChild(cross);

    let sessionLabel = atomLogger.doctype.window.document.createElement('label');
    sessionLabel.className = 'icon icon-flame atom-logger-label';
    sessionLabel.textContent = 'Current Session';
    this.element.appendChild(sessionLabel);


    let sessionContainer = atomLogger.doctype.window.document.createElement('div');
    sessionContainer.className = 'inset-panel padded';
    this.element.appendChild(sessionContainer);

    let unsentmetric = atomLogger.doctype.window.document.createElement('div');
    unsentmetric.className = 'block';
    sessionContainer.appendChild(unsentmetric);

    let unsendCount = atomLogger.doctype.window.document.createElement('div');
    unsendCount.className = 'inline-block'
    unsendCount.textContent = 'Unsent Metrics';
    unsentmetric.appendChild(unsendCount);

    this.counter = atomLogger.doctype.window.document.createElement('span');
    this.counter.className = 'inline-block badge badge-warning icon-database';
    this.counter.textContent = atomLogger.unsentmetric;
    unsentmetric.appendChild(this.counter);

    let time = atomLogger.doctype.window.document.createElement('div');
    time.className ='atom-logger-line';
    time.className = 'block';
    sessionContainer.appendChild(time);

    let sessionTime = atomLogger.doctype.window.document.createElement('div');
    sessionTime.className = 'inline-block'
    sessionTime.textContent = 'Session Time';
    time.appendChild(sessionTime);

    let clock = atomLogger.doctype.window.document.createElement('div');
    this.timer = new Stopwatch(clock);
    time.appendChild(clock);

    let statisticsLabel = atomLogger.doctype.window.document.createElement('label');
    statisticsLabel.className = 'icon icon-graph atom-logger-label';
    statisticsLabel.textContent = 'Weekly Statistics';
    this.element.appendChild(statisticsLabel);

    this.statsContainer = atomLogger.doctype.window.document.createElement('div');
    this.statsContainer.className = 'inset-panel padded';
    this.element.appendChild(this.statsContainer);
/*
    var settings = atomLogger.doctype.window.document.createElement('button');
    settings.className = 'btn icon-gear atom-logger-settings';
    this.element.appendChild(settings);

    cross.addEventListener('click', () => {
      atomLogger.panel.hide();
    })

    settings.addEventListener('click', () => {
      atom.workspace.open('atom://config/packages/atom-logger');
    })
*/
    this.BODY_LOADER.appendChild(this.element);
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

/*
  createWarning() {
    var warning = atomLogger.doctype.window.document.createElement('div');
    warning.className = 'atom-logger-warning';

    let sessionLabel = atomLogger.doctype.window.document.createElement('label');
    sessionLabel.className = 'icon icon-issue-opened atom-logger-warning';
    warning.appendChild(sessionLabel);

    let message = atomLogger.doctype.window.document.createElement('label');
    message.className = 'atom-logger-warning';
    message.textContent = 'You are not logged';
    warning.appendChild(message);

    this.loginButton = atomLogger.doctype.window.document.createElement('button');
    this.loginButton.className = 'inline-block btn atom-logger-button';
    this.loginButton.textContent = 'Login';
    warning.appendChild(this.loginButton);

    this.statsContainer.appendChild(warning);

    this.loginButton.addEventListener('click', () => {
      this.loginButton.disabled = 'true';// forse va scritto true
      var loginView = new LoginView();
      
      // create the background modal div
      this.loginPanel = atomLogger.doctype.window.document.createElement('div');
      this.loginPanel.classList.add('modal');
      // create the inner modal div with appended argument
      const child = atomLogger.doctype.window.document.createElement('div');
      child.classList.add('child');
      child.innerHTML = loginView.getElement().innerHTML;//CONTROLLARE BENE SE FUNZIONA
      // render the modal with child on DOM
      this.loginPanel.appendChild(child);
      atomLogger.doctype.window.document.body.appendChild(this.loginPanel);

    });
  }
*/
/*
  createStats() {
    this.lineChart = new ChartView('Lines');
    this.statsContainer.appendChild(this.lineChart.getElement());

    this.commChart = new ChartView('Comments');
    this.statsContainer.appendChild(this.commChart.getElement());

    this.testChart = new ChartView('Tests');
    this.statsContainer.appendChild(this.testChart.getElement());

    this.BODY_LOADER.appendChild(this.statsContainer)

    var buttonDiv = atomLogger.doctype.window.document.createElement('div');
    buttonDiv.id = 'buttons';
    buttonDiv.className = 'inline-block atom-logger-logout';
    this.element.appendChild(buttonDiv);

    var logoutButton = atomLogger.doctype.window.document.createElement('button');
    logoutButton.innerHTML = "Logout";
    logoutButton.className = 'inline-block btn';
    buttonDiv.appendChild(logoutButton);

    var downloadButton = atomLogger.doctype.window.document.createElement('button');
    downloadButton.innerHTML = "Download Stats";
    downloadButton.className = 'inline-block btn';
    buttonDiv.appendChild(downloadButton);

    downloadButton.addEventListener('click', () =>{
      downloadButton.innerHTML = "DOWNLOADING ...";
      downloadButton.disabled = true;
      atomLogger.server.getStatistics()
         .then(stats => {
           var json = JSON.stringify(stats);
           var blob = new Blob([json], {type: "application/json"});

           var a = atomLogger.doctype.window.document.createElement('a');
           a.href = window.URL.createObjectURL(blob);
           a.download = "loggerStats.json";
           a.dispatchEvent(new MouseEvent('click'));
           downloadButton.disabled = false;
           downloadButton.innerHTML = "Download Stats";
         })
    })

    logoutButton.addEventListener('click', () => {
      atomLogger.logout();
    })
  }
*/
  refreshStats(stats) {

    this.lines = {
      inserted : 0,
      deleted: 0,
      modified: 0,
    }

    this.comments = {
      inserted : 0,
      deleted: 0,
    }

    this.tests = {
      inserted : 0,
      deleted: 0,
    }

    stats.forEach((item) => {
      if(item.activity_type.includes('lines_insert')) this.lines.inserted++;
      else if (item.activity_type.includes('lines_delete')) this.lines.deleted++;
      else if (item.activity_type.includes('lines_change')) this.lines.modified++;
      else if (item.activity_type.includes('comments_added')) this.comments.inserted++;
      else if (item.activity_type.includes('comments_deleted')) this.comments.deleted++;
      else if (item.activity_type.includes('tests_added')) this.tests.inserted++;
      else if (item.activity_type.includes('tests_deleted')) this.tests.deleted++;
    });
    /*
    this.lineChart.update(this.lines);
    this.commChart.update(this.comments);
    this.testChart.update(this.tests);
    
    if (!this.stats_created){
      this.lines_container = atomLogger.doctype.window.document.createElement('div')
      this.lines_container.textContent = 'Lines';

          this.inserted_lines = atomLogger.doctype.window.document.createElement('div');
          this.inserted_lines.textContent = 'Inserted: ' + this.lines.inserted;

          this.lines_container.appendChild(this.inserted_lines);

          this.deleted_lines = atomLogger.doctype.window.document.createElement('div');
          this.deleted_lines.textContent = 'Deleted: ' + this.lines.modified;
          
          this.lines_container.appendChild(this.deleted_lines);

          this.modifies_lines = atomLogger.doctype.window.document.createElement('div');
          this.modifies_lines.textContent = 'Modified: ' + this.lines.deleted;

          this.lines_container.appendChild(this.modifies_lines);

      this.statsContainer.appendChild(this.lines_container);
      




      this.comments_container = atomLogger.doctype.window.document.createElement('div')
      this.comments_container.textContent = 'Comments';

          this.inserted_comments = atomLogger.doctype.window.document.createElement('div');
          this.inserted_comments.textContent = 'Inserted: ' + this.comments.inserted;

          this.comments_container.appendChild(this.inserted_comments);

          this.deleted_comments = atomLogger.doctype.window.document.createElement('div');
          this.deleted_comments.textContent = 'Deleted: ' + this.comments.deleted;

          this.comments_container.appendChild(this.deleted_comments);

      this.statsContainer.appendChild(this.comments_container);





      this.tests_container = atomLogger.doctype.window.document.createElement('div')
      this.tests_container.textContent = 'Tests';

          this.inserted_tests = atomLogger.doctype.window.document.createElement('div');
          this.inserted_tests.textContent = 'Inserted: ' + this.tests.inserted;

          this.tests_container.appendChild(this.inserted_tests);

          this.deleted_tests = atomLogger.doctype.window.document.createElement('div');
          this.deleted_tests.textContent = 'Deleted: ' + this.tests.deleted;

          this.tests_container.appendChild(this.deleted_tests);  
      
      this.statsContainer.appendChild(this.tests_container);

      this.stats_created = true;
    }
    else{
      //lines_container updater
      this.inserted_lines.textContent = 'Inserted: ' + this.lines.inserted;
      this.deleted_lines.textContent = 'Deleted: ' + this.lines.modified;
      this.modifies_lines.textContent = 'Modified: ' + this.lines.deleted;

      //comments_container updater
      this.inserted_comments.textContent = 'Inserted: ' + this.comments.inserted;
      this.deleted_comments.textContent = 'Deleted: ' + this.comments.deleted;

      //tests_container updater
      this.inserted_tests.textContent = 'Inserted: ' + this.tests.inserted;
      this.deleted_tests.textContent = 'Deleted: ' + this.tests.deleted;
    }*/
  }
}

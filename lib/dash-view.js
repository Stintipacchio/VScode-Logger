'use babel';
import Stopwatch from './stopwatch.js';
import atomLogger from './atom-logger.js';

export default class DashView {

  constructor() {
    this.BODY_LOADER = atomLogger.doctype.window.document.body;

    this.stats_created = false;

    this.session = false;

    this.element = atomLogger.doctype.window.document.createElement('div');
    
    this.title = atomLogger.doctype.window.document.createElement('div');
    this.title.textContent = ' VScode-Logger DashBoard';
    this.element.appendChild(this.title);


    let sessionLabel = atomLogger.doctype.window.document.createElement('label');
    sessionLabel.textContent = 'Current Session';
    this.element.appendChild(sessionLabel);


    let sessionContainer = atomLogger.doctype.window.document.createElement('div');
    this.element.appendChild(sessionContainer);

    let unsentmetric = atomLogger.doctype.window.document.createElement('div');
    sessionContainer.appendChild(unsentmetric);

    let unsendCount = atomLogger.doctype.window.document.createElement('div');
    unsendCount.textContent = 'Unsent Metrics';
    unsentmetric.appendChild(unsendCount);

    this.counter = atomLogger.doctype.window.document.createElement('span');
    this.counter.textContent = atomLogger.unsentmetric;
    unsentmetric.appendChild(this.counter);

    let time = atomLogger.doctype.window.document.createElement('div');
    sessionContainer.appendChild(time);

    let sessionTime = atomLogger.doctype.window.document.createElement('div');
    time.appendChild(sessionTime);

    let clock = atomLogger.doctype.window.document.createElement('div');
    this.timer = new Stopwatch(clock);
    time.appendChild(clock);

    let statisticsLabel = atomLogger.doctype.window.document.createElement('label');
    statisticsLabel.textContent = 'Weekly Statistics';
    this.element.appendChild(statisticsLabel);

    this.statsContainer = atomLogger.doctype.window.document.createElement('div');
    this.element.appendChild(this.statsContainer);

    this.BODY_LOADER.appendChild(this.element);
}

  refreshStats(stats) {

    this.lines = {
      inserted : 0,
      deleted: 0,
      modified: 0,
    },

    this.comments = {
      inserted : 0,
      deleted: 0,
    },

    this.tests = {
      inserted : 0,
      deleted: 0,
    },

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

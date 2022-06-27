'use babel';
import Stopwatch from './stopwatch.js';
import VScodeLogger from './VScode-logger.js';

export default class DashView {

  constructor() {
    this.BODY_LOADER = VScodeLogger.doctype.window.document.body;

    this.stats_created = false;

    this.session = false;

    this.element = VScodeLogger.doctype.window.document.createElement('div');
    
    this.title = VScodeLogger.doctype.window.document.createElement('div');
    this.title.textContent = 'DashBoard';
    this.element.appendChild(this.title);


    let sessionLabel = VScodeLogger.doctype.window.document.createElement('label');
    sessionLabel.textContent = 'Current Session';
    this.element.appendChild(sessionLabel);


    let sessionContainer = VScodeLogger.doctype.window.document.createElement('div');
    this.element.appendChild(sessionContainer);

    let unsentmetric = VScodeLogger.doctype.window.document.createElement('div');
    sessionContainer.appendChild(unsentmetric);

    let unsendCount = VScodeLogger.doctype.window.document.createElement('div');
    unsendCount.textContent = 'Unsent Metrics';
    unsentmetric.appendChild(unsendCount);

    this.counter = VScodeLogger.doctype.window.document.createElement('span');
    this.counter.textContent = VScodeLogger.unsentmetric;
    unsentmetric.appendChild(this.counter);

    let time = VScodeLogger.doctype.window.document.createElement('div');
    sessionContainer.appendChild(time);

    let sessionTime = VScodeLogger.doctype.window.document.createElement('div');
    time.appendChild(sessionTime);

    let clock = VScodeLogger.doctype.window.document.createElement('div');
    this.timer = new Stopwatch(clock);
    time.appendChild(clock);

    this.statsContainer = VScodeLogger.doctype.window.document.createElement('div');
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
  }
}

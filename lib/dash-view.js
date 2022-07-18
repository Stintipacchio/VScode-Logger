'use babel';
export default class DashView {

  constructor() {
    this.stats_created = false;

    this.session = false;
  }

  async refreshStats(stats) {

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

'use babel';

export default class Stopwatch{

  constructor() {
    this.clockvalue = '00:00:00';
    this.time = 0;
    this.interval;
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

  start() {
    this.interval = setInterval(() => {
      this.time++;
      this.timer();
    }, 1000);
  }

  stop() {
    clearInterval(this.interval);
  }

  clear(){
    this.stop();
    this.time = 0;
    this.clockvalue = 'Session Time : 00:00:00';
  }

  timer() {
    let temp;
    let hours = ((temp = Math.floor(this.time/3600)) < 10) ? '0'+ temp : temp;
    let minutes = ((temp = Math.floor((this.time%3600)/60)) < 10 ) ? '0'+ temp : temp;
    let seconds = ((temp = Math.floor((this.time%3600)%60)) <10 ) ? '0'+ temp : temp;
    this.clockvalue = hours + ':' + minutes + ':' + seconds;
  }
}

/* eslint-disable class-methods-use-this */
export default class Bot {
  constructor(elem, url) {
    if (typeof (elem) === 'string') {
      this.element = document.querySelector(elem);
    } else {
      this.element = elem;
    }
    this.form = this.element.querySelector('.bot-form');
    this.ws = new WebSocket(url);

    this.ws.addEventListener('message', this.messageServer);
    this.ws.addEventListener('open', this.openServer);
    this.ws.addEventListener('close', this.serverLost);
    this.form.addEventListener('submit', (e) => {
      this.postMessage(e, this);
    });
  }

  init(url) {

  }

  openServer(e) {

  }

  messageServer(e) {
    console.log(e.data);
    console.log('general kenobi');
  }

  serverLost(e) {
    console.log(e);
    console.log('лавочка закрыта');
  }

  postMessage(e, app) {
    e.preventDefault();
    app.ws.send(app.getFormData());
  }

  getFormData() {
    const result = this.form.querySelector('.bot-form-input').value;
    this.form.querySelector('.bot-form-input').value = '';
    return JSON.stringify(result);
  }
}

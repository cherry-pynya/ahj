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
    this.feed = this.element.querySelector('.bot-window-messages');

    this.ws.addEventListener('message', (e) => {
      this.messageFromServer(e, this);
    });
    this.ws.addEventListener('open', () => {
      this.openServer(this);
    });
    this.ws.addEventListener('close', this.serverLost);
    this.form.addEventListener('submit', (e) => {
      this.onSubmit(e, this);
    });
  }

  openServer(app) {
    app.sentMessage(JSON.stringify({ comand: 'sentInitailData' }));
  }

  sentMessage(data) {
    this.ws.send(data);
  }

  messageFromServer(e, app) {
    const obj = JSON.parse(e.data);
    if (obj.comand === 'sentInitailData' && obj.fullfilled) {
      obj.data.forEach((el) => {
        app.feed.insertAdjacentElement('beforeend', app.renderMessage(el));
      });
    }
    if (obj.comand === 'newMessage' && obj.fullfilled) {
      app.feed.insertAdjacentElement('beforeend', app.renderMessage(obj.data));
    }
  }

  serverLost(e) {
    console.log(e);
    console.log('лавочка закрыта');
  }

  onSubmit(e, app) {
    e.preventDefault();
    const message = {
      comand: 'newMessage',
      text: app.getFormData(),
    };
    app.ws.send(JSON.stringify(message));
  }

  getFormData() {
    const result = this.form.querySelector('.bot-form-input').value;
    this.form.querySelector('.bot-form-input').value = '';
    return result;
  }

  renderMessage(obj) {
    const container = document.createElement('div');
    container.dataset.id = obj.id;
    container.dataset.index = obj.index;
    container.classList.add('message-container');
    container.classList.add('border'); // граница
    const timestamp = document.createElement('div');
    timestamp.classList.add('timestamp');
    const time = document.createElement('span');
    time.textContent = obj.timestamp;
    timestamp.insertAdjacentElement('afterbegin', time);
    container.insertAdjacentElement('afterbegin', timestamp);
    const message = document.createElement('div');
    const text = document.createElement('span');
    message.insertAdjacentElement('afterbegin', text);
    container.insertAdjacentElement('beforeend', message);
    const reg = new RegExp(/(http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(\/\S*)?/);
    if (reg.test(obj.text)) {
        
      const link = obj.text.match(reg)[0];
      console.log(obj.text.split(link))
      const html = `<a href='${link}'>${link}</a>`;
      console.log(obj.text.replace(reg, `<a href='${link}'>${link}</a>`));
      const res = obj.text.replace(reg, `<a href='${link}'>${link}</a>`);
      text.textContent = res;
    }
    return container;
  }
}

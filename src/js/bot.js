/* eslint-disable consistent-return */
/* eslint-disable class-methods-use-this */
export default class Bot {
  constructor(elem, url) {
    if (typeof (elem) === 'string') {
      this.element = document.querySelector(elem);
    } else {
      this.element = elem;
    }
    this.form = this.element.querySelector('.bot-form');
    this.fileInput = this.form.querySelector('.file-input');
    this.ws = new WebSocket(url);
    this.feed = this.element.querySelector('.bot-window-messages');

    this.ws.addEventListener('message', (e) => {
      this.messageFromServer(e);
    });
    this.ws.addEventListener('open', () => {
      this.openServer();
    });
    this.ws.addEventListener('close', this.serverLost);
    this.form.addEventListener('submit', (e) => {
      this.onSubmit(e);
    });
    this.fileInput.addEventListener('change', (e) => {
      this.sendFile(e);
    });
    this.feed.addEventListener('wheel', (e) => {
      if (e.deltaY < 0 && window.scrollY === 0) {
        this.sentMessage(JSON.stringify({ comand: 'lazyLoad' }));
      }
    });

    this.onSubmit = this.onSubmit.bind(this);
    this.openServer = this.openServer.bind(this);
    this.sendFile = this.sendFile.bind(this);
    this.messageFromServer = this.messageFromServer.bind(this);
    this.sentMessage = this.sentMessage.bind(this);
  }

  sendFile() {
    const file = this.fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    this.ws.send(JSON.stringify(formData));
  }

  openServer() {
    this.sentMessage(JSON.stringify({ comand: 'lazyLoad' }));
  }

  sentMessage(data) {
    this.ws.send(data);
  }

  messageFromServer(e) {
    const obj = JSON.parse(e.data);
    if (obj.comand === 'lazyLoad') {
      obj.data.forEach((el) => {
        this.feed.insertAdjacentElement('beforeend', this.renderMessage(el));
      });
    }
    if (obj.comand === 'newMessage') {
      this.feed.insertAdjacentElement('afterbegin', this.renderMessage(obj.data));
    }
  }

  serverLost(e) {
    console.log(e);
    console.log('лавочка закрыта');
  }

  onSubmit(e) {
    e.preventDefault();
    if (this.form.querySelector('.bot-form-input').value === '') return false;
    const message = {
      comand: 'newMessage',
      text: this.form.querySelector('.bot-form-input').value,
    };
    this.form.querySelector('.bot-form-input').value = '';
    this.ws.send(JSON.stringify(message));
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
      const res = obj.text.replace(reg, `</span><a href='${link}'>${link}</a><span>`);
      text.innerHTML = res;
    } else {
      text.textContent = obj.text;
    }
    return container;
  }
}

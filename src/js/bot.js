/* eslint-disable consistent-return */
/* eslint-disable class-methods-use-this */
import { Array } from 'core-js';
import { saveAs } from 'file-saver';
import post from './post';
import getLocation, { validate } from './location';

export default class Bot {
  constructor(elem, url) {
    if (typeof (elem) === 'string') {
      this.element = document.querySelector(elem);
    } else {
      this.element = elem;
    }
    this.form = this.element.querySelector('.bot-form');
    this.fileInput = this.form.querySelector('.file-input');
    this.fileInputOverlap = this.element.querySelector('.file-input-icon');
    this.url = url;
    this.ws = new WebSocket(this.url);
    this.feed = this.element.querySelector('.bot-window-messages');
    this.geoBtn = this.element.querySelector('.geo');
    this.finder = this.element.querySelector('.lens');

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
    this.fileInputOverlap.addEventListener('click', () => {
      this.fileInput.dispatchEvent(new MouseEvent('click'));
    });
    this.feed.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    this.feed.addEventListener('drop', (e) => {
      this.dropFiles(e);
    });
    this.feed.addEventListener('wheel', (e) => {
      if (e.deltaY < 0 && window.scrollY === 0) {
        this.sentMessage(JSON.stringify({ comand: 'lazyLoad' }));
      }
    });
    this.geoBtn.addEventListener('click', () => {
      this.postLocation();
    });
    this.finder.addEventListener('click', (e) => {
      this.findMessage(e);
    });

    this.onSubmit = this.onSubmit.bind(this);
    this.openServer = this.openServer.bind(this);
    this.sendFile = this.sendFile.bind(this);
    this.messageFromServer = this.messageFromServer.bind(this);
    this.sentMessage = this.sentMessage.bind(this);
    this.dropFiles = this.dropFiles.bind(this);
    this.postLocation = this.postLocation.bind(this);
    this.findMessage = this.findMessage.bind(this);
    this.handleFormMissClick = this.handleFormMissClick.bind(this);
  }

  dropFiles(e) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach((el) => {
      post(el, this.url);
    });
  }

  sendFile() {
    post(this.fileInput.files[0], this.url);
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
    if (obj.comand === 'geo') {
      this.feed.insertAdjacentElement('afterbegin', this.renderMessage(obj.data));
    }
    if (obj.comand === 'findMessage') {
      obj.data.forEach((el) => {
        this.feed.insertAdjacentElement('afterbegin', this.renderMessage(el));
      });
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
    if (obj.type === 'file') {
      const link = document.createElement('a');
      const href = this.url.replace('ws', 'http');
      link.href = `${href}/${obj.text}`;
      link.textContent = obj.text;
      const div = document.createElement('div');
      div.insertAdjacentElement('afterbegin', link);
      container.insertAdjacentElement('beforeend', div);
      link.addEventListener('click', (event) => {
        event.preventDefault();
        saveAs(`${href}/${obj.text}`, obj.text);
      });
      return container;
    }
    const text = document.createElement('span');
    message.insertAdjacentElement('afterbegin', text);
    container.insertAdjacentElement('beforeend', message);
    const reg = new RegExp(/(http|https|ftp|ftps):\/\/[a-zA-Z0-9\-\\.]+\.[a-zA-Z]{2,3}(\/\S*)?/);
    if (reg.test(obj.text)) {
      const link = obj.text.match(reg)[0];
      const res = obj.text.replace(reg, `</span><a href='${link}'>${link}</a><span>`);
      text.innerHTML = res;
    } else {
      text.textContent = obj.text;
    }
    return container;
  }

  postLocation() {
    getLocation()
      .then((resolve) => {
        this.sentMessage(JSON.stringify({
          comand: 'geo',
          text: resolve,
        }));
      }, (reject) => {
        this.createTopInput('Упс! Геолокация отключена или не поддерживается данным браузером. Пожалуйста, введите координаты в формате: Х.ХХХ, Х.ХХХ!');
        this.element.addEventListener('click', this.handleFormMissClick);
        const form = document.querySelector('.bot-window-top-form');
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const coords = form.querySelector('.bot-window-top-form-input').value;
          if (validate(coords)) {
            const text = coords.replace(',', ' - ');
            this.sentMessage(JSON.stringify({
              comand: 'geo',
              text: `[${text}]`,
            }));
            this.removeTopForm();
          } else {
            form.querySelector('.bot-window-top-form-text').textContent = 'Упс! Неыерный формат координат. Пожалуйста, введите координаты в формате: Х.ХХХ, Х.ХХХ!';
            form.querySelector('.bot-window-top-form-input').value = '';
          }
          return reject;
        });
      });
  }

  createTopInput(str, type = 'geo') {
    if (this.element.querySelector('.bot-window-top-form') !== null) {
      this.removeTopForm();
    }
    this.element.querySelector('.bot-window-messages').style.height = '75%';
    const form = document.createElement('form');
    form.classList.add('bot-window-top-form');
    form.classList.add(type);
    form.classList.add('border');
    this.element.querySelector('.bot-window-top').insertAdjacentElement('afterend', form);
    const text = document.createElement('span');
    text.textContent = str;
    text.classList.add('bot-window-top-form-text');
    form.insertAdjacentElement('afterbegin', text);
    const input = document.createElement('input');
    input.classList.add('bot-window-top-form-input');
    form.insertAdjacentElement('beforeend', input);
  }

  removeTopForm() {
    const form = this.element.querySelector('.bot-window-top-form');
    if (form.classList.contains('search')) {
      this.sentMessage(JSON.stringify({
        comand: 'refreshFeed',
      }));
    }
    form.remove();
    this.element.querySelector('.bot-window-messages').style.height = '85%';
    this.element.removeEventListener('click', this.handleFormMissClick);
  }

  handleFormMissClick(e) {
    if (e.target === this.finder) {
      return false;
    }
    if (e.target.closest('.bot-window-top-form') === null) {
      this.removeTopForm();
    }
  }

  findMessage(e) {
    e.preventDefault();
    this.createTopInput('Поиск по сообщениям...', 'search');
    this.element.addEventListener('click', this.handleFormMissClick);
    const input = document.querySelector('.bot-window-top-form').querySelector('.bot-window-top-form-input');
    input.addEventListener('input', () => {
      this.feed.innerHTML = '';
      this.sentMessage(JSON.stringify({
        comand: 'findMessage',
        text: input.value,
      }));
    });
  }
}

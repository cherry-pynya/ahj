import Bot from './bot';

const heroku = 'https://cherry-pynya-ahj-diploma-back.herokuapp.com';
// const localhost = 'ws://localhost:7777';

window.bot = new Bot('.bot-container', heroku);

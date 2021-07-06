import Bot from './bot';

const bot = new Bot('.bot-container', 'ws://localhost:7777');
bot.init();

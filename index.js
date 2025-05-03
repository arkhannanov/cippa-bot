const { Bot, InlineKeyboard, InputFile } = require("grammy");
require('dotenv').config();
const filePath = 'cipa.jpg';

const bot = new Bot(process.env.BOT_KEY);

// Идентификатор группы, куда будут отправляться данные
const groupChatId = '-1002505161849';

// Объект для хранения состояния пользователей
const userStates = {};

bot.command('start', async (ctx) => {
    const keyboard = new InlineKeyboard()
        .text('Подключиться бесплатно', 'freeConnect')
        .row()
        .url('Перейти на сайт', 'http://cippa.ru/');

    await ctx.replyWithPhoto(new InputFile(filePath), {
        caption: 'Привет! Данный бот поможет подключиться \n' +
            'к системе ЦИППА, это позволит пользоваться привилегиями персональной защиты прямо сейчас.',
        reply_markup: keyboard,
    });
});

bot.callbackQuery('freeConnect', async (ctx) => {
    await ctx.answerCallbackQuery({ text: 'Процесс подключения начался!' });
    await ctx.reply('Давайте начнем процесс подключения.');

    userStates[ctx.from.id] = { step: 1 };
    await ctx.reply('Как Вас зовут?');
});

bot.on('message', async (ctx) => {
    const state = userStates[ctx.from.id];

    if (!state) {
        return; // Если состояние не найдено, игнорируем
    }

    switch (state.step) {
        case 1:
            state.name = ctx.message.text;
            state.step = 2;
            await ctx.reply('Номер телефона:');
            break;
        case 2:
            state.phone = ctx.message.text;
            state.step = 3;
            await ctx.reply('Код Агента:');
            break;
        case 3:
            state.agentCode = ctx.message.text;

            // Отправка собранных данных в группу
            await bot.api.sendMessage(groupChatId, `Новый пользователь:\nИмя: ${state.name}\nТелефон: ${state.phone}\nКод Агента: ${state.agentCode}`);

            // Ответ пользователю
            await ctx.reply('Спасибо за предоставленную информацию!');

            // Удаляем состояние пользователя
            delete userStates[ctx.from.id];
            break;
    }
});

bot.start();

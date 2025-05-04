const { Bot, InlineKeyboard, InputFile } = require("grammy");
require('dotenv').config();
const filePath = 'cipa.jpg';

const bot = new Bot(process.env.BOT_KEY);

// Идентификатор группы, куда будут отправляться данные
const groupChatId = '-1002505161849';

// Объект для хранения состояния пользователей
const userStates = {};

bot.command('start', async (ctx) => {
    try {
        const keyboard = new InlineKeyboard()
            .text('Подключиться бесплатно', 'freeConnect')
            .row()
            .url('Перейти на сайт', 'http://cippa.ru/');

        await ctx.replyWithPhoto(new InputFile(filePath), {
            caption: 'Привет! Данный бот поможет подключиться \n' +
                'к системе ЦИППА, это позволит пользоваться привилегиями персональной защиты прямо сейчас.',
            reply_markup: keyboard,
        });
    } catch (error) {
        console.error('Ошибка в команде start:', error);
    }
});

bot.callbackQuery('freeConnect', async (ctx) => {
    try {
        await ctx.answerCallbackQuery({ text: 'Процесс подключения начался!' });
        await ctx.reply('Давайте начнем процесс подключения.');

        userStates[ctx.from.id] = { step: 1 };
        await ctx.reply('Как Вас зовут?');
    } catch (error) {
        console.error('Ошибка в обработке колбэка freeConnect:', error);
    }
});

bot.on('message', async (ctx) => {
    try {
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
                const phoneRegex = /^[+]?[0-9]{10,15}$/;  // Простая регулярка для номера телефона
                if (phoneRegex.test(ctx.message.text)) {
                    state.phone = ctx.message.text;
                    state.step = 3;
                    await ctx.reply('Код Агента:');
                } else {
                    await ctx.reply('Введите правильный номер телефона, пожалуйста. Пример: +7234567890 или 8234567890');
                }
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
    } catch (error) {
        console.error('Ошибка в обработке сообщения:', error);
    }
});

bot.start();

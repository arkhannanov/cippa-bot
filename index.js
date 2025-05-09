const { Bot, InlineKeyboard, InputFile } = require("grammy");
require('dotenv').config();
const filePath = 'cipa.jpg';

const bot = new Bot(process.env.BOT_KEY);

// Идентификатор группы, куда будут отправляться данные
const groupChatId = '-1002505161849';

// Объект для хранения состояния пользователей
const userStates = {};

// Установка команд для панели команд
bot.api.setMyCommands([
    { command: 'start', description: 'Запустить бота и получить приветственное сообщение' },
    { command: 'faq', description: 'Получить список часто задаваемых вопросов' },
]);

bot.command('start', async (ctx) => {
    try {
        const keyboard = new InlineKeyboard()
            .text('Подключиться бесплатно', 'freeConnect')
            .row()
            .url('Ссылка на сайт', 'http://cippa.ru/');

        await ctx.replyWithPhoto(new InputFile(filePath), {
            caption: 'Привет, это ЦИППА бот!\n' +
                'Я могу подключить тебя к системе ЦИППА прямо сейчас.\n' +
                'ЦИППА - твоя финансовая безопасность, правовая поддержка и юридическая защита. \n\n\n' +
                'Вы можете использовать команды:\n/start - Запустить бота\n/faq - Часто задаваемые вопросы',
            reply_markup: keyboard,
        });
    } catch (error) {
        console.error('Ошибка в команде start:', error);
    }
});

bot.command('faq', async (ctx) => {
    try {
        const faqText = `
1. Центр Информационно Правовой Поддержки Автовладельцев, функционирует с 2001 года. 

2. ЦИППА не сотрудничает со страховыми компаниями, не представляет интересы автосалонов и автосервисов, ЦИППА защищает гражданские права и имущественные интересы исключительно владельцев автомобилей. 

3. К ЦИППА подключены независимые юристы, эксперты и другие специалисты, обеспечивающие поддержку автовладельцев. Только в ЦИППА существует двойная система контроля, это позволяет исключить возможные ошибки специалистов на всех этапах ведения дела. 

4. Только в ЦИППА существует 100% гарантия
в возмещении объявленного и рассчитанного ущерба. Это значит, что если в ЦИППА Вам объявили конкретную сумму ущерба, то вы обязательно её получите. 
`;

        await ctx.reply(faqText, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Ошибка в обработке команды faq:', error);
    }
});

bot.callbackQuery('freeConnect', async (ctx) => {
    try {
        await ctx.reply('Хорошо, приступим! Как к Вам обращаться? \n');

        userStates[ctx.from.id] = { step: 1 };
    } catch (error) {
        console.error('Ошибка в обработке колбэка freeConnect:', error);
    }
});

// Обработка сообщений
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
                await ctx.reply(`Поздравляем, ${state.name}! Вы подключены к системе безопасности ЦИППА. \n` + '\n'+
                    'В течении 24 часов Вам станут доступны бесплатные консультации, без ограничений. \n' +
                    '\n' +
                    '+79005557702 это номер ЦИППА, добавьте его в контакты прямо сейчас. \n');

                // Удаляем состояние пользователя
                delete userStates[ctx.from.id];
                break;
        }
    } catch (error) {
        console.error('Ошибка в обработке сообщения:', error);
    }
});

bot.start();

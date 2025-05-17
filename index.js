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
            caption:
                'Привет, это ЦИППА бот!\n' +
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
            return; // Если состояние пользователя не найдено, игнорируем сообщение
        }

        switch (state.step) {
            case 1:
                state.name = ctx.message.text;
                state.step = 2;
                await ctx.reply('Пожалуйста, укажите ваш номер телефона в формате +79998888888:');
                break;

            case 2:
                const phoneRegex = /^\+7\d{10}$/; // Регулярное выражение для проверки номера формата +79998888888
                if (phoneRegex.test(ctx.message.text)) {
                    state.phone = ctx.message.text;
                    state.step = 3;
                    await ctx.reply('Введите ваш Код Агента (если у вас его нет, укажите 0):');
                } else {
                    await ctx.reply('Неверный формат номера. Пожалуйста, введите номер в формате +79998888888:');
                }
                break;

            case 3:
                state.agentCode = ctx.message.text;

                const usernameOrFallback = ctx.from.username
                    ? `@${ctx.from.username}` // Юзернейм в формате @username
                    : ctx.from.first_name || ctx.from.id; // Или имя, или ID телеграм

                // Получение аватара пользователя
                const profilePhotos = await bot.api.getUserProfilePhotos(ctx.from.id).catch(() => null);

                if (profilePhotos && profilePhotos.total_count > 0) {
                    const fileId = profilePhotos.photos[0][0].file_id; // Берем первый file_id из первой фотографии
                    await bot.api.sendPhoto(
                        groupChatId,
                        fileId,
                        {
                            caption:
                                `Новый пользователь:\n` +
                                `Имя в Telegram: ${usernameOrFallback}\n` +
                                `Имя: ${state.name}\n` +
                                `Телефон: ${state.phone}\n` +
                                `Код Агента: ${state.agentCode}`,
                        }
                    );
                } else {
                    // Если аватарки нет
                    await bot.api.sendMessage(
                        groupChatId,
                        `Новый пользователь:\n` +
                        `Имя в Telegram: ${usernameOrFallback}\n` +
                        `Имя: ${state.name}\n` +
                        `Телефон: ${state.phone}\n` +
                        `Код Агента: ${state.agentCode}\n` +
                        `Аватарка отсутствует.`
                    );
                }

                // Все данные собраны — удаляем состояние
                delete userStates[ctx.from.id];
                await ctx.reply('Поздравляем, В! Вы подключены к системе безопасности ЦИППА. \n' +
                    '\n' +
                    'В течении 24 часов Вам станут доступны бесплатные консультации, без ограничений. \n' +
                    '\n' +
                    '+79005557702 это номер ЦИППА, добавьте его в контакты прямо сейчас.');
                break;

            default:
                await ctx.reply('Произошла ошибка. Попробуйте начать заново /start.');
                delete userStates[ctx.from.id]; // Удаляем состояние на случай сбоя
                break;
        }
    } catch (error) {
        console.error('Ошибка в обработке сообщения:', error);
    }
});

bot.start();

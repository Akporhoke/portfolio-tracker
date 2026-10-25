/*
 * Telegram service: sends alerts to a user's Telegram and handles the
 * "/start <code>" message that connects their account.
 *
 * Put this file in:  backend/services/telegramService.js
 *
 * Settings (backend/.env, and the Render environment variables):
 *   TELEGRAM_BOT_TOKEN   from @BotFather. Without it Telegram stays off
 *                        and nothing else in Gaze is affected.
 *   TELEGRAM_POLLING     "false" on a laptop that shares the live bot.
 *                        Only ONE running server may poll a bot at a time
 *                        (Telegram answers 409 to the second one).
 *   TELEGRAM_BOT_USERNAME optional; looked up automatically if missing.
 *
 * Security: the bot token is part of every Telegram URL, so errors are
 * logged by message only, never by printing the whole error object.
 */

const axios = require('axios');
const crypto = require('crypto');

const TelegramLink =
    require('../models/TelegramLink');


const LINK_CODE_MINUTES = 10;

// Ignore "/start" messages older than this (Telegram redelivers
// unconfirmed messages after a restart)
const MAX_START_AGE_SECONDS = 15 * 60;

const POLL_TIMEOUT_SECONDS = 25;

let botUsername =
    String(process.env.TELEGRAM_BOT_USERNAME || '')
        .replace(/^@/, '');

let polling = false;
let offset = 0;
let lastConflictLog = 0;


// ------------------------------------------------------------
// SETTINGS (read when used, so load order never matters)
// ------------------------------------------------------------

function getToken() {
    return String(process.env.TELEGRAM_BOT_TOKEN || '').trim();
}

function isConfigured() {
    return Boolean(getToken());
}

function pollingEnabled() {
    return String(
        process.env.TELEGRAM_POLLING || 'true'
    ).toLowerCase() !== 'false';
}


// ------------------------------------------------------------
// LOW LEVEL
// ------------------------------------------------------------

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// A safe description of an error (never includes the URL / token)
function describeError(error) {
    return (
        (error.response &&
            error.response.data &&
            error.response.data.description) ||
        error.message ||
        'unknown error'
    );
}


async function callApi(method, body = {}, timeoutMs = 15000) {
    const response =
        await axios.post(
            `https://api.telegram.org/bot${getToken()}/${method}`,
            body,
            { timeout: timeoutMs }
        );

    return response.data && response.data.result;
}


async function sendMessage(chatId, text) {
    return callApi(
        'sendMessage',
        {
            chat_id: chatId,
            text,
            disable_web_page_preview: true
        }
    );
}


// A reply to the person chatting with the bot. A failure is only logged.
async function reply(chatId, text) {
    try {
        await sendMessage(chatId, text);
    } catch (error) {
        console.error(
            '[Telegram] reply failed:',
            describeError(error)
        );
    }
}


// The bot's @username, needed to build the t.me link
async function ensureBotUsername() {
    if (botUsername || !isConfigured()) {
        return botUsername;
    }

    try {
        const me = await callApi('getMe');

        if (me && me.username) {
            botUsername = me.username;
        }
    } catch (error) {
        console.error(
            '[Telegram] getMe failed:',
            describeError(error)
        );
    }

    return botUsername;
}


// ------------------------------------------------------------
// SENDING AN ALERT
// ------------------------------------------------------------

// Returns true if the message was delivered. Never throws: a Telegram
// problem must never break the alert engine.
async function sendToUser(userId, text) {
    if (!isConfigured()) {
        return false;
    }

    try {
        const link =
            await TelegramLink.findOne({
                userId,
                chatId: { $type: 'string' }
            }).lean();

        if (!link) {
            return false;
        }

        try {
            await sendMessage(link.chatId, text);

            return true;

        } catch (error) {
            const status =
                error.response && error.response.status;

            console.error(
                '[Telegram] send failed:',
                status || '',
                describeError(error)
            );

            // 403: the user blocked the bot. 400 "chat not found": the
            // chat is gone. Either way, stop trying until they reconnect.
            const gone =
                status === 403 ||
                (
                    status === 400 &&
                    /chat not found/i.test(describeError(error))
                );

            if (gone) {
                await TelegramLink.updateOne(
                    { userId },
                    { $set: { chatId: null, linkedAt: null } }
                );
            }

            return false;
        }

    } catch (error) {
        console.error(
            '[Telegram] sendToUser failed:',
            error.message
        );

        return false;
    }
}


// ------------------------------------------------------------
// LINKING
// ------------------------------------------------------------

async function createLinkCode(userId) {
    await ensureBotUsername();

    // 12 characters, URL-safe, impossible to guess
    const code =
        crypto.randomBytes(9).toString('base64url');

    const expiresAt =
        new Date(Date.now() + LINK_CODE_MINUTES * 60 * 1000);

    await TelegramLink.findOneAndUpdate(
        { userId },
        {
            $set: {
                linkCode: code,
                linkCodeExpiresAt: expiresAt
            }
        },
        { upsert: true }
    );

    return {
        code,
        expiresAt,
        botUsername: botUsername || null,
        url: botUsername
            ? `https://t.me/${botUsername}?start=${code}`
            : null
    };
}


async function getStatus(userId) {
    const link =
        await TelegramLink.findOne({ userId }).lean();

    return {
        configured: isConfigured(),
        linked: Boolean(link && link.chatId),
        linkedAt: (link && link.linkedAt) || null,
        botUsername: botUsername || null
    };
}


async function unlink(userId) {
    await TelegramLink.updateOne(
        { userId },
        {
            $set: {
                chatId: null,
                linkedAt: null,
                linkCode: null,
                linkCodeExpiresAt: null
            }
        }
    );
}


// ------------------------------------------------------------
// INCOMING MESSAGES
// ------------------------------------------------------------

async function handleStart(chatId, text, message) {
    const code = text.split(/\s+/)[1] || '';

    if (!code) {
        return reply(
            chatId,
            'To connect Gaze, open Alerts in the app and tap Connect Telegram.'
        );
    }

    // A message that is only being redelivered after a restart
    if (
        message.date &&
        Date.now() / 1000 - message.date > MAX_START_AGE_SECONDS
    ) {
        return;
    }

    const link =
        /^[A-Za-z0-9_-]{6,64}$/.test(code)
            ? await TelegramLink.findOne({
                linkCode: code,
                linkCodeExpiresAt: { $gt: new Date() }
            })
            : null;

    if (!link) {
        // Already connected (a redelivered /start): say nothing
        const already =
            await TelegramLink.findOne({ chatId }).lean();

        if (already) {
            return;
        }

        return reply(
            chatId,
            'That link has expired. Open Alerts in Gaze and tap Connect Telegram again.'
        );
    }

    // One chat belongs to one Gaze user: free it from any other account
    await TelegramLink.updateMany(
        { chatId, userId: { $ne: link.userId } },
        { $set: { chatId: null, linkedAt: null } }
    );

    link.chatId = chatId;
    link.linkedAt = new Date();
    link.linkCode = null;
    link.linkCodeExpiresAt = null;

    await link.save();

    return reply(
        chatId,
        'Gaze is connected. Your price alerts will arrive here.\n\nSend /stop to disconnect.'
    );
}


async function handleUpdate(update) {
    const message = update && update.message;

    // Private chats only (not groups or channels)
    if (
        !message ||
        !message.chat ||
        message.chat.type !== 'private'
    ) {
        return;
    }

    const chatId = String(message.chat.id);
    const text = String(message.text || '').trim();

    if (text.startsWith('/start')) {
        return handleStart(chatId, text, message);
    }

    if (text.startsWith('/stop')) {
        await TelegramLink.updateMany(
            { chatId },
            {
                $set: {
                    chatId: null,
                    linkedAt: null
                }
            }
        );

        return reply(
            chatId,
            'Disconnected. You will no longer get Gaze alerts here.'
        );
    }

    return reply(
        chatId,
        'I send your Gaze price alerts. To connect, open Alerts in the app and tap Connect Telegram.'
    );
}


// ------------------------------------------------------------
// POLLING LOOP
// ------------------------------------------------------------

// "Long polling": we ask Telegram for new messages, and it holds the
// request open for up to 25 seconds. Works on a laptop and on Render
// with no public URL or webhook.
async function pollLoop() {
    while (polling) {
        try {
            const updates =
                await callApi(
                    'getUpdates',
                    {
                        offset,
                        timeout: POLL_TIMEOUT_SECONDS,
                        allowed_updates: ['message']
                    },
                    (POLL_TIMEOUT_SECONDS + 10) * 1000
                );

            for (const update of updates || []) {
                offset = update.update_id + 1;

                try {
                    await handleUpdate(update);
                } catch (error) {
                    console.error(
                        '[Telegram] update failed:',
                        error.message
                    );
                }
            }

        } catch (error) {
            const status =
                error.response && error.response.status;

            if (status === 401) {
                console.error(
                    '[Telegram] bot token rejected. Polling stopped.'
                );

                polling = false;
                return;
            }

            if (status === 409) {
                // Another server is already polling this bot
                if (Date.now() - lastConflictLog > 5 * 60 * 1000) {
                    lastConflictLog = Date.now();

                    console.warn(
                        '[Telegram] another server is polling this bot. ' +
                        'Set TELEGRAM_POLLING=false on the one that should not.'
                    );
                }

                await wait(30 * 1000);
                continue;
            }

            console.error(
                '[Telegram] polling error:',
                describeError(error)
            );

            await wait(5 * 1000);
        }
    }
}


async function startTelegram() {
    if (!isConfigured()) {
        console.log(
            '⏸️ Telegram is off (TELEGRAM_BOT_TOKEN is not set)'
        );

        return;
    }

    await ensureBotUsername();

    if (!pollingEnabled()) {
        console.log(
            '✓ Telegram ready, sending only (TELEGRAM_POLLING=false)'
        );

        return;
    }

    if (polling) {
        return;
    }

    polling = true;

    console.log(
        `✓ Telegram bot ${botUsername ? '@' + botUsername : ''} started ` +
        '(listening for /start)'
    );

    // Runs in the background; not awaited
    pollLoop();
}


function stopTelegram() {
    polling = false;
}


module.exports = {
    startTelegram,
    stopTelegram,
    isConfigured,
    sendToUser,
    createLinkCode,
    getStatus,
    unlink
};
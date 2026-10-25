const mongoose = require('mongoose');

/*
 * Links one Gaze user to one Telegram chat, so alerts can be sent there.
 *
 * Put this file in:  backend/models/TelegramLink.js
 *
 * How linking works:
 *   1. The app asks for a link code  -> linkCode + linkCodeExpiresAt saved
 *   2. The user opens t.me/<bot>?start=<linkCode> and presses Start
 *   3. The bot receives "/start <linkCode>", finds this document, and
 *      saves the chatId. The code is cleared so it can't be used again.
 */

const telegramLinkSchema = new mongoose.Schema(
    {
        // Same type as Alert.userId (a string)
        userId: {
            type: String,
            required: true,
            unique: true
        },

        // Where messages are sent. null = not connected.
        chatId: {
            type: String,
            default: null
        },

        linkedAt: {
            type: Date,
            default: null
        },

        // One-time code, valid for a few minutes
        linkCode: {
            type: String,
            default: null
        },

        linkCodeExpiresAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// One Telegram chat can belong to only ONE Gaze user.
// "partial" means documents with chatId null are not compared
// (otherwise every unlinked user would clash on null).
telegramLinkSchema.index(
    { chatId: 1 },
    {
        unique: true,
        partialFilterExpression: { chatId: { $type: 'string' } }
    }
);

telegramLinkSchema.index({ linkCode: 1 });

module.exports =
    mongoose.model(
        'TelegramLink',
        telegramLinkSchema
    );
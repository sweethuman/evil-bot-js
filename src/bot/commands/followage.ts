import { addCommand, CommandCallback, ParsedCommand } from '../commandProcessor';
import { PrivateMessage } from 'twitch-chat-client';
import chalk from 'chalk';
import TwitchClient from 'twitch';
import { logger } from '../../winston';
import i18next from 'i18next';

/**
 * Shows for how long the user has been following the channel
 * @param {string} channel
 * @param {string} user
 * @param {string} message
 * @param {PrivateMessage} msg
 * @param {ParsedCommand} command
 * @param {TwitchClient} twitchClient
 * @returns {Promise<string>}
 */
const command: CommandCallback = async (
    channel: string,
    user: string,
    message: string,
    msg: PrivateMessage,
    command: ParsedCommand,
    twitchClient: TwitchClient
) => {
    if (msg.userInfo.userId === undefined || msg.channelId === null) {
        logger.error('userid is undefined');
        return 'userid is undefined or channelId is undefined';
    }
    const follow = await twitchClient.kraken.users.getFollowedChannel(msg.userInfo.userId, msg.channelId);

    if (follow) {
        const currentTimestamp = Date.now();
        const followStartTimestamp = follow.followDate.getTime();
        logger.silly('aa');
        return i18next.t('twitch:followAge_success', {
            user,
            timeStamp: (currentTimestamp - followStartTimestamp) / 1000,
        });
    } else {
        logger.silly(chalk.yellow('aa'));
        return i18next.t('twitch:followAge_fail', { user });
    }
};

addCommand('followage', command);

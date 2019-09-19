import { addCommand, CommandCallback, ParsedCommand } from '../commandProcessor';
import { PrivateMessage } from 'twitch-chat-client';
import { log } from '../loggingModule';
import chalk from 'chalk';
import TwitchClient from 'twitch';
import { logger } from '../../winston';

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
        log('aa');
        return `@${user} You have been following for ${(currentTimestamp - followStartTimestamp) / 1000}!`;
    } else {
        log(chalk.yellow('aa'));
        return `@${user} You are not following!`;
    }
};

addCommand('followage', command);

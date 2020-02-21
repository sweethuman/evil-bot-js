import { AbstractCommand, AdditionalData } from '../commandEngine';
import chalk from 'chalk';
import { logger } from '../../winston';
import i18next from 'i18next';
import { SubCommand } from '../commandEngine/decorators';

/**
 * Shows for how long the user has been following the channel
 */
export class FollowAge extends AbstractCommand {
    name = 'followage';

    @SubCommand
    async followage({ user, msg, twitchClient }: AdditionalData): Promise<string> {
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
    }
}

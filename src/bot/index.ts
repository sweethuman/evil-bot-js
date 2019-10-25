import TwitchClient from 'twitch';
import ChatClient, { PrivateMessage } from 'twitch-chat-client';
import { executeCommands } from './commandProcessor';
import './commands';
import { isUserIdPresent } from './trackers/presenceTracker';
import { addTalker } from './trackers/talkerTracker';
import * as timedMessagesModule from './modules/timedMessages';
import * as timedPoints from './modules/timedPoints';
import i18next from 'i18next';
import * as userMonitor from './modules/userMonitor';
import * as rankManager from './modules/rankManager';
import { twitchUsers } from './modules/userMonitor';
import { ranks } from './modules/rankManager';

export let isBotRunning = false;

export async function run(clientId: string, accessToken: string, twitchUsername: string): Promise<void> {
    isBotRunning = true;
    const twitchClient: TwitchClient = await TwitchClient.withCredentials(clientId, accessToken);
    //console.log(twitchClient);

    const chatClient = await ChatClient.forTwitchClient(twitchClient);
    await chatClient.connect();
    await chatClient.waitForRegistration();
    await chatClient.join(twitchUsername);
    await timedMessagesModule.start('#' + twitchUsername, chatClient);
    await timedPoints.start(twitchUsername, twitchClient);
    userMonitor.load();
    await rankManager.load();
    rankManager.updatedRank.attach(data => {
        chatClient.say(
            twitchUsername,
            i18next.t('twitch:rankUpdated', { user: data.user.lastSeenDisplayName, rank: data.rank.name })
        );
    });
    chatClient.onPrivmsg(async (channel: string, user: string, message: string, msg: PrivateMessage) => {
        const commandMessage = await executeCommands(channel, user, message, msg, twitchClient);
        if (commandMessage != null) {
            chatClient.say(channel, commandMessage);
            return;
        }
        if (!isUserIdPresent(msg.userInfo.userId!)) {
            const databaseUser = twitchUsers.get(msg.userInfo.userId!);
            if (databaseUser == null || databaseUser.rank == null) {
                chatClient.say(channel, i18next.t('twitch:welcome', { name: msg.userInfo.displayName }));
            } else {
                chatClient.say(
                    channel,
                    i18next.t('twitch:welcomeWithRank', {
                        name: msg.userInfo.displayName,
                        rank: ranks[databaseUser.rank].name,
                    })
                );
            }
        }
        addTalker({ userId: msg.userInfo.userId!, displayName: msg.userInfo.displayName });
    });
}

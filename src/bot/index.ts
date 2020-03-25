import TwitchClient from 'twitch';
import ChatClient, { PrivateMessage } from 'twitch-chat-client';
import { executeCommands } from './commandEngine';
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
import { logger } from '../winston';
import { loadCommands } from './commandEngine/engine';

/**
 * Variable Used globally to check the state of the bot
 * It Should only be set in this module, nowhere else!
 * @type {boolean}
 */
export let isBotRunning = false;
export async function run(clientId: string, accessToken: string, twitchUsername: string): Promise<void> {
    logger.debug('Starting Bot');
    isBotRunning = true;
    //TODO CODE 2
    loadCommands();
    const { twitchClient, chatClient } = await initializeClient(twitchUsername, clientId, accessToken);
    await loadModules(twitchUsername, chatClient, twitchClient);
    attachUpdatedRankNotification(twitchUsername, chatClient);
    chatClient.onPrivmsg(async (channel: string, user: string, message: string, msg: PrivateMessage) => {
        await executeAndReplyToCommand(channel, user, message, msg, twitchClient, chatClient);
        checkUserPresence(channel, chatClient, msg);
        addTalker({ userId: msg.userInfo.userId!, displayName: msg.userInfo.displayName });
    });
}

async function initializeClient(twitchUsername: string, clientId: string, accessToken: string) {
    logger.debug('Initializing client!');
    const twitchClient: TwitchClient = await TwitchClient.withCredentials(clientId, accessToken);
    const chatClient = await ChatClient.forTwitchClient(twitchClient);
    logger.debug('Connecting chat client!');
    await chatClient.connect();
    chatClient.onRegister(() => {
        chatClient.join(twitchUsername);
        logger.debug(`Joined channel ${twitchUsername}`);
    });
    logger.debug('Finishing Initialization');
    return { twitchClient, chatClient };
}

async function loadModules(twitchUsername: string, chatClient: ChatClient, twitchClient: TwitchClient) {
    logger.debug('Loding Modules');
    await timedMessagesModule.load('#' + twitchUsername, chatClient);
    await timedPoints.load(twitchUsername, twitchClient);
    userMonitor.load();
    await rankManager.load();
    logger.debug('Modules Loaded!');
}
function attachUpdatedRankNotification(twitchUsername: string, chatClient: ChatClient) {
    logger.debug('Attaching Update Rank Notification.');
    rankManager.updatedRank.attach(data => {
        chatClient.say(
            twitchUsername,
            i18next.t('twitch:rankUpdated', { user: data.user.lastSeenDisplayName, rank: data.rank.name })
        );
    });
}

async function executeAndReplyToCommand(
    channel: string,
    user: string,
    message: string,
    msg: PrivateMessage,
    twitchClient: TwitchClient,
    chatClient: ChatClient
) {
    const commandMessage = await executeCommands(channel, user, message, msg, twitchClient);
    if (commandMessage != null) {
        chatClient.say(channel, commandMessage);
        return;
    }
}
function checkUserPresence(channel: string, chatClient: ChatClient, msg: PrivateMessage) {
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
}

import TwitchClient from 'twitch';
import ChatClient, { PrivateMessage } from 'twitch-chat-client';
import { executeCommands } from './commandProcessor';
import './commands';
import { isUserIdPresent } from './trackers/presenceTracker';

export async function run(clientId: string, accessToken: string, twitchUsername: string): Promise<void> {
    const twitchClient: TwitchClient = await TwitchClient.withCredentials(clientId, accessToken);
    console.log(twitchClient);

    const chatClient = await ChatClient.forTwitchClient(twitchClient);
    await chatClient.connect();
    await chatClient.waitForRegistration();
    await chatClient.join(twitchUsername);
    chatClient.onPrivmsg(async (channel: string, user: string, message: string, msg: PrivateMessage) => {
        const commandMessage = await executeCommands(channel, user, message, msg, twitchClient);
        if (commandMessage != null) {
            chatClient.say(channel, commandMessage);
            return;
        }
        if (!isUserIdPresent(msg.userInfo.userId!)) {
            chatClient.say(channel, `${msg.userInfo.displayName} bine ai venit!`);
        }
    });
}

import TwitchClient from 'twitch';
import ChatClient, { PrivateMessage } from 'twitch-chat-client';
import chalk from 'chalk';
import { log } from './loggingModule';

export async function run(clientId: string, accessToken: string, twitchUsername: string): Promise<void> {
  const twitchClient: TwitchClient = await TwitchClient.withCredentials(clientId, accessToken);
  console.log(twitchClient);

  const chatClient = await ChatClient.forTwitchClient(twitchClient);
  await chatClient.connect();
  await chatClient.waitForRegistration();
  await chatClient.join(twitchUsername);
  chatClient.onPrivmsg(async (channel: string, user: string, message: string, msg: PrivateMessage) => {
    if (message === '!followage') {
      if (msg.userInfo.userId === undefined || msg.channelId === null) {
        console.log('userid is undefined');
        return;
      }
      const follow = await twitchClient.kraken.users.getFollowedChannel(msg.userInfo.userId, msg.channelId);

      if (follow) {
        const currentTimestamp = Date.now();
        const followStartTimestamp = follow.followDate.getTime();
        chatClient.say(
          channel,
          `@${user} You have been following for ${(currentTimestamp - followStartTimestamp) / 1000}!`
        );
        log('aa');
      } else {
        chatClient.say(channel, `@${user} You are not following!`);
        log(chalk.yellow('aa'));
      }
    }
  });
}

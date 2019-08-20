import TwitchClient from 'twitch';
import ChatClient, { PrivateMessage } from 'twitch-chat-client';

async function run(): Promise<void> {
  const clientId = 'c96zyldxwq27mbuvp2s6kwcgkq5l5k';
  const accessToken = 'pj9t8vnwk1bio5i5wpqjmu8cky1osu';
  const twitchClient: TwitchClient = await TwitchClient.withCredentials(clientId, accessToken);
  console.log(twitchClient);

  const chatClient = await ChatClient.forTwitchClient(twitchClient);
  await chatClient.connect();
  await chatClient.waitForRegistration();
  const userName = 'm0rtuary';
  await chatClient.join(userName);
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
      } else {
        chatClient.say(channel, `@${user} You are not following!`);
      }
    }
  });
}

run().then(() => console.log('-- Startup Finished'));

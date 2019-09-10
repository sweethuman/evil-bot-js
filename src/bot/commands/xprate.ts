import { addCommand, CommandCallback } from '../commandProcessor';

const command: CommandCallback = () => {
    return 'Lurker: 1 XP + 1 Coin per 10 Minute; Talker: 1 XP + 1 Coin per 1 Minut; Dublu Coins pentru Subscriber';
};

addCommand('xprate', command);

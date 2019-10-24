import { addCommand, CommandCallback } from '../commandProcessor';
import i18next from 'i18next';

const command: CommandCallback = () => {
    return i18next.t('twitch:xprateCommand');
};

addCommand('xprate', command);

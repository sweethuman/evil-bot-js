import { addCommand, CommandCallback } from '../commandEngine';
import i18next from 'i18next';

/**
 * Shows the xp rate of current config
 * Which means how much xp is given per how much time and for what actions such as lurking or talking
 * @returns {string}
 */
const command: CommandCallback = () => {
    return i18next.t('twitch:xprateCommand');
};

addCommand('xprate', command);

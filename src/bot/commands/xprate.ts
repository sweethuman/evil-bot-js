import { AbstractCommand } from '../commandEngine';
import i18next from 'i18next';
import { SubCommand } from '../commandEngine/decorators';

/**
 * Shows the xp rate of current config
 * Which means how much xp is given per how much time and for what actions such as lurking or talking
 * @returns {string}
 */
export class XpRateCommand extends AbstractCommand {
    name = 'xprate';

    @SubCommand
    xprate(): string {
        return i18next.t('twitch:xprateCommand');
    }
}

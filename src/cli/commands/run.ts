import { auth, firestore } from '../../firebase';
import * as bot from '../../bot';
import { vorpal } from '../vorpal';
import i18next from 'i18next';
import { botIsNotRunning, combineLimiters, userIsLoggedIn } from '../accessLimiters';

/**
 * Actually starts the bot
 */
vorpal
    .command('run', 'Runs the bot')
    .validate(() => {
        return combineLimiters(userIsLoggedIn, botIsNotRunning);
    })
    .action(async () => {
        //TODO remove duplicate code
        const userDoc = await firestore
            .collection('users')
            .doc(auth.currentUser!.uid)
            .get();
        const clientId = userDoc.data() != null ? userDoc.data()!.clientId : '';
        const accessToken = userDoc.data() != null ? userDoc.data()!.accessToken : '';
        const twitchUsername = userDoc.data() != null ? userDoc.data()!.twitchUsername : '';
        if (userDoc.data() && userDoc.data()!.language) await i18next.changeLanguage(userDoc.data()!.language);
        await bot.run(clientId, accessToken, twitchUsername);
        vorpal.log('Startup Has Finished');
    });

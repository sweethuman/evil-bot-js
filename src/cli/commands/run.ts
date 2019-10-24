import { auth, firestore } from '../../firebase';
import chalk from 'chalk';
import * as bot from '../../bot';
import { vorpal } from '../vorpal';
import i18next from 'i18next';

vorpal
    .command('run', 'Runs the bot')
    .validate(() => {
        if (auth.currentUser != null) {
            return true;
        }
        return chalk.red('User is not logged in');
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

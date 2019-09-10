import { auth, firestore } from '../../firebase';
import chalk from 'chalk';
import * as loggingModule from '../../bot/loggingModule';
import * as bot from '../../bot';
import { vorpal } from '../vorpal';

vorpal
    .command('run', 'Runs the bot')
    .validate(() => {
        if (auth.currentUser != null) {
            return true;
        }
        return chalk.red('User is not logged in');
    })
    .action(async () => {
        function log(value: string) {
            vorpal.log(value);
        }

        loggingModule.setupLogging(log);
        //TODO remove duplicate code
        const userDoc = await firestore
            .collection('users')
            .doc(auth.currentUser!.uid)
            .get();
        const clientId = userDoc.data() != null ? userDoc.data()!.clientId : '';
        const accessToken = userDoc.data() != null ? userDoc.data()!.accessToken : '';
        const twitchUsername = userDoc.data() != null ? userDoc.data()!.twitchUsername : '';
        await bot.run(clientId, accessToken, twitchUsername);
        vorpal.log('Startup Has Finished');
    });

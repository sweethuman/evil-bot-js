import { vorpal } from '../vorpal';
import i18next from 'i18next';
import { auth, firestore } from '../../firebase';
import chalk from 'chalk';

vorpal
    .command('changeLanguage <language>', 'Changes program language')
    .validate(() => {
        if (auth.currentUser != null) {
            return true;
        }
        return chalk.red('User is not logged in');
    })
    .action(async args => {
        await firestore
            .collection('users')
            .doc(auth.currentUser!.uid)
            .set(
                {
                    language: args.language,
                },
                { merge: true }
            );
        await i18next.changeLanguage(args.language);
    });

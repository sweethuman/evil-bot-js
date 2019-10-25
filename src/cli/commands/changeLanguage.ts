import { vorpal } from '../vorpal';
import i18next from 'i18next';
import { auth, firestore } from '../../firebase';
import { userIsLoggedIn } from '../accessLimiters';

vorpal
    .command('changeLanguage <language>', 'Changes program language')
    .validate(() => {
        return userIsLoggedIn();
    })
    .action(async args => {
        await firestore
            .collection('users')
            .doc(auth.currentUser!.uid)
            .update({
                language: args.language,
            });
        await i18next.changeLanguage(args.language);
    });

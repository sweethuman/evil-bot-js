/**
 * Adds command that let's you add or edit your Twitch Credentials
 */

import { auth, firestore } from '../../firebase';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { vorpal } from '../vorpal';
import { botIsNotRunning, combineLimiters, userIsLoggedIn } from '../accessLimiters';

vorpal
    .command('credentials', 'Add or Edit your Twitch Credentials')
    .validate(() => {
        return combineLimiters(userIsLoggedIn, botIsNotRunning);
    })
    .action(async () => {
        const userDoc = await firestore
            .collection('users')
            .doc(auth.currentUser!.uid)
            .get();
        const clientId = userDoc.data() != null ? userDoc.data()!.clientId : '';
        const accessToken = userDoc.data() != null ? userDoc.data()!.accessToken : '';
        const twitchUsername = userDoc.data() != null ? userDoc.data()!.twitchUsername : '';
        let promptResults: {
            clientId: string;
            accessToken: string;
            twitchUsername: string;
        };
        promptResults = await inquirer.prompt([
            {
                type: 'input',
                name: 'clientId',
                message: 'Please Enter your Twitch Client ID:',
                default: clientId,
            },
            {
                type: 'input',
                name: 'accessToken',
                message: 'Please Enter your Twitch Access Token:',
                default: accessToken,
            },
            {
                type: 'input',
                name: 'twitchUsername',
                message: 'Please Enter your Twitch Username:',
                default: twitchUsername,
            },
        ]);
        await firestore
            .collection('users')
            .doc(auth.currentUser!.uid)
            .set(
                {
                    clientId: promptResults.clientId,
                    accessToken: promptResults.accessToken,
                    twitchUsername: promptResults.twitchUsername,
                },
                { merge: true }
            );
        vorpal.log(chalk.green('User Credentials Changed!'));
    });

import { validateEmail } from '../../utilities/validators';
import inquirer from 'inquirer';
import { auth, firestore } from '../../firebase';
import chalk from 'chalk';
import { vorpal } from '../vorpal';

vorpal.command('register <email>', 'Registers a new user').action(async args => {
    if (!validateEmail(args.email)) {
        console.log('Email is not valid!');
        return;
    }
    const promptResult = await inquirer.prompt([
        {
            type: 'password',
            name: 'registerPassword',
            message: 'Please enter your register password',
            mask: '*',
        },
        {
            type: 'password',
            name: 'repeatPassword',
            message: 'Repeat your password',
            mask: '*',
        },
    ]);
    const password: string = promptResult.registerPassword;
    const password2: string = promptResult.repeatPassword;
    if (password !== password2) {
        console.log(`Password "${password}" doesn't match with "${password2}"`);
        return;
    }

    try {
        await auth.createUserWithEmailAndPassword(args.email, password);
        console.log(`Register User with email "${args.email}" and password "${password}"`);
    } catch (e) {
        console.log(chalk.bgRed(e.code));
    }
    if (auth.currentUser == null) {
        console.error('Error: after register currentUser is not set');
        return;
    }
    let promptResults: {
        addCredentials: boolean;
        addClientId?: string;
        addAccessToken?: string;
        addUsername?: string;
    };
    promptResults = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'addCredentials',
            message: 'Do you want to add Bot Credentials now?',
            default: true,
        },
        {
            type: 'input',
            name: 'addClientId',
            message: 'Please Enter your Twitch Client ID:',
            when: (response: { addCredentials: boolean }) => response.addCredentials,
        },
        {
            type: 'input',
            name: 'addAccessToken',
            message: 'Please Enter your Twitch Access Token:',
            when: (response: { addCredentials: boolean }) => response.addCredentials,
        },
        {
            type: 'input',
            name: 'addUsername',
            message: 'Please Enter your Twitch Username:',
            when: (response: { addCredentials: boolean }) => response.addCredentials,
        },
    ]);
    if (!promptResults.addCredentials) return;
    await firestore
        .collection('users')
        .doc(auth.currentUser.uid)
        .set({
            clientId: promptResults.addClientId,
            accessToken: promptResults.addAccessToken,
            twitchUsername: promptResults.addUsername,
        });
});

import { validateEmail } from '../../utilities/validators';
import inquirer from 'inquirer';
import { auth } from '../../firebase';
import chalk from 'chalk';
import { vorpal } from '../vorpal';

vorpal.command('login <email>', 'Logs in the user').action(async args => {
    if (!validateEmail(args.email)) {
        console.log('Email is not valid!');
        return;
    }
    const promptResult = await inquirer.prompt([
        {
            type: 'password',
            name: 'loginPassword',
            message: 'Please enter your login password',
            mask: '*',
        },
    ]);
    try {
        await auth.signInWithEmailAndPassword(args.email, promptResult.loginPassword);
        console.log(`Logged In User with email "${args.email}" and password "${promptResult.loginPassword}"`);
    } catch (e) {
        console.log(chalk.bgRed(e.code));
    }
});

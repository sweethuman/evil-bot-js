import Vorpal from 'vorpal';
import passwordPrompt from 'password-prompt';
import { auth } from './firebase';
import chalk from 'chalk';
import { validateEmail } from './utilities/validators';

const vorpal = new Vorpal();

vorpal.delimiter('eviljs$').show();
vorpal.command('login <email>', 'Logs in the user').action(async args => {
  if (!validateEmail(args.email)) {
    console.log('Email is not valid!');
    return;
  }
  const password: string = await passwordPrompt('Enter your password: ', { method: 'hide' });
  try {
    await auth.signInWithEmailAndPassword(args.email, password);
    console.log(`Logged In User with email "${args.email}" and password "${password}"`);
  } catch (e) {
    console.log(chalk.bgRed(e.code));
  }
});
vorpal.command('register <email>', 'Registers a new user').action(async args => {
  if (!validateEmail(args.email)) {
    console.log('Email is not valid!');
    return;
  }
  const password: string = await passwordPrompt('Enter your password: ', { method: 'hide' });
  const password2: string = await passwordPrompt('Repeat your password: ', { method: 'hide' });
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
});
vorpal.command('loggedIn', 'Checks if user is logged in').action(async () => console.log(auth.currentUser != null));

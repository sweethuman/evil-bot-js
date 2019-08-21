import Vorpal from 'vorpal';
import { auth } from './firebase';
import chalk from 'chalk';
import { validateEmail } from './utilities/validators';
import inquirer from 'inquirer';
const vorpal = new Vorpal();

vorpal.delimiter('eviljs$').show();
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
});
vorpal.command('loggedIn', 'Checks if user is logged in').action(async () => console.log(auth.currentUser != null));

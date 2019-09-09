import Vorpal from 'vorpal';
import { auth, firestore } from './firebase';
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
  if (auth.currentUser == null) {
    console.error('Error: after register currentUser is not set');
    return;
  }
  let promptResults: {
    addCredentials: boolean;
    addClientId?: string;
    addAccessToken?: string;
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
  ]);
  if (!promptResults.addCredentials) return;
  await firestore
    .collection('users')
    .doc(auth.currentUser.uid)
    .set({
      clientId: promptResults.addClientId,
      accessToken: promptResults.addAccessToken,
    });
});
vorpal
  .command('credentials', 'Add or Edit your Twitch Credentials')
  .validate(() => {
    if (auth.currentUser != null) {
      return true;
    }
    return chalk.red('User is not logged in');
  })
  .action(async () => {
    const userDoc = await firestore
      .collection('users')
      .doc(auth.currentUser!.uid)
      .get();
    const clientId = userDoc.data() != null ? userDoc.data()!.clientId : '';
    const accessToken = userDoc.data() != null ? userDoc.data()!.accessToken : '';
    let promptResults: {
      clientId: string;
      accessToken: string;
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
    ]);
    await firestore
      .collection('users')
      .doc(auth.currentUser!.uid)
      .set(
        {
          clientId: promptResults.clientId,
          accessToken: promptResults.accessToken,
        },
        { merge: true }
      );
    vorpal.log(chalk.green('User Credentials Changed!'));
  });
vorpal.command('loggedin', 'Checks if user is logged in').action(async () => console.log(auth.currentUser != null));

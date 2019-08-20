import Vorpal from 'vorpal';
import passwordPrompt from 'password-prompt';

const vorpal = new Vorpal();

vorpal.delimiter('eviljs$').show();
vorpal.command('login <email>', 'Logs in the user').action(async args => {
  const password: string = await passwordPrompt('Enter your password: ', { method: 'hide' });
  console.log(`Logged In User with email "${args.email}" and password "${password}"`);
});
vorpal.command('register <email>', 'Logs in the user').action(async args => {
  const password: string = await passwordPrompt('Enter your password: ', { method: 'hide' });
  const password2: string = await passwordPrompt('Repeat your password: ', { method: 'hide' });

  if (password !== password2) console.log(`Password "${password}" doesn't match with "${password2}"`);
  else console.log(`Register User with email "${args.email}" and password "${password}"`);
});

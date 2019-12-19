import { auth } from '../../firebase';
import { vorpal } from '../vorpal';
//Checks if the User is Logged in
vorpal.command('loggedin', 'Checks if user is logged in').action(async () => {
    vorpal.log(`${auth.currentUser != null}`);
});

import { auth } from '../../firebase';
import { vorpal } from '../vorpal';

vorpal.command('loggedin', 'Checks if user is logged in').action(async () => console.log(auth.currentUser != null));

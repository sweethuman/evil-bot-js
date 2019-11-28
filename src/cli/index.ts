/**
 * Starts the Vorpal CLI and imports all commands
 * in .validate function
 */

import { vorpal } from './vorpal';
import './commands';

vorpal.delimiter('eviljs$').show();

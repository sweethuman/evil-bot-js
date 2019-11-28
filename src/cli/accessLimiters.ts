/**
 * Defines access limiters to be used with vorpal.js
 */

import { auth } from '../firebase';
import chalk from 'chalk';
import { isBotRunning } from '../bot';

export function userIsLoggedIn() {
    if (auth.currentUser != null) {
        return true;
    }
    return chalk.red('User is not logged in');
}

export function botIsNotRunning() {
    if (isBotRunning) return chalk.red('Bot is already running');
    return true;
}

/**
 * Combines Limiters defined in this file, and can be used with vorpal validate
 * @param limiters
 */
export function combineLimiters(...limiters: Array<() => string | true>) {
    for (const limiter of limiters) {
        if (limiter() !== true) return limiter();
    }
    return true;
}

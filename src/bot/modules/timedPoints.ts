import { logger } from '../../winston';
import chalk from 'chalk';
import { clearTalkers } from '../trackers/talkerTracker';
import { auth, firestore } from '../../firebase';
import firebase from 'firebase';
import TwitchClient from 'twitch';
import { isUserIdFiltered } from './filterManager';
import _ from 'lodash';

let talkerTimeout: NodeJS.Timeout | null = null;
let lurkerTimeout: NodeJS.Timeout | null = null;

//started when 'run' command is run, which means user is already logged in
export async function load(username: string, twitchClient: TwitchClient) {
    talkerTimeout = setInterval(updateTalkers, 60000 * 0.25);
    lurkerTimeout = global.setInterval(updateLurkers, 60000 * 0.3, username, twitchClient);
}

/**
 * Gets Talkers from Talker Tracker
 * Usually run once per minute
 * @returns {Promise<void>}
 */
async function updateTalkers(): Promise<void> {
    logger.debug('Updating Talkers');
    const talkers = clearTalkers();
    const batch = firestore.batch();
    for (const talker of talkers) {
        batch.set(
            firestore
                .collection('users')
                .doc(auth.currentUser!.uid)
                .collection('twitchUsers')
                .doc(talker.userId),
            {
                xp: firebase.firestore.FieldValue.increment(1),
                coins: firebase.firestore.FieldValue.increment(1),
                lastSeenDisplayName: talker.displayName,
            },
            {
                merge: true,
            }
        );
    }
    await batch.commit();
    logger.debug('Updated Talkers');
}

/**
 * Will get lurkers from chatters api and update their points
 * Usually run every 10 minutes
 * @param {string} username
 * @param {TwitchClient} twitchClient
 * @returns {Promise<void>}
 */
async function updateLurkers(username: string, twitchClient: TwitchClient): Promise<void> {
    logger.debug('Updating Lurkers');
    const chatters = await twitchClient.unsupported.getChatters(username);
    let users = await twitchClient.helix.users.getUsersByNames(chatters.allChatters);
    users = _.filter(users, user => {
        return !isUserIdFiltered(user.id);
    });
    const batch = firestore.batch();
    for (const user of users) {
        batch.set(
            firestore
                .collection('users')
                .doc(auth.currentUser!.uid)
                .collection('twitchUsers')
                .doc(user.id),
            {
                xp: firebase.firestore.FieldValue.increment(1),
                coins: firebase.firestore.FieldValue.increment(1),
                lastSeenDisplayName: user.displayName,
            },
            {
                merge: true,
            }
        );
    }
    await batch.commit();
    logger.debug('Updated Lurkers');
}

export function unload(): void {
    if (talkerTimeout == null || lurkerTimeout == null) {
        logger.error(chalk.red("Timed Points Module hasn't been started"));
        return;
    }
    clearInterval(talkerTimeout);
    clearInterval(lurkerTimeout);
    talkerTimeout = null;
    lurkerTimeout = null;
}

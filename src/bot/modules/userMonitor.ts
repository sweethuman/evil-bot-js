import { auth, firestore } from '../../firebase';
import { logger } from '../../winston';
import QuerySnapshot = firebase.firestore.QuerySnapshot;
import firebase from 'firebase';
import { SyncEvent } from 'ts-events';

/**
 * Module monitors users and database and triggers an event if any of them is changed
 * Usually used to send chat notifications
 */

/**
 * Data Type with all the users in the database
 * @type {Map<string, TwitchDatabaseUser>}
 */
export const twitchUsers: Map<string, TwitchDatabaseUser> = new Map<string, TwitchDatabaseUser>();
/**
 * Event that is triggered if any of the users is updated or a user is added
 * @type {SyncEvent<TwitchDatabaseUser[]>}
 */
export const usersUpdated = new SyncEvent<TwitchDatabaseUser[]>();

export interface TwitchDatabaseUser {
    id: string;
    xp: number;
    coins: number;
    rank?: number;
    lastSeenDisplayName: string;
}

/**
 * Loads the user Monitor and subscribes to the database event of onSnapshot
 * @returns {() => void}
 */
export function load() {
    logger.debug('User Monitor Loaded');
    return firestore
        .collection('users')
        .doc(auth.currentUser!.uid)
        .collection('twitchUsers')
        .onSnapshot(
            (ref: QuerySnapshot) => {
                logger.debug('User Update Received');
                const updates: TwitchDatabaseUser[] = [];
                ref.docChanges().forEach(change => {
                    const { doc, type } = change;
                    const dataBaseUser: TwitchDatabaseUser = {
                        id: doc.id,
                        xp: doc.data().xp,
                        coins: doc.data().coins,
                        rank: doc.data().rank,
                        lastSeenDisplayName: doc.data().lastSeenDisplayName,
                    };
                    if (type === 'added') {
                        twitchUsers.set(doc.id, dataBaseUser);
                        updates.push(dataBaseUser);
                    } else if (type === 'modified') {
                        twitchUsers.set(doc.id, dataBaseUser);
                        updates.push(dataBaseUser);
                    } else if (type === 'removed') {
                        twitchUsers.delete(doc.id);
                    }
                });
                usersUpdated.post(updates);
            },
            error => logger.error(error.message)
        );
}

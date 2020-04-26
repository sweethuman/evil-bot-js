import { auth, firestore } from '../../firebase';
import { logger } from '../../winston';
import firebase from 'firebase';
import { SyncEvent } from 'ts-events';
import { IUserMonitor, Module, TwitchDatabaseUser } from './interfaces';
import chalk from 'chalk';
import QuerySnapshot = firebase.firestore.QuerySnapshot;

/**
 * Module monitors users and database and triggers an event if any of them is changed
 * Usually used to send chat notifications
 */
export class UserMonitor implements Module, IUserMonitor {
    name = 'userMonitor';
    /**
     * Event that is triggered if any of the users is updated or a user is added
     * @type {SyncEvent<TwitchDatabaseUser[]>}
     */
    usersUpdated = new SyncEvent<TwitchDatabaseUser[]>();
    /**
     * Data Type with all the users in the database
     * @type {Map<string, TwitchDatabaseUser>}
     */
    twitchUsers: Map<string, TwitchDatabaseUser> = new Map<string, TwitchDatabaseUser>();

    /**
     * Loads the user Monitor and subscribes to the database event of onSnapshot
     * @returns {() => void}
     */
    async load(): Promise<void> {
        logger.info(`${chalk.blue('Timed Points')}: Loading User Monitor`);
        const that = this;
        firestore
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
                            that.twitchUsers.set(doc.id, dataBaseUser);
                            updates.push(dataBaseUser);
                        } else if (type === 'modified') {
                            that.twitchUsers.set(doc.id, dataBaseUser);
                            updates.push(dataBaseUser);
                        } else if (type === 'removed') {
                            that.twitchUsers.delete(doc.id);
                        }
                    });
                    that.usersUpdated.post(updates);
                },
                error => logger.error(error.message)
            );
    }
}

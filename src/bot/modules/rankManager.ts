import { TwitchDatabaseUser, usersUpdated } from './userMonitor';
import { logger } from '../../winston';
import { AsyncEvent } from 'ts-events';
import { auth, firestore } from '../../firebase';
import chalk from 'chalk';

/**
 * Event Triggered in case any of the users acquires a new rank
 * @type {AsyncEvent<UpdatedUserRank>}
 */
export const updatedRank = new AsyncEvent<UpdatedUserRank>();
// updates rank
// stores new rank
// checks if rank exists
// emits rank event is user rank is updated

export interface UpdatedUserRank {
    rank: Rank;
    user: TwitchDatabaseUser;
}

export interface Rank {
    requiredXp: number;
    name: string;
}

export let ranks: Rank[] = [];

/**
 * Loads the Rank Manager
 * @returns {Promise<void>}
 */

// TODO does too many things in one function, better split it into multiple small functions
export async function load() {
    const ranksData = (
        await firestore
            .collection(`users/${auth.currentUser!.uid}/config`)
            .doc('ranks')
            .get()
    ).data();
    if (
        ranksData == null ||
        ranksData.ranks == null ||
        !(ranksData.ranks instanceof Array) ||
        ranksData.ranks.length === 0
    ) {
        logger.debug(chalk.red("Ranks doesn't exist"));
        return;
    }
    ranks = ranksData.ranks;
    usersUpdated.attach(async data => {
        logger.silly(data.length.toString());
        for (const user of data) {
            let foundRank = false;
            for (let index = 0; index < ranks.length; index++) {
                if (user.xp < ranks[index].requiredXp && index > 0) {
                    if (user.rank == null || user.rank !== index - 1) {
                        await firestore
                            .collection('users')
                            .doc(auth.currentUser!.uid)
                            .collection('twitchUsers')
                            .doc(user.id)
                            .update({
                                rank: index - 1,
                            });
                        foundRank = true;
                        updatedRank.post({ rank: ranks[index - 1], user });
                    }
                    break;
                }
            }
            if (!foundRank && user.xp >= ranks[ranks.length - 1].requiredXp) {
                if (user.rank == null || user.rank !== ranks.length - 1) {
                    await firestore
                        .collection('users')
                        .doc(auth.currentUser!.uid)
                        .collection('twitchUsers')
                        .doc(user.id)
                        .update({
                            rank: ranks.length - 1,
                        });
                    foundRank = true;
                    updatedRank.post({ rank: ranks[ranks.length - 1], user });
                    break;
                }
            }
        }
    });
}

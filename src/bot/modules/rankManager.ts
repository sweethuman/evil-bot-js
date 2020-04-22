import { usersUpdated } from './userMonitor';
import { logger } from '../../winston';
import { AsyncEvent } from 'ts-events';
import { auth, firestore } from '../../firebase';
import chalk from 'chalk';
import { Rank, TwitchDatabaseUser, UpdatedUserRank } from './interfaces';

/**
 * Event Triggered in case any of the users acquires a new rank
 * @type {AsyncEvent<UpdatedUserRank>}
 */
export const updatedRank = new AsyncEvent<UpdatedUserRank>();
// updates rank
// stores new rank
// checks if rank exists
// emits rank event is user rank is updated

export let ranks: Rank[] = [];

/**
 * Loads the Rank Manager
 * @returns {Promise<void>}
 */

export async function load() {
    //Load Rank Config
    logger.info(`${chalk.blue('Rank Manager')}: Loading Rank Manager`);
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
        logger.warn(`${chalk.blue('Rank Manager')}: ${chalk.red("Ranks doesn't exist \n MODULE DISABLED")}`);
        return;
    }
    ranks = ranksData.ranks;

    usersUpdated.attach(announceUpdatedRankUsers);
    logger.info(`${chalk.blue('Rank Manager')}: Rank Manager loaded`);
}

async function announceUpdatedRankUsers(data: TwitchDatabaseUser[]) {
    logger.debug(`${chalk.blue('Rank Manager')}: Received update for ${chalk.yellow(data.length.toString())} users`);
    // Check for Updated user/users if rank changed
    for (const user of data) {
        let foundRank = false;
        for (let index = 0; index < ranks.length; index++) {
            if (user.xp < ranks[index].requiredXp && index > 0) {
                if (user.rank == null || user.rank !== index - 1) {
                    // TODO instead of update make a batched write
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
}

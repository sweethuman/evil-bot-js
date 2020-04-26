import { logger } from '../../winston';
import { AsyncEvent } from 'ts-events';
import { auth, firestore } from '../../firebase';
import chalk from 'chalk';
import { IRankManager, IUserMonitor, Module, Rank, TwitchDatabaseUser, UpdatedUserRank } from './interfaces';
import { boundMethod } from 'autobind-decorator';

export class RankManager implements Module, IRankManager {
    name = 'rankManager';

    /**
     * Event Triggered in case any of the users acquires a new rank
     * @type {AsyncEvent<UpdatedUserRank>}
     */
    updatedRank = new AsyncEvent<UpdatedUserRank>();
    private ranks: Rank[] = [];
    private userMonitor: IUserMonitor;

    constructor(userMonitor: IUserMonitor) {
        this.userMonitor = userMonitor;
    }

    @boundMethod
    async load(): Promise<void> {
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
        this.ranks = ranksData.ranks;

        this.userMonitor.usersUpdated.attach(this.announceUpdatedRankUsers);
        logger.info(`${chalk.blue('Rank Manager')}: Rank Manager loaded`);
    }

    @boundMethod
    private async announceUpdatedRankUsers(data: TwitchDatabaseUser[]): Promise<void> {
        logger.debug(
            `${chalk.blue('Rank Manager')}: Received update for ${chalk.yellow(data.length.toString())} users`
        );
        // Check for Updated user/users if rank changed
        for (const user of data) {
            let foundRank = false;
            for (let index = 0; index < this.ranks.length; index++) {
                if (user.xp < this.ranks[index].requiredXp && index > 0) {
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
                        this.updatedRank.post({ rank: this.ranks[index - 1], user });
                    }
                    break;
                }
            }
            if (!foundRank && user.xp >= this.ranks[this.ranks.length - 1].requiredXp) {
                if (user.rank == null || user.rank !== this.ranks.length - 1) {
                    await firestore
                        .collection('users')
                        .doc(auth.currentUser!.uid)
                        .collection('twitchUsers')
                        .doc(user.id)
                        .update({
                            rank: this.ranks.length - 1,
                        });
                    foundRank = true;
                    this.updatedRank.post({ rank: this.ranks[this.ranks.length - 1], user });
                    break;
                }
            }
        }
    }
}

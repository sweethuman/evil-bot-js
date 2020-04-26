import { logger } from '../../winston';
import chalk from 'chalk';
import { clearTalkers } from './talkerTracker';
import { auth, firestore } from '../../firebase';
import firebase from 'firebase';
import TwitchClient from 'twitch';
import _ from 'lodash';
import { IFilterManager, ITimedPoints, Module } from './interfaces';
import { boundMethod } from 'autobind-decorator';

export class TimedPoints implements Module, ITimedPoints {
    name = 'timedPoints';
    private talkerTimeout: NodeJS.Timeout | null = null;
    private lurkerTimeout: NodeJS.Timeout | null = null;
    private readonly username: string;
    private twitchClient: TwitchClient;
    private filterManager: IFilterManager;

    constructor(filterManager: IFilterManager, username: string, twitchClient: TwitchClient) {
        this.username = username;
        this.twitchClient = twitchClient;
        this.filterManager = filterManager;
    }

    async load() {
        logger.info(`${chalk.blue('Timed Points')}: Loading Timed Points Module`);
        logger.info('Update rate is set to 1 minute.');
        this.talkerTimeout = setInterval(this.updateTalkers, 60000);
        this.lurkerTimeout = global.setInterval(this.updateLurkers, 60000, this.username, this.twitchClient);
        logger.info(`${chalk.blue('Timed Points')}: Loaded Timed Points Module`);
    }

    unload(): void {
        if (this.talkerTimeout == null || this.lurkerTimeout == null) {
            logger.error(`${chalk.blue('Timed Points')}: ${chalk.red("Timed Points Module hasn't been started")}`);
            return;
        }
        clearInterval(this.talkerTimeout);
        clearInterval(this.lurkerTimeout);
        this.talkerTimeout = null;
        this.lurkerTimeout = null;
    }

    /**
     * Gets Talkers from Talker Tracker
     * Usually run once per minute
     * @returns {Promise<void>}
     */
    @boundMethod
    private async updateTalkers(): Promise<void> {
        logger.debug(`${chalk.blue('Timed Points')}: Updating Talkers`);
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
        logger.debug(`${chalk.blue('Timed Points')}: Updated Talkers`);
    }

    /**
     * Will get lurkers from chatters api and update their points
     * Usually run every 10 minutes
     * @param {string} username
     * @param {TwitchClient} twitchClient
     * @returns {Promise<void>}
     */
    @boundMethod
    private async updateLurkers(username: string, twitchClient: TwitchClient): Promise<void> {
        logger.debug(`${chalk.blue('Timed Points')}: Updating Lurkers`);
        const chatters = await twitchClient.unsupported.getChatters(username);
        let users = await twitchClient.helix.users.getUsersByNames(chatters.allChatters);
        const that = this;
        users = _.filter(users, user => {
            return !that.filterManager.isUserIdFiltered(user.id);
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
        logger.debug(`${chalk.blue('Timed Points')}: Updated Lurkers`);
    }
}

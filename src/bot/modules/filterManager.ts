import { auth, firestore } from '../../firebase';
import firebase from 'firebase';
import { logger } from '../../winston';
import chalk from 'chalk';
import { IFilterManager, Module } from './interfaces';
import { boundMethod } from 'autobind-decorator';

export class FilterManager implements Module, IFilterManager {
    name = 'filterManager';
    private userIds: Set<string>; //automatically updated by onSnapshot function in load

    constructor() {
        this.userIds = new Set<string>();
    }

    async load(): Promise<void> {
        logger.info('Loading Filter Manager');
        const that = this;
        firestore
            .collection('users')
            .doc(auth.currentUser!.uid)
            .collection('modules')
            .doc('filter')
            .onSnapshot(docSnapshot => {
                logger.debug('Filter Update Received');
                that.userIds = new Set(docSnapshot.data()?.userIds);
            });
    }

    @boundMethod
    async addUserIdToFilter(userId: string): Promise<boolean> {
        logger.debug(`${chalk.blue('Filter')}: ${chalk.yellow(userId)} adding to filter`);
        if (this.userIds.has(userId)) {
            return false;
        }
        await firestore
            .collection('users')
            .doc(auth.currentUser!.uid)
            .collection('modules')
            .doc('filter')
            .update({
                userIds: firebase.firestore.FieldValue.arrayUnion(userId),
            });
        return true;
    }

    @boundMethod
    async removeUserIdFromFilter(userId: string): Promise<boolean> {
        logger.debug(`${chalk.blue('Filter')}: ${chalk.yellow(userId)} removing from filter`);
        if (!this.userIds.has(userId)) {
            return false;
        }
        await firestore
            .collection('users')
            .doc(auth.currentUser!.uid)
            .collection('modules')
            .doc('filter')
            .update({
                userIds: firebase.firestore.FieldValue.arrayRemove(userId),
            });
        return true;
    }

    @boundMethod
    isUserIdFiltered(userId: string): boolean {
        logger.debug(`${chalk.blue('Filter')}: ${chalk.yellow(userId)} checking in filter`);
        return this.userIds.has(userId);
    }

    @boundMethod
    getAllFilteredUserIds(): string[] {
        logger.debug(`${chalk.blue('Filter')}: Getting all user ids`);
        return Array.from(this.userIds);
    }
}

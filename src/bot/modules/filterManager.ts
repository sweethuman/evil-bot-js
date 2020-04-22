import { auth, firestore } from '../../firebase';
import firebase from 'firebase';
import { logger } from '../../winston';
import chalk from 'chalk';

let userIds: Set<string>; //automatically updated by onSnapshot function in load
export async function load() {
    logger.info('Loading Filter Manager');
    return firestore
        .collection('users')
        .doc(auth.currentUser!.uid)
        .collection('modules')
        .doc('filter')
        .onSnapshot(docSnapshot => {
            logger.debug('Filter Update Received');
            userIds = new Set(docSnapshot.data()?.userIds);
        });
}

export async function addUserIdToFilter(userId: string): Promise<boolean> {
    logger.debug(`${chalk.blue('Filter')}: ${chalk.yellow(userId)} adding to filter`);
    if (userIds.has(userId)) {
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

export async function removeUserIdFromFilter(userId: string): Promise<boolean> {
    logger.debug(`${chalk.blue('Filter')}: ${chalk.yellow(userId)} removing from filter`);
    if (!userIds.has(userId)) {
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

export function isUserIdFiltered(userId: string): boolean {
    logger.debug(`${chalk.blue('Filter')}: ${chalk.yellow(userId)} checking in filter`);
    return userIds.has(userId);
}

export function getAllFilteredUserIds(): string[] {
    logger.debug(`${chalk.blue('Filter')}: Getting all user ids`);
    return Array.from(userIds);
}

import { auth, firestore } from '../../firebase';
import firebase from 'firebase';

let userIds: Set<string>; //automatically updated by onSnapshot function in load
//TODO Code 4
export async function load() {
    // TODO add logging

    return firestore
        .collection('users')
        .doc(auth.currentUser!.uid)
        .collection('modules')
        .doc('filter')
        .onSnapshot(docSnapshot => {
            userIds = new Set(docSnapshot.data()?.userIds);
        });
}

export async function addUserIdToFilter(userId: string): Promise<boolean> {
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
    return userIds.has(userId);
}

export function getAllFilteredUserIds(): string[] {
    return Array.from(userIds);
}

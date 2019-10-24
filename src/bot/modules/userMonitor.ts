import { auth, firestore } from '../../firebase';
import { logger } from '../../winston';
import QuerySnapshot = firebase.firestore.QuerySnapshot;
import firebase from 'firebase';

// TODO add proper typing for twitchUsers
// tslint:disable-next-line:no-any
export const twitchUsers: Map<string, any> = new Map<string, any>();

export function load() {
    return firestore
        .collection('users')
        .doc(auth.currentUser!.uid)
        .collection('twitchUsers')
        .onSnapshot(
            (ref: QuerySnapshot) => {
                ref.docChanges().forEach(change => {
                    const { doc, type } = change;
                    if (type === 'added') {
                        twitchUsers.set(doc.id, doc.data());
                    } else if (type === 'modified') {
                        twitchUsers.set(doc.id, doc.data());
                    } else if (type === 'removed') {
                        twitchUsers.delete(doc.id);
                    }
                });
            },
            error => logger.error(error.message)
        );
}

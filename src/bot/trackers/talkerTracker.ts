/**
 * Module Used to Track Talkers
 * Talkers are people who Talk on the Chat
 */

import { TalkerUser } from './interfaces';
import { isUserIdFiltered } from '../modules/filterManager';

/**
 * Talker user Interface
 */

let talkers: Map<string, TalkerUser> = new Map<string, TalkerUser>();

export function addTalker(user: TalkerUser): void {
    if (isUserIdFiltered(user.userId)) return;
    talkers.set(user.userId, user);
}

export function clearTalkers(): TalkerUser[] {
    const oldTalkers = talkers;
    talkers = new Map<string, TalkerUser>();
    return [...oldTalkers.values()];
}

/**
 * Module Used to Track Talkers
 * Talkers are people who Talk on the Chat
 */

import { TalkerUser } from './interfaces';

/**
 * Talker user Interface
 */

let talkers: Map<string, TalkerUser> = new Map<string, TalkerUser>();

export function addTalker(user: TalkerUser): void {
    talkers.set(user.userId, user);
}

export function clearTalkers(): TalkerUser[] {
    const oldTalkers = talkers;
    talkers = new Map<string, TalkerUser>();
    return [...oldTalkers.values()];
}

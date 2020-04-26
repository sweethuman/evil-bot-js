import { AsyncEvent, SyncEvent } from 'ts-events';

export interface UpdatedUserRank {
    rank: Rank;
    user: TwitchDatabaseUser;
}

export interface Rank {
    requiredXp: number;
    name: string;
}

export interface TwitchDatabaseUser {
    id: string;
    xp: number;
    coins: number;
    rank?: number;
    lastSeenDisplayName: string;
}

export interface Module {
    name: string;

    load(): Promise<void>;
}

export interface IFilterManager {
    addUserIdToFilter(userId: string): Promise<boolean>;

    removeUserIdFromFilter(userId: string): Promise<boolean>;

    isUserIdFiltered(userId: string): boolean;

    getAllFilteredUserIds(): string[];
}

export interface IUserMonitor {
    usersUpdated: SyncEvent<TwitchDatabaseUser[]>;
    twitchUsers: Map<string, TwitchDatabaseUser>;
}

export interface ITimedPoints {}

export interface ITimedMessages {}

export interface IRankManager {
    updatedRank: AsyncEvent<UpdatedUserRank>;
}

export interface TalkerUser {
    userId: string;
    displayName: string;
}
export interface ITalkerTracker {
    addTalker(user: TalkerUser): void;

    clearTalkers(): TalkerUser[];
}
export interface IPresenceTracker {
    /**
     * Give the user id and check if user is present, if not it makes it present
     * @param {string} userId
     * @returns {boolean}
     */
    isUserIdPresent(userId: string): boolean;
}

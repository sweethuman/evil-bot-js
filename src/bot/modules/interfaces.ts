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

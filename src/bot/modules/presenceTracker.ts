import { IFilterManager, IPresenceTracker, Module } from './interfaces';
import { boundMethod } from 'autobind-decorator';

/**
 * Class which holds user id of users that have come through the channel at least once
 */
export class PresenceTracker implements Module, IPresenceTracker {
    name = 'presenceTracker';
    private presentUsers: Set<string> = new Set<string>();
    private filterManager: IFilterManager;

    constructor(filterManager: IFilterManager) {
        this.filterManager = filterManager;
    }

    async load() {}

    /**
     * Give the user id and check if user is present, if not it makes it present
     * @param {string} userId
     * @returns {boolean}
     */
    @boundMethod
    isUserIdPresent(userId: string): boolean {
        if (this.presentUsers.has(userId) || this.filterManager.isUserIdFiltered(userId)) {
            return true;
        }
        this.presentUsers.add(userId);
        return false;
    }
}

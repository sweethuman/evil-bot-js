import { IFilterManager, ITalkerTracker, Module, TalkerUser } from './interfaces';
import { boundMethod } from 'autobind-decorator';

/**
 * Class Used to Track Talkers
 * Talkers are people who Talk on the Chat
 */
export class TalkerTracker implements Module, ITalkerTracker {
    name = 'talkerTracker';
    private filterManager: IFilterManager;
    private talkers: Map<string, TalkerUser> = new Map<string, TalkerUser>();

    constructor(filterManager: IFilterManager) {
        this.filterManager = filterManager;
    }

    async load(): Promise<void> {}

    @boundMethod
    addTalker(user: TalkerUser): void {
        if (this.filterManager.isUserIdFiltered(user.userId)) return;
        this.talkers.set(user.userId, user);
    }

    @boundMethod
    clearTalkers(): TalkerUser[] {
        const oldTalkers = this.talkers;
        this.talkers = new Map<string, TalkerUser>();
        return [...oldTalkers.values()];
    }
}

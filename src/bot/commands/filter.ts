import { Arguments, PermissionLevel, SubCommand } from '../commandEngine/decorators';
import { AbstractCommand } from '../commandEngine';
import { ArgumentType, UserLevel } from '../commandEngine/enums';
import { AdditionalData, OptionalArguments, RequiredArguments } from '../commandEngine/interfaces';
import { HelixUser } from 'twitch';
import {
    addUserIdToFilter,
    getAllFilteredUserIds,
    isUserIdFiltered,
    removeUserIdFromFilter,
} from '../modules/filterManager';
import { twitchUsers } from '../modules/userMonitor';
import { auth, firestore } from '../../firebase';
import i18next from 'i18next';

//TODO Code 1
export class Filter extends AbstractCommand {
    name = 'filter';

    @SubCommand('get')
    @Arguments(['username', ArgumentType.TwitchUser, true])
    async get(additionalData: AdditionalData, reqArgs: RequiredArguments, optArgs: OptionalArguments): Promise<string> {
        if (optArgs.username != null) {
            const user = optArgs.username as HelixUser;
            if (isUserIdFiltered(user.id)) {
                return i18next.t('twitch:filter_get_filtered', { username: user.displayName });
            }
            return i18next.t('twitch:filter_get_notFiltered', { username: user.displayName });
        }
        const userIds: string[] = getAllFilteredUserIds();
        if (userIds.length === 0) {
            return i18next.t('twitch:filter_get_noneInFilter');
        }
        const stringOfUsernames: string[] = [];
        for (const userId of userIds) {
            const user = twitchUsers.get(userId);
            if (user == null) {
                const userFromAPI = await additionalData.twitchClient.helix.users.getUserById(userId);
                if (userFromAPI == null) continue;
                stringOfUsernames.push(userFromAPI.displayName);
                //TODO Code 2
                // Better to make a function in userMonitor to "instantiate an user"
                // Also, user already being in filter, in case it changes it's username might never be updated in the
                // database
                await firestore
                    .collection('users')
                    .doc(auth.currentUser!.uid)
                    .collection('twitchUsers')
                    .doc(userFromAPI.id)
                    .set({
                        lastSeenDisplayName: userFromAPI.displayName,
                    });
                continue;
            }
            stringOfUsernames.push(user.lastSeenDisplayName);
        }
        return i18next.t('twitch:filter_get_allInFilter', { users: stringOfUsernames.join(', ') });
    }

    @SubCommand('add')
    @PermissionLevel(UserLevel.Moderator)
    @Arguments(['username', ArgumentType.TwitchUser])
    async add(additionalData: AdditionalData, reqArgs: RequiredArguments): Promise<string> {
        const user = reqArgs.username as HelixUser;
        const success = await addUserIdToFilter(user.id);
        if (success) {
            return i18next.t('twitch:filter_add_addedInFilter', { username: user.displayName });
        }
        return i18next.t('twitch:filter_add_notAddedInFilter', { username: user.displayName });
    }

    @SubCommand('remove')
    @PermissionLevel(UserLevel.Moderator)
    @Arguments(['username', ArgumentType.TwitchUser])
    async remove(additionalData: AdditionalData, reqArgs: RequiredArguments): Promise<string> {
        const user = reqArgs.username as HelixUser;
        const success = await removeUserIdFromFilter(user.id);
        if (success) {
            return i18next.t('twitch:filter_remove_removedFromFilter', { username: user.displayName });
        }
        return i18next.t('twitch:filter_remove_notRemovedFromFilter', { username: user.displayName });
    }
}

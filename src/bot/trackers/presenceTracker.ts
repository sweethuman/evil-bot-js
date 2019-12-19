/**
 * Module which holds user id of users that have come through the channel at least once
 */

const presentUsers: Set<string> = new Set<string>();

/**
 * Give the user id and check if user is present, if not it makes it present
 * @param {string} userId
 * @returns {boolean}
 */
export function isUserIdPresent(userId: string): boolean {
    if (presentUsers.has(userId)) {
        return true;
    }
    presentUsers.add(userId);
    return false;
}

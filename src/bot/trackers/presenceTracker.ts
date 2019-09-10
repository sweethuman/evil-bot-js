const presentUsers: Set<string> = new Set<string>();

export function isUserIdPresent(userId: string): boolean {
    if (presentUsers.has(userId)) {
        return true;
    }
    presentUsers.add(userId);
    return false;
}

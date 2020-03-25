import { PrivateMessage } from 'twitch-chat-client';
import TwitchClient, { HelixUser } from 'twitch';

export interface AdditionalData {
    channel: string;
    user: string;
    message: string;
    msg: PrivateMessage;
    parsedCommand: ParsedCommand;
    twitchClient: TwitchClient;
}

export interface ParsedCommand {
    /**
     * Only the command Identifier
     */
    command: string;
    argumentsAsArray: string[];
    argumentsAsString: string;
}

export interface CommandCallback {
    (additionalData: AdditionalData, ...args: Array<string | number | HelixUser>): string | Promise<string>;
}

import { PrivateMessage } from 'twitch-chat-client';
import TwitchClient, { HelixUser } from 'twitch';
import { ArgumentsParam } from './decorators';

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

export interface CommandHandler {
    (additionalData: AdditionalData, reqArgs: RequiredArguments, optArgs: OptionalArguments): string | Promise<string>;
}

export interface RequiredArguments {
    [key: string]: string | number | HelixUser;
}

export interface OptionalArguments {
    [key: string]: string | number | HelixUser | undefined;
}

export interface CommandArguments {
    requiredArguments: ArgumentsParam;
    optionalArguments: ArgumentsParam;
}

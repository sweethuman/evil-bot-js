import _ from 'lodash';
import { PrivateMessage } from 'twitch-chat-client';
import TwitchClient from 'twitch';
import chalk from 'chalk';
import { logger } from '../../winston';

export interface ParsedCommand {
    /**
     * Only the command Identifier
     */
    command: string;
    argumentsAsArray: string[];
    argumentsAsString: string;
}

export interface CommandCallback {
    (
        channel: string,
        user: string,
        message: string,
        msg: PrivateMessage,
        command: ParsedCommand,
        twitchClient: TwitchClient
    ): string | Promise<string>;
}

const commands: Map<string, CommandCallback> = new Map<string, CommandCallback>();
// TODO we should have command manager that is used globally or something
export function addCommand(command: string, callback: CommandCallback) {
    commands.set(command, callback);
}

export async function executeCommands(
    channel: string,
    user: string,
    message: string,
    msg: PrivateMessage,
    twitchClient: TwitchClient
): Promise<void | string> {
    const parsedCommand = parser(message);
    if (parsedCommand == null) return;
    const commandCallback = commands.get(parsedCommand.command);
    if (commandCallback == null) return;
    logger.debug(chalk.blue(parsedCommand.command) + chalk.yellow(' command called'));
    return commandCallback(channel, user, message, msg, parsedCommand, twitchClient);
}

function parser(input: string): void | ParsedCommand {
    if (!input.startsWith('!') || input.length <= 1) return;
    const splitted = _.trimStart(input, '!').split(' ');
    const command = splitted[0];
    const argumentsAsArray: string[] = _.slice(splitted, 1, splitted.length);
    const argumentsAsString = _.trimStart(input, '!' + command + ' ');

    return {
        command,
        argumentsAsArray,
        argumentsAsString,
    };
}

import _ from 'lodash';
import { PrivateMessage } from 'twitch-chat-client';
import TwitchClient from 'twitch';
import { log } from '../loggingModule';
import chalk from 'chalk';

export interface ParsedCommand {
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
    log(chalk.blue(parsedCommand.command) + chalk.yellow(' command called'));
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

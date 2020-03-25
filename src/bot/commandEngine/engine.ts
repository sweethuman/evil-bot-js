import _ from 'lodash';
import { PrivateMessage } from 'twitch-chat-client';
import TwitchClient, { HelixUser } from 'twitch';
import chalk from 'chalk';
import { logger } from '../../winston';
import * as Commands from '../commands';
import 'reflect-metadata';
import {
    ArgumentsParam,
    argumentsSpecKey,
    commandStorageKey,
    permissionLevelKey,
    subCommandNameKey,
} from './decorators';
import { CommandObject } from './commandObject';
import { ArgumentType, UserLevel } from './types';
import { AbstractCommand } from './abstractCommand';
import { SubCommandDefineError } from '../../errors/subCommandDefine';

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

const commands: {
    [index: string]: CommandObject | { [index: string]: CommandObject };
} = {};

export function loadCommands(): void {
    logger.debug('Loading commands');
    for (const [key, value] of Object.entries(Commands)) {
        const command = new value();
        const storage: string | string[] = Reflect.getMetadata(commandStorageKey, command);
        if (typeof storage === 'string') {
            commands[command.name] = instantiateCommandObject(storage, command);
        } else if (Array.isArray(storage)) {
            const setOfChildren: { [index: string]: CommandObject } = {};
            for (const funcName of storage) {
                const subCommandName: string = Reflect.getMetadata(subCommandNameKey, command, funcName);
                setOfChildren[subCommandName] = instantiateCommandObject(funcName, command, true);
            }
            commands[command.name] = setOfChildren;
        }
    }
    logger.debug('Commands loaded');
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
    //TODO CODE 3
    const commandObject = commands[parsedCommand.command];
    if (commandObject == null) return;
    logger.debug(chalk.blue(parsedCommand.command) + chalk.yellow(' command called'));
    const additionalData: AdditionalData = {
        channel,
        user,
        message,
        msg,
        twitchClient,
        parsedCommand,
    };
    if (commandObject instanceof CommandObject) {
        return commandInjector(commandObject, additionalData);
    } else if (typeof commandObject === 'object') {
        if (parsedCommand.argumentsAsArray.length === 0) {
            //TODO CODE 1
            return 'Subcommand not specified!';
        }
        const subCommand = commandObject[parsedCommand.argumentsAsArray[0]];
        if (subCommand == null) {
            //TODO CODE 1
            return 'Subcommand does not exist';
        }
        return commandInjector(subCommand, additionalData);
    }
}

function isAllowed(
    permissionLevel: UserLevel,
    vip: boolean,
    subscriber: boolean,
    moderator: boolean,
    founder: boolean,
    broadcaster: boolean
): boolean {
    //This is like this for readability
    if (permissionLevel === UserLevel.User) return true;
    if (permissionLevel === UserLevel.Vip && (vip || subscriber || moderator || founder || broadcaster)) return true;
    if (permissionLevel === UserLevel.Subscriber && (vip || subscriber || moderator || founder || broadcaster)) {
        return true;
    }
    if (permissionLevel === UserLevel.Moderator && (moderator || broadcaster)) return true;
    if (permissionLevel === UserLevel.Broadcaster && broadcaster) return true;
    return false;
}

/**
 *
 * @param commandObject
 * @param additionalData
 */
async function commandInjector(commandObject: CommandObject, additionalData: AdditionalData): Promise<string | void> {
    const { msg, parsedCommand: parsedCommand, twitchClient } = additionalData;
    if (
        commandObject.permissionLevel != null &&
        !isAllowed(
            commandObject.permissionLevel,
            msg.userInfo.isVip,
            msg.userInfo.isSubscriber,
            msg.userInfo.isMod,
            msg.userInfo.isFounder,
            msg.userInfo.badges.has('broadcaster')
        )
    ) {
        return;
    }
    const args: Array<string | number | HelixUser> = [];
    if (commandObject.args != null) {
        if (commandObject.args.size <= parsedCommand.argumentsAsArray.length - (commandObject.subCommand ? 1 : 0)) {
            let i = commandObject.subCommand ? 1 : 0;
            for (const [key, value] of commandObject.args) {
                if (value === ArgumentType.String) {
                    args.push(parsedCommand.argumentsAsArray[i]);
                } else if (value === ArgumentType.Number) {
                    const convertedNumber = Number.parseInt(parsedCommand.argumentsAsArray[i], 10);
                    if (isNaN(convertedNumber)) {
                        //TODO CODE 2
                        //TODO CODE 1
                        return `${key} Argument is not a Number`;
                    }
                    args.push(convertedNumber);
                } else if (value === ArgumentType.TwitchUser) {
                    const user = await twitchClient.helix.users.getUserByName(parsedCommand.argumentsAsArray[i]);
                    if (user == null) {
                        //TODO CODE 1
                        return 'There is no user with that username';
                    }
                    args.push(user);
                } else {
                    //TODO CODE 2
                    //Maybe I should a type Check of Support implementation and it's response somewhere else
                    return 'Arguments type included in command not supported';
                }
                i++;
            }
        } else {
            //TODO CODE 1
            return 'Not Enough Arguments';
        }
    }
    return commandObject.command(additionalData, ...args);
}

function instantiateCommandObject(
    funcName: string,
    commandClass: AbstractCommand,
    isSubCommand = false
): CommandObject {
    const commandFunc = commandClass[funcName];
    if (typeof commandFunc === 'function') {
        let argumentsSpec: ArgumentsParam | undefined;
        let permissionLevel: UserLevel | undefined;
        if (Reflect.hasMetadata(argumentsSpecKey, commandClass, funcName)) {
            argumentsSpec = Reflect.getMetadata(argumentsSpecKey, commandClass, funcName);
        }
        if (Reflect.hasMetadata(permissionLevelKey, commandClass, funcName)) {
            permissionLevel = Reflect.getMetadata(permissionLevelKey, commandClass, funcName);
        }
        return new CommandObject(commandFunc.bind(commandClass), argumentsSpec, permissionLevel, isSubCommand);
    } else {
        throw new SubCommandDefineError('Property of class stored in reflection is not a function!');
    }
}

function parser(input: string): void | ParsedCommand {
    if (!input.startsWith('!') || input.length <= 1) return;
    const split = _.trimStart(input, '!').split(' ');
    const command = split[0];
    const argumentsAsArray: string[] = _.slice(split, 1, split.length);
    const argumentsAsString = _.trimStart(input, '!' + command + ' ');

    return {
        command,
        argumentsAsArray,
        argumentsAsString,
    };
}

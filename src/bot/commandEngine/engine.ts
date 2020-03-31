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
import { ArgumentType, UserLevel } from './enums';
import { AbstractCommand } from './abstractCommand';
import { SubCommandDefineError } from '../../errors/subCommandDefine';
import { AdditionalData, ParsedCommand } from './interfaces';
import i18next from 'i18next';

const commands: {
    [index: string]: CommandObject | { [index: string]: CommandObject };
} = {};

/**
 * It loads commands from the Abstract Command class Objects and turns them into more easily readable
 * CommandObjects to be read and interpreted by the engine
 */
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

/**
 * Given a message with the appropriate data, if it is a command, it tries to execute it
 */
export async function executeCommands(
    channel: string,
    user: string,
    message: string,
    msg: PrivateMessage,
    twitchClient: TwitchClient
): Promise<string> {
    if (!message.startsWith('!') || message.length <= 1) return '';
    const parsedCommand = parser(message);
    const registeredValue = commands[parsedCommand.command];
    if (registeredValue == null) return '';
    logger.debug(chalk.blue(parsedCommand.command) + chalk.yellow(' command called'));
    const additionalData: AdditionalData = {
        channel,
        user,
        message,
        msg,
        twitchClient,
        parsedCommand,
    };
    if (registeredValue instanceof CommandObject) {
        return commandInjector(registeredValue, additionalData);
    } else if (typeof registeredValue === 'object') {
        if (parsedCommand.argumentsAsArray.length === 0) {
            return i18next.t('common:missingSubcommand', { command: parsedCommand.command });
        }
        const subCommand = registeredValue[parsedCommand.argumentsAsArray[0]];
        if (subCommand == null) {
            return i18next.t('common:wrongSubcommand', {
                subcommand: parsedCommand.argumentsAsArray[0],
                command: parsedCommand.command,
            });
        }
        return commandInjector(subCommand, additionalData);
    }
    return '';
}

/**
 * Checks if user is allowed to run the command
 * @param permissionLevel The Minimum Permission Level of The Command
 * @param vip If User is vip
 * @param subscriber If User is subscriber
 * @param moderator If User is moderator
 * @param founder If User is founder
 * @param broadcaster If User is broadcaster
 */
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
 * It takes a CommandObject and the additional parsed data and handles Permission Checking, And Argument Injection for
 * the command and converting everything into the expected type for the actual Command Handler
 */
async function commandInjector(commandObject: CommandObject, additionalData: AdditionalData): Promise<string> {
    const { msg, parsedCommand, twitchClient } = additionalData;
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
        return '';
    }
    const args: Array<string | number | HelixUser> = [];
    if (commandObject.args != null) {
        if (commandObject.args.size <= parsedCommand.argumentsAsArray.length - (commandObject.subCommand ? 1 : 0)) {
            let i = commandObject.subCommand ? 1 : 0;
            for (const [argName, argType] of commandObject.args) {
                if (argType === ArgumentType.String) {
                    args.push(parsedCommand.argumentsAsArray[i]);
                } else if (argType === ArgumentType.Number) {
                    const convertedNumber = Number.parseInt(parsedCommand.argumentsAsArray[i], 10);
                    if (isNaN(convertedNumber)) {
                        return i18next.t('common:argumentNotANumber', {
                            argument: argName,
                            value: parsedCommand.argumentsAsArray[i],
                        });
                    }
                    args.push(convertedNumber);
                } else if (argType === ArgumentType.TwitchUser) {
                    const user = await twitchClient.helix.users.getUserByName(parsedCommand.argumentsAsArray[i]);
                    if (user == null) {
                        return i18next.t('twitch:missingUsername', { username: parsedCommand.argumentsAsArray[i] });
                    }
                    args.push(user);
                } else {
                    return i18next.t('common:commandArgumentNotSupported');
                }
                i++;
            }
        } else {
            return i18next.t('common:notEnoughArguments', { command: parsedCommand.command });
        }
    }
    return commandObject.handler(additionalData, ...args);
}

/**
 * Instantiates a CommandObject
 * @param funcName The function name in the `commandClass` that has attached to it all the properties that define a "COMMAND"
 * @param commandClass The class that coins everything including the function and to which the function is bound to
 * @param isSubCommand If the given is a SubCommand of a more general parent command
 */
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

/**
 * From a string it returns the command from text into parsed format
 * @param input String to parse into standard command format
 */
function parser(input: string): ParsedCommand {
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

import _ from 'lodash';
import { PrivateMessage } from 'twitch-chat-client';
import TwitchClient from 'twitch';
import chalk from 'chalk';
import { logger } from '../../winston';
import * as Commands from '../commands';
import 'reflect-metadata';
import { argumentsSpecKey, commandStorageKey, permissionLevelKey, subCommandNameKey } from './decorators';
import { CommandObject } from './commandObject';
import { ArgumentType, UserLevel } from './enums';
import { AbstractCommand } from './abstractCommand';
import { SubCommandDefineError } from '../../errors/subCommandDefine';
import { AdditionalData, CommandArguments, OptionalArguments, ParsedCommand, RequiredArguments } from './interfaces';
import i18next from 'i18next';

const commands: {
    [index: string]: CommandObject | { [index: string]: CommandObject };
} = {};

/**
 * It loads commands from the Abstract Command class Objects and turns them into more easily readable
 * CommandObjects to be read and interpreted by the engine
 */
export function loadCommands(): void {
    logger.info(`${chalk.blue('Engine')}: Loading commands`);
    for (const [, value] of Object.entries(Commands)) {
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
    logger.info(`${chalk.blue('Engine')}: Commands loaded`);
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
    logger.info(`${chalk.blue('Engine')}: ${chalk.yellow(parsedCommand.command)} command called`);
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
        logger.info(`${chalk.blue('Engine')}: ${chalk.yellow(parsedCommand.argumentsAsArray[0])} subcommand called`);
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
 * the command and converting everything into the expected type for the actual Command Handler and calls said Command Handler
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
    const argsToProcess: string[] = parsedCommand.argumentsAsArray;
    if (commandObject.subCommand) argsToProcess.shift();
    const reqArgs: RequiredArguments = {};
    const optArgs: OptionalArguments = {};
    if (commandObject.requiredArgs != null) {
        if (commandObject.requiredArgs.size <= argsToProcess.length) {
            for (const [argName, argType] of commandObject.requiredArgs) {
                const currentArgument: string = argsToProcess.shift()!;
                if (argType === ArgumentType.String) {
                    reqArgs[argName] = currentArgument;
                } else if (argType === ArgumentType.Number) {
                    const convertedNumber = Number.parseInt(currentArgument, 10);
                    if (isNaN(convertedNumber)) {
                        return i18next.t('common:argumentNotANumber', {
                            argument: argName,
                            value: currentArgument,
                        });
                    }
                    reqArgs[argName] = convertedNumber;
                } else if (argType === ArgumentType.TwitchUser) {
                    const user = await twitchClient.helix.users.getUserByName(currentArgument);
                    if (user == null) {
                        return i18next.t('twitch:missingUsername', {
                            username: currentArgument,
                        });
                    }
                    reqArgs[argName] = user;
                } else {
                    return i18next.t('common:commandArgumentNotSupported');
                }
            }
        } else {
            return i18next.t('common:notEnoughArguments', { command: parsedCommand.command });
        }
    }
    if (commandObject.optionalArgs != null) {
        for (const [argName, argType] of commandObject.optionalArgs) {
            const currentArgument = argsToProcess.shift();
            if (currentArgument == null) {
                break;
            }
            //TODO Code 2
            //TODO this is duplicate with the code above, convert to a function
            if (argType === ArgumentType.String) {
                optArgs[argName] = currentArgument;
            } else if (argType === ArgumentType.Number) {
                const convertedNumber = Number.parseInt(currentArgument, 10);
                if (isNaN(convertedNumber)) {
                    return i18next.t('common:argumentNotANumber', {
                        argument: argName,
                        value: currentArgument,
                    });
                }
                optArgs[argName] = convertedNumber;
            } else if (argType === ArgumentType.TwitchUser) {
                const user = await twitchClient.helix.users.getUserByName(currentArgument);
                if (user == null) {
                    return i18next.t('twitch:missingUsername', {
                        username: currentArgument,
                    });
                }
                optArgs[argName] = user;
            } else {
                return i18next.t('common:commandArgumentNotSupported');
            }
        }
    }
    return commandObject.handler(additionalData, reqArgs, optArgs);
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
        const argumentsSpec: CommandArguments | undefined = Reflect.getMetadata(
            argumentsSpecKey,
            commandClass,
            funcName
        );
        const permissionLevel: UserLevel | undefined = Reflect.getMetadata(permissionLevelKey, commandClass, funcName);
        return new CommandObject(
            commandFunc.bind(commandClass),
            argumentsSpec?.requiredArguments,
            argumentsSpec?.optionalArguments,
            permissionLevel,
            isSubCommand
        );
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

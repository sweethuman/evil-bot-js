import { AbstractCommand } from './abstractCommand';
import 'reflect-metadata';
import { ArgumentType, UserLevel } from './enums';
import { SubCommandDefineError } from '../../errors/subCommandDefine';

export const subCommandNameKey = Symbol('subcommand');
export const commandStorageKey = Symbol('commandStorageKey');
export const permissionLevelKey = Symbol('permission');
export const argumentsSpecKey = Symbol('arguments');

/**
 * Decorator to declare that the function is a command
 * `@SubCommand` if function is the only handler for the command defined by the class
 * `@SubCommand(name)` if the function is the handler for the subcommand "name" of the command defined by the class
 */
function SubCommand(name: string): MethodDecorator;
function SubCommand(target: AbstractCommand, propertyKey: string, descriptor: PropertyDescriptor): void;
function SubCommand(
    target: AbstractCommand | string,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
): MethodDecorator | void {
    const name = target;
    if (typeof name === 'string') {
        return (target: {}, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
            const subCommands = Reflect.getMetadata(commandStorageKey, target) ?? [];
            if (typeof subCommands === 'string') {
                throw new SubCommandDefineError('Default SubCommand defined, cannot have other named SubCommands');
            }
            Reflect.defineMetadata(subCommandNameKey, name, target, propertyKey);
            subCommands.push(propertyKey);
            Reflect.defineMetadata(commandStorageKey, subCommands, target);
        };
    } else {
        const subCommands = Reflect.getMetadata(commandStorageKey, target);
        if (subCommands != null) {
            throw new SubCommandDefineError('SubCommands defined, cannot have a default SubCommand');
        }
        Reflect.defineMetadata(commandStorageKey, propertyKey, target);
    }
}

export { SubCommand };

/**
 * Decorator for the command handlers declared with `@SubCommand`
 * Sets the minimum user level required to run the command
 * @param level
 */
export function PermissionLevel(level: UserLevel): MethodDecorator {
    return Reflect.metadata(permissionLevelKey, level);
}

export type ArgumentsParam = Map<string, ArgumentType>;

/**
 * Decorator for the command handlers declared with `@SubCommand`
 * Declares the arguments of the command/subcommand, including their name and type
 * The Command Handler will receive them in the same order
 */
export function Arguments(...args: Array<[string, ArgumentType]>): MethodDecorator {
    const newArguments: ArgumentsParam = new Map(args);
    return Reflect.metadata(argumentsSpecKey, newArguments);
}

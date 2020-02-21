import { AbstractCommand } from './abstractCommand';
import 'reflect-metadata';
import { ArgumentType, UserLevel } from './types';
import { SubCommandDefineError } from '../../errors/subCommandDefine';

export const subCommandNameKey = Symbol('subcommand');
export const commandStorageKey = Symbol('commandStorageKey');
export const permissionLevelKey = Symbol('permission');
export const argumentsSpecKey = Symbol('arguments');

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

export function PermissionLevel(level: UserLevel): MethodDecorator {
    return Reflect.metadata(permissionLevelKey, level);
}

export type ArgumentsParam = Map<string, ArgumentType>;

export function Arguments(args: Array<[string, ArgumentType]>): MethodDecorator {
    const newArguments: ArgumentsParam = new Map(args);
    return Reflect.metadata(argumentsSpecKey, newArguments);
}

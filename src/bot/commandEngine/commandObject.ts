import { UserLevel } from './types';
import { ArgumentsParam } from './decorators';
import { CommandCallback } from './engine';

export class CommandObject {
    constructor(
        readonly command: CommandCallback,
        readonly args?: ArgumentsParam,
        readonly permissionLevel?: UserLevel,
        readonly subCommand = false
    ) {}
}

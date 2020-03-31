import { UserLevel } from './enums';
import { ArgumentsParam } from './decorators';
import { CommandHandler } from './interfaces';

export class CommandObject {
    constructor(
        readonly handler: CommandHandler,
        readonly args?: ArgumentsParam,
        readonly permissionLevel?: UserLevel,
        readonly subCommand = false
    ) {}
}

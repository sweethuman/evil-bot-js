export abstract class AbstractCommand {
    abstract name: string;
    // tslint:disable-next-line:no-any
    [index: string]: any;
}

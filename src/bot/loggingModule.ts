export let log: Function;

export function setupLogging(loggingCommand: Function) {
    log = loggingCommand;
}

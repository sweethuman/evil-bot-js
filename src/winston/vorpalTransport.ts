import TransportStream from 'winston-transport';
import { vorpal } from '../cli/vorpal';
import { MESSAGE } from 'triple-beam';

export class VorpalTransport extends TransportStream {
    constructor(opts?: TransportStream.TransportStreamOptions) {
        super(opts);

        //
        // Consume any custom options here. e.g.:
        // - Connection information for databases
        // - Authentication information for APIs (e.g. loggly, papertrail,
        //   logentries, etc.).
        //
    }

    // tslint:disable-next-line:no-any
    log(info: { message: string; level: string; [key: string]: any }, callback: () => void) {
        setImmediate(() => {
            this.emit('logged', info);
        });

        // Perform the writing to the remote service
        const { level, message, ...meta } = info;
        vorpal.log(info[MESSAGE]);

        callback();
    }
}

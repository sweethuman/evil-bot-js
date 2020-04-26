import ChatClient from 'twitch-chat-client';
import { auth, firestore } from '../../firebase';
import chalk from 'chalk';
import { getRandomInt } from '../../utilities/useful';
import { logger } from '../../winston';
import { ITimedMessages, Module } from './interfaces';

export class TimedMessages implements Module, ITimedMessages {
    name = 'timedMessages';
    private channel: string;
    private chatClient: ChatClient;

    private intervalTimeout: NodeJS.Timeout | null = null;
    private messageCounter: number;

    constructor(channel: string, chatClient: ChatClient) {
        this.channel = channel;
        this.chatClient = chatClient;
        this.messageCounter = -1;
    }

    async load(): Promise<void> {
        const that = this;
        logger.info(`${chalk.blue('Timed Messages')}: Loading Timed Messages Module`);
        //Retrieve Config
        const messagesDoc = await firestore
            .collection(`users/${auth.currentUser!.uid}/config`)
            .doc('timedmessages')
            .get();
        if (!messagesDoc.exists) {
            logger.warn(
                `${chalk.blue('Timed Messages')}: ${chalk.bgRed(
                    'Timed Messages Configuration Does Not Exist \n MODULE DISABLED'
                )}`
            );
            return;
        }
        const messagesData: {
            timeInterval?: number;
            messageOrder?: number;
            messages?: string[];
        } = messagesDoc.data()!;

        // Check for incompatible data format
        if (messagesData.timeInterval == null || messagesData.messageOrder == null || messagesData.messages == null) {
            logger.error(
                `${chalk.blue('Timed Messages')}: ${chalk.bgRed('Timed Messages Config is not a valid CONFIG')}`
            );
            return;
        }
        if (messagesData.messages.length === 0) {
            logger.warn(
                `${chalk.blue('Timed Messages')}: ${chalk.red('There are no Timed Messages! \n MODULE DISABLED')}`
            );
            return;
        }

        this.intervalTimeout = setInterval(
            () => this.sendMessage(that.chatClient, that.channel, messagesData),
            messagesData.timeInterval * 60000
        );
        logger.info(`${chalk.blue('Timed Messages')}: Loaded Timed Messages Module`);
    }

    unload(): void {
        const that = this;
        if (that.intervalTimeout == null) {
            logger.error(`${chalk.blue('Timed Messages')}: ${chalk.red("Timed Messages Module hasn't been started")}`);
            return;
        }
        clearInterval(that.intervalTimeout);
        that.intervalTimeout = null;
    }

    private sendMessage(
        chatClient: ChatClient,
        channel: string,
        messagesData: { timeInterval?: number; messageOrder?: number; messages?: string[] }
    ) {
        let messageToBeSent: string;
        switch (messagesData.messageOrder) {
            //Random
            case 0: {
                let selection = getRandomInt(0, messagesData.messages!.length - 1);
                while (selection === this.messageCounter) {
                    selection = getRandomInt(0, messagesData.messages!.length - 1);
                }
                this.messageCounter = selection;
                messageToBeSent = messagesData.messages![selection];
                break;
            }
            // Ordered
            case 1: {
                this.messageCounter += 1;
                if (this.messageCounter === messagesData.messages!.length) this.messageCounter = 0;
                messageToBeSent = messagesData.messages![this.messageCounter];
                break;
            }
            default: {
                logger.error(
                    chalk.red(
                        `${chalk.blue('Timed Messages')}: Message Order ${chalk.blue(
                            `${messagesData.messageOrder}`
                        )} does not exist in current version of the app; Timed Messages Disabled`
                    )
                );
                return;
            }
        }
        chatClient.say(channel, messageToBeSent);
    }
}

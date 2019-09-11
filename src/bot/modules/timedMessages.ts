import ChatClient from 'twitch-chat-client';
import { auth, firestore } from '../../firebase';
import { log } from '../loggingModule';
import chalk from 'chalk';
import { getRandomInt } from '../../utilities/useful';

let intervalTimeout: NodeJS.Timeout | null = null;
let messageCounter: number;
export async function start(channel: string, chatClient: ChatClient) {
    messageCounter = -1;
    const messagesDoc = await firestore
        .collection(`users/${auth.currentUser!.uid}/config`)
        .doc('timedmessages')
        .get();
    if (!messagesDoc.exists) {
        log(chalk.bgRed('Timed Messages Configuration Does Not Exist \n MODULE DISABLED'));
        return;
    }
    const messagesData: {
        //Time Interval is in Minutes
        timeInterval?: number;
        // Message Order:
        // 0 is Random
        // 1 is Normal Order
        messageOrder?: number;
        messages?: string[];
    } = messagesDoc.data()!;
    if (messagesData.timeInterval == null || messagesData.messageOrder == null || messagesData.messages == null) {
        log(chalk.bgRed('Timed Messages Config is not a valid CONFIG'));
        return;
    }
    if (messagesData.messages.length === 0) {
        log(chalk.red('There are no Timed Messages! \n MODULE DISABLED'));
        return;
    }

    intervalTimeout = setInterval(() => {
        let messageToBeSent: string;
        switch (messagesData.messageOrder) {
            case 0: {
                let selection = getRandomInt(0, messagesData.messages!.length - 1);
                while (selection === messageCounter) {
                    selection = getRandomInt(0, messagesData.messages!.length - 1);
                }
                messageCounter = selection;
                messageToBeSent = messagesData.messages![selection];
                break;
            }
            case 1: {
                messageCounter += 1;
                if (messageCounter === messagesData.messages!.length) messageCounter = 0;
                messageToBeSent = messagesData.messages![messageCounter];
                break;
            }
            default: {
                log(
                    chalk.red(`Message Order ${messagesData.messageOrder} does not exist in current version of the app`)
                );
                return;
            }
        }
        chatClient.say(channel, messageToBeSent);
    }, messagesData.timeInterval * 60000);
}

export function stop(): void {
    if (intervalTimeout == null) {
        log(chalk.red("Timed Messages Module hasn't been started"));
        return;
    }
    clearInterval(intervalTimeout);
    intervalTimeout = null;
}

import ChatClient from 'twitch-chat-client';
import { auth, firestore } from '../../firebase';
import chalk from 'chalk';
import { getRandomInt } from '../../utilities/useful';
import { logger } from '../../winston';

let intervalTimeout: NodeJS.Timeout | null = null;
let messageCounter: number;
export async function load(channel: string, chatClient: ChatClient) {
    messageCounter = -1;
    //Retrieve Config
    const messagesDoc = await firestore
        .collection(`users/${auth.currentUser!.uid}/config`)
        .doc('timedmessages')
        .get();
    if (!messagesDoc.exists) {
        logger.warn(chalk.bgRed('Timed Messages Configuration Does Not Exist \n MODULE DISABLED'));
        return;
    }
    const messagesData: {
        timeInterval?: number;
        messageOrder?: number;
        messages?: string[];
    } = messagesDoc.data()!;

    // Check for incompatible data format
    if (messagesData.timeInterval == null || messagesData.messageOrder == null || messagesData.messages == null) {
        logger.error(chalk.bgRed('Timed Messages Config is not a valid CONFIG'));
        return;
    }
    if (messagesData.messages.length === 0) {
        logger.warn(chalk.red('There are no Timed Messages! \n MODULE DISABLED'));
        return;
    }

    intervalTimeout = setInterval(
        () => sendMessage(chatClient, channel, messagesData),
        messagesData.timeInterval * 60000
    );
}

function sendMessage(
    chatClient: ChatClient,
    channel: string,
    messagesData: { timeInterval?: number; messageOrder?: number; messages?: string[] }
) {
    let messageToBeSent: string;
    switch (messagesData.messageOrder) {
        //Random
        case 0: {
            let selection = getRandomInt(0, messagesData.messages!.length - 1);
            while (selection === messageCounter) {
                selection = getRandomInt(0, messagesData.messages!.length - 1);
            }
            messageCounter = selection;
            messageToBeSent = messagesData.messages![selection];
            break;
        }
        // Ordered
        case 1: {
            messageCounter += 1;
            if (messageCounter === messagesData.messages!.length) messageCounter = 0;
            messageToBeSent = messagesData.messages![messageCounter];
            break;
        }
        default: {
            logger.error(
                chalk.red(
                    `Message Order ${chalk.blue(
                        `${messagesData.messageOrder}`
                    )} does not exist in current version of the app; Timed Messages Disabled`
                )
            );
            return;
        }
    }
    chatClient.say(channel, messageToBeSent);
}

export function unload(): void {
    if (intervalTimeout == null) {
        logger.error(chalk.red("Timed Messages Module hasn't been started"));
        return;
    }
    clearInterval(intervalTimeout);
    intervalTimeout = null;
}

import { vorpal } from '../vorpal';
import { auth, firestore } from '../../firebase';
import chalk from 'chalk';
import * as inquirer from 'inquirer';
import _ from 'lodash';

vorpal
    .command('timedmessages', 'Edit Timed Messages from the Bot')
    .validate(() => {
        if (auth.currentUser != null) {
            return true;
        }
        return chalk.red('User is not logged in');
    })
    .action(async () => {
        //Gets Document to Be Edited
        const messagesDoc = await firestore
            .collection(`users/${auth.currentUser!.uid}/config`)
            .doc('timedmessages')
            .get();
        let messagesData: {
            timeInterval?: number;
            // Message Order:
            // 0 is Random
            // 1 is Normal Order
            messageOrder?: number;
            messages?: string[];
        };
        messagesData = messagesDoc.data() != null ? messagesDoc.data()! : {};
        messagesData.messages = messagesData.messages == null ? [] : messagesData.messages;

        //Prompt to Edit Time Interval and The Order In Which Messages are Sent
        const editPropResults: {
            timeInterval: number;
            messageOrder: number;
        } = await inquirer.prompt([
            {
                type: 'number',
                name: 'timeInterval',
                message: 'The Time Interval Between Messages in Minutes',
                default: messagesData.timeInterval != null ? messagesData.timeInterval : 15,
            },
            {
                type: 'list',
                name: 'messageOrder',
                message: 'The Order In Which Messages are Sent',
                //TODO Test: if messageOrder is bigger than choices array
                default: messagesData.messageOrder != null ? messagesData.messageOrder : 0,
                choices: [{ name: 'Random Order', value: 0 }, { name: 'The Order In Which They Appear', value: 1 }],
            },
        ]);
        messagesData = { ...messagesData, ...editPropResults };

        function areMessages() {
            return messagesData.messages != null && messagesData.messages.length !== 0;
        }

        //Show Current Messages otherwise Show error
        function viewMessages() {
            if (!areMessages()) {
                vorpal.log(chalk.red('There are no Timed Messages'));
            } else {
                _.forEach(messagesData.messages, value => vorpal.log(chalk.yellow('- ') + chalk.cyan(value)));
            }
        }

        //Another Prompt to Edit The Array of Messages
        //Asks If You want to Add, Edit, Delete a Message or Finish Editing
        let finished = false;
        while (!finished) {
            vorpal.log('');
            const { editAction }: { editAction: string } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'editAction',
                    message: 'Select Action for Timed Messages',
                    choices: () => {
                        const actionChoices = [
                            {
                                name: 'Add Message',
                                value: 'add',
                            },
                            {
                                name: 'View all Messages',
                                value: 'view',
                            },
                            {
                                name: 'Finish Editing',
                                value: 'finish',
                            },
                        ];
                        if (areMessages()) {
                            actionChoices.splice(
                                1,
                                0,
                                {
                                    name: 'Edit a Message',
                                    value: 'edit',
                                },
                                {
                                    name: 'Remove a Message',
                                    value: 'remove',
                                }
                            );
                        }
                        return actionChoices;
                    },
                },
            ]);

            //Run Code For The Selection Made
            //Edit and Remove Actions are available only if there are Messages
            switch (editAction) {
                case 'add': {
                    const { addMessage }: { addMessage: string } = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'addMessage',
                            message: 'Enter Message You want to Add',
                        },
                    ]);
                    messagesData.messages!.push(addMessage);
                    break;
                }
                case 'edit': {
                    const editResults: { selectedMessageIndex: number; editedMessage: string } = await inquirer.prompt([
                        {
                            type: 'list',
                            name: 'selectedMessageIndex',
                            message: 'Select the Message you want to Edit',
                            choices: (): Array<{ name: string; value: number }> =>
                                _.map(messagesData.messages, (value, index) => {
                                    return { name: value, value: index };
                                }),
                        },
                        //This Prompt Needs to Edit The message, may not be the best way to edit as you have to enter the message again
                        {
                            type: 'input',
                            name: 'editedMessage',
                            message: 'Edit Message',
                            default: (answers: { selectedMessageIndex: number }) =>
                                messagesData.messages![answers.selectedMessageIndex],
                        },
                    ]);
                    messagesData.messages![editResults.selectedMessageIndex] = editResults.editedMessage;
                    break;
                }
                case 'remove': {
                    const { selectedMessageIndex }: { selectedMessageIndex: number } = await inquirer.prompt([
                        {
                            type: 'list',
                            name: 'selectedMessageIndex',
                            message: 'Select the Message you want to Remove',
                            choices: (): Array<{ name: string; value: number }> =>
                                _.map(messagesData.messages, (value, index) => {
                                    return { name: value, value: index };
                                }),
                        },
                    ]);
                    messagesData.messages!.splice(selectedMessageIndex, 1);
                    break;
                }
                case 'view': {
                    viewMessages();
                    break;
                }
                case 'finish': {
                    finished = true;
                    break;
                }
                default:
                    break;
            }
        }
        //Shows The Final Version of The Timed Messages Config
        vorpal.log('');
        vorpal.log('Message Time Interval ' + chalk.cyan(messagesData.timeInterval!.toString()) + ' Minutes');
        function numberToOrderName(input: number): string {
            if (input === 0) {
                return 'Random Order';
            }
            if (input === 1) {
                return 'The Order In Which They Appear';
            }
            return 'UNSPECIFIED SELECTION';
        }
        vorpal.log(
            'The Order In which Messages are Sent: ' + chalk.cyan(numberToOrderName(messagesData.messageOrder!))
        );
        vorpal.log('The List of Timed Messages:');
        viewMessages();

        //Asks if you want to Save Changes
        const confirmResult: { save: boolean } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'save',
                message: 'Do you want to save the changes?',
            },
        ]);
        if (confirmResult.save) {
            await firestore
                .collection(`users/${auth.currentUser!.uid}/config`)
                .doc('timedmessages')
                .set(messagesData, { merge: true });
        }
    });

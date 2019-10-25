import { auth, firestore } from '../../firebase';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { vorpal } from '../vorpal';
import _ from 'lodash';
import { Rank } from '../../bot/modules/rankManager';

vorpal
    .command('ranks', 'Add or Edit your Ranks')
    .validate(() => {
        if (auth.currentUser != null) {
            return true;
        }
        return chalk.red('User is not logged in');
    })
    .action(async () => {
        //Gets Document to Be Edited
        const ranksDoc = await firestore
            .collection(`users/${auth.currentUser!.uid}/config`)
            .doc('ranks')
            .get();
        let ranksData: {
            ranks?: Rank[];
        };
        ranksData = ranksDoc.data() != null ? ranksDoc.data()! : {};
        ranksData.ranks = ranksData.ranks == null ? [] : ranksData.ranks;
        ranksData.ranks.sort((a, b) => a.requiredXp - b.requiredXp);

        function areRanks() {
            return ranksData.ranks != null && ranksData.ranks.length !== 0;
        }

        //Show Current Messages otherwise Show error
        function viewRanks() {
            if (!areRanks()) {
                vorpal.log(chalk.red('There are no Ranks'));
            } else {
                _.forEach(ranksData.ranks, value =>
                    vorpal.log(
                        chalk.yellow('- ') +
                            chalk.cyan(value.name) +
                            ' : ' +
                            chalk.greenBright(value.requiredXp.toString())
                    )
                );
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
                    message: 'Select Action for Ranks',
                    choices: () => {
                        const actionChoices = [
                            {
                                name: 'Add Rank',
                                value: 'add',
                            },
                            {
                                name: 'View all Ranks',
                                value: 'view',
                            },
                            {
                                name: 'Finish Editing',
                                value: 'finish',
                            },
                        ];
                        if (areRanks()) {
                            actionChoices.splice(
                                1,
                                0,
                                {
                                    name: 'Edit a Rank',
                                    value: 'edit',
                                },
                                {
                                    name: 'Remove a Rank',
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
                    const { addRank, requiredXp }: { addRank: string; requiredXp: number } = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'addRank',
                            message: 'Enter Rank Name You want to Add',
                        },
                        {
                            type: 'number',
                            name: 'requiredXp',
                            message: 'Enter Required XP for Rank',
                        },
                    ]);
                    ranksData.ranks!.push({ name: addRank, requiredXp });
                    ranksData.ranks.sort((a, b) => a.requiredXp - b.requiredXp);
                    break;
                }
                case 'edit': {
                    const editResults: {
                        selectRankIndex: number;
                        editedRankName: string;
                        editedRankXp: number;
                    } = await inquirer.prompt([
                        {
                            type: 'list',
                            name: 'selectRankIndex',
                            message: 'Select the Rank you want to Edit',
                            choices: (): Array<{ name: string; value: number }> =>
                                _.map(ranksData.ranks, (value, index) => {
                                    return { name: value.name, value: index };
                                }),
                        },
                        //This Prompt Needs to Edit The message, may not be the best way to edit as you have to enter the message again
                        {
                            type: 'input',
                            name: 'editedRankName',
                            message: 'Edit Rank Name',
                            default: (answers: { selectRankIndex: number }) =>
                                ranksData.ranks![answers.selectRankIndex].name,
                        },
                        //This Prompt Needs to Edit The message, may not be the best way to edit as you have to enter the message again
                        {
                            type: 'number',
                            name: 'editedRankXp',
                            message: 'Edit Rank Required Xp',
                            default: (answers: { selectRankIndex: number }) =>
                                ranksData.ranks![answers.selectRankIndex].requiredXp,
                        },
                    ]);
                    ranksData.ranks![editResults.selectRankIndex] = {
                        name: editResults.editedRankName,
                        requiredXp: editResults.editedRankXp,
                    };
                    ranksData.ranks.sort((a, b) => a.requiredXp - b.requiredXp);
                    break;
                }
                case 'remove': {
                    const { selectedRankIndex }: { selectedRankIndex: number } = await inquirer.prompt([
                        {
                            type: 'list',
                            name: 'selectedRankIndex',
                            message: 'Select the Rank you want to Remove',
                            choices: (): Array<{ name: string; value: number }> =>
                                _.map(ranksData.ranks, (value, index) => {
                                    return { name: value.name, value: index };
                                }),
                        },
                    ]);
                    ranksData.ranks!.splice(selectedRankIndex, 1);
                    break;
                }
                case 'view': {
                    viewRanks();
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
        viewRanks();

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
                .doc('ranks')
                .set(ranksData, { merge: true });
        }
    });

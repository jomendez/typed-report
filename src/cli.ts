#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import { dirname } from 'path';
import { getProgram, typeCoverage } from './coverage';
const program = new Command();

interface ICliOptions {
  excludeSpec?: boolean;
}

function coverageHandler(tsConfigPath: string, opts: ICliOptions) {
    const coverage = typeCoverage(getProgram({ tsConfig: tsConfigPath, rootDir: dirname(tsConfigPath) })!, opts.excludeSpec);

    console.log('\n');
    if(opts.excludeSpec){
      console.log(chalk.yellow('spec files excluded from the report'));
    }
    console.log(`${coverage.knownTypes} of ${coverage.totalTypes} types are known.`);
    console.log(`Your type coverage is: ${printPercentageWithColor(coverage.percentage.toFixed(2))}%`);
    console.log(`Total of uknown types: ${coverage.numberOfAny}`);
}

program
    .command('coverage <tsconfig.json>')
    .option('-e, --exclude-spec', 'Exclude spec files from report ')
    .description('Calculate type coverage for your project')
    .action(coverageHandler);

program.action(() => {
    program.help();
});

program.parse(process.argv);

function printPercentageWithColor(percent: string) {
  const percentInt = parseInt(percent);
    if (percentInt <= 80) {
        return chalk.red(percent);
    } else if (percentInt > 80 && percentInt < 95) {
        return chalk.yellow(percent);
    } else if (percentInt >= 95) {
        return chalk.green(percent);
    }
}

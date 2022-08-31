#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import { dirname } from 'path';
import { getProgram, typeCoverage } from './coverage';
const program = new Command();

interface ICliOptions {
    excludeSpec?: boolean;
    usage?: boolean;
    badVars?: boolean;
}

function coverageHandler(tsConfigPath: string, opts: ICliOptions) {
    const coverage = typeCoverage(
        getProgram({ tsConfig: tsConfigPath, rootDir: dirname(tsConfigPath) })!,
        opts.excludeSpec,
    );
    const topTenTypesUsed = Object.entries(coverage.aggregatedTypes)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 10)
        .map((x) => `<${x[0]}> - ${chalk.yellow(x[1] as string)}`)
        .join('\n');
    const notMeaningfulVars = (coverage.badVars as string[]).filter((x) => x.length < 4).join(', ');
    console.log('\n');
    if (opts.excludeSpec) {
        console.log(chalk.yellow('spec files excluded from the report'));
    }
    if (opts.usage) {
        console.log('\n');
        console.log(chalk.yellow('Top 10 most used types <type> - <total>'));
        console.log(topTenTypesUsed);
        console.log('\n');
    }
    if (opts.badVars) {
        console.log('\n');
        console.log(chalk.yellow('Display not optimal variable names'));
        console.log(notMeaningfulVars);
        console.log('\n');
    }
    console.log(`${coverage.knownTypes} of ${coverage.totalTypes} types are known.`);
    console.log(`Your type coverage is: ${printPercentageWithColor(coverage.percentage.toFixed(2))}%`);
    console.log(`Total of unknown types: ${coverage.numberOfAny}`);
}

program
    .command('coverage <tsconfig.json>')
    .description('Calculate type coverage for your project')
    .option('-e, --exclude-spec', 'Exclude spec files from report ')
    .option('-u, --usage', 'Display top 10 most used types ')
    .option('-b, --bad-vars', 'Display not optimal variable names ')
    .action(coverageHandler);

program.action(() => {
    program.help();
});

program.parse(process.argv);

function printPercentageWithColor(percent: string) {
    const percentInt = parseInt(percent, 10);
    if (percentInt <= 80) {
        return chalk.red(percent);
    } else if (percentInt > 80 && percentInt < 95) {
        return chalk.yellow(percent);
    } else if (percentInt >= 95) {
        return chalk.green(percent);
    }
}

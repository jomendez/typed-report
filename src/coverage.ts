import chalk from 'chalk';
import * as ts from 'typescript';

export function typeCoverage(program: ts.Program, excludeSpec = false) {
    let sourceFileGlobal: ts.SourceFile;
    const checker = program.getTypeChecker();

    const result = {
        knownTypes: 0,
        numberOfAny: 0,
        percentage: 100,
        totalTypes: 0,
    };

    function report(node: ts.Node, message: string) {
        const { line, character } = sourceFileGlobal.getLineAndCharacterOfPosition(node.getStart());
        console.log(
            chalk.red(`Uknown type found at: ${sourceFileGlobal.fileName} (${line + 1},${character + 1}): ${message}`),
        );
    }

    function visit(node: ts.Node) {
        if (
            ts.isIdentifier(node) &&
            (ts.isMethodDeclaration(node.parent) ||
                ts.isGetAccessor(node.parent) ||
                ts.isFunctionDeclaration(node.parent))
        ) {
            const typeObj = checker.getTypeAtLocation(node.parent);
            const type =
                checker.typeToString(typeObj).indexOf('() => ') > -1
                    ? checker
                          .typeToString(typeObj)
                          .split('() => ')
                          .join('')
                    : checker.typeToString(typeObj);
            result.totalTypes++;
            if (type !== 'any') {
                result.knownTypes++;
            }
            if (type === 'any') {
                result.numberOfAny++;
                report(node, node.escapedText.toString());
            }
        } else if (
            ts.isIdentifier(node) &&
            (ts.isVariableDeclaration(node.parent) ||
                ts.isParameter(node.parent) ||
                ts.isPropertyDeclaration(node.parent))
        ) {
            const type = checker.getTypeAtLocation(node);
            if (type) {
                result.totalTypes++;
                if (checker.typeToString(type) !== 'any') {
                    result.knownTypes++;
                }
                if (checker.typeToString(type) === 'any') {
                    result.numberOfAny++;
                    report(node, node.escapedText.toString());
                }
            }
        }
        node.forEachChild(visit);
    }

    for (const sourceFile of program.getSourceFiles()) {
        if (
            !sourceFile.isDeclarationFile &&
            !sourceFile.fileName.includes('/node_modules/') &&
            !sourceFile.fileName.includes('/dist/') &&
            !(sourceFile.fileName.includes('.spec.ts') && excludeSpec)
        ) {
            sourceFileGlobal = sourceFile;
            visit(sourceFile);
        }
    }

    if (result.totalTypes > 0) {
        result.percentage = (100 * result.knownTypes) / result.totalTypes;
    }

    return result;
}

export interface ICompilerOptions {
    /**
     * If given, all the file paths in the collected type info will be resolved relative to this directory.
     */
    rootDir?: string;

    /**
     * Path to your project's tsconfig file
     */
    tsConfig?: string;

    // You probably never need to touch these two - they are used by the integration tests to setup
    // a virtual file system for TS:
    tsConfigHost?: ts.ParseConfigHost;
    tsCompilerHost?: ts.CompilerHost;
}

export function getProgram(options: ICompilerOptions) {
    let program: ts.Program | undefined;
    if (options.tsConfig) {
        const configHost = options.tsConfigHost || ts.sys;
        const { config, error } = ts.readConfigFile(options.tsConfig, configHost.readFile);
        if (error) {
            throw new Error(`Error while reading ${options.tsConfig}: ${error.messageText}`);
        }

        const parsed = ts.parseJsonConfigFileContent(config, configHost, options.rootDir || '');
        if (parsed.errors.length) {
            const errors = parsed.errors.map((e) => e.messageText).join(', ');
            throw new Error(`Error while parsing ${options.tsConfig}: ${errors}`);
        }

        program = ts.createProgram(parsed.fileNames, parsed.options, options.tsCompilerHost);
    }
    return program;
}

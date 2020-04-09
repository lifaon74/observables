import { IArgumentParser, IArgumentParserOptions, IParseResult, IParseResultJSON, } from './interfaces';
import { IndentLines } from './snipets';
import { Command } from './command/implementation';
import { ICommand, TCommandFunctionArguments } from './command/interfaces';
import { ICommandArgument } from './command/argument/interfaces';
import {
  COMMAND_ARGUMENT_NAME_AND_VALUE_REGEXP, COMMAND_ARGUMENT_NAME_REGEXP, COMMAND_ARGUMENT_VALUE_REGEXP, CommandArgument
} from './command/argument/implementation';
import { IReadonlyMap } from '../../src/misc/readonly-map/interfaces';
import { SIFT4 } from '../../src/classes/sift4';
import { ConstructClassWithPrivateMembers } from '@lifaon/class-factory';


export function ParseResultToJSON(instance: IParseResult): IParseResultJSON {
  return {
    command: instance.command.name,
    args: Object.fromEntries(
      Array.from<[ICommandArgument, any], [string, any]>(instance.args.entries(), ([commandArgument, value]: [ICommandArgument, string]) => {
        return [commandArgument.name, commandArgument.castValue(value)];
      })
    )
  };
}

export function ParseResultRun(instance: IParseResult): Promise<void> {
  return instance.command.run(instance.toJSON().args);
}

export class ParseResult implements IParseResult {
  readonly command: ICommand;
  readonly args: IReadonlyMap<ICommandArgument, string>;

  constructor(command: ICommand, args: IReadonlyMap<ICommandArgument, string>) {
    this.command = command;
    this.args = args;
  }

  toJSON(): IParseResultJSON {
    return ParseResultToJSON(this);
  }

  run(): Promise<void> {
    return ParseResultRun(this);
  }
}


/*--------------------------*/


export const ARGUMENT_PARSER_PRIVATE = Symbol('argument-parser-private');

export interface IArgumentParserPrivate {
  programName: string;
  description: string;
  version: string;
  commands: ICommand[];
  mappedCommands: Map<string, ICommand>;
}

export interface IArgumentParserInternal extends IArgumentParser {
  [ARGUMENT_PARSER_PRIVATE]: IArgumentParserPrivate;
}

export function ConstructArgumentParser(
  instance: IArgumentParser,
  options: IArgumentParserOptions
): void {
  ConstructClassWithPrivateMembers(instance, ARGUMENT_PARSER_PRIVATE);
  const privates: IArgumentParserPrivate = (instance as IArgumentParserInternal)[ARGUMENT_PARSER_PRIVATE];

  privates.programName = options.programName;
  privates.description = options.description || '';
  privates.version = options.version || '';
  privates.commands = [];
  privates.mappedCommands = new Map<string, ICommand>();

  instance.add(ArgumentParserGetHelpCommand(instance));

  if (privates.version !== '') {
    instance.add(ArgumentParserGetVersionCommand(instance));
  }
}


/** FUNCTIONS **/

// export function NormalizeArgumentParserAddArgumentValue(input: IArgumentParserAddArgumentValue): IArgumentValue {
//   const result: IArgumentValue = {} as IArgumentValue;
//
//   if (typeof input.name === 'string') {
//     result.name = input.name;
//   } else {
//     throw new TypeError(`Expected string as IArgumentParserAddArgumentValue.name`);
//   }
//
//   if (typeof input.type === void 0) {
//     result.type = 'string';
//   } else if (['string', 'number', 'boolean', 'json'].includes(input.type as string)) {
//     result.name = input.name;
//   } else {
//     throw new TypeError(`Expected 'string', 'number', 'boolean' or 'json' as IArgumentParserAddArgumentValue.type`);
//   }
//
//   result.required = (typeof input.required === void 0) ? false : Boolean(input.required);
//
//   return result;
// }
//
// export function NormalizeArgumentParserAddOptions(name: string, input: IArgumentParserAddOptions): ICommand {
//   const result: ICommand = {} as ICommand;
//
//   if (typeof name !== 'string') {
//     throw new TypeError(`Expected string' as name`);
//   }
//
//   if (input.aliases === void 0) {
//     result.aliases = ['--' + name];
//   } else if (Array.isArray(input.aliases) && input.aliases.every(alias => (typeof alias === 'string'))) {
//     result.aliases = input.aliases.slice();
//   } else {
//     throw new TypeError(`Expected string[] as IArgumentParserAddOptions.aliases`);
//   }
//
//   if (input.args === void 0) {
//     result.args = [];
//   } else if (Array.isArray(input.args)) {
//     result.args = input.args.map(NormalizeArgumentParserAddArgumentValue);
//   } else {
//     throw new TypeError(`Expected string as IArgumentParserAddArgumentValue.help`);
//   }
//
//   if (input.help === void 0) {
//     result.help = '';
//   } else if (typeof input.help === 'string') {
//     result.help = input.help;
//   } else {
//     throw new TypeError(`Expected string as IArgumentParserAddArgumentValue.help`);
//   }
//
//   result.required = (typeof input.required === void 0) ? false : Boolean(input.required);
//
//   return result;
// }


export function CommandArgumentToString(commandArgument: ICommandArgument): string[] {
  const requiredSting: string = commandArgument.required
    ? 'required'
    : (
      (commandArgument.defaultValue === void 0)
        ? 'optional'
        : ('default: ' + JSON.stringify(commandArgument.defaultValue))
    );

  const aliases: string[] = (commandArgument.aliases.size > 1) ? [
    `aliases: ${ Array.from(commandArgument.aliases).slice(1).join(', ') }`,
  ] : [];

  const description: string[] = (commandArgument.description !== '') ? [
    `description: ${ commandArgument.description }`,
  ] : [];

  const extra: string[] = [
    ...aliases,
    ...description,
  ];

  return [
    `'${ commandArgument.name }' (${ requiredSting }):`,
    ...IndentLines(extra),
  ];
}

export function CommandArgumentsToString(args: Pick<ICommandArgument[], 'map' | 'flat'>): string[] {
  return args
    .map((argument: ICommandArgument) => {
      return [
        ...CommandArgumentToString(argument),
        '',
      ];
    })
    .flat();
}

export function CommandToString(command: ICommand): string[] {
  const aliases: string[] = (command.aliases.size > 1) ? [
    `aliases: ${ Array.from(command.aliases).slice(1).join(', ') }`,
  ] : [];

  const description: string[] = (command.description !== '') ? [
    `description: ${ command.description }`,
  ] : [];

  const args: string[] = (command.args.size > 0) ? [
    `arguments:`,
    ...IndentLines(CommandArgumentsToString(Array.from(command.args))),
  ] : [];

  const extra: string[] = [
    ...aliases,
    ...description,
    ...args
  ];

  return [
    `'${ command.name }':`,
    ...IndentLines(extra),
  ];
}

export function CommandsToString(commands: Pick<ICommand[], 'map' | 'flat'>): string[] {
  return commands
    .map((command: ICommand) => {
      return [
        ...CommandToString(command),
        '',
      ];
    })
    .flat();
}

/** METHODS **/

export function ArgumentParserGetHelpCommand(instance: IArgumentParser): ICommand {
  return new Command({
    aliases: ['help', '-h', '--help'],
    description: 'Show this help message and exit.',
    args: [
      new CommandArgument({
        aliases: ['--command', '-c'],
        type: 'string',
        description: 'The command to show the help for',
      })
    ],
    run(args: TCommandFunctionArguments) {
      console.log(instance.help(args['--command']));
    }
  });
}

export function ArgumentParserGetVersionCommand(instance: IArgumentParser): ICommand {
  return new Command({
    aliases: ['version', '-v', '--version'],
    description: 'Show program\'s version number and exit.',
    run() {
      console.log(instance.version());
    }
  });
}

export function ArgumentParserAdd(instance: IArgumentParser, command: ICommand): void {
  const privates: IArgumentParserPrivate = (instance as IArgumentParserInternal)[ARGUMENT_PARSER_PRIVATE];

  command.aliases.forEach((alias: string) => {
    if (privates.mappedCommands.has(alias)) {
      throw new Error(`Command's alias '${ alias }' already exists for command ${ privates.mappedCommands.get(alias) }`);
    }
  });

  privates.commands.push(command);

  command.aliases.forEach((alias: string) => {
    privates.mappedCommands.set(alias, command)
  });
}

export function ArgumentParserVersion(instance: IArgumentParser): string {
  const privates: IArgumentParserPrivate = (instance as IArgumentParserInternal)[ARGUMENT_PARSER_PRIVATE];
  if (privates.version === '') {
    throw new Error(`No version available`);
  } else {
    return 'v' + privates.version;
  }
}

export function ArgumentParserHelpAll(instance: IArgumentParser): string[] {
  const privates: IArgumentParserPrivate = (instance as IArgumentParserInternal)[ARGUMENT_PARSER_PRIVATE];
  return [
    `usage: ${ privates.programName }`,
    ``,
    `commands:`,
    ``,
    ...IndentLines(CommandsToString(privates.commands))
  ];
}

export function ArgumentParserHelpSingle(instance: IArgumentParser, name: string): string[] {
  const privates: IArgumentParserPrivate = (instance as IArgumentParserInternal)[ARGUMENT_PARSER_PRIVATE];
  if (privates.mappedCommands.has(name)) {
    return [
      `Help for command:`,
      ...CommandToString(privates.mappedCommands.get(name) as ICommand)
    ];
  } else {
    throw new Error(`Help not available for '${ name }'`);
  }
}

export function ArgumentParserHelp(instance: IArgumentParser, name?: string): string[] {
  return (name === void 0)
    ? ArgumentParserHelpAll(instance)
    : ArgumentParserHelpSingle(instance, name);
}



function CreateCommandArgumentDoesntExistsError(argument: string, command: ICommand): Error {
  const closest: IClosestCommandArgument | null = FindClosestCommandArgument(argument, command);
  return new Error(`Command's argument '${ argument }' doesn't exist for the command '${ command.name }'.${ (closest === null) ? '' : ` Did you mean '${ closest.alias }' ?`}`);
}

function CreateCommandArgumentAlreadySpecifiedError(argument: string, command: ICommand): Error {
  return new Error(`Command's argument '${ argument }' has already been specified for the command '${ command.name }'`);
}

interface IClosestCommandArgument {
  argument: ICommandArgument;
  alias: string;
}

function FindClosestCommandArgument(argument: string, command: ICommand): IClosestCommandArgument | null {
  let result: IClosestCommandArgument | null = null;
  let bestScore: number = Number.POSITIVE_INFINITY;

  const commandArgumentsIterator: Iterator<ICommandArgument> = command.args.values();
  let commandArgumentsResult: IteratorResult<ICommandArgument>;
  while (!(commandArgumentsResult = commandArgumentsIterator.next()).done) {
    const aliasIterator: Iterator<string> = commandArgumentsResult.value.aliases.values();
    let aliasResult: IteratorResult<string>;
    while (!(aliasResult = aliasIterator.next()).done) {
      const score: number = SIFT4(argument, aliasResult.value);
      if (score < bestScore) {
        bestScore = score;
        result = {
          argument: commandArgumentsResult.value,
          alias: aliasResult.value,
        };
      }
    }
  }

  return result;
}

export function ArgumentParserParseArgs(instance: IArgumentParser, args: string[]): IParseResult {
  if (args.length > 0) {
    const privates: IArgumentParserPrivate = (instance as IArgumentParserInternal)[ARGUMENT_PARSER_PRIVATE];


    let argument: string | null;
    let argsIndex: number = 0;
    argument = args[argsIndex++];

    if (privates.mappedCommands.has(argument)) {
      const command: ICommand = privates.mappedCommands.get(argument) as ICommand;
      const commandArgumentMap: Map<ICommandArgument, string> = new Map<ICommandArgument, string>();
      const remainingCommandArguments: Set<ICommandArgument> = new Set<ICommandArgument>(command.args);

      while (argsIndex < args.length) {
        if (remainingCommandArguments.size > 0) {
          argument = args[argsIndex++];

          let match: RegExpExecArray | null;
          let commandArgument: ICommandArgument | null;
          let commandArgumentValue: string;

          if ((match = COMMAND_ARGUMENT_NAME_AND_VALUE_REGEXP.exec(argument)) !== null) {
            // console.log(match);
            commandArgument = command.findArgument(match[1]);

            if (commandArgument === null) {
              throw CreateCommandArgumentDoesntExistsError(match[1], command);
            } else if (remainingCommandArguments.has(commandArgument)) {
              commandArgumentValue = match[3];
            } else {
              throw CreateCommandArgumentAlreadySpecifiedError(match[1], command);
            }
          } else if ((match = COMMAND_ARGUMENT_NAME_REGEXP.exec(argument)) !== null) {
            // console.log(match);

            commandArgument = command.findArgument(match[1]);

            if (commandArgument === null) {
              throw CreateCommandArgumentDoesntExistsError(argument, command);
            } else if (remainingCommandArguments.has(commandArgument)) {

              if (argsIndex < args.length) {
                argument = args[argsIndex++];
                if ((match = COMMAND_ARGUMENT_VALUE_REGEXP.exec(argument)) !== null) {
                  commandArgumentValue = match[2];
                } else {
                  throw new Error(`Invalid syntax for the command argument's value '${ argument }' for the command '${ command.name }'`);
                }
              } else {
                throw new Error(`Not enough input arguments for the command '${ command.name }': expected a value for '${ argument }'`);
              }
            } else {
              throw CreateCommandArgumentAlreadySpecifiedError(argument, command);
            }
          } else { // inline arg
            commandArgumentValue = argument;
            commandArgument = (remainingCommandArguments.values().next().value as ICommandArgument);
            // assert(commandArgument !== void 0);

            // console.log(`Infer input argument'${ commandArgumentValue }' as command's argument '${ commandArgument.name }'`);
          }

          remainingCommandArguments.delete(commandArgument);
          commandArgumentMap.set(commandArgument, commandArgumentValue);
        } else {
          throw new Error(`Too much input arguments for the command '${ command.name }': '${ args.slice(argsIndex).join(' ') }'`);
        }
      }

      remainingCommandArguments.forEach((commandArgument: ICommandArgument) => {
        if (commandArgument.required) {
          throw new Error(`Missing required command's argument '${ commandArgument.name }' for the command '${ command.name }'`);
        } else {
          commandArgumentMap.set(commandArgument, commandArgument.defaultValue);
        }
      });

      return new ParseResult(command, commandArgumentMap);
    } else {
      throw new Error(`Command '${ argument }' doesn't exist`);
    }
  } else {
    throw new Error(`Not enough input arguments`);
  }
}

export function ArgumentParserRun(instance: IArgumentParser, args: string[] = process.argv.slice(2)): Promise<void> {
  return instance.parseArgs(args).run();
}

/** CLASS **/

export class ArgumentParser implements IArgumentParser {

  constructor(options: IArgumentParserOptions) {
    ConstructArgumentParser(this, options);
  }

  add(command: ICommand): this {
    ArgumentParserAdd(this, command);
    return this;
  }

  version(): string {
    return ArgumentParserVersion(this);
  }

  help(name?: string): string {
    return ArgumentParserHelp(this, name).join('\n');
  }

  parseArgs(args: string[]): IParseResult {
    return ArgumentParserParseArgs(this, args);
  }

  run(args?: string[]): Promise<void> {
    return ArgumentParserRun(this, args);
  }
}

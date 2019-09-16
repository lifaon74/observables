import { ICommand, TCommandFunctionArguments } from './command/interfaces';
import { ICommandArgument } from './command/argument/interfaces';
import { IReadonlyMap } from '../../src/misc/readonly-map/interfaces';

export interface IArgumentParserOptions {
  programName: string;
  version?: string;
  description?: string;
}

/*----------------------------*/

export interface IParseResultConstructor {
  new(command: ICommand, args: IReadonlyMap<ICommandArgument, string>): IParseResult;
}
export interface IParseResult {
  readonly command: ICommand;
  readonly args: IReadonlyMap<ICommandArgument, string>;

  toJSON(): IParseResultJSON;
  run(): Promise<void>;
}

export interface IParseResultJSON {
  command: string;
  args: TCommandFunctionArguments;
}

/*----------------------------*/

export interface IArgumentParserConstructor {
  new(options: IArgumentParserOptions): IArgumentParser;
}

export interface IArgumentParser {
  add(command: ICommand): this;
  version(): string;
  help(name?: string): string;
  parseArgs(args: string[]): IParseResult;
  run(args?: string[]): Promise<void>;
}


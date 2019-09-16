import { ICommandArgument } from './argument/interfaces';
import { IReadonlySet } from '../../../src/misc/readonly-set/interfaces';
import { TPromiseOrValue } from '../../../src/promises/interfaces';

export type TCommandFunction = (this: ICommand, args: TCommandFunctionArguments) => TPromiseOrValue<void>;
export type TCommandFunctionArguments = { [key: string]: any };

export interface ICommandOptions {
  aliases: Iterable<string>;
  run: TCommandFunction;
  description?: string; // default: empty string
  args?: Iterable<ICommandArgument>; // default: empty map
}

export interface ICommandConstructor {
  new(options: ICommandOptions): ICommand;
}

export interface ICommand {
  readonly name: string;
  readonly aliases: IReadonlySet<string>;
  readonly description: string;
  readonly args: IReadonlySet<ICommandArgument>;

  findArgument(alias: string): ICommandArgument | null;
  run(args?: TCommandFunctionArguments): Promise<void>;
}


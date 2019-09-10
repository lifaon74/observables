import { ICommandArgument } from './argument/interfaces';
import { IReadonlySet } from '../../../src/misc/readonly-set/interfaces';

export interface ICommandOptions {
  aliases: Iterable<string>;
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
}


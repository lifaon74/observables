import { ICommand, ICommandOptions, TCommandFunction, TCommandFunctionArguments } from './interfaces';
import { ICommandArgument } from './argument/interfaces';
import { IsObject } from '../../../src/helpers';
import { IReadonlySet } from '../../../src/misc/readonly-set/interfaces';
import { ReadonlySet } from '../../../src/misc/readonly-set/implementation';
import { PromiseTry } from '../../../src/promises/types/helpers';
import { ConstructClassWithPrivateMembers } from '@lifaon/class-factory';

export const COMMAND_NAME_PATTERN = '([\\w]+)';
export const COMMAND_NAME_REGEXP = new RegExp(`^${ COMMAND_NAME_PATTERN }$`);
export const COMMAND_NAME_ALIAS_PATTERN = '([\\w\\-]+)';
export const COMMAND_NAME_ALIAS_REGEXP = new RegExp(`^${ COMMAND_NAME_ALIAS_PATTERN }$`);

export function IsValidCommandName(name: string, strict: boolean = true): boolean {
  return strict
    ? COMMAND_NAME_REGEXP.test(name)
    : COMMAND_NAME_ALIAS_REGEXP.test(name);
}

/*--------------*/

export const COMMAND_PRIVATE = Symbol('command-private');

export interface ICommandPrivate {
  aliases: IReadonlySet<string>;
  run: TCommandFunction;
  description: string;
  args: IReadonlySet<ICommandArgument>;
}

export interface ICommandInternal extends ICommand {
  [COMMAND_PRIVATE]: ICommandPrivate;
}

export function ConstructCommand(
  instance: ICommand,
  options: ICommandOptions
): void {
  ConstructClassWithPrivateMembers(instance, COMMAND_PRIVATE);
  const privates: ICommandPrivate = (instance as ICommandInternal)[COMMAND_PRIVATE];

  if (IsObject(options)) {

    if (Symbol.iterator in options.aliases) {
      privates.aliases = new ReadonlySet<string>(options.aliases);
      if (privates.aliases.size > 0) {
        let index: number = 0;
        privates.aliases.forEach((alias: string) => {
          if (IsValidCommandName(alias, index === 0)) {
            index++;
          } else {
            throw new TypeError(`Invalid Command's alias '${ alias }' at index ${ index } in options.aliases`);
          }
        });
      } else {
        throw new TypeError(`Expected at least one alias in options.aliases`);
      }
    } else {
      throw new TypeError(`Expected Iterable<string> or void as options.aliases`);
    }

    if (typeof options.run === 'function') {
      privates.run = options.run;
    } else {
      throw new TypeError(`Expected function options.run`);
    }

    if (options.description === void 0) {
      privates.description = '';
    } else if (typeof options.description === 'string') {
      privates.description = options.description;
    } else {
      throw new TypeError(`Expected string or void as options.description`);
    }

    if (options.args === void 0) {
      privates.args = new ReadonlySet<ICommandArgument>([]);
    } else if (Symbol.iterator in options.args) {
      privates.args = new ReadonlySet<ICommandArgument>(options.args);
    } else {
      throw new TypeError(`Expected Iterable<ICommandArgument> or void as options.aliases`);
    }
  } else {
    throw new TypeError(`Expected object or void as options`);
  }
}

export function CommandFindArgument(
  instance: ICommand,
  alias: string
): ICommandArgument | null {
  const privates: ICommandPrivate = (instance as ICommandInternal)[COMMAND_PRIVATE];
  const iterator: Iterator<ICommandArgument> = privates.args.values();
  let result: IteratorResult<ICommandArgument>;
  while (!(result = iterator.next()).done) {
    if (result.value.aliases.has(alias)) {
      return result.value;
    }
  }
  return null;
}

export function CommandRun(
  instance: ICommand,
  args: TCommandFunctionArguments = {},
): Promise<void> {
  return PromiseTry<void>(() => {
    return (instance as ICommandInternal)[COMMAND_PRIVATE].run.call(instance, args);
  })
}

export class Command implements ICommand {
  constructor(options: ICommandOptions) {
    ConstructCommand(this, options);
  }

  get name(): string {
    return ((this as unknown) as ICommandInternal)[COMMAND_PRIVATE].aliases.values().next().value;
  }

  get aliases(): IReadonlySet<string> {
    return ((this as unknown) as ICommandInternal)[COMMAND_PRIVATE].aliases;
  }

  get description(): string {
    return ((this as unknown) as ICommandInternal)[COMMAND_PRIVATE].description;
  }

  get args(): IReadonlySet<ICommandArgument> {
    return ((this as unknown) as ICommandInternal)[COMMAND_PRIVATE].args;
  }

  findArgument(alias: string): ICommandArgument | null {
    return CommandFindArgument(this, alias);
  }

  run(args?: TCommandFunctionArguments): Promise<void> {
    return CommandRun(this, args);
  }
}

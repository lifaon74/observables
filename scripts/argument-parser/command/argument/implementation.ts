import { ICommandArgument, ICommandArgumentOptions, TCommandArgumentType } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../src/misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../../src/helpers';
import { IReadonlySet } from '../../../../src/misc/readonly-set/interfaces';
import { ReadonlySet } from '../../../../src/misc/readonly-set/implementation';

export const COMMAND_ARGUMENT_NAME_PATTERN = '(-[\\w\\-]+)';
export const COMMAND_ARGUMENT_NAME_REGEXP = new RegExp(`^${ COMMAND_ARGUMENT_NAME_PATTERN }$`);
export const COMMAND_ARGUMENT_VALUE_PATTERN = '(["\']?)(.*)\\1';
export const COMMAND_ARGUMENT_VALUE_REGEXP = new RegExp(`^${ COMMAND_ARGUMENT_VALUE_PATTERN }$`);
export const COMMAND_ARGUMENT_NAME_AND_VALUE_PATTERN = `${ COMMAND_ARGUMENT_NAME_PATTERN }\\s*=\\s*(["']?)(.*)\\2`;
export const COMMAND_ARGUMENT_NAME_AND_VALUE_REGEXP = new RegExp(`^${ COMMAND_ARGUMENT_NAME_AND_VALUE_PATTERN }$`);

export function IsValidCommandArgumentName(name: string): boolean {
  return COMMAND_ARGUMENT_NAME_REGEXP.test(name);
}

/*--------------*/


export const COMMAND_ARGUMENT_PRIVATE = Symbol('command-argument-private');

export interface ICommandArgumentPrivate {
  aliases: IReadonlySet<string>;
  description: string;
  required: boolean;
  type: TCommandArgumentType;
  defaultValue: any;
}

export interface ICommandArgumentInternal extends ICommandArgument {
  [COMMAND_ARGUMENT_PRIVATE]: ICommandArgumentPrivate;
}

export function ConstructCommandArgument(
  instance: ICommandArgument,
  options: ICommandArgumentOptions
): void {
  ConstructClassWithPrivateMembers(instance, COMMAND_ARGUMENT_PRIVATE);
  const privates: ICommandArgumentPrivate = (instance as ICommandArgumentInternal)[COMMAND_ARGUMENT_PRIVATE];

  if (IsObject(options)) {

    if (Symbol.iterator in options.aliases) {
      privates.aliases = new ReadonlySet<string>(options.aliases);
      if (privates.aliases.size > 0) {
        let index: number = 0;
        privates.aliases.forEach((alias: string) => {
          if (IsValidCommandArgumentName(alias)) {
            index++;
          } else {
            throw new TypeError(`Invalid CommandArgument's alias '${ alias }' at index ${ index } in options.aliases`);
          }
        });
      } else {
        throw new TypeError(`Expected at least one value in options.aliases`);
      }
    } else {
      throw new TypeError(`Expected Iterable<[string, ICommandArgumentArgument]> or void as options.aliases`);
    }

    if (options.description === void 0) {
      privates.description = '';
    } else if (typeof options.description === 'string') {
      privates.description = options.description;
    } else {
      throw new TypeError(`Expected string or void as options.description`);
    }

    if (options.required === void 0) {
      privates.required = false;
    } else if (typeof options.required === 'boolean') {
      privates.required = options.required;
    } else {
      throw new TypeError(`Expected boolean or void as options.required`);
    }

    if (options.type === void 0) {
      privates.type = 'string';
    } else if (['string', 'number', 'boolean', 'json'].includes(options.type)) {
      privates.type = options.type;
    } else {
      throw new TypeError(`Expected 'string', 'number', 'boolean', 'json' or void as options.type`);
    }

    privates.defaultValue = options.defaultValue;
  } else {
    throw new TypeError(`Expected object or void as options`);
  }
}



export function CommandArgumentCastValue(
  instance: ICommandArgument,
  value: string
): any {
  switch ((instance as ICommandArgumentInternal)[COMMAND_ARGUMENT_PRIVATE].type) {
    case 'string':
      return value;
    case 'number':
      return Number(value);
    case 'boolean':
      switch (value) {
        case 'false':
        case '0':
          return false;
        case 'true':
        case '1':
          return true;
        default:
          return Boolean(value);
      }
    case 'json':
      return JSON.parse(value);
    default:
      throw new TypeError(`Unknown type`);
  }
}

export class CommandArgument implements ICommandArgument {
  constructor(options: ICommandArgumentOptions) {
    ConstructCommandArgument(this, options);
  }

  get name(): string {
    return ((this as unknown) as ICommandArgumentInternal)[COMMAND_ARGUMENT_PRIVATE].aliases.values().next().value;
  }

  get aliases(): IReadonlySet<string> {
    return ((this as unknown) as ICommandArgumentInternal)[COMMAND_ARGUMENT_PRIVATE].aliases;
  }

  get description(): string {
    return ((this as unknown) as ICommandArgumentInternal)[COMMAND_ARGUMENT_PRIVATE].description;
  }

  get required(): boolean {
    return ((this as unknown) as ICommandArgumentInternal)[COMMAND_ARGUMENT_PRIVATE].required;
  }

  get type(): TCommandArgumentType {
    return ((this as unknown) as ICommandArgumentInternal)[COMMAND_ARGUMENT_PRIVATE].type;
  }

  get defaultValue(): any {
    return ((this as unknown) as ICommandArgumentInternal)[COMMAND_ARGUMENT_PRIVATE].defaultValue;
  }

  castValue(value: string): any {
    return CommandArgumentCastValue(this, value);
  }
}

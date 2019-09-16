import { IReadonlySet } from '../../../../src/misc/readonly-set/interfaces';

export type TCommandArgumentType = 'string' | 'number' | 'boolean' | 'json';

export interface ICommandArgumentOptions {
  aliases: Iterable<string>;
  description?: string; // default: empty string
  required?: boolean; // default: false
  type?: TCommandArgumentType; // default: 'string'
  defaultValue?: any; // default: undefined
}

export interface ICommandArgumentConstructor {
  new(options: ICommandArgumentOptions): ICommandArgument;
}

export interface ICommandArgument {
  readonly name: string;
  readonly aliases: IReadonlySet<string>;
  readonly description: string;
  readonly required: boolean;
  readonly type: TCommandArgumentType;
  readonly defaultValue: any;

  castValue(value: string): any;
}


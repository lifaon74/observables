import { IProgress, IProgressConstructor, IProgressJSON, IProgressOptions } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../helpers/ClassWithPrivateMembers';
import { IsObject } from '../../helpers';


export const PROGRESS_PRIVATE = Symbol('progress-private');

export interface IProgressPrivate {
  loaded: number;
  total: number;
  name: string | undefined;
}

export interface IProgressInternal extends IProgress {
  [PROGRESS_PRIVATE]: IProgressPrivate;
}

export function ConstructProgress(
  instance: IProgress,
  options?: IProgressOptions | number,
  total?: number,
  name?: string,
): void {
  ConstructClassWithPrivateMembers(instance, PROGRESS_PRIVATE);
  const privates: IProgressPrivate = (instance as IProgressInternal)[PROGRESS_PRIVATE];

  let _options: IProgressOptions;
  if ((options === void 0) || (typeof options === 'number')) {
    _options = {
      loaded: options,
      total: total,
      name: name,
    };
  } else if (IsObject(options) && (total === void 0) && (name === void 0)) {
    _options = options;
  } else {
    throw new TypeError(`Expected Progress(object?) or Progress(number?, number?, string?)`);
  }

  if (_options.total === void 0) {
    privates.total = Number.POSITIVE_INFINITY;
  } else {
    const total: number = Number(_options.total);
    if (Number.isNaN(total) || (total < 0)) {
      throw new TypeError(`Expected positive number as Progress.options.total`);
    } else {
      privates.total = total;
    }
  }

  if (_options.loaded === void 0) {
    privates.loaded = 0;
  } else {
    const loaded: number = Number(_options.loaded);
    if (Number.isNaN(loaded) || (loaded < 0) || (loaded > privates.total)) {
      throw new TypeError(`Expected number in the range [0, ${ privates.total } (total)] as Progress.options.loaded`);
    } else {
      privates.loaded = loaded;
    }
  }

  if (_options.name === void 0) {
    privates.name = void 0;
  } else if (typeof _options.name === 'string') {
    privates.name = _options.name;
  } else {
    throw new TypeError(`Expected string or void as Progress.options.name`);
  }
}

export function IsProgress(value: any): value is IProgress {
  return IsObject(value)
    && value.hasOwnProperty(PROGRESS_PRIVATE as symbol);
}

/** METHODS **/

export function ProgressToJSON(instance: IProgress, allowFloat: boolean = false): IProgressJSON {
  const obj: IProgressJSON = {
    lengthComputable: instance.lengthComputable,
    loaded: instance.loaded,
    total: (allowFloat || instance.lengthComputable) ? instance.total : 0,
  };
  if (instance.name !== void 0) {
    obj.name = instance.name;
  }
  return obj;
}

export function ProgressToString(instance: IProgress): string {
  return instance.lengthComputable
    ? `${ instance.loaded.toString(10) } / ${ instance.total.toString(10) } (${ Math.floor((instance.loaded / instance.total) * 100).toString(10) }%)`
    : instance.loaded.toString(10);
}

/** STATIC **/

export function ProgressFromJSONStatic(constructor: IProgressConstructor, json: IProgressJSON): IProgress {
  const total: number = json.lengthComputable
    ? Math.max(0, json.total)
    : Number.POSITIVE_INFINITY;

  return new constructor({
    total: total,
    loaded: Math.max(0, Math.min(total, json.loaded)),
    name: json.name
  });
}


/** CLASS **/

export class Progress implements IProgress {

  static fromEvent(event: ProgressEvent): IProgress {
    return this.fromJSON(event);
  }

  static fromJSON(json: IProgressJSON): IProgress {
    return ProgressFromJSONStatic(this, json);
  }

  constructor(loaded?: number, total?: number, name?: string);
  constructor(options?: IProgressOptions);
  constructor(options?: IProgressOptions | number, total?: number, name?: string) {
    ConstructProgress(this, options, total, name);
  }

  get lengthComputable(): boolean {
    return ((this as unknown) as IProgressInternal)[PROGRESS_PRIVATE].total !== Number.POSITIVE_INFINITY;
  }

  get loaded(): number {
    return ((this as unknown) as IProgressInternal)[PROGRESS_PRIVATE].loaded;
  }

  get total(): number {
    return ((this as unknown) as IProgressInternal)[PROGRESS_PRIVATE].total;
  }

  get name(): string | undefined {
    return ((this as unknown) as IProgressInternal)[PROGRESS_PRIVATE].name;
  }

  toJSON(allowFloat?: boolean): IProgressJSON {
    return ProgressToJSON(this, allowFloat);
  }

  toString(): string {
    return ProgressToString(this);
  }
}

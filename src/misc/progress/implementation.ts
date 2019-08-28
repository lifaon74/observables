import { IProgress, IProgressConstructor, IProgressJSON, IProgressOptions } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../helpers/ClassWithPrivateMembers';
import { IsObject } from '../../helpers';


export const PROGRESS_PRIVATE = Symbol('progress-private');

export interface IProgressPrivate {
  loaded: number;
  total: number;
}

export interface IProgressInternal extends IProgress {
  [PROGRESS_PRIVATE]: IProgressPrivate;
}

export function ConstructProgress(
  instance: IProgress,
  options?: IProgressOptions | number,
  total?: number
): void {
  ConstructClassWithPrivateMembers(instance, PROGRESS_PRIVATE);
  const privates: IProgressPrivate = (instance as IProgressInternal)[PROGRESS_PRIVATE];

  let _options: IProgressOptions;
  if ((options === void 0) || (typeof options === 'number')) {
    _options = {
      loaded: options,
      total: total,
    };
  } else if (IsObject(options) && (total === void 0)) {
    _options = options;
  } else {
    throw new TypeError(`Expected Progress(object?) or Progress(number?, number?)`);
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

}

export function IsProgress(value: any): value is IProgress {
  return IsObject(value)
    && value.hasOwnProperty(PROGRESS_PRIVATE as symbol);
}

/** METHODS **/

export function ProgressToJSON(instance: IProgress, allowFloat: boolean = false): IProgressJSON {
  return {
    lengthComputable: instance.lengthComputable,
    loaded: instance.loaded,
    total: (allowFloat || instance.lengthComputable) ? instance.total : 0,
  };
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

  constructor(loaded?: number, total?: number);
  constructor(options?: IProgressOptions);
  constructor(options?: IProgressOptions | number, total?: number) {
    ConstructProgress(this, options, total);
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

  toJSON(allowFloat?: boolean): IProgressJSON {
    return ProgressToJSON(this, allowFloat);
  }

  toString(): string {
    return ProgressToString(this);
  }
}

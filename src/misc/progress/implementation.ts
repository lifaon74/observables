import { IProgress, IProgressJSON, IProgressOptions } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../helpers/ClassWithPrivateMembers';
import { IsObject } from '../../helpers';


export const PROGRESS_PRIVATE = Symbol('progress-private');

export interface IProgressPrivate {
  loaded: number;
  total: number;
}

export interface ProgressInternal extends IProgress {
  [PROGRESS_PRIVATE]: IProgressPrivate;
}

export function ConstructProgress(
  instance: IProgress,
  options: IProgressOptions = {}
): void {
  ConstructClassWithPrivateMembers(instance, PROGRESS_PRIVATE);
  const privates: IProgressPrivate = (instance as ProgressInternal)[PROGRESS_PRIVATE];

  if (IsObject(options)) {
    if (options.total === void 0) {
      privates.total = Number.POSITIVE_INFINITY;
    } else {
      const total: number = Number(options.total);
      if (Number.isNaN(total) || (total < 0)) {
        throw new TypeError(`Expected positive number as Progress.options.total`);
      } else {
        privates.total = total;
      }
    }

    if (options.loaded === void 0) {
      privates.loaded = 0;
    } else {
      const loaded: number = Number(options.loaded);
      if (Number.isNaN(loaded) || (loaded < 0) || (loaded > privates.total)) {
        throw new TypeError(`Expected number in the range [0, ${ privates.total } (total)] as Progress.options.loaded`);
      } else {
        privates.loaded = loaded;
      }
    }

  } else {
    throw new TypeError(`Expected object as Progress.options`);
  }

}

export function IsProgress(value: any): value is IProgress {
  return IsObject(value)
    && value.hasOwnProperty(PROGRESS_PRIVATE as symbol);
}

export class Progress implements IProgress {

  static fromEvent(event: ProgressEvent): IProgress {
    return this.fromJSON(event);
  }

  static fromJSON(json: IProgressJSON): IProgress {
    const total: number = json.lengthComputable ? Math.max(0, json.total) : Number.POSITIVE_INFINITY;
    return new Progress({
      total: total,
      loaded: Math.max(0, Math.min(total, json.loaded)),
    });
  }

  constructor(options?: IProgressOptions) {
    ConstructProgress(this, options);
  }

  get lengthComputable(): boolean {
    return ((this as unknown) as ProgressInternal)[PROGRESS_PRIVATE].total !== Number.POSITIVE_INFINITY;
  }

  get loaded(): number {
    return ((this as unknown) as ProgressInternal)[PROGRESS_PRIVATE].loaded;
  }

  get total(): number {
    return ((this as unknown) as ProgressInternal)[PROGRESS_PRIVATE].total;
  }

  toJSON(allowFloat: boolean = false): IProgressJSON {
    return {
      lengthComputable: this.lengthComputable,
      loaded: this.loaded,
      total: (allowFloat || this.lengthComputable) ? this.total : 0,
    };
  }
}

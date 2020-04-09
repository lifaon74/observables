import { Writeable } from '@lifaon/class-factory';

export interface IProgressOptions {
  loaded?: number; // (default => 0)
  total?: number; // (default => Number.POSITIVE_INFINITE)
  name?: string; // (default => undefined)
}


export interface IProgressConstructor {
  fromEvent(event: ProgressEvent, name?: string): IProgress;

  fromJSON(json: IProgressJSON): IProgress;

  new(loaded?: number, total?: number, name?: string): IProgress;

  new(options?: IProgressOptions): IProgress;
}

export interface IProgressJSON extends Writeable<Pick<IProgress, 'loaded' | 'total' | 'lengthComputable' | 'name'>> {
}


/**
 * A Progress is like a ProgressEvent, but doesn't implement all unnecessary properties
 */
export interface IProgress extends IProgressOptions {
  readonly lengthComputable: boolean; // returns true if the length is computable
  readonly loaded: number; // number of bytes, percents, etc... loaded
  readonly total: number; // total number of bytes, percents, etc... to load. INFO MUST be Number.POSITIVE_INFINITE, if length if not computable (lengthComputable => false)
  readonly name?: string; // name may be used to do the distinction between different kind of progress

  toJSON(allowFloat?: boolean): IProgressJSON; // because JSON doesnt support 'Infinite', use lengthComputable.
  toString(): string;
}

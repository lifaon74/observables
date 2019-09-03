export interface IProgressOptions {
  loaded?: number; // (default => 0)
  total?: number; // (default => Number.POSITIVE_INFINITE)
}


export interface IProgressConstructor {
  fromEvent(event: ProgressEvent): IProgress;
  fromJSON(json: IProgressJSON): IProgress;

  new(loaded?: number, total?: number): IProgress;
  new(options?: IProgressOptions): IProgress;
}

export interface IProgressJSON extends Pick<IProgress, 'loaded' | 'total' | 'lengthComputable'> {
}

/**
 * A Progress is like a ProgressEvent, but doesn't implement all unnecessary properties
 */
export interface IProgress {
  readonly lengthComputable: boolean; // returns true if the length is computable
  readonly loaded: number; // number of bytes, percents, etc... loaded
  readonly total: number; // total number of bytes, percents, etc... to load. INFO may be Number.POSITIVE_INFINITE, if length if not computable (lengthComputable => false)

  toJSON(allowFloat?: boolean): IProgressJSON; // because JSON doesnt support 'Infinite', use lengthComputable.
  toString(): string;
}

import { IXHRObservableRequestInit } from '../xhr-observable/types';

export function EnsureRequestInitDoesntContainSignal(requestInit: IXHRObservableRequestInit, observableName: string): void | never {
  if ('signal' in requestInit) {
    throw new Error(`The 'requestInit' argument cannot have a signal: the request is aborted when the ${ observableName } is no more observed.\n`
      + `\tSo prefer something like: signal.addEventListener('abort', () => observable.clearObservers())`);
  }
}

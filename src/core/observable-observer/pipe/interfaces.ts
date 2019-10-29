import { IObserver } from '../../observer/interfaces';
import { IObservable } from '../../observable/interfaces';
import { IObservableObserver } from '../interfaces';
import { TPipeActivateMode } from './types';
import { IPipeContext } from './context/interfaces';
import { IPipeHook } from './hook/interfaces';

/** INTERFACES **/

export interface IPipeConstructor {
  create<TValueObserver, TValueObservable = TValueObserver>(
    create?: (context: IPipeContext<IObserver<TValueObserver>, IObservable<TValueObservable>>) => (IPipeHook<IObserver<TValueObserver>, IObservable<TValueObservable>> | void)
  ): IPipe<IObserver<TValueObserver>, IObservable<TValueObservable>>;

  // creates a Pipe
  new<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(create: () => IObservableObserver<TObserver, TObservable>): IPipe<TObserver, TObservable>;
}

/**
 * A Pipe is an ObservableObserver which self activate/deactivate
 */
export interface IPipe<TObserver extends IObserver<any>, TObservable extends IObservable<any>> extends IObservableObserver<TObserver, TObservable> {
  readonly activateMode: TPipeActivateMode;
  readonly deactivateMode: TPipeActivateMode;
  readonly activated: boolean;

  activate(mode?: TPipeActivateMode): this;

  deactivate(mode?: TPipeActivateMode): this;
}

import {
  IDistinctValueObservable, IDistinctValueObservableConstructor
} from '../../distinct-value-observable/sync/interfaces';

/** INTERFACES **/

export interface ISourceStatic extends Omit<IDistinctValueObservableConstructor, 'new'> {

}

export interface ISourceConstructor extends ISourceStatic {
  new<T>(): ISource<T>;
}

export interface ISourceTypedConstructor<T> extends ISourceStatic {
  new(): ISource<T>;
}

/**
 * A Source is an distinct value emitter:
 *
 * - Every Observers subscribing to the Source will receive the last emitted value:
 *      new Source().emit(123).pipeTo(console.log.bind(console)).activate(); // print 123
 *
 * - A new value is emitted only if it is different than the previous one:
 *      const source = new Source();
 *      source.pipeTo(console.log.bind(console)).activate();
 *      source.emit(123); // print 123
 *      source.emit(123); // nothing append
 *      source.emit(0); // print 0
 *
 */
export interface ISource<T> extends IDistinctValueObservable<T> {
  readonly value: T | undefined; // last emitted value
  valueOf(): T | undefined;

  emit(value: T): this;
}

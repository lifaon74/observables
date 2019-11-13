import { IObservable } from '../../core/observable/interfaces';
import { ISource } from '../../observables/distinct/source/interfaces';
import { IExpression } from '../../observables/distinct/expression/interfaces';

export type TObservableOrValue<T> = IObservable<T> | T;
export type TObservableOrValueToValueType<T extends TObservableOrValue<any>> = T extends IObservable<infer R> ? R : T;
export type TSourceOrValue<T> = ISource<T> | T;
export type TExpressionOrFunction<T> = IExpression<T> | (() => T);

export type TObservableOrValues<T extends any[]> = {
  [K in keyof T]: TObservableOrValue<T[K]>;
};

export type TObservableOrValuesNonStrict<T extends any[]> = Array<any> & TObservableOrValues<T>;


export type TObservableOrValueToObservableValue<T> = (T extends IObservable<infer V> ? V : T);
export type TObservableOrValueToObservable<T> = IObservable<TObservableOrValueToObservableValue<T>>;

export type TObservableOrValueTupleToObservables<TTuple extends any[]> = {
  [K in keyof TTuple]: TObservableOrValueToObservable<TTuple[K]>;
};



import { IAdvancedAbortSignal } from '../../../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { TupleTypes } from '../../../../misc/readonly-list/interfaces';
import { TValueTupleToObservableArray } from '../sync/types';
import { IAsyncFunctionObservable } from './interfaces';

/** TYPES **/


export type TAsyncFunctionObservableFactory = (signal: IAdvancedAbortSignal, ...args: any[]) => Promise<any>;

export type TAsyncFunctionObservableFactoryParameters<TFactory extends TAsyncFunctionObservableFactory> = TFactory extends (signal: IAdvancedAbortSignal, ...args: infer P) => any ? P : never;

export type TAsyncFunctionObservableFactoryReturnType<TFactory extends TAsyncFunctionObservableFactory> = ReturnType<TFactory>;

export type TAsyncFunctionObservableParameters<TFactory extends TAsyncFunctionObservableFactory> = TValueTupleToObservableArray<TAsyncFunctionObservableFactoryParameters<TFactory>>;

export type TAsyncFunctionObservableValue<TFactory extends TAsyncFunctionObservableFactory> = TAsyncFunctionObservableFactoryReturnType<TFactory> extends Promise<infer R> ? R : never;

export type TAsyncFunctionObservableParametersUnion<TFactory extends TAsyncFunctionObservableFactory> = TupleTypes<TAsyncFunctionObservableParameters<TFactory>>;

export type TAsyncFunctionObservableRunCallback<TFactory extends TAsyncFunctionObservableFactory> = (this: IAsyncFunctionObservable<TFactory>) => void;

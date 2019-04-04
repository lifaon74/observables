// import { ILogicAndObservable, ILogicNotObservable, ILogicObservable, ILogicOrObservable } from './interfaces';
// import { ConstructSource, ISourceInternal } from '../source/implementation';
// import { IObserver } from '../../core/observer/interfaces';
// import { Observable } from '../../core/observable/implementation';
// import { IObservable, IObservableContext } from '../../core/observable/interfaces';
// import { IReadonlyList } from '../../misc/readonly-list/interfaces';
// import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
// import { ReadonlyList } from '../../misc/readonly-list/implementation';
// import { Observer } from '../../core/observer/implementation';
//
// export function ArrayLogicAnd(values: boolean[]): boolean {
//   for (let i = 0, l = values.length; i < l; i++) {
//     if (!values[i]) {
//       return false;
//     }
//   }
//   return true;
// }
//
// export function ArrayLogicOr(values: boolean[]): boolean {
//   for (let i = 0, l = values.length; i < l; i++) {
//     if (values[i]) {
//       return true;
//     }
//   }
//   return false;
// }
//
// /*-------------------*/
//
// type TLogicObservableUpdateFunction = (values: boolean[]) => boolean;
// type TLogicObservableUpdateWithValueFunction = (values: boolean[], value: boolean) => boolean;
//
// export const LOGIC_OBSERVABLE_PRIVATE = Symbol('logic-observable-private');
//
// export interface ILogicObservablePrivate {
//   observables: IObservable<boolean>[];
//   readonlyObservables: IReadonlyList<IObservable<boolean>>;
//
//   values: boolean[];
//   value: boolean;
//   valuesObserver: IObserver<boolean>;
//   emitAllowed: boolean;
//   update: TLogicObservableUpdateFunction;
//   updateWithValue: TLogicObservableUpdateWithValueFunction;
// }
//
// export interface ILogicObservableInternal extends ILogicObservable, ISourceInternal<boolean> {
//   [LOGIC_OBSERVABLE_PRIVATE]: ILogicObservablePrivate;
// }
//
// export function ConstructLogicObservable(
//   logicObservable: ILogicObservable,
//   context: IObservableContext<boolean>,
//   observables: Iterable<IObservable<boolean>>,
//   update: TLogicObservableUpdateFunction,
//   updateWithValue: TLogicObservableUpdateWithValueFunction,
// ): void {
//   ConstructSource<boolean>(logicObservable as any, context);
//   ConstructClassWithPrivateMembers(logicObservable, LOGIC_OBSERVABLE_PRIVATE);
//
//   const privates: ILogicObservablePrivate = (logicObservable as ILogicObservableInternal)[LOGIC_OBSERVABLE_PRIVATE];
//   privates.observables = Array.from(observables);
//   privates.readonlyObservables = new ReadonlyList<IObservable<boolean>>(privates.observables);
//   privates.values = Array.from({ length: privates.observables.length }, () => false);
//
//   privates.valuesObserver = new Observer<boolean>((value: boolean, observable: IObservable<boolean>) => {
//     privates.values[privates.observables.indexOf(observable)] = value;
//     if (privates.emitAllowed) {
//       SourceEmit<boolean>(logicObservable as any, privates.updateWithValue(privates.values, value));
//     }
//   }).observe(...privates.observables);
//
//   privates.emitAllowed = true;
//   privates.update = update;
//   privates.updateWithValue = updateWithValue;
//
//   SourceEmit<boolean>(logicObservable as any, privates.update(privates.values));
// }
//
// export function LogicObservableOnObserved(logicObservable: ILogicObservable, observer: IObserver<boolean>): void {
//   const privates: ILogicObservablePrivate = (logicObservable as ILogicObservableInternal)[LOGIC_OBSERVABLE_PRIVATE];
//
//   if ((logicObservable as ILogicObservableInternal)[OBSERVABLE_VALUE_PRIVATE].context.observable.observers.length === 1) {
//     privates.emitAllowed = false;
//     privates.valuesObserver.activate();
//     privates.emitAllowed = true;
//     SourceEmit<boolean>(logicObservable as any, privates.update(privates.values));
//   }
//
//   SourceOnObserved<boolean>(logicObservable as any, observer);
// }
//
// export function LogicObservableOnUnobserved(logicObservable: ILogicObservable, observer: IObserver<boolean>): void {
//   if ((logicObservable as ILogicObservableInternal)[OBSERVABLE_VALUE_PRIVATE].context.observable.observers.length === 0) {
//     (logicObservable as ILogicObservableInternal)[LOGIC_OBSERVABLE_PRIVATE].valuesObserver.deactivate();
//   }
//   SourceOnUnobserved<boolean>(logicObservable as any, observer);
// }
//
//
// function AndObservableUpdateWithValue(values: boolean[], value: boolean): boolean {
//   return value && ArrayLogicAnd(values);
// }
//
// function OrObservableUpdateWithValue(values: boolean[], value: boolean): boolean {
//   return value || ArrayLogicOr(values);
// }
//
//
//
// export abstract class LogicObservable extends Observable<boolean> implements ILogicObservable {
//   protected constructor(
//     observables: Iterable<IObservable<boolean>>,
//     update: TLogicObservableUpdateFunction,
//     updateWithValue: TLogicObservableUpdateWithValueFunction,
//   ) {
//     let context: IObservableContext<boolean> = void 0;
//     super((_context: IObservableContext<boolean>) => {
//       context = _context;
//       return {
//         onObserved: (observer: IObserver<boolean>): void => {
//           LogicObservableOnObserved(this, observer);
//         },
//         onUnobserved: (observer: IObserver<boolean>): void => {
//           LogicObservableOnUnobserved(this, observer);
//         },
//       };
//     });
//     ConstructLogicObservable(this, context, observables, update, updateWithValue);
//   }
//
//   get observables(): IReadonlyList<IObservable<boolean>> {
//     return ((this as unknown) as ILogicObservableInternal)[LOGIC_OBSERVABLE_PRIVATE].readonlyObservables;
//   }
//
//   // get value(): boolean {
//   //   return ((this as unknown) as ILogicObservableInternal)[SOURCE_PRIVATE].value;
//   // }
//   //
//   // valueOf(): boolean {
//   //   return ((this as unknown) as ILogicObservableInternal)[SOURCE_PRIVATE].value;
//   // }
// }
//
// export class LogicAndObservable extends LogicObservable implements ILogicAndObservable {
//   constructor(observables: Iterable<IObservable<boolean>>) {
//     super(observables, ArrayLogicAnd, AndObservableUpdateWithValue);
//   }
// }
//
// export class LogicOrObservable extends LogicObservable implements ILogicOrObservable {
//   constructor(observables: Iterable<IObservable<boolean>>) {
//     super(observables, ArrayLogicOr, OrObservableUpdateWithValue);
//   }
// }
//
//
// /*----------------------------------------*/
//
// export const LOGIC_NOT_OBSERVABLE_PRIVATE = Symbol('logic-not-observable-private');
//
// export interface ILogicNotObservablePrivate {
//   observable: IObservable<boolean>;
//   valueObserver: IObserver<boolean>;
// }
//
// export interface ILogicNotObservableInternal extends ILogicNotObservable, ISourceInternal<boolean> {
//   [LOGIC_NOT_OBSERVABLE_PRIVATE]: ILogicNotObservablePrivate;
// }
//
// export function ConstructLogicNotObservable(
//   logicObservable: ILogicNotObservable,
//   context: IObservableContext<boolean>,
//   observable: IObservable<boolean>,
// ): void {
//   ConstructSource<boolean>(logicObservable as any, context);
//   ConstructClassWithPrivateMembers(logicObservable, LOGIC_NOT_OBSERVABLE_PRIVATE);
//
//   const privates: ILogicNotObservablePrivate = (logicObservable as ILogicNotObservableInternal)[LOGIC_NOT_OBSERVABLE_PRIVATE];
//   privates.observable = observable;
//
//   privates.valueObserver = new Observer<boolean>((value: boolean) => {
//     SourceEmit<boolean>(logicObservable as any, !value);
//   }).observe(privates.observable);
// }
//
// export function LogicNotObservableOnObserved(logicObservable: ILogicNotObservable, observer: IObserver<boolean>): void {
//   const privates: ILogicNotObservablePrivate = (logicObservable as ILogicNotObservableInternal)[LOGIC_NOT_OBSERVABLE_PRIVATE];
//
//   if ((logicObservable as ILogicNotObservableInternal)[OBSERVABLE_VALUE_PRIVATE].context.observable.observers.length === 1) {
//     privates.valueObserver.activate();
//     SourceEmit<boolean>(logicObservable as any, (logicObservable as ILogicNotObservableInternal)[OBSERVABLE_VALUE_PRIVATE].value);
//   }
//
//   SourceOnObserved<boolean>(logicObservable as any, observer);
// }
//
// export function LogicNotObservableOnUnobserved(logicObservable: ILogicNotObservable, observer: IObserver<boolean>): void {
//   if ((logicObservable as ILogicNotObservableInternal)[OBSERVABLE_VALUE_PRIVATE].context.observable.observers.length === 0) {
//     (logicObservable as ILogicNotObservableInternal)[LOGIC_NOT_OBSERVABLE_PRIVATE].valueObserver.deactivate();
//   }
//   SourceOnUnobserved<boolean>(logicObservable as any, observer);
// }
//
// export class LogicNotObservable extends Observable<boolean> implements ILogicNotObservable {
//   constructor(observable: IObservable<boolean>) {
//     let context: IObservableContext<boolean> = void 0;
//     super((_context: IObservableContext<boolean>) => {
//       context = _context;
//       return {
//         onObserved: (observer: IObserver<boolean>): void => {
//           LogicNotObservableOnObserved(this, observer);
//         },
//         onUnobserved: (observer: IObserver<boolean>): void => {
//           LogicNotObservableOnUnobserved(this, observer);
//         },
//       };
//     });
//     ConstructLogicNotObservable(this, context, observable);
//   }
//
//   get observable(): IObservable<boolean> {
//     return ((this as unknown) as ILogicNotObservableInternal)[LOGIC_NOT_OBSERVABLE_PRIVATE].observable;
//   }
// }

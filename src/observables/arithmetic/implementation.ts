// import { ConstructSource, ISourceInternal, SourceEmit } from '../source/implementation';
// import { IObserver } from '../../core/observer/interfaces';
// import { Observable } from '../../core/observable/implementation';
// import { IObservable, IObservableContext } from '../../core/observable/interfaces';
// import { IReadonlyList } from '../../misc/readonly-list/interfaces';
// import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
// import { ReadonlyList } from '../../misc/readonly-list/implementation';
// import { Observer } from '../../core/observer/implementation';
// import { IArithmeticAdditionObservable, IArithmeticAddObservable, IArithmeticSubtractObservable } from './interfaces';
// import { ISource } from '../source/interfaces';
//
//
// // https://github.com/Microsoft/TypeScript/issues/25947
// // type StripTuple<T extends any[]> =
// //   Pick<T, Exclude<keyof T, keyof Array<any>>>
// //
// // type SourceCastTuple<T extends any[]> =
// //   Array<keyof StripTuple<T> extends infer K ? K extends any ? ISource<T[K]> : never : never> &
// //   { length: T['length'] } &
// //   { [K in keyof StripTuple<T>]: ISource<T[K]> };
//
// // https://github.com/Microsoft/TypeScript/pull/26063
// type SourceCastTuple<T extends any[]> = Array<ISource<any>> & {
//   [K in keyof T]: ISource<T[K]>;
// };
//
// // export function $expression<T extends (...args: any[]) => any>(callback: T): (...args: SourceCastTuple<Parameters<T>>) => ISource<ReturnType<T>> {
// //   return (...args: SourceCastTuple<Parameters<T>>) => {
// //     return new Observable
// //   };
// // }
//
// // const a: ISource<boolean> = $expression((a: number, b: string): boolean => {
// //   return true;
// // })(1 as unknown as ISource<number>, 1 as unknown as ISource<string>);
//
// export function ArraySum(values: number[]): number {
//   let sum: number = 0;
//   for (let i = 0, l = values.length; i < l; i++) {
//     sum += values[i];
//   }
//   return sum;
// }
//
// export function ArraySubtraction(values: number[]): number {
//   const length: number = values.length;
//   if (length > 0) {
//     let sum: number = values[0];
//     for (let i = 1, l = values.length; i < l; i++) {
//       sum -= values[i];
//     }
//     return sum;
//   } else {
//     throw new RangeError(`Expected at least one element in values`);
//   }
// }
//
// /*-------------------*/
//
// type TArithmeticAdditionObservableUpdateFunction = (values: number[], value: number, index: number) => number;
//
// export const ARITHMETIC_ADDITION_OBSERVABLE_PRIVATE = Symbol('arithmetic-addition-observable-private');
//
// export interface IArithmeticAdditionObservablePrivate {
//   observables: IObservable<number>[];
//   readonlyObservables: IReadonlyList<IObservable<number>>;
//
//   values: number[];
//   value: number;
//   valuesObserver: IObserver<number>;
//   emitAllowed: boolean;
//   modeAdd: boolean;
// }
//
// export interface IArithmeticAdditionObservableInternal extends IArithmeticAdditionObservable, ISourceInternal<number> {
//   [ARITHMETIC_ADDITION_OBSERVABLE_PRIVATE]: IArithmeticAdditionObservablePrivate;
// }
//
// export function ConstructArithmeticAdditionObservable(
//   arithmeticAdditionObservable: IArithmeticAdditionObservable,
//   context: IObservableContext<number>,
//   observables: Iterable<IObservable<number>>,
//   modeAdd: boolean,
// ): void {
//   ConstructSource<number>(arithmeticAdditionObservable as any, context);
//   ConstructClassWithPrivateMembers(arithmeticAdditionObservable, ARITHMETIC_ADDITION_OBSERVABLE_PRIVATE);
//
//   const privates: IArithmeticAdditionObservablePrivate = (arithmeticAdditionObservable as IArithmeticAdditionObservableInternal)[ARITHMETIC_ADDITION_OBSERVABLE_PRIVATE];
//   privates.observables = Array.from(observables);
//   privates.readonlyObservables = new ReadonlyList<IObservable<number>>(privates.observables);
//   privates.values = Array.from({ length: privates.observables.length }, () => 0);
//   privates.value = 0; // ArraySum(privates.values) // ArraySubtraction
//
//   privates.valuesObserver = new Observer<number>((value: number, observable: IObservable<number>) => {
//     const index: number = privates.observables.indexOf(observable);
//     if (privates.modeAdd || (index === 0)) {
//       privates.value += value - privates.values[index];
//     } else {
//       privates.value += privates.values[index] - value;
//     }
//     privates.values[index] = value;
//     if (privates.emitAllowed) {
//       SourceEmit<number>(arithmeticAdditionObservable as any, privates.value);
//     }
//   }).observe(...privates.observables);
//
//   privates.emitAllowed = true;
//   privates.modeAdd = modeAdd;
//
//   SourceEmit<number>(arithmeticAdditionObservable as any, privates.value);
// }
//
// export function ArithmeticAdditionObservableOnObserved(arithmeticAdditionObservable: IArithmeticAdditionObservable, observer: IObserver<number>): void {
//   const privates: IArithmeticAdditionObservablePrivate = (arithmeticAdditionObservable as IArithmeticAdditionObservableInternal)[ARITHMETIC_ADDITION_OBSERVABLE_PRIVATE];
//
//   if ((arithmeticAdditionObservable as IArithmeticAdditionObservableInternal)[OBSERVABLE_VALUE_PRIVATE].context.observable.observers.length === 1) {
//     privates.emitAllowed = false;
//     privates.valuesObserver.activate();
//     privates.emitAllowed = true;
//     // TODO continue here => value dispatched 2 times
//     SourceEmit<number>(arithmeticAdditionObservable as any, privates.value);
//   }
//
//   SourceOnObserved<number>(arithmeticAdditionObservable as any, observer);
// }
//
// export function ArithmeticAdditionObservableOnUnobserved(arithmeticAdditionObservable: IArithmeticAdditionObservable, observer: IObserver<number>): void {
//   if ((arithmeticAdditionObservable as IArithmeticAdditionObservableInternal)[OBSERVABLE_VALUE_PRIVATE].context.observable.observers.length === 0) {
//     (arithmeticAdditionObservable as IArithmeticAdditionObservableInternal)[ARITHMETIC_ADDITION_OBSERVABLE_PRIVATE].valuesObserver.deactivate();
//   }
//   SourceOnUnobserved<number>(arithmeticAdditionObservable as any, observer);
// }
//
//
// export abstract class ArithmeticAdditionObservable extends Observable<number> implements IArithmeticAdditionObservable {
//   protected constructor(
//     observables: Iterable<IObservable<number>>,
//     modeAdd: boolean,
//   ) {
//     let context: IObservableContext<number> = void 0;
//     super((_context: IObservableContext<number>) => {
//       context = _context;
//       return {
//         onObserved: (observer: IObserver<number>): void => {
//           ArithmeticAdditionObservableOnObserved(this, observer);
//         },
//         onUnobserved: (observer: IObserver<number>): void => {
//           ArithmeticAdditionObservableOnUnobserved(this, observer);
//         },
//       };
//     });
//     ConstructArithmeticAdditionObservable(this, context, observables, modeAdd);
//   }
//
//   get observables(): IReadonlyList<IObservable<number>> {
//     return ((this as unknown) as IArithmeticAdditionObservableInternal)[ARITHMETIC_ADDITION_OBSERVABLE_PRIVATE].readonlyObservables;
//   }
//
//   // get value(): boolean {
//   //   return ((this as unknown) as IArithmeticAdditionObservableInternal)[SOURCE_PRIVATE].value;
//   // }
//   //
//   // valueOf(): boolean {
//   //   return ((this as unknown) as IArithmeticAdditionObservableInternal)[SOURCE_PRIVATE].value;
//   // }
// }
//
//
// export class ArithmeticAddObservable extends ArithmeticAdditionObservable implements IArithmeticAddObservable {
//   constructor(observables: Iterable<IObservable<number>>) {
//     super(observables, true);
//   }
// }
//
// export class ArithmeticSubtractObservable extends ArithmeticAdditionObservable implements IArithmeticSubtractObservable {
//   constructor(observables: Iterable<IObservable<number>>) {
//     super(observables, false);
//   }
// }
//
// /*----------------------------------------*/
//
//

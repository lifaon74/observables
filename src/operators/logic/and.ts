// import { IObservable } from '../../core/observable/interfaces';
// import { LogicAndObservable } from '../../observables/logic/implementation';
// import { ILogicAndObservable } from '../../observables/logic/interfaces';
//
//
// // export function andPipe(defaultValue: boolean = false): IPipe<IObserver<boolean>, IObservable<boolean>> {
// //   return Pipe.create<boolean, boolean>((context: IPipeContext<boolean, boolean>) => {
// //     let values: WeakMap<IObservable<boolean>, boolean> = new WeakMap<IObservable<boolean>, boolean>();
// //     let previousValue: boolean;
// //
// //     return {
// //       onEmit: (value: boolean, observable: IObservable<boolean>) =>{
// //         if (observable !== void 0) {
// //           values.set(observable, value);
// //
// //           const _values: WeakMap<IObservable<boolean>, boolean> = new WeakMap<IObservable<boolean>, boolean>();
// //           const iterator: Iterator<IObservable<boolean>> = context.pipe.observer.observables[Symbol.iterator]();
// //           let result: IteratorResult<IObservable<boolean>>;
// //           while (!(result = iterator.next()).done) {
// //             const _value = values.has(result.value) ? values.get(result.value) : defaultValue;
// //             _values.set(result.value, _value);
// //             value = value && _value;
// //           }
// //
// //           values = _values;
// //           if (value !== previousValue) {
// //             previousValue = value;
// //             context.emit(value);
// //           }
// //         }
// //       },
// //     };
// //   });
// // }
//
// // export function and(...observables: IObservable<boolean>[]): IObservable<boolean> {
// //   return new Observable<boolean>((context: IObservableContext<boolean>) => {
// //     const values: boolean[] = observables.map(() => false);
// //
// //     let previousValue: boolean;
// //
// //     function emit(value: boolean) {
// //       if (value !== previousValue) {
// //         previousValue = value;
// //         context.emit(value);
// //       }
// //     }
// //
// //     const valuesObserver = new Observer<boolean>((value: boolean, observable: IObservable<boolean>) => {
// //       values[observables.indexOf(observable)] = value;
// //       emit(value && ArrayAnd(values)); // equiv of => if (value) { value = ArrayAnd(values); }
// //     }).observe(...observables);
// //
// //     return {
// //       onObserved(observer: IObserver<boolean>): void {
// //         if (context.observable.observers.length === 1) {
// //           previousValue = void 0;
// //           valuesObserver.activate();
// //           emit(ArrayAnd(values));
// //         } else {
// //           observer.emit(previousValue);
// //         }
// //       },
// //       onUnobserved(): void {
// //         if (!context.observable.observed) {
// //           valuesObserver.deactivate();
// //         }
// //       },
// //     };
// //   });
// // }
//
// export function and(...observables: IObservable<boolean>[]): ILogicAndObservable {
//   return new LogicAndObservable(observables);
// }

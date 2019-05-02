// import { IObservable } from '../../core/observable/interfaces';
// import { LogicOrObservable } from '../../observables/logic/implementation';
// import { ILogicOrObservable } from '../../observables/logic/interfaces';
//
// // export function or(...observables: IObservable<boolean>[]): IObservable<boolean> {
// //   return new Observable<boolean>((context: IObservableContext<boolean>) => {
// //     const values: boolean[] = observables.map(() => false);
// //
// //     let previousValue: boolean;
// //
// //     const valuesObserver = new Observer<boolean>((value: boolean, observable: IObservable<boolean>) => {
// //       values[observables.indexOf(observable)] = value;
// //       value = value || ArrayOr(values); // equiv of => if (!value) { value = ArrayOr(values); }
// //
// //       if (value !== previousValue) {
// //         previousValue = value;
// //         context.emit(value);
// //       }
// //     }).observe(...observables);
// //
// //     return {
// //       onObserved(observer: IObserver<boolean>): void {
// //         if (context.observable.observers.length === 1) {
// //           valuesObserver.activate();
// //         }
// //
// //         const value: boolean = ArrayOr(values);
// //
// //         if (value !== previousValue) {
// //           previousValue = value;
// //           observer.emit(value);
// //         }
// //
// //         // if (context.observable.observers.length === 1) {
// //         //   valuesObserver.activate();
// //         // } else {
// //         //   observer.emit(previousValue);
// //         // }
// //       },
// //       onUnobserved(): void {
// //         if (!context.observable.observed) {
// //           valuesObserver.deactivate();
// //           previousValue = void 0;
// //         }
// //       },
// //     };
// //   });
// // }
//
//
// export function or(...observables: IObservable<boolean>[]): ILogicOrObservable {
//   return new LogicOrObservable(observables);
// }

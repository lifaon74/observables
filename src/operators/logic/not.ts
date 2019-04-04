// import { IObservable } from '../../core/observable/interfaces';
// import { ILogicNotObservable } from '../../observables/logic/interfaces';
// import { LogicNotObservable } from '../../observables/logic/implementation';
//
//
// // export function not(observable: IObservable<boolean>): IObservable<boolean> {
// //   return new Observable<boolean>((context: IObservableContext<boolean>) => {
// //     let previousValue: boolean;
// //
// //     const valueObserver = new Observer<boolean>((value: boolean) => {
// //       value = !value;
// //       if (value !== previousValue) {
// //         previousValue = value;
// //         context.emit(value);
// //       }
// //     }).observe(observable);
// //
// //     return {
// //       onObserved(observer: IObserver<boolean>): void {
// //         if (context.observable.observers.length === 1) {
// //           valueObserver.activate();
// //         }
// //         observer.emit(previousValue);
// //       },
// //       onUnobserved(): void {
// //         if (!context.observable.observed) {
// //           valueObserver.deactivate();
// //         }
// //       },
// //     };
// //   });
// // }
//
// export function not(observable: IObservable<boolean>): ILogicNotObservable {
//   return new LogicNotObservable(observable);
// }

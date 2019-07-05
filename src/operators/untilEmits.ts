import { IObservable } from '../core/observable/interfaces';

export function untilObservableEmits<T>(observable: IObservable<T>): Promise<T> {
  return new Promise<T>((resolve: any) => {
    const observer = observable.pipeTo(() => {
      observer.deactivate();
      resolve();
    });
    observer.activate();
  });
}



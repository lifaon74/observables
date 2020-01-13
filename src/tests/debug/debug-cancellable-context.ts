import { CancellableContext } from '../../misc/cancellable-context/implementation';
import { $delay } from '../../promises/cancellable-promise/snipets';
import { IAdvancedAbortSignal } from '../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { OnFinallyResult } from '../../promises/cancellable-promise/types';
import { AdvancedAbortController } from '../../misc/advanced-abort-controller/implementation';
import { EventsObservable } from '../../notifications/observables/events/events-observable/public';
import { ClassListActivable } from '../../misc/activable/built-in/class-list-activable';

export async function debugCancellablePromise1() {
  const controller = new AdvancedAbortController();
  controller.abort('end');

  await $delay(1000, { signal: controller.signal })
    .finally((state: OnFinallyResult<void>) => {
      console.log(`'p1' finished with state:`);
      console.log(state);
    }, { includeCancelled: true })
    .then(() => {
      console.log('fulfilled');
    }, () => {
      console.log('rejected');
    }, () => {
      console.log('cancelled');
    })
    .promise;


}

export async function debugCancellableContext1() {
  const ctx = new CancellableContext();

  const createFactory = (name: string) => {
    return (signal: IAdvancedAbortSignal) => {
      console.log(`'${ name }' started`);
      return $delay(1000, { signal })
        .finally((state: OnFinallyResult<void>) => {
          console.log(`'${ name }' finished with state:`);
          console.log(state);
        }, { includeCancelled: true });
    };
  };

  // ctx.registerCancellablePromise('debug1', createFactory('debug1-f1'));
  // ctx.registerCancellablePromise('debug1', createFactory('debug1-f2'), { mode: 'skip' });
  // ctx.registerCancellablePromise('debug1', createFactory('debug1-f3'), { mode: 'warn' });
  // ctx.registerCancellablePromise('debug1', createFactory('debug1-f4'), { mode: 'throw' });
  // ctx.registerCancellablePromise('debug1', createFactory('debug1-f5'), { mode: 'queue' });
  //
  // ctx.registerCancellablePromise('debug2', createFactory('debug2-f1'));
  // ctx.registerCancellablePromise('debug2', createFactory('debug2-f2'), { mode: 'replace' });
  //
  // ctx.registerCancellablePromise('debug3', createFactory('debug3-f1'));
  // ctx.clear('debug3');
  //
  // ctx.registerCancellablePromise('debug4-1', createFactory('debug4-f1'));
  // ctx.registerCancellablePromise('debug4-2', createFactory('debug4-f2'));
  // await ctx.clearAll();

  ctx.registerActivable('click', () => {
    return new EventsObservable<WindowEventMap>(window)
      .addListener('click', () => {
        console.log('click');
      });
  });
  ctx.registerActivable('classes', () => {
    return new ClassListActivable(document.body, ['class1', 'class2']);
  });
  await $delay(2000);
  await ctx.clearAll();
}


export async function debugCancellableContext() {
  // await debugCancellablePromise1();
  await debugCancellableContext1();
}

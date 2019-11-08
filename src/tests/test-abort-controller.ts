import { AdvancedAbortController } from '../misc/advanced-abort-controller/implementation';
import { IAdvancedAbortSignal } from '../misc/advanced-abort-controller/advanced-abort-signal/interfaces';

export function testAbortController1() {
  const controller = new AdvancedAbortController();

  controller.signal.on('abort', (reason: any) => {
    console.log('aborted !', reason);
  });

  controller.abort('any reason');
}


export function testAbortController2() {
  const abortController = new AbortController();
  const controller = AdvancedAbortController.fromAbortSignals(abortController.signal);

  controller.signal.on('abort', (reason: any) => {
    console.log('aborted !', reason);
  });

  abortController.abort();
}


export function advancedAbortSignalExample(signal: IAdvancedAbortSignal = new AdvancedAbortController().signal): Promise<void> {
  // 1) wrapFetchArguments => ensures fetch will be aborted when signal is aborted
  // 2) wrapPromise => ensures fetch won't resolve if signal is aborted
  return signal.wrapPromise(fetch(...signal.wrapFetchArguments('http://domain.com/request1')))
    .then(signal.wrapFunction(function toJSON(response: Response) { // 3) ensures 'toJSON' is called only if signal is not aborted
      return response.json(); // 'wrapPromise' not required because we immediately return a promise inside 'wrapFunction'
    }))
    .then(signal.wrapFunction(function next(json: any) { // 4) ensures 'next' is called only if signal is not aborted
      console.log(json);
      // continue...
    }));
}

export async function testAbortController() {
  // testAbortController1();
  testAbortController2();
}

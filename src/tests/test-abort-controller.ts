import { AdvancedAbortController } from '../misc/advanced-abort-controller/implementation';

export function testAbortController1() {
  const controller = new AdvancedAbortController();

  controller.signal.on('abort', (reason: any) => {
    console.log('aborted !', reason);
  });

  controller.abort('any reason');
}


export async function testAbortController() {
  testAbortController1();
}

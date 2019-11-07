import { AdvancedAbortController } from '../misc/advanced-abort-controller/implementation';

export function testAbortController1() {
  const controller = new AdvancedAbortController();
  console.log(controller);
}


export async function testAbortController() {
  testAbortController1();
}

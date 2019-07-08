import { ReadonlyList } from '../misc/readonly-list/implementation';
import { Observable } from '../core/observable/implementation';
import { NotificationsObservable } from '../notifications/core/notifications-observable/implementation';
import { EventsObservable } from '../notifications/observables/events-observable/implementation';
import { mapPipe } from '../operators/pipes/mapPipe';
import { TimerObservable } from '../observables/timer-observable/implementation';
import { AsyncSource, Source } from '../observables/distinct/source/implementation';
import { Notification } from '../notifications/core/notification/implementation';
import { WebSocketIO } from '../observables/io/websocket-observable/implementation';
import { UnionToIntersection } from '../classes/types';
import { reducePipe } from '../operators/pipes/reducePipe';
import { flattenPipe } from '../operators/pipes/flattenPipe';
import { assertFailsSync, assertObservableEmits } from '../classes/asserts';
import { FromIterableObservable } from '../observables/from/iterable/implementation';
import { noop } from '../helpers';
import { FromRXJSObservable } from '../observables/from/rxjs/implementation';
import { testSignalingServer } from './webrtc/test-signaling-server';
import { testPromises } from './test-promises';
import { Observer } from '../core/observer/public';
import { testExamples } from './examples/examples';
import { toRXJS } from '../operators/to/toRXJS';
import { testPerformances } from './test-performances';
import { testClasses } from './test-class';
import { testProgram } from './test-program';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve: any, reject: any) => {
    const script: HTMLScriptElement = document.createElement('script');

    const clear = () => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onLoad);
      document.head.removeChild(script);
    };

    const onLoad = () => {
      clear();
      resolve();
    };

    const onError = () => {
      clear();
      reject(new URIError(`The script '${ src.substring(0, 300) }' didn't load correctly.`));
    };

    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);

    script.src = src;

    document.head.appendChild(script);
  });
}

function loadUMDScript<T>(src: string, name: string): Promise<T> {
  // (window as any).exports = {};
  // (window as any).module = {
  //   exports: (window as any).exports
  // };
  if (name in (window as any)) {
    return Promise.reject(new Error(`The global object already contains a property with name '${ name }'.`));
  } else {
    return loadScript(src)
      .then(() => {
        if (name in (window as any)) {
          const module: any = (window as any)[name];
          delete (window as any)[name];
          return module;
        } else {
          throw new Error(`No exported UMD name '${ name }'.`);
        }
      });
  }

}

function loadRXJS(): Promise<any> {
  return loadUMDScript('https://unpkg.com/rxjs@6.4.0/bundles/rxjs.umd.js', 'rxjs');
  // loadScript( 'https://unpkg.com/rxjs@6.4.0/bundles/rxjs.umd.min.js');
}


function testReadOnlyList() {
  const list = new ReadonlyList<number>([0, 1, 2, 3]);
  for (let i = 0; i < list.length; i++) {
    if (list.item(i) !== i) {
      throw new Error(`list.item(${ i }) !== ${ i }`);
    }
  }

  let i: number = 0;
  for (const value of Array.from(list)) {
    if (value !== i) {
      throw new Error(`iterable[${ i }] !== ${ i }`);
    }
    i++;
  }

}

function typeTest() {
  type a = 'a' | 'b';
  type b = 'a' | 'b' | 'c';
  type c = 'a';
  type d = 'd';

  type inter_a = 'a' & 'b';
  type inter_b = 'a' & 'b' & 'c';
  type inter_c = 'a';
  type inter_d = 'd';


  // expect B super set of A
  function foo<A extends string, B extends string>(v: UnionToIntersection<A>): B {
    return v as any;
  }

  const v: unknown = null;

  // const k: O<a> = { a: 'a', b: 'b' };
  // const k: (a & b) = 'b';
  // const k: keyof { [key in a]: void };
  // const k: T<a, b> = 'c';
  // const k: UnionToIntersection<a> = 'a' as unknown as a;
  // const k: keyof { a: 1, b: never };

  // (a & b) extends b => true
  // (b & a) extends b => true
  // (a & b) extends a => true
  // (a & b) extends c => false
  // (a & b) extends d => false
  // ('a' | 'b' | 'c') extends ('a' | 'b') => false
  // ('a' | 'b' | 'c') extends ('a' | 'b' | 'c') => true
  // ('a' & 'b' & 'c') extends ('a' & 'b') => true
  // ('a' & 'b') extends ('a') => true
  // ('a') extends ('a' & 'b') => false

  // string extends ('a' & 'b') => false
  // ('a' & 'b') extends string => true

  // string extends ('a' | 'b') => false
  // ('a' | 'b') extends string => true

  // ('a' | 'b' | 'c') extends ('a' & 'b') => false
  // ('a' | 'b') extends ('a' & 'b') => false
  // ('a') extends ('a' & 'b') => false
  // (('a' & 'b') | ('a' & 'b' & 'c')) extends ('a' & 'b') => true
  // ('a' & 'b') extends ('a' | 'b') => true

  // const k: (string extends ('a' | 'b') ? boolean : never) = null;
  // const k: Record<a, void> & Record<b, void> = null;
  // k.c = void 0;


  // const r0 = foo<a, a>(v as inter_a); // valid
  // const r1 = foo<a, b>(v as inter_b); // valid
  // const r2 = foo<a, c>(v as inter_c); // valid
  // const r3 = foo<a, d>(v as inter_d); // valid
  //
  // const ra = foo<a, a>(v as a); // valid
  // const rb = foo<a, b>(v as b); // valid
  // const rc = foo<a, c>(v as c); // invalid
  // const rd = foo<a, d>(v as d); // invalid
}

export function testSource() {
  const source = new Source<number>().emit(0);

  source.pipeTo((value: number) => {
    console.log(value);
  }).activate(); // print 0

  source.emit(1); // print 1
  source.emit(1); // nothing to print
  source.emit(2); // print 2
}

export async function testAsyncSource() {
  const source = await new AsyncSource<number>().emit(Promise.resolve(0));

  source.pipeTo((value: number) => {
    console.log(value);
  }).activate(); // print 0

  await source.emit(Promise.resolve(1)); // print 1
  await source.emit(Promise.resolve(1)); // nothing to print
  await source.emit(Promise.resolve(2)); // print 2
}


async function testFromIterableObservable() {
  const values1 = new FromIterableObservable([0, 1, 2, 3]);

  await assertObservableEmits(
    values1,
    [0, 1, 2, 3]
  );

  assertFailsSync(() => values1.pipeTo(noop).activate());

  const values2 = new FromIterableObservable([0, 1, 2, 3][Symbol.iterator](), { nextObservers: 'cache' });

  await assertObservableEmits(
    values2,
    [0, 1, 2, 3]
  );

  await assertObservableEmits(
    values2,
    [0, 1, 2, 3]
  );
}

async function testReducePipe() {
  await assertObservableEmits(
    new FromIterableObservable([0, 1, 2, 3])
      .pipeThrough(reducePipe<number>((a, b) => (a + b), 0)),
    [0, 1, 3, 6]
  );
}

async function testFlattenPipe() {
  await assertObservableEmits(
    new FromIterableObservable([[0, 1], [2, 3]])
      .pipeThrough(flattenPipe<number>()),
    [0, 1, 2, 3]
  );
}


async function testFromRXJSObservable() {
  const rxjs: any = await loadRXJS();

  const { range, operators: { map, filter } } = rxjs;

  const notifications = [
    new Notification('next', 0),
    new Notification('next', 1),
    new Notification('next', 2),
    new Notification('next', 3),
    new Notification('complete', void 0),
  ];

  const rxObservable = range(0, 7).pipe(
    filter((x: number) => x % 2 === 0),
    map((x: number) => x / 2)
  ); // 0, 1, 2, 3

  const values1 = new FromRXJSObservable<number, undefined>(rxObservable);

  await assertObservableEmits(
    values1,
    notifications
  );

  assertFailsSync(() => values1.pipeTo(noop).activate());

  const values2 = new FromRXJSObservable<number, undefined>(rxObservable, { nextObservers: 'cache' });

  await assertObservableEmits(
    values2,
    notifications
  );

  await assertObservableEmits(
    values2,
    notifications
  );

}

async function testToRXJSObservable() {
  toRXJS<number>(new FromIterableObservable([0, 1, 2, 3, 4]))
    .subscribe({
      next: (value: number) => {
        console.log('next', value);
      },
      complete: () => {
        console.log('complete');
      },
      error: (error: any) => {
        console.log('error', error);
      }
    });
}


export function testWebSocket() {

  // wss://echo.websocket.org
  const ws = new WebSocketIO('wss://echo.websocket.org');
  ws.in.pipeTo((value: any) => {
    console.log('in:', value);
  }).activate();

  const emitter = new TimerObservable(1000)
    .pipe(mapPipe<void, string>(() => `value-${ Math.random() }`)).observable
    .pipeTo(ws.out);

  const clear = () => {
    ws.deactivate()
      .then(() => {
        Array.from(ws.observers).forEach(_ => _.disconnect());
      });
  };

  ws.on('activate', () => {
    console.timeEnd('ws activate');
    emitter.activate();
    setTimeout(clear, 5000);
  });

  ws.on('error', (error: Error) => {
    console.error('ws error', error);
  });

  ws.on('deactivate', () => {
    console.log('ws deactivate');
    emitter.deactivate();
  });

  console.time('ws activate');
  ws.activate();
}


// export async function testWEBRTCChat() {
//
// }

export function testTypes(): void {
  new Observable<Uint8Array>()
    .pipeTo(new Observer<Uint8Array>((data: Uint8Array) => {

    })).activate();
}

export function testInstanceof() {
  const a = new NotificationsObservable();
  if (!(a instanceof Observable)) {
    throw new Error(`!(a instanceof Observable)`);
  }

  const b = new EventsObservable(window);
  if (!(b instanceof Observable)) {
    throw new Error(`!(b instanceof Observable)`);
  }

  const c = new Source();
  if (!(c instanceof Observable)) {
    throw new Error(`!(c instanceof Observable)`);
  }

  const d = new WebSocketIO('');
  if (!(d instanceof Observable)) {
    throw new Error(`!(d instanceof Observable)`);
  }
}


export async function test() {
  // await testExamples();

  // testReadOnlyList();
  // testSource();
  // testAsyncSource();

  // await testFromIterableObservable();
  // await testReducePipe();
  // await testFlattenPipe();

  // await testFromRXJSObservable();
  // await testToRXJSObservable();

  // testWebSocket();
  // testWEBRTC1();
  // testWEBRTCChat();

  // testMisc();
  // testFactoryV2();
  // testInstanceof();
  // testPerformances();
  // testSignalingServer();
  testPromises();
  // testClasses();
  // testProgram();
}




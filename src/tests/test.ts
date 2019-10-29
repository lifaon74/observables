import { ReadonlyList } from '../misc/readonly-list/implementation';
import { Observable } from '../core/observable/implementation';
import { NotificationsObservable } from '../notifications/core/notifications-observable/implementation';
import { EventsObservable } from '../notifications/observables/events/events-observable/implementation';
import { mapPipe } from '../operators/pipes/mapPipe';
import { TimerObservable } from '../observables/timer-observable/implementation';
import { AsyncSource, Source } from '../observables/distinct/source/implementation';
import { Notification } from '../notifications/core/notification/implementation';
import { WebSocketIO } from '../observables/io/websocket-observable/implementation';
import { UnionToIntersection } from '../classes/types';
import { reducePipe } from '../operators/pipes/reducePipe';
import { flattenPipe } from '../operators/pipes/flattenPipe';
import { assert, assertFails, assertObservableEmits, eq, notificationsEquals } from '../classes/asserts';
// import { FromIterableObservable } from '../observables/from/iterable/implementation';
import { noop } from '../helpers';
import { Observer } from '../core/observer/public';
import { toRXJS } from '../operators/to/toRXJS';
import {
  FiniteStateObservable, IFiniteStateObservable, IFiniteStateObservableKeyValueMapGeneric,
  TFiniteStateObservableFinalState, TFiniteStateObservableMode
} from '../notifications/observables/finite-state/public';
import { IFileReaderObservable } from '../notifications/observables/finite-state/file-reader/interfaces';
import { FileReaderObservable } from '../notifications/observables/finite-state/file-reader/implementation';
import { Progress } from '../misc/progress/implementation';
import { FromIterableObservable } from '../notifications/observables/finite-state/from/iterable/sync/public';
import { FromRXJSObservable } from '../notifications/observables/finite-state/from/rxjs/public';
import { aggregateNotificationsPipe } from '../operators/pipes/aggregateNotificationsPipe';
import { finiteStateObservableToPromise, toPromise } from '../operators/to/toPromise';
import { testExamples } from './examples/examples';
import { testPromises } from './test-promises';
import { testTask } from './test-task';
import { IProgress } from '../misc/progress/interfaces';
import { testSAndF } from './test-s-and-s';



// import { toAsyncIterable } from '../operators/to/async-iterator/toAsyncIterable';


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



async function testFiniteStateObservable() {

  function assertFiniteStateObservableEmits<TValue>(observable: IFiniteStateObservable<any, TFiniteStateObservableFinalState, TFiniteStateObservableMode, IFiniteStateObservableKeyValueMapGeneric<any, TFiniteStateObservableFinalState>>, notifications: [string, any][]): Promise<void> {
    return assertObservableEmits(observable, notifications, 100, notificationsEquals);
  }

  function testCannotEmitAfterFiniteState() {
    return new Promise<void>((resolve: any, reject: any) => {
      new FiniteStateObservable<number, TFiniteStateObservableFinalState, TFiniteStateObservableMode, IFiniteStateObservableKeyValueMapGeneric<number, TFiniteStateObservableFinalState>>((context) => {
        context.next(1);
        context.next(2);
        context.complete();
        resolve(
          Promise.all([
            assertFails(() => context.next(3)),
            assertFails(() => context.complete()),
            assertFails(() => context.error())
          ])
        );
      });
    });
  }

  async function testOnce() {
    const observable = new FiniteStateObservable<number, TFiniteStateObservableFinalState, TFiniteStateObservableMode, IFiniteStateObservableKeyValueMapGeneric<number, TFiniteStateObservableFinalState>>((context) => {
      return {
        onObserved(): void {
          if (context.observable.state === 'next') {
            context.next(1);
            context.next(2);
            context.complete();
          }
        }
      }
    }, { mode: 'once' });

    await assertFiniteStateObservableEmits(observable,[
      ['next', 1],
      ['next', 2],
      ['complete', void 0],
    ]);

    await assertFiniteStateObservableEmits(observable,[]);
  }

  async function testCache() {
    const observable = new FiniteStateObservable<number, TFiniteStateObservableFinalState, TFiniteStateObservableMode, IFiniteStateObservableKeyValueMapGeneric<number, TFiniteStateObservableFinalState>>((context) => {
      context.next(1);
      context.next(2);
      context.complete();
    }, { mode: 'cache' });

    await assert(() => (observable.state === 'complete'));

    await assertFiniteStateObservableEmits(observable,[
      ['next', 1],
      ['next', 2],
      ['complete', void 0],
    ]);

    await assertFiniteStateObservableEmits(observable,[
      ['next', 1],
      ['next', 2],
      ['complete', void 0],
    ]);
  }

  async function testCacheFinalState() {
    const observable = new FiniteStateObservable<number, TFiniteStateObservableFinalState, TFiniteStateObservableMode, IFiniteStateObservableKeyValueMapGeneric<number, TFiniteStateObservableFinalState>>((context) => {
      context.next(1);
      context.next(2);
      context.error('my-error');
    }, { mode: 'cache-final-state' });

    await assert(() => (observable.state === 'complete'));

    await assertFiniteStateObservableEmits(observable,[
      ['error', 'my-error'],
    ]);

    await assertFiniteStateObservableEmits(observable,[
      ['error', 'my-error'],
    ]);
  }

  async function testThrowAfterComplete() {
    const observable = new FiniteStateObservable<number, TFiniteStateObservableFinalState, TFiniteStateObservableMode, IFiniteStateObservableKeyValueMapGeneric<number, TFiniteStateObservableFinalState>>((context) => {
      context.next(1);
      context.next(2);
      context.complete();
    }, { mode: 'uniq' });

    await assert(() => (observable.state === 'complete'));
    await assertFails(() => (observable.pipeTo(() => {}).activate()));
  }


  await testCannotEmitAfterFiniteState();
  await testOnce();
  await testCache();
  await testCacheFinalState();
  await testThrowAfterComplete();
}


async function testFromIterableObservable() {
  console.log('test testFromIterableObservable');
  const notifications = [
    new Notification('next', 0),
    new Notification('next', 1),
    new Notification('next', 2),
    new Notification('next', 3),
    new Notification('complete', void 0),
  ];

  const values1 = new FromIterableObservable<number>([0, 1, 2, 3], { mode: 'uniq' });

  await assertObservableEmits(
    values1,
    notifications
  );

  await assertFails(() => values1.pipeTo(noop).activate());

  const values2 = new FromIterableObservable<number>([0, 1, 2, 3][Symbol.iterator](), { mode: 'cache' });

  await assertObservableEmits(
    values2,
    notifications
  );

  await assertObservableEmits(
    values2,
    notifications
  );
}

async function testReducePipe() {
  await assertObservableEmits(
    new FromIterableObservable<number>([0, 1, 2, 3])
      .pipeThrough(aggregateNotificationsPipe<number>(['next']))
      .pipeThrough(reducePipe<number>((a, b) => (a + b), 0)),
    [0, 1, 3, 6]
  );
}

async function testFlattenPipe() {
  await assertObservableEmits(
    new FromIterableObservable([[0, 1], [2, 3]])
      .pipeThrough(aggregateNotificationsPipe<number>(['next']))
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

  const values1 = new FromRXJSObservable<number>(rxObservable, { mode: 'uniq' });

  await assertObservableEmits(
    values1,
    notifications
  );

  await assertFails(() => values1.pipeTo(noop).activate());

  const values2 = new FromRXJSObservable<number>(rxObservable, { mode: 'cache' });

  await assertObservableEmits(
    values2,
    notifications
  );

  await assertObservableEmits(
    values2,
    notifications
  );

}

async function testToRXJS() {
  const rxObservable = toRXJS<number>(new FromIterableObservable([0, 1, 2, 3]));

  const notifications = [
    new Notification('next', 0),
    new Notification('next', 1),
    new Notification('next', 2),
    new Notification('next', 3),
    new Notification('complete', void 0),
  ];


  const values = new FromRXJSObservable<number>(rxObservable, { mode: 'uniq' });

  await assertObservableEmits(
    values,
    notifications
  );

  // rxObservable.subscribe({
  //   next: (value: number) => {
  //     console.log('next', value);
  //   },
  //   complete: () => {
  //     console.log('complete');
  //   },
  //   error: (error: any) => {
  //     console.log('error', error);
  //   }
  // });
}

async function testToPromise() {
  await assert(() => toPromise(new FromIterableObservable<number>([0, 1, 2, 3])).then(_ => (_ === 3)));
  await assert(() => finiteStateObservableToPromise(new FromIterableObservable<number>([0, 1, 2, 3])).then(values => eq(values, [0, 1, 2, 3])));
}

async function testToAsyncIterable() {
  // for await(const value of toAsyncIterable<number>(new FromIterableObservable<number>([1, 2, 3]))) {
  //   console.log(value);
  // }
  // TODO => problem, FromIterableObservable emits all values immediately where 'next' can only return one
  // const iterator: AsyncIterator<number | undefined> = toAsyncIterable<number>(new FromIterableObservable<number>([1, 2, 3]));
  // let result: IteratorResult<number | undefined>;
  // while (!(result = await iterator.next()).done) {
  //   console.log(result.value);
  // }
  // should output: 1, 2, 3
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




export async function testFileReaderObservable() {
  // function assertFileReaderObservableEmits<T>(observable: IFileReaderObservable<any>, notifications: [string, T | any][]): Promise<void> {
  //   return assertObservableEmits(observable, notifications, 100, notificationsEquals);
  // }
  const blob = new Blob([new Uint8Array([0, 1, 2, 3, 4, 5])]);

  const read = <T extends IFileReaderObservable<any>>(reader: T): T => {
    return reader
      .on('progress', (progress: IProgress) => {
        console.log('progress', progress);
      })
      .on('next', (value: ArrayBuffer | string) => {
        console.log('next', (typeof value === 'string') ? value: new Uint8Array(value));
      })
      .on('complete', () => {
        console.log('complete');
      })
      .on('error', (error: DOMException) => {
        console.log('error', error);
      })
    ;
  };

  console.log('cache all');
  const reader = new FileReaderObservable(blob, { mode: 'cache-final-state' });

  read(reader);

  setTimeout(() => {
    console.warn('---------------------------');
    read(reader);
  }, 1000);

  // reader.clearObservers();
}


export async function test() {
  console.log('1');
  // await testExamples();
  // testMicroObservables();

  // testReadOnlyList();
  // testSource();
  // testAsyncSource();

  // await testFiniteStateObservable();
  // await testFromIterableObservable();
  // await testReducePipe();
  // await testFlattenPipe();

  // await testFromRXJSObservable();
  // await testToRXJS();
  // await testToPromise();

  // await testToAsyncIterable();


  // await testFileReaderObservable();

  // testWebSocket();
  // testWEBRTC1();
  // testWEBRTCChat();

  // testMisc();
  // testFactoryV2();
  // testInstanceof();
  // testPerformances();
  // testSignalingServer();
  // testPromises();
  // testClasses();
  // testProgram();
  // await testTask();
  // await testFactory();
  // await testUnit();
  await testSAndF();

  console.log('tests done');
}




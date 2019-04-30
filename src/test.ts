import { ReadonlyList } from './misc/readonly-list/implementation';
import { Observable } from './core/observable/implementation';
import { Observer } from './core/observer/implementation';
import { NotificationsObservable, NotificationsObservableContext } from './notifications/core/notifications-observable/implementation';
import { NotificationsObserver } from './notifications/core/notifications-observer/implementation';
import { EventsObservable } from './notifications/observables/events-observable/implementation';
import { FetchObservable } from './notifications/observables/fetch-observable/implementation';
import { toCancellablePromise, toPromise } from './operators/promise/toPromise';
import { PromiseCancelError, PromiseCancelReason, PromiseCancelToken } from './notifications/observables/promise-observable/promise-cancel-token/implementation';
import { TCancellablePromiseTuple } from './notifications/observables/promise-observable/interfaces';
import { Reason } from './misc/reason/implementation';
import { PromiseObservable } from './notifications/observables/promise-observable/implementation';
import { IObserver } from './core/observer/interfaces';
import { Pipe } from './core/observable-observer/implementation';
import {
  INotificationsObservable, INotificationsObservableContext, KeyValueMapToNotifications,
  TNotificationsObservablePipeToObserverResult
} from './notifications/core/notifications-observable/interfaces';
import { IObservableObserver, IPipe, TBasePipe } from './core/observable-observer/interfaces';
import {
  IObservable, IObservableContext, TObservablePipeThroughResult, TObservablePipeToObserverResult
} from './core/observable/interfaces';
import { promisePipe } from './operators/promise/promisePipe';
import { mapPipe } from './operators/pipes/mapPipe';
import { TimerObservable } from './observables/timer-observable/implementation';
import { AsyncSource, Source } from './observables/distinct/source/implementation';
import { ISource } from './observables/distinct/source/interfaces';
import { KeyValueMap, KeyValueMapKeys, KeyValueMapValues } from './notifications/core/interfaces';
import { INotification } from './notifications/core/notification/interfaces';
import { from } from './operators/from';
import { WebSocketObservableObserver } from './notifications/observables/websocket-observable/implementation';
import { INotificationsObserver } from './notifications/core/notifications-observer/interfaces';
import { FunctionObservable } from './observables/distinct/function-observable/implementation';
import { Expression } from './observables/distinct/expression/implementation';
import { $add, $equal, $expression, $source, $string, testMisc } from './operators/misc';
import { IPromiseCancelToken } from './notifications/observables/promise-observable/promise-cancel-token/interfaces';
import { UnionToIntersection } from './classes/types';
import { EventKeyValueMapConstraint } from './notifications/observables/events-observable/interfaces';

function testReadOnlyList() {
  const list = new ReadonlyList<number>([0, 1, 2, 3]);
  for (let i = 0; i < list.length; i++) {
    if (list.item(i) !== i) {
      throw new Error(`list.item(${i}) !== ${i}`);
    }
  }

  let i: number = 0;
  for (const value of Array.from(list)) {
    if (value !== i) {
      throw new Error(`iterable[${i}] !== ${i}`);
    }
    i++;
  }

}

/**
 * EXAMPLES
 */

/**
 * Creates an Observable emitting 'void' every 'period' milliseconds
 */
function createTimerObservable(period: number) {
  return new Observable<void>((context: IObservableContext<void>) => {
    let timer: any | null = null;
    return {
      // everytime an Observer wants to receive data from this Observable, this method will be called
      onObserved() {
        if (timer === null) { // if its the first observer to observe this observable, create a timer
          timer = setInterval(() => {
            context.emit(void 0); // emit void data
          }, period);
        }
      },
      // everytime an Observer wants to stop to receive data from this Observable, this method will be called
      onUnobserved() {
        if (!context.observable.observed) { // if there's no more Observers for this Observable, we can stop the timer.
          clearInterval(timer);
          timer = null;
        }
      }
    };
  });
}

function createEventObservable<T extends Event>(target: EventTarget, name: string) {
  return new Observable<Event>((context: IObservableContext<Event>) => {
    const listener = (event: T) => context.emit(event);
    return {
      // everytime an Observer wants to receive data from this Observable, this method will be called
      onObserved() {
        if (context.observable.observers.length === 1) { // if its the first observer to observe this observable, create a listener
          target.addEventListener(name, listener);
        }
      },
      // everytime an Observer wants to stop to receive data from this Observable, this method will be called
      onUnobserved() {
        if (!context.observable.observed) { // if there's no more Observers for this Observable, we can stop the listener.
          target.removeEventListener(name, listener);
        }
      }
    };
  });
}


/**
 * output 'updated' 5 times every 500ms
 */
function observeTimerObservable(): void {
  let count: number = 5; // limit do 5 emits

  // creates an Observable emitting every 500 milliseconds
  const observer = createTimerObservable(500)
    .pipeTo(new Observer<void>(() => { // called when the TimerObservable emits
      console.log('updated');
      count--;
      if (count <= 0) { // deactivate the observer after 5 times
        observer.deactivate();
      }
    }))
    .activate(); // don't forget to activate the observer !
}

/**
 * Creates a NotificationsObservable listening to 'name' events on 'target'
 * @param target
 * @param name
 */
function createEventNotificationsObservable<TKVMap extends EventKeyValueMapConstraint<TKVMap>>(target: EventTarget, name: KeyValueMapKeys<TKVMap>): INotificationsObservable<TKVMap> {
  return new NotificationsObservable<TKVMap>((context: NotificationsObservableContext<TKVMap>) => {
    const listener = (event: Event) => {
      context.dispatch(event.type as KeyValueMapKeys<TKVMap>, event as KeyValueMapValues<TKVMap>);
    };
    return {
      onObserved() {
        if (context.observable.observers.length === 1) { // if its the first observer to observe this observable, create a listener
          target.addEventListener(name, listener);
        }
      },
      onUnobserved() {
        if (!context.observable.observed) { // if there's no more Observers for this Observable, we can stop the listener.
          target.removeEventListener(name, listener);
        }
      }
    };
  });
}


/**
 * Example how to use a TimerObservable
 */
function timerObservableExample1(): void {
  let count: number = 0;

  const observer = new TimerObservable(1000)
    .pipeTo(() => {
      count++;
      console.log(`count: ${count}`);
      if (count >= 10) {
        observer.deactivate();
      }
    }).activate();
}


/**
 * Example how to observe a NotificationsObservable
 */
function observeNotificationsObservable(): void {

  // creates a Observables listening some mouse events on window
  // 4 examples doing the same thing (almost)

  // 1) use 'addListener' to listen to 'mousemove' on X axis
  const observer1 = createEventNotificationsObservable<WindowEventMap>(window, 'mousemove')
    .addListener('mousemove', (event: MouseEvent) => {
      console.log(`x: ${event.clientX}`);
    }).activate(); // WARN: don't forget to activate the observer !

  // 2) use 'pipeTo' and NotificationsObserver (is strictly equal to 'addListener')
  const observer2 = createEventNotificationsObservable<WindowEventMap>(window, 'mousemove')
    .pipeTo<INotificationsObserver<'mousemove', MouseEvent>>(new NotificationsObserver<'mousemove', MouseEvent>('mousemove', (event: MouseEvent) => {
      console.log(`y: ${event.clientY}`);
    })).activate();

  // 3) use standard Observer
  const observer3 = createEventNotificationsObservable(window, 'click')
    .pipeTo(new Observer<INotification<'click', MouseEvent>>((notification: INotification<'click', MouseEvent>) => {
      if (notification.name === 'click') {
        console.log(`click => x: ${notification.value.clientX}, x: ${notification.value.clientY}`);
      }
    })).activate();

  // 4) use 'on' which is strictly equal to 'addListener' but returns the observable instead of the observer
  const observable = createEventNotificationsObservable(window, 'mousedown')
    .on('mousedown', (event: MouseEvent) => {
      console.log(`mousedown => x: ${event.clientX}`);
    })
    .on('mousedown', (event: MouseEvent) => { // great way to chain listeners
      console.log(`mousedown => y: ${event.clientY}`);
    }); // INFO: the observers are automatically activated with 'on'


  setTimeout(() => {
    observer1.deactivate();
    observer2.deactivate();
    observer3.deactivate();
    observable.removeListener('mousedown'); // or observable.off('mousedown');
  }, 5000);
}

/**
 * Demo how listen to various events using EventsObservable
 */
function eventsObservableExample1(): void {
  const observable = new EventsObservable<WindowEventMap>(window)
    .on('click', (event: MouseEvent) => {
      console.log(`click => button: ${event.button}`);
    })
    .on('mousemove', (event: MouseEvent) => {
      console.log(`mousemove => x: ${event.clientX}, x: ${event.clientY}`);
    });

  // or
  /*const observable = new EventsObservable(window)
    .observedBy(
      new NotificationsObserver('click', (event: MouseEvent) => {
        console.log(`click => button: ${event.button}`);
      }).activate(),
      new NotificationsObserver('mousemove', (event: MouseEvent) => {
        console.log(`mousemove => x: ${event.clientX}, x: ${event.clientY}`);
      }).activate()
    );*/

  setTimeout(() => {
    let observer: IObserver<any> | null;
    while ((observer = observable.observers.item(0)) !== null) {
      observer.unobserve();
    }
  }, 5000);
}

/**
 * Demo how listen to a uniq event's type using EventsObservable
 */
function eventsObservableExample2(): void {
  const observer = new EventsObservable(window, 'mousemove')
    .pipeTo(new Observer((notification: INotification<'mousemove', MouseEvent>) => {
      console.log(`x: ${notification.value.clientX}, x: ${notification.value.clientY}`);
    })).activate();

  setTimeout(() => {
    observer.deactivate();
  }, 5000);
}

function promiseCancelTokenFetchExample1(): void {
  function loadNews(page: number, token: IPromiseCancelToken = new PromiseCancelToken()): Promise<void> {
    return fetch(`https://my-domain/api/news?page${page}`, { signal: token.toAbortController().signal })
      .then((response: Response) => {
        if (token.cancelled) {
          throw token.reason;
        } else {
          return response.json();
        }
      })
      .then((news: any) => {
        if (token.cancelled) {
          throw token.reason;
        } else {
          // render news in DOM for example
        }
      });
  }

  let page: number = 0;
  let token: IPromiseCancelToken;
  document.querySelector('button')
    .addEventListener(`click`, () => {
      if (token !== void 0) {
        token.cancel(new PromiseCancelReason('Manual cancel'));
      }
      token = new PromiseCancelToken();
      page++;
      loadNews(page, token)
        .catch(PromiseCancelReason.discard);
    });
}

/**
 * Creates a simple GET http request which loads an url and returns result as [Promise<string>, PromiseCancelToken]
 * @param url
 * @param token - optional PromiseCancelToken, will be returned in the tuple
 */
function createHttpRequest(url: string, token: IPromiseCancelToken = new PromiseCancelToken()): TCancellablePromiseTuple<string> {
  return [
    new Promise<string>((resolve, reject) => {
      const request = new XMLHttpRequest(); // create an XMLHttpRequest
      new EventsObservable<XMLHttpRequestEventMap>(request) // creates an EventsObservable for this request
        .on('load', () => { // when the request is finished, resolve the promise
          resolve(request.responseText);
        })
        .on('error', () => {
          reject(new Error(`Failed to fetch data: ${request.statusText}`));
        })
        .on('abort', () => {
          reject(token.reason || new PromiseCancelReason());
        });

      token.addListener('cancel', () => { // if the token is cancelled, abort the request
        request.abort();
      }).activate();

      request.open('GET', url, true);
      request.send();
    }),
    token
  ];
}

/**
 * Demo how to use a PromiseCancelToken
 */
function promiseCancelTokenExample1(): void {
  const [promise, token] = createHttpRequest('https://server.test-cors.org/server?id=643798&enable=true&status=200&credentials=false&response_headers=Access-Control-Allow-Origin%3A%20*');
  promise
    .then((content: string) => {
      if (!token.cancelled) {
        return JSON.parse(content);
      }
    })
    .then((data: any) => {
      if (!token.cancelled) { // token.cancelled MUST be check in every then/catch because it may change at any time
        console.log(data);
      }
    })
    .catch((error: any) => {
      if (!token.cancelled) {
        console.error(error);
      }
    });

  token.addListener('cancel', (reason: Reason) => {
    console.warn('promise cancelled:', reason.message);
  }).activate();

  // token.cancel(new Reason('Abort http request'));
}


function promiseObservableExample1(): void {
  // creates an fetch observable from an url
  function http(url: string) {
    return new PromiseObservable<Response, Error, any>((token: PromiseCancelToken) => {
      return fetch(url, { signal: token.toAbortController().signal });
    });
  }


  /*class ResponseToJSON<T> extends Pipe<IObserver<INotification<TPromiseNotificationType, Response>>, IPromiseObservable<T, Error, any>> {
    constructor() {
      super(() => {
        let resolve: any;
        let reject: any;
        let token: PromiseCancelToken;

        return {
          observer: new Observer<INotification<TPromiseNotificationType, Response>>((notification: INotification<TPromiseNotificationType, Response>) => {
            console.log('on data');
            if (!token.cancelled) {
              switch (notification.name) {
                case 'complete':
                  resolve(notification.value.json());
                  break;
                case 'error':
                  reject(notification.value);
                  break;
                case 'cancel':
                  token.cancel();
                  break;
              }
            }
          }),
          observable: new PromiseObservable((_token: IPromiseCancelToken) => {
            console.log('call promise');
            token = _token;
            return new Promise<T>((_resolve, _reject) => {
              resolve = _resolve;
              reject = _reject;
            });
          })
        };
      });
    };
  }*/


  const url: string = 'https://server.test-cors.org/server?id=643798&enable=true&status=200&credentials=false&response_headers=Access-Control-Allow-Origin%3A%20*'; // valid cors url

  const observable = http(url)
    .pipeThrough(promisePipe((response: Response) => response.json()))
    .on('complete', (response: Response) => {
      console.log('complete', response);
    })
    .on('error', (reason: any) => {
      console.error('error', reason);
    })
    .on('cancel', (reason: any) => {
      console.warn('cancel', reason);
    });

  /*for (const observer of Array.from(observable.observers)) {
    observer.disconnect();
  }*/
}


/**
 * Example how to observe a FetchObservable
 * @param observable
 */
function observeFetchObservable(observable: FetchObservable): FetchObservable {
  return observable.on('complete', (response: Response) => {
    console.log(response);
  })
    .on('error', (error: any) => {
      console.error('error', error);
    })
    .on('cancel', (reason: any) => {
      console.warn('cancelled', reason);
    });
}


/**
 * Example how to use a FetchObservable
 */
function fetchObservableExample1(): void {
  const url1: string = 'https://server.test-cors.org/server?id=643798&enable=true&status=200&credentials=false&response_headers=Access-Control-Allow-Origin%3A%20*'; // valid cors url
  const url2: string = 'https://invalid url'; // invalid  url

  observeFetchObservable(new FetchObservable(url1)); // will complete
  observeFetchObservable(new FetchObservable(url2)); // will error

  const abortController: AbortController = new AbortController();
  observeFetchObservable(new FetchObservable(url1, { signal: abortController.signal })); // will cancel
  abortController.abort();

}


/**
 * Example how to cast an Observable to a Promise
 */
function observableToPromiseExample1(): void {

  function observePromise(promise: Promise<Response>, token?: PromiseCancelToken): Promise<void> {
    return promise
      .then((response: Response) => {
        if (token && token.cancelled) {
          console.warn('cancel', token.reason);
        } else {
          console.log(response);
        }
      }, (error: any) => {
        if (token && token.cancelled) {
          console.warn('cancel', token.reason);
        } else {
          console.error('error', error);
        }
      });
  }

  const url1: string = 'https://server.test-cors.org/server?id=643798&enable=true&status=200&credentials=false&response_headers=Access-Control-Allow-Origin%3A%20*'; // valid cors url
  const url2: string = 'https://invalid url'; // invalid  url

  observePromise(toPromise<Response>(new FetchObservable(url1))); // will complete
  observePromise(toPromise<Response>(new FetchObservable(url2))); // will error

  const abortController: AbortController = new AbortController();
  observePromise(toPromise<Response>(new FetchObservable(url1, { signal: abortController.signal }))); // will cancel
  abortController.abort();

  // provides PromiseCancelToken too, to detect cancellation
  observePromise(...toCancellablePromise<Response>(new FetchObservable(url1, { signal: abortController.signal }))); // will cancel
}


function observableObserverExampple1(): void {
  function map<Tin, Tout>(transform: (value: Tin) => Tout): IObservableObserver<IObserver<Tin>, IObservable<Tout>> {
    let context: IObservableContext<Tout>;
    return {
      observer: new Observer((value: Tin) => {
        context.emit(transform(value));
      }),
      observable: new Observable((_context: IObservableContext<Tout>) => {
        context = _context;
      })
    };
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

function pipeExample1() {
  function map<Tin, Tout>(transform: (value: Tin) => Tout): IPipe<IObserver<Tin>, IObservable<Tout>> {
    let context: IObservableContext<Tout>;
    return new Pipe(() => {
      let context: IObservableContext<Tout>;
      return {
        observer: new Observer((value: Tin) => {
          context.emit(transform(value));
        }),
        observable: new Observable((_context: IObservableContext<Tout>) => {
          context = _context;
        })
      };
    });
  }
}

function pipeExample2() {
  const pipe = new Pipe(() => {
    let context: INotificationsObservableContext<{ click: [number, number] }>;
    return {
      observer: new NotificationsObserver<'click', MouseEvent>('click', (event: MouseEvent) => {
        context.dispatch('click', [event.clientX, event.clientX]);
      }),
      observable: new NotificationsObservable((_context: INotificationsObservableContext<{ click: [number, number] }>) => {
        context = _context;
      })
    };
  });

  new EventsObservable<WindowEventMap>(window)
    .pipeThrough(pipe)
    .addListener('click', (value: [number, number]) => {
      console.log(value);
    }).activate();
}

function pipeExample3() {
  // create a map pipe which transform incoming data into numbers
  const pipe = Pipe.create<any, number>((context) => {
    return {
      onEmit(value: any) {
        context.emit(Number(value));
      }
    };
  });

  // create a simple pipe to emit some data
  const emitter = Pipe.create<any>();

  emitter.observable
    .pipeThrough(pipe)
    .pipeTo((value: number) => {
      console.log(value);
    }).activate();

  emitter.observer.emit(false); // 0
  emitter.observer.emit(1); // 1
  emitter.observer.emit('2'); // 2
  emitter.observer.emit(void 0); // NaN
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





function functionObservableExample1() {
  const a: ISource<number> = new Source<number>();
  const b: ISource<number> = new Source<number>();

  const observable = FunctionObservable.create((a: number, b: number) => {
    return a + b;
  })(a, b);

  observable.pipeTo((value: number) => {
    console.log('sum', value);
  }).activate();

  function call(v_a: number, v_b: number) {
    a.emit(v_a);
    b.emit(v_b);
  }

  observable.run(() => {
    call(1, 2);
  }); // print 3
  a.emit(5); // print 7

  (window as any).a = a;
  (window as any).b = b;
  (window as any).call = call;


  $equal(a, 1)
    .pipeTo((value: boolean) => {
      console.log('equal', value);
    }).activate();


  $string`a${a}b${a}c${$expression(() => window.location.href)}`
    .pipeTo((value: string) => {
      console.log('str', value);
    }).activate();
}



function expressionExample1() {
  const data = {
    a: 1,
    b: 2,
    c: new Source<number>().emit(3)
  };

  new Expression<number>(() => {
    return data.a + data.b;
  })
    .pipeTo((value: number) => {
      console.log('sum', value);
    }).activate();

  (window as any).data = data;

}


// function logicAndExample1() {
//   const sources: ISource<boolean>[] = Array.from({ length: 3 }, () => new Source<boolean>().emit(false));
//   new LogicAndObservable(sources)
//     .pipeTo((value: boolean) => {
//       console.log('and:', value);
//     }).activate(); // print false
//
//
//   sources.forEach(_ => _.emit(true)); // print true
//   sources[sources.length - 1].emit(true); // nothing to print
//   sources[sources.length - 1].emit(false); // print false
// }
//
// function logicOrExample1() {
//   const sources: ISource<boolean>[] = Array.from({ length: 3 }, () => new Source<boolean>().emit(false));
//   new LogicOrObservable(sources)
//     .pipeTo((value: boolean) => {
//       console.log('or:', value);
//     }).activate(); // print false
//
//
//   sources[sources.length - 1].emit(true); // print true
//   sources[sources.length - 1].emit(false); // nothing to print
//   sources.forEach(_ => _.emit(false)); // print false
// }
//
// function logicExample1() {
//   // (a || b) && !(c && d)
//   const sources: ISource<boolean>[] = Array.from({ length: 4 }, () => new Source<boolean>().emit(false));
//   let _value: boolean;
//   and(or(sources[0], sources[1]), not(and(sources[2], sources[3])))
//     .pipeTo((value: boolean) => {
//       console.log(`(${sources[0].value} || ${sources[1].value}) && !(${sources[2].value} && ${sources[3].value}):`, value);
//       _value = value;
//     }).activate(); // print false
//
//
//   function set(values: boolean[]) {
//     console.warn('set:', ...values);
//
//     for (let i = 0; i < values.length; i++) {
//       sources[i].emit(values[i]);
//     }
//
//     const expected: boolean = (sources[0].value || sources[1].value) && !(sources[2].value && sources[3].value);
//     if (_value !== expected) {
//       console.error('expected: ' + _value);
//     }
//   }
//
//   const values: boolean[] = sources.map(_ => _.value);
//
//   for (let i = 0; i < values.length; i++) {
//     values[i] = false;
//     set(values);
//     values[i] = true;
//     set(values);
//   }
//
//   (window as any).set = set;
// }
//
//
// function arithmeticExample1() {
//   const sources: ISource<number>[] = Array.from({ length: 4 }, (v, k) => new Source<number>().emit(k));
//   new ArithmeticAddObservable(sources)
//     .pipeTo((value: number) => {
//       console.log('add:', value);
//     }).activate(); // print 6
// }
//
// function testLogicOperators() {
//
//   // a.b.c
//
//   function $prop<T>(observable: IObservable<object | T>, ...propertyNames: (string | number | symbol)[]): IObservable<T> {
//
//     if (propertyNames.length === 0) {
//       return observable as any;
//     } else {
//       type TValue = object | T;
//       const propertyName: (string | number | symbol) = propertyNames.shift();
//
//       return $prop<T>(new Observable<TValue>((context: IObservableContext<TValue>) => {
//         const valueObserver = new Observer((value: TValue) => {
//           context.emit(value);
//         });
//
//         const objectObserver = new Observer<object>((object: object) => {
//           const value: any = (object as any)[propertyName];
//           if (value instanceof Observable) {
//             valueObserver.disconnect();
//             valueObserver.observe(value);
//           } else {
//             valueObserver.emit(value);
//           }
//         }).observe(observable as IObservable<object>);
//
//         return {
//           onObserved(): void {
//             if (context.observable.observers.length === 1) {
//               objectObserver.activate();
//               valueObserver.activate();
//             }
//           },
//           onUnobserved(): void {
//             if (!context.observable.observed) {
//               objectObserver.deactivate();
//               valueObserver.deactivate();
//             }
//           },
//         };
//       }), ...propertyNames);
//     }
//
//   }
//
//   const pipes: TBasePipe<boolean, boolean>[] = Array.from({ length: 10 }, () => {
//     return Pipe.create();
//   });
//
//   const observables = pipes.map(_ => _.observable);
//   const observers = pipes.map(_ => _.observer);
//
//   /*$and(...observables)
//     .pipeTo((value: boolean) => {
//       console.log('and', value);
//     }).activate();
//
//   $or(...observables)
//     .pipeTo((value: boolean) => {
//       console.log('or', value);
//     }).activate();*/
//
//   /*const _and = $$and();
//   _and.observer.observe(...observables);
//   _and.observable.pipeTo((value: boolean) => {
//       console.log('and', value);
//     }).activate();
//
//   for (const observer of observers) {
//     observer.emit(true);
//   }
//
//   (window as any).observers = observers;*/
//
//
//   const a = new TimerObservable(1000)
//     .pipeThrough(
//       mapPipe<void, object>(() => {
//         return {
//           b: new TimerObservable(500)
//             .pipeThrough(
//               mapPipe<void, object>(() => {
//                 return {
//                   c: new TimerObservable(250)
//                     .pipeThrough(mapPipe<void, number>(() => Math.random()))
//                 };
//               })
//             ),
//           b2: true
//         };
//       })
//     );
//
//   $prop<number>($prop<object>(a, 'b'), 'c')
//   // $prop<number>(a, 'b2')
//     .pipeTo((value: number) => {
//       console.log(value);
//     }).activate();
// }






async function testRXJSObservable() {
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
        reject(new URIError(`The script '${src.substring(0, 300)}' didn't load correctly.`));
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
      return Promise.reject(new Error(`The global object already contains a property with name '${name}'.`));
    } else {
      return loadScript(src)
        .then(() => {
          if (name in (window as any)) {
            const module: any = (window as any)[name];
            delete (window as any)[name];
            return module;
          } else {
            throw new Error(`No exported UMD name '${name}'.`)
          }
        });
    }

  }

  const rxjs: any = await loadUMDScript( 'https://unpkg.com/rxjs@6.4.0/bundles/rxjs.umd.js', 'rxjs');
  // await loadScript( 'https://unpkg.com/rxjs@6.4.0/bundles/rxjs.umd.min.js');

  const { range, operators: { map, filter }} = rxjs;

  const rxObservable = range(1, 20).pipe(
    filter((x: number) => x % 2 === 1),
    map((x: number) => x + x)
  );

  // const observable = fromRXJSObservable<number, undefined>(rxObservable);
  // const observer = observable
  //   .addListener<'next'>('next', (value: number) =>{
  //     console.log(value);
  //   }).activate();
  //
  //
  // setTimeout(() => {
  //   observer.observe(observable as IObservable<INotification<Record<'next', number>>>).activate();
  //   // new NotificationsObserver<Record<'next', number>>('next', () => {}).observe(observable /*as IObservable<INotification<'next', number>>*/).activate();
  // }, 500);
  // console.log(rxjs);
}

function testFromOperator() {
  from([0, 1, 2, 3])
    .pipeTo((v: number) => {
      console.log(v);
    }).activate();
}


/*function testPipe1() {
  class A extends Observable<any> {
    public a:number;
  }

  class B extends Observer<any> {
    public b:number;
  }

  const AB = CreateObservableObserver(B, A);
  const ab = new AB(() => {
    let _context: any;
    return [[(value: any) => {
      _context.emit(value * 2);
    }], [(context) => {
      _context = context;
      return {};
    }]];
  });

  ab.b = 10;

  ab.pipeTo((value) => {
    console.log('value', value);
  }).activate();

  ab.emit(4);
}

function testPipe2() {
  // ObservableObserver which converts mouse clicks to [x, y] tuple
  class MouseClickPipe extends CreateObservableObserver<INotificationsObserverTypedConstructor<'click', MouseEvent>, IObservableTypedConstructor<[number, number]>>(NotificationsObserver, Observable) {
    constructor() {
      super(() => {
        let _context: IObservableContext<[number, number]>;
        return [['click', (value: MouseEvent) => {
          _context.emit([value.clientX, value.clientY]);
        }], [(context: IObservableContext<[number, number]>) => {
          _context = context;
        }]];
      });
    }
  }

  new EventsObservable(window)
    .pipeTo(new MouseClickPipe())
    .pipeTo(new Observer<[number, number]>((value) => {
      console.log(value);
    })).activate()
}

function testPipe3() {
  class RandomPipe extends ObservableObserver<void, number> {
    constructor(start: number = 0, end: number = 2) {
      super((context: IObservableContext<number>) => {
        return {
          onEmit(): void {
            context.emit(Math.floor(Math.random() * (end - start) + start));
          }
        }
      });
    }
  }

  class DistinctPipe<T> extends ObservableObserver<T, T> {
    constructor() {
      super((context: IObservableContext<T>) => {
        let _value: T = void 0;
        return {
          onEmit(value: T): void {
            if (value !=_value) {
              _value = value;
              context.emit(value);
            }
          }
        }
      });
    }
  }

  new TimerObservable(200)
    .pipeTo(new RandomPipe())
    .pipeTo(new DistinctPipe<number>())
    .pipeTo((value: number) => {
      console.log(value);
    }).activate();
}*/


export function testWebSocket() {

  // wss://echo.websocket.org

  const ws = new WebSocketObservableObserver('wss://echo.websocket.org');
  ws.in.pipeTo((value: any) => {
    console.log('in:', value);
  }).activate();

  const emitter = new TimerObservable(1000)
    .pipe(mapPipe<void, string>(() => `value-${Math.random()}`)).observable
    .pipeTo(ws.out);

  ws.on('activate', () => {
    console.log('ws activate');
    emitter.activate();
  });

  ws.on('error', (error: Error) => {
    console.error('ws error', error);
  });

  ws.on('deactivate', () => {
    console.log('ws deactivate');
    emitter.deactivate();
  });

  ws.activate();

  setTimeout(() => {
    ws.deactivate();
    Array.from(ws.observers).forEach(_ => _.disconnect());
  }, 5000);
}

export function test() {
  // testReadOnlyList();

  // timerObservableExample1();
  // observeTimerObservable();
  // observeNotificationsObservable();
  // eventsObservableExample1();
  // promiseCancelTokenExample1();
  // promiseObservableExample1();
  // fetchObservableExample1();
  // observableToPromiseExample1();

  // pipeExample1();
  // pipeExample2();
  // pipeExample3();


  // testSource();
  // testAsyncSource();

  // testPipe1();
  // testPipe2();
  // testPipe3();

  // functionObservableExample1();
  // expressionExample1();

  // logicAndExample1();
  // logicOrExample1();
  // logicExample1();

  // arithmeticExample1();
  // testLogicOperators();
  // testAsyncSource();
  // testRXJSObservable();
  // testFromOperator();
  // testWebSocket();

  testMisc();
}




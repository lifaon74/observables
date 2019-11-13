import { Observer } from '../../core/observer/implementation';
import {
  NotificationsObservable
} from '../../notifications/core/notifications-observable/implementation';
import { NotificationsObserver } from '../../notifications/core/notifications-observer/implementation';
import { EventsObservable } from '../../notifications/observables/events/events-observable/implementation';
import { FetchObservable } from '../../notifications/observables/finite-state/built-in/promise/fetch-observable/implementation';
import {
  finiteStateObservableToPromise, singleFiniteStateObservableToCancellablePromiseTuple,
  singleFiniteStateObservableToPromise, genericObservableToCancellablePromiseTuple, genericObservableToPromise
} from '../../operators/to/toPromise';
import {
  CancelReason, CancelToken
} from '../../misc/cancel-token/implementation';
import { Reason } from '../../misc/reason/implementation';
import { PromiseObservable } from '../../notifications/observables/finite-state/built-in/promise/promise-observable/implementation';
import { IObserver } from '../../core/observer/interfaces';
import {
  INotificationsObservable
} from '../../notifications/core/notifications-observable/interfaces';
import { IObservableObserver} from '../../core/observable-observer/interfaces';
import { IObservable} from '../../core/observable/interfaces';
import { TimerObservable } from '../../observables/timer-observable/implementation';
import { Source } from '../../observables/distinct/source/implementation';
import { ISource } from '../../observables/distinct/source/interfaces';
import { KeyValueMapKeys, KeyValueMapValues } from '../../notifications/core/interfaces';
import { INotification } from '../../notifications/core/notification/interfaces';
import { INotificationsObserver } from '../../notifications/core/notifications-observer/interfaces';
import { FunctionObservable } from '../../observables/distinct/function-observable/implementation';
import { Expression } from '../../observables/distinct/expression/implementation';
import { $equal, $expression } from '../../operators/shortcuts/public';
import { $string } from '../../operators/misc';
import { ICancelToken } from '../../misc/cancel-token/interfaces';
import { EventKeyValueMapConstraint } from '../../notifications/observables/events/events-observable/interfaces';
import { ICancellablePromiseTuple } from '../../promises/interfaces';
import { SpreadCancellablePromiseTuple } from '../../promises/helpers';
import { FiniteStateObservable } from '../../notifications/observables/finite-state/implementation';
import {
  IFiniteStateObservable
} from '../../notifications/observables/finite-state/interfaces';
import { FromIterableObservable } from '../../notifications/observables/finite-state/built-in/from/iterable/sync/public';
import { IFetchObservable } from '../../notifications/observables/finite-state/built-in/promise/fetch-observable/interfaces';
import { XHRObservable } from '../../notifications/observables/finite-state/built-in/promise/xhr-observable/implementation';
import { FromReadableStreamObservable } from '../../notifications/observables/finite-state/built-in/from/readable-stream/implementation';
import { FromAsyncIterableObservable } from '../../notifications/observables/finite-state/built-in/from/iterable/async/implementation';
import { ClientRequest, IncomingMessage } from 'http';
import { IGenericEvent } from '../../notifications/observables/events/events-listener/event-like/generic/interfaces';
import { EventEmitterEventsListener } from '../../notifications/observables/events/events-listener/from/event-emitter/implementation';
import { Observable } from '../../core/observable/implementation';
import { IObservableContext } from '../../core/observable/context/interfaces';
import { IPipe } from '../../core/observable-observer/pipe/interfaces';
import { TPipeContextBase } from '../../core/observable-observer/pipe/types';
import { Pipe } from '../../core/observable-observer/pipe/implementation';
import { INotificationsObservableContext } from '../../notifications/core/notifications-observable/context/interfaces';
import { NotificationsObservableContext } from '../../notifications/core/notifications-observable/context/implementation';
import {
  TFiniteStateObservableKeyValueMapGeneric, TFiniteStateObservableFinalState, TFiniteStateObservableMode
} from '../../notifications/observables/finite-state/types';


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
    const listener = (event: Event) => context.emit(event as T);
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
      console.log(`count: ${ count }`);
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
      console.log(`x: ${ event.clientX }`);
    }).activate(); // WARN: don't forget to activate the observer !

  // 2) use 'pipeTo' and NotificationsObserver (is strictly equal to 'addListener')
  const observer2 = createEventNotificationsObservable<WindowEventMap>(window, 'mousemove')
    .pipeTo<INotificationsObserver<'mousemove', MouseEvent>>(new NotificationsObserver<'mousemove', MouseEvent>('mousemove', (event: MouseEvent) => {
      console.log(`y: ${ event.clientY }`);
    })).activate();

  // 3) use standard Observer
  const observer3 = createEventNotificationsObservable(window, 'click')
    .pipeTo(new Observer<INotification<'click', MouseEvent>>((notification: INotification<'click', MouseEvent>) => {
      if (notification.name === 'click') {
        console.log(`click => x: ${ notification.value.clientX }, x: ${ notification.value.clientY }`);
      }
    })).activate();

  // 4) use 'on' which is strictly equal to 'addListener' but returns the observable instead of the observer
  const observable = createEventNotificationsObservable(window, 'mousedown')
    .on('mousedown', (event: MouseEvent) => {
      console.log(`mousedown => x: ${ event.clientX }`);
    })
    .on('mousedown', (event: MouseEvent) => { // great way to chain listeners
      console.log(`mousedown => y: ${ event.clientY }`);
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
      console.log(`click => button: ${ event.button }`);
    })
    .on('mousemove', (event: MouseEvent) => {
      console.log(`mousemove => x: ${ event.clientX }, x: ${ event.clientY }`);
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
    observable.clearObservers();
  }, 5000);
}

/**
 * Demo how listen to a uniq event's type using EventsObservable
 */
function eventsObservableExample2(): void {
  const observer = new EventsObservable(window, 'mousemove')
    .pipeTo(new Observer((notification: INotification<'mousemove', MouseEvent>) => {
      console.log(`x: ${ notification.value.clientX }, x: ${ notification.value.clientY }`);
    })).activate();

  setTimeout(() => {
    observer.deactivate();
  }, 5000);
}

/**
 * Demo how listen response from an http request on NodeJS using EventsObservable
 */
function eventsObservableExample3(): void {
  interface ClientRequestEventMap {
    'response': IGenericEvent<IncomingMessage>;
  }

  const http = require('http');

  const request: ClientRequest = http.get(`https://nodejs.org`);

  const observable = new EventsObservable<ClientRequestEventMap>(new EventEmitterEventsListener(request))
    .on('response', (event: IGenericEvent<IncomingMessage>) => {
      console.log(`response`, event.value);
    });
}

function finiteStateObservableExample1(): void {
  function fromIterable<T>(iterable: Iterable<T>): IFiniteStateObservable<T, TFiniteStateObservableFinalState, TFiniteStateObservableMode, TFiniteStateObservableKeyValueMapGeneric<T, TFiniteStateObservableFinalState>> {
    return new FiniteStateObservable<T, TFiniteStateObservableFinalState, TFiniteStateObservableMode, TFiniteStateObservableKeyValueMapGeneric<T, TFiniteStateObservableFinalState>>((context) => {
      return {
        onObserved(): void {
          if (context.observable.state === 'next') {
            for (const value of Array.from(iterable)) {
              context.next(value);
            }
            context.complete();
          }
        }
      }
    }, { mode: 'cache' });
  }

  fromIterable([0, 1, 2, 3])
    .addListener('next', (value: number) => {
      console.log('next', value);
    })
    .activate();
}


async function finiteStateObservableExample2() {
  function fromReadableStream<T>(reader: ReadableStreamReader<T>): IFiniteStateObservable<T, TFiniteStateObservableFinalState, TFiniteStateObservableMode, TFiniteStateObservableKeyValueMapGeneric<T, TFiniteStateObservableFinalState>> {
    return new FiniteStateObservable<T, TFiniteStateObservableFinalState, TFiniteStateObservableMode, TFiniteStateObservableKeyValueMapGeneric<T, TFiniteStateObservableFinalState>>((context) => {
      async function readAll() {
        let result: ReadableStreamReadResult<T>;
        while (!(result = await reader.read()).done) {
          context.next(result.value);
        }
        context.complete();
      }

      return {
        onObserved(): void {
          if (
            (context.observable.state === 'next')
            && (context.observable.observers.length === 1)
          ) {
            readAll();
          }
        }
      }
    }, { mode: 'cache' });
  }

  function fromReadableStreamUsingFromAsyncIterableObservable<T>(reader: ReadableStreamReader<T>): IFiniteStateObservable<T, TFiniteStateObservableFinalState, TFiniteStateObservableMode, TFiniteStateObservableKeyValueMapGeneric<T, TFiniteStateObservableFinalState>> {
    return new FromAsyncIterableObservable((async function * () {
      let result: ReadableStreamReadResult<T>;
      while (!(result = await reader.read()).done) {
        yield result.value;
      }
    })(), { mode: 'cache' });
  }


  const response: Response = await fetch(URL.createObjectURL(new Blob([new Uint8Array(1e6)])));

  fromReadableStream((response.body as ReadableStream<Uint8Array>).getReader())
    .on('next', (chunk: Uint8Array) => {
      console.log('chunk', chunk);
    })
    .on('complete', () => {
      console.log('complete');
    });

  // new FromReadableStreamObservable((response.body as ReadableStream<Uint8Array>).getReader())
  //   .on('next', (chunk: Uint8Array) => {
  //     console.log('chunk', chunk);
  //   })
  //   .on('complete', () => {
  //     console.log('complete');
  //   });
}


function fromIterableObservableExample1(): void {
  const observable = new FromIterableObservable([0, 1, 2, 3], { mode: 'once' });
  const observer = observable
    .addListener('next', (value: number) => {
      console.log('next', value);
      observer.deactivate();

      observable
        .addListener('next', (value: number) => {
          console.log('next-2', value);
        }).activate();
    });
  observer.activate();
}

function cancelTokenFetchExample1(): void {
  function loadNews(page: number, token: ICancelToken = new CancelToken()): Promise<void> {
    return token.wrapPromise(fetch(`https://my-domain/api/news?page${ page }`, { signal: token.toAbortController().signal }))
      .then(token.wrapFunction((response: Response): Promise<any> => { // <(response: Response) => any, 'never', never>
        return response.json() as any;
      }))
      .then(token.wrapFunction((news: any) => {
        // render news in DOM for example
      }));
  }

  let page: number = 0;
  let token: ICancelToken;
  (document.querySelector('button') as HTMLElement)
    .addEventListener(`click`, () => {
      if (token !== void 0) {
        token.cancel(new CancelReason('Manual cancel'));
      }
      token = new CancelToken();
      page++;
      loadNews(page, token)
        .catch(CancelReason.discard);
    });
}

/**
 * Creates a simple GET http request which loads an url and returns result as [Promise<string>, CancelToken]
 * @param url
 * @param token - optional CancelToken, will be returned in the tuple
 */
function createHttpRequest(url: string, token: ICancelToken = new CancelToken()): ICancellablePromiseTuple<string> {
  return {
    promise: new Promise<string>((resolve, reject) => {
      const request = new XMLHttpRequest(); // create an XMLHttpRequest
      new EventsObservable<XMLHttpRequestEventMap>(request) // creates an EventsObservable for this request
        .on('load', () => { // when the request is finished, resolve the promise
          resolve(request.responseText);
        })
        .on('error', () => {
          reject(new Error(`Failed to fetch data: ${ request.statusText }`));
        })
        .on('abort', () => {
          reject(token.reason || new CancelReason());
        });

      token.addListener('cancel', () => { // if the token is cancelled, abort the request
        request.abort();
      }).activate();

      request.open('GET', url, true);
      request.send();
    }),
    token: token
  };
}

/**
 * Demo how to use a CancelToken
 */
function cancelTokenExample1(): void {
  const { promise, token } = createHttpRequest('https://server.test-cors.org/server?id=643798&enable=true&status=200&credentials=false&response_headers=Access-Control-Allow-Origin%3A%20*');
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
    return new PromiseObservable<Response>((token: CancelToken) => {
      return fetch(url, { signal: token.toAbortController().signal });
    }, { mode: 'cache' });
  }


  /*class ResponseToJSON<T> extends Pipe<IObserver<INotification<TPromiseNotificationType, Response>>, IPromiseObservable<T, Error, any>> {
    constructor() {
      super(() => {
        let resolve: any;
        let reject: any;
        let token: CancelToken;

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
          observable: new PromiseObservable((_token: ICancelToken) => {
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

  console.log('do http');
  const observable = http(url)
    // .pipeThrough(promisePipe((response: Response) => response.json()))
    .on('next', (response: Response) => {
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
function observeFetchObservable(observable: IFetchObservable): IFetchObservable {
  return observable
    .on('next', (response: Response) => {
      console.log(response);
    })
    .on('error', (error: any) => {
      console.error('error', error);
    })
    .on('cancel', (reason: any) => {
      console.warn('cancelled', reason);
    });
}

function observeFetchObservable2(observable: IFetchObservable): IObserver<INotification<string, any>> {
  return observable
    .pipeTo((notification: INotification<string, any>) => {
      console.log(notification.name, notification.value);
    }).activate();
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

function fetchObservableExample2(): void {
  const url: string = 'https://server.test-cors.org/server?id=643798&enable=true&status=200&credentials=false&response_headers=Access-Control-Allow-Origin%3A%20*'; // valid cors url

  const observable = new FetchObservable(url, void 0, { mode: 'every' });
  observeFetchObservable2(observable);
  observeFetchObservable2(observable);
}

function observeReadableStream(stream: ReadableStream<Uint8Array>) {
  const chunks: Uint8Array[] = [];
  new FromReadableStreamObservable<Uint8Array>(stream.getReader())
    .on('next', (chunk: Uint8Array) => {
      chunks.push(chunk);
      // console.log('chunk', chunk);
    })
    .on('complete', () => {
      const bytes = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
      chunks.reduce((index, chunk) => {
        bytes.set(chunk, index);
        return index + chunk.length;
      }, 0);
      console.log('complete', bytes);
    });

  // finiteStateObservableToPromise(new FromReadableStreamObservable<Uint8Array>(stream))
  //   .then((chunks: Uint8Array[]) => {
  //     const bytes = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  //     chunks.reduce((index, chunk) => {
  //       bytes.set(chunk, index);
  //       return index + chunk.length;
  //     }, 0);
  //     console.log('complete', bytes);
  //   });
}

function readableStreamExample1() {
  fetch(URL.createObjectURL(new Blob([new Uint8Array(1e7)])))
    .then((response: Response) => {
      observeReadableStream(response.body as ReadableStream<Uint8Array>);
    });
}

async function xhrObservableExample1() {

  function http(requestInfo: RequestInfo, requestInit?: RequestInit): Promise<void> {
    return new Promise<void>((resolve: any, reject: any) => {
      const observable = new XHRObservable(requestInfo, requestInit, { mode: 'once' });
      const observer = observable
        .pipeTo((notification: INotification<string, any>) => {
          console.log(notification.name, notification.value);

          if (notification.name === 'complete') {
            resolve();
          } else if (notification.name === 'error') {
            reject(notification.value);
          } else if (notification.name === 'next') {
            observeReadableStream((notification.value as Response).body as ReadableStream<Uint8Array>);
            // (notification.value as Response)
            //   .arrayBuffer()
            //   .then((buffer) => {
            //     console.log('done', new Uint8Array(buffer));
            //   }, (error: any) => {
            //     console.warn(error);
            //   });

            // observer.deactivate();
          }

        }).activate();
    });
  }

  function noCORS(url: string): string {
    return `https://cors-anywhere.herokuapp.com/${ url }`;
  }

  function dummyBytes(bytes: Uint8Array): Uint8Array {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = i;
    }
    return bytes;
  }


  // const bytes: Uint8Array = new TextEncoder().encode('😀 😁 😂');

  function downloadBigFile() {
    const bytes = new Blob([dummyBytes(new Uint8Array(1e7))], { type: 'application/octet-stream' });
    return http(URL.createObjectURL(bytes));
  }

  function uploadBigFile() {
    const bytes = new Blob([dummyBytes(new Uint8Array(1e7))], { type: 'application/octet-stream' });
    const formData = new FormData();
    formData.set('file', bytes, 'my-file.bin');
    return http('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      body: formData
    });
  }

  await downloadBigFile();
  await uploadBigFile();
}




/**
 * Example how to cast an Observable to a Promise
 */
async function observableToPromiseExample1(): Promise<void> {

  function observePromise(name: string, promise: Promise<Response>, token?: CancelToken): Promise<void> {
    return promise
      .then((response: Response) => {
        if (token && token.cancelled) {
          console.warn(`cancel '${ name }'`, token.reason);
        } else {
          console.log(name, response);
        }
      }, (error: any) => {
        if (token && token.cancelled) {
          console.warn(`cancel '${ name }'`, token.reason);
        } else {
          console.error(`error '${ name }'`, error);
        }
      });
  }

  const url1: string = 'https://server.test-cors.org/server?id=643798&enable=true&status=200&credentials=false&response_headers=Access-Control-Allow-Origin%3A%20*'; // valid cors url
  const url2: string = 'https://invalid url'; // invalid  url

  observePromise('fetch url 1', singleFiniteStateObservableToPromise(new FetchObservable(url1)) as Promise<Response>); // will complete
  observePromise('fetch url 2', singleFiniteStateObservableToPromise(new FetchObservable(url2)) as Promise<Response>); // will error

  const abortController: AbortController = new AbortController();
  observePromise('fetch url with abort controller without token', singleFiniteStateObservableToPromise(new FetchObservable(url1, { signal: abortController.signal }), 'reject') as Promise<Response>); // will cancel
  abortController.abort();

  // provides CancelToken too, to detect cancellation
  observePromise('fetch url with abort controller with token', ...SpreadCancellablePromiseTuple(singleFiniteStateObservableToCancellablePromiseTuple(new FetchObservable(url1, { signal: abortController.signal }), 'reject') as ICancellablePromiseTuple<Response>)); // will cancel
}


function observableObserverExample1(): void {
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
  const pipe = Pipe.create<any, number>((context: TPipeContextBase<any, number>) => {
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


  $string`a${ a }b${ a }c${ $expression(() => window.location.href) }`
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



function sensorExample1() {

  interface AmbientLightObservableEventsMap {
    'error': Error;
    'value': number;
  }

  /**
   * An Observable based on an AmbientLightSensor.
   * Emits the illuminance
   */
  class AmbientLightObservable extends NotificationsObservable<AmbientLightObservableEventsMap> {

    /**
     * Ensures permission is granted
     */
    static create(): Promise<AmbientLightObservable> {
      return navigator.permissions.query({ name: 'ambient-light-sensor' })
        .then((result: PermissionStatus) => {
          if (result.state === 'denied') {
            throw new Error(`Permission to use ambient light sensor is denied.`);
          } else {
            return new AmbientLightObservable();
          }
        });
    }

    constructor(options: { frequency: number } = { frequency: 10 }) {
      super((context: INotificationsObservableContext<AmbientLightObservableEventsMap>) => {
        // @ts-ignore - because AmbientLightSensor is draft
        const sensor: AmbientLightSensor = new AmbientLightSensor(options);

        const valueListener = () => context.dispatch('value', sensor.illuminance);
        // @ts-ignore - because SensorErrorEvent is draft
        const errorListener = (event: SensorErrorEvent) => context.dispatch('error', event.error);

        return {
          onObserved() {
            if (context.observable.observers.length === 1) {
              sensor.addEventListener('reading', valueListener);
              sensor.addEventListener('error', errorListener);
              sensor.main();
            }
          },
          onUnobserved() {
            if (!context.observable.observed) {
              sensor.removeEventListener('reading', valueListener);
              sensor.removeEventListener('error', errorListener);
              sensor.stop();
            }
          }
        };
      });
    }
  }

  return AmbientLightObservable.create()// or new AmbientLightObservable()
    .then((ambientLightObservable: AmbientLightObservable) => {

      // observes incoming values and log it in the DOM
      const ambientLightObserver = ambientLightObservable
        .addListener('value', (illuminance: number) => {
          const div = document.createElement('div');
          div.innerText = `${ illuminance }lux`;
          document.body.appendChild(div);
        });

      // observes errors and log it in the DOM if any
      ambientLightObservable
        .addListener('error', (error: Error) => {
          const div = document.createElement('div');
          div.innerText = `[ERROR]: ${ error.message }`;
          document.body.appendChild(div);
        }).activate();

      // creates a "toggle sensor" button
      const button = document.createElement('button');
      button.innerText = 'activate';
      button.style.margin = `10px`;
      document.body.appendChild(button);

      // on click, toggle ambientLightObserver
      button.addEventListener('click', () => {
        if (ambientLightObserver.activated) {
          button.innerText = 'activate';
          ambientLightObserver.deactivate();
        } else {
          button.innerText = 'deactivate';
          ambientLightObserver.activate();
        }
      });

      const div = document.createElement('div');
      div.innerText = `illuminance:`;
      document.body.appendChild(div);
    })
    .catch((error: any) => {
      const div = document.createElement('div');
      div.innerText = `[ERROR]: ${ error.message }`;
      document.body.appendChild(div);
    });
}




export async function testExamples() {
  // timerObservableExample1();
  // observeTimerObservable();
  // observeNotificationsObservable();
  eventsObservableExample1();
  // finiteStateObservableExample1();
  // finiteStateObservableExample2();
  // fromIterableObservableExample1();
  // cancelTokenExample1();
  // promiseObservableExample1();
  // fetchObservableExample1();
  // fetchObservableExample2();
  // readableStreamExample1();
  // xhrObservableExample1();
  // await observableToPromiseExample1();

  // pipeExample1();
  // pipeExample2();
  // pipeExample3();

  // functionObservableExample1();
  // expressionExample1();

  // sensorExample1();
}





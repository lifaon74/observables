# How to create an Observable which does http request (for REST API for example) ?

### Understanding the PromiseCancelToken

One recurrent issue with the promise is the **cancellation**: when initialized, a promise and all its *then/catch* will be called
even if at some point we don't require anymore the final result.

Imagine this example:

```ts
function loadNews(page: number): Promise<void> {
  return fetch(`https://my-domain/api/news?page${page}`)
    .then(_ => _.json())
    .then((news: INews) => {
      // render news in DOM for example
    });
}

let page: number = 0;
document.querySelector('button')
  .addEventListener(`click`, () => {
    page++;
    loadNews(page);
  });
```

This has some problems if the user clicks many times on the button:
- the previous requests are no more required, as consequence they should be aborted.
- the UI should not be rendered/updated for the previous calls or we could potentially see page 0 being rendered after page 1:
  1) (at time 0) user clicks on button, first request starts and will take 1000ms
  2) (at time 100ms) user clicks on button (another time), first request is not finished, second request starts and will take 200ms (faster than the previous one)
  3) (at time 300ms) second request finishes and is rendered into the DOM (page 1)
  4) (at time 1000ms) first request finishes and is rendered into the DOM (page 0) => UNWANTED BEHAVIOUR !

PromiseCancelToken helps to solve this problem: it's simply an object with a possible *cancelled* state, and a `cancel` function.

It may be used like this:

```ts
function loadNews(page: number, token: IPromiseCancelToken = new PromiseCancelToken()): Promise<void> {
  return fetch(`https://my-domain/api/news?page=${page}`, { signal: token.toAbortController().signal })
    .then((response: Response) => {
      if (token.cancelled) {
        throw token.reason;
      } else {
        return response.json();
      }
    })
    .then((news: INews) => {
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
```

**The PromiseCancelToken is useful to avoid unnecessary work into the promise chain.**

### Simple cancellable http request example

```ts
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

      token.addListener('cancel', () => { // if the token is cancelled, abort the request, saves bandwidth and execution time
        request.abort();
      }).activate();

      request.open('GET', url, true);
      request.send();
    }),
    token
  ];
}

async function doRequest() {
  let [promise, token] = createHttpRequest(`https://my-domain`);
  promise.catch(PromiseCancelReason.discard); // hide 'cancel' error
  
  token.cancel(); // abort the request
  
  [promise, token] = createHttpRequest(`https://other-domain`);
  await promise;
}

doRequest();
```


### Understanding the PromiseObservable

Unlike Promises, Observables are cancellable due to their onObserve/onUnobserve mechanism (a core functionality), that's why we introduced the PromiseCancelToken.

We may consider that Promises have 3 states: *completed*, *errored*, and *canceled*.

The PromiseObservable is constructed like this:
```ts
new<TFulfilled, TErrored, TCancelled>(promiseFactory: (token: IPromiseCancelToken) => Promise<TFulfilled>, options?: IPromiseObservableOptions): IPromiseObservable<TFulfilled, TErrored, TCancelled>;
```

The `promiseFactory` is a function returning a Promise, called in certain circumstances (see bellow).
The PromiseCancelToken provided by this function must be used to abort/cancel unnecessary work as seen previously (used in `then`for example).

This token is cancelled by the PromiseObservable if it has no more observers,
or if the Observer which generated the promise stopped to observe it for example.


The second argument `options` is used to adjust the behaviour:
- **clear**: used to auto cache/uncache the `promiseFactory`'s promise.
  - immediate (default: false): if set to true, when an Observer observes this Observable, the `promiseFactory` is called and not cached (so its called for each observers).
    If false, the promise returned by the `promiseFactory` is cached and reused.
  - complete (default: false): if set to true, the promise is uncached when it fulfils.
  - error (default: true): if set to true, the promise is uncached when it errors.
  - cancel (default: true): if set to true, the promise is uncached when it cancels.


By default, the first observer will call `promiseFactory`, and the returned promise will be cached (so following observers won't generate more promises),
**except** if the promise is rejected or cancelled (in this case, the cached promise is cleared, and the next observer will call again `promiseFactory`).

---

The PromiseObservable is a NotificationsObservable with the following KeyValueMap:

```ts
interface IPromiseNotificationKeyValueMap<TFulfilled, TErrored, TCancelled> {
  complete: TFulfilled;
  error: TErrored;
  cancel: TCancelled;
}
```

When the Promise resolves, an uniq Notification is emitted according to the Promise's state.

---

Using PromiseObservable, we can now create a simpler cancellable fetch function:

```ts
function http(url: string) {
  return new PromiseObservable((token: PromiseCancelToken) => {
    return fetch(url, { signal: token.toAbortController().signal });
  });
}

const observable = http(url)
  .on('complete', (response: Response) => {
    console.log('complete', response);
  }) // generates a new activated Observer, the promiseFactory is called and the request starts
  .on('error', (reason: any) => {
    console.error('error', reason);
  })
  .on('cancel', (reason: any) => {
    console.warn('cancel', reason);
  });
```


### Using FetchObservable to do http requests

For a simpler and safer implementation, FetchObservable is available: the arguments are the same as the `fetch` function.

It will properly handles the send/abort for you when the Observable is observed/unobserved.

```ts
new FetchObservable(url)
  .on('complete', (response: Response) => {
    console.log(response);
  })
  .on('error', (error: any) => {
    console.error('error', error);
  })
  .on('cancel', (reason: any) => {
    console.warn('cancelled', reason);
  });
```






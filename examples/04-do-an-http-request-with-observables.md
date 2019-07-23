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

Or even better, using the *wrap* methods:
```ts
function loadNews(page: number, token: IPromiseCancelToken = new PromiseCancelToken()): Promise<void> {
  return token.wrapPromise(fetch(`https://my-domain/api/news?page=${page}`, { signal: token.toAbortController().signal }))
    .then(token.wrapFunction((response: Response) => {
      return response.json();
    }))
    .then(token.wrapFunction((news: INews) => {
      // render news in DOM for example
    }));
}
```

Or if you prefer to use the provided CancellablePromise:
```ts
function loadNews(page: number, token: IPromiseCancelToken = new PromiseCancelToken()): Promise<void> {
  return new CancellablePromise(fetch(`https://my-domain/api/news?page=${page}`, { signal: token.toAbortController().signal }), token)
    .then((response: Response) => {
      return response.json();
    })
    .then((news: INews) => {
      // render news in DOM for example
    })
        .promise; // optional
}
```

**The PromiseCancelToken is useful to avoid unnecessary work into the promise chain, and should be used in most of your workflow.**

*Another example - assuming a payment mobile app:*

1) (t = 0s) user click on a "pay" button
    1) an http request starts in the background to verify the order and will take 10s (assuming the server is very slow). User navigation is not blocked.
    The server expects a valid user's session during the whole time.
    2) at the end a "choose a payment method" popup is displayed
2) (t = 5s) user expected a change, but nothing append (5s remaining for the request), so user decides to logout.
    1) *the first request must de cancelled, to avoid to display the "choose a payment method" popup after the user reached the logout page*
    2) a logout request is done. The server clear the user session.
    3) the user is redirected to the login page
    4) the server detects that the session is no more valid for the first request, and returns a 401 error.

This king of pattern occurs extremely frequently: a call to the server after a click on a button, followed by a success/error popup.
Sadly, by laziness or time constraint, developers tend to forgot the *cancel* part (and the error part too ;) ), where PromiseCancelToken simplifies the work.

### Simple cancellable http request example

```ts
/**
 * Creates a simple GET http request which loads an url and returns result as [Promise<string>, PromiseCancelToken]
 * @param url
 * @param token - optional PromiseCancelToken, will be returned in the tuple
 */
function createHttpRequest(url: string, token: IPromiseCancelToken = new PromiseCancelToken()): TCancellablePromiseTuple<string> {
  return {
    promise: new Promise<string>((resolve, reject) => {
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
  };
}

async function doRequest() {
  let { promise, token } = createHttpRequest(`https://my-domain`);
  promise.catch(PromiseCancelReason.discard); // hide 'cancel' error
  
  token.cancel(); // abort the request
  
  { promise, token } = createHttpRequest(`https://other-domain`);
  await promise;
}

doRequest();
```


### Understanding the PromiseObservable

Unlike Promises, Observables are cancellable due to their onObserve/onUnobserve mechanism (a core functionality), that's why we introduced the PromiseCancelToken.

We may consider that Promises have 3 final states: *completed*, *errored*, and *canceled*.

The PromiseObservable is constructed like this:
```ts
new<T>(promiseFactory: (token: IPromiseCancelToken) => Promise<T>, options?: IPromiseObservableOptions): IPromiseObservable<T>;
```

The `promiseFactory` is a function returning a Promise. It is called once if mode is different than `every`, else it is called for each Observers.
The PromiseCancelToken provided in this function must be used to abort/cancel unnecessary work as seen previously (used in `then` for example).

This token is cancelled by the PromiseObservable in certain circumstances: for example, if it has no more observers,
or if the Observer which generated the promise stopped to observe.

---

The PromiseObservable is a FiniteSateObservable with the following KeyValueMap:

```ts
interface IPromiseNotificationKeyValueMap<T> {
  next: T;
  complete: void;
  error: any;
  cancel: any;
}
```

When the Promise fulfils, a `next` Notification followed by a `complete` Notification are emitted.
If it rejects, a `error` Notification is send. Adn finally if it is cancelled, a `cancel` Notification is triggered.

---

Using PromiseObservable, we can now create a simple cancellable fetch function:

```ts
function http(url: string) {
  return new PromiseObservable((token: PromiseCancelToken) => {
    return fetch(url, { signal: token.toAbortController().signal });
  }, { mode: 'cache' });
}

const observable = http(url)
  .on('next', (response: Response) => {
    console.log( response);
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

Moreover, it provides some convenient methods to extract the body of the response:


```ts
new FetchObservable(url)
  .toJSON<INewsJSON>()
  .on('complete', (news: INewsJSON) => {
    console.log(news);
  })
  .on('error', (error: any) => {
    console.error('error', error);
  })
  .on('cancel', (reason: any) => {
    console.warn('cancelled', reason);
  });
```




import { NotificationsObservable } from '../../core/notifications-observable/implementation';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IReadonlyList } from '../../../misc/readonly-list/interfaces';
import { IWebSocketObservableObserver, IWebSocketObservableObserverOptions, IWebSocketObservableObserverValueMap, TWebSocketData } from './interfaces';
import { ReadonlyList } from '../../../misc/readonly-list/implementation';
import { EventsObservable } from '../events-observable/implementation';
import { IEventsObservable } from '../events-observable/interfaces';
import { INotificationsObservableContext, INotificationsObservableTypedConstructor } from '../../core/notifications-observable/interfaces';
import { Observable, ObservableClearObservers } from '../../../core/observable/implementation';
import { ActivableFactory } from '../../../classes/activable/implementation';
import { IObservable, IObservableContext } from '../../../core/observable/interfaces';
import { IObserver, Observer } from '../../../core/observer/public';

export const WEBSOCKET_OBSERVABLE_OBSERVER_PRIVATE = Symbol('websocket-observable-observer-private');

export interface IWebSocketObservableObserverPrivate {
  url: string;
  protocols: string[];
  readonlyProtocols: IReadonlyList<string>;
  binaryType: BinaryType;

  stateContext: INotificationsObservableContext<IWebSocketObservableObserverValueMap>;

  webSocket: WebSocket | null;
  webSocketListener: IEventsObservable<WebSocketEventMap> | null;

  in: IObservable<TWebSocketData>;
  inContext: IObservableContext<TWebSocketData>;
  out: IObserver<TWebSocketData>;
}

export interface IWebSocketObservableObserverInternal extends IWebSocketObservableObserver/*, INotificationsObservableInternal<IWebSocketObservableKeyValueMap>*/ {
  [WEBSOCKET_OBSERVABLE_OBSERVER_PRIVATE]: IWebSocketObservableObserverPrivate;
}

export function ConstructWebSocketObservableObserverPrivates(
  observableObserver: IWebSocketObservableObserver,
  context: INotificationsObservableContext<IWebSocketObservableObserverValueMap>,
  url: string,
  options: IWebSocketObservableObserverOptions = {}
): void {
  ConstructClassWithPrivateMembers(observableObserver, WEBSOCKET_OBSERVABLE_OBSERVER_PRIVATE);
  const privates: IWebSocketObservableObserverPrivate = (observableObserver as IWebSocketObservableObserverInternal)[WEBSOCKET_OBSERVABLE_OBSERVER_PRIVATE];

  privates.url = url;

  if (options.protocols === void 0) {
    privates.protocols = [];
  } else if (Array.isArray(options.protocols)) {
    privates.protocols = Array.from(options.protocols);
  } else {
    throw new TypeError(`Expected array as options.protocols`);
  }

  privates.readonlyProtocols = new ReadonlyList<string>(privates.protocols);
  privates.binaryType = 'blob';

  privates.stateContext = context;

  privates.webSocket = null;
  privates.webSocketListener = null;

  privates.in = new Observable<TWebSocketData>((context: IObservableContext<TWebSocketData>) => {
    privates.inContext = context;
  });

  privates.out = new Observer<TWebSocketData>((value: TWebSocketData) => {
    if ((privates.webSocket !== null) && (privates.webSocket.readyState === WebSocket.OPEN)) {
      privates.webSocket.send(value);
    }
  });
}


export function WebSocketObservableObserverActivate(observableObserver: IWebSocketObservableObserver): Promise<void> {
  return new Promise((resolve: any, reject: any) => {
    const privates: IWebSocketObservableObserverPrivate = (observableObserver as IWebSocketObservableObserverInternal)[WEBSOCKET_OBSERVABLE_OBSERVER_PRIVATE];

    privates.webSocket = new WebSocket(privates.url, privates.protocols);
    privates.webSocket.binaryType = privates.binaryType;
    privates.webSocketListener = new EventsObservable<WebSocketEventMap>(privates.webSocket)
      .on('open', () => {
        privates.stateContext.dispatch('activate');
        resolve();
      })
      .on('error', () => {
        const error = new Error(`WebSocket encountered an error`);
        privates.stateContext.dispatch('error', error);
        reject(error);
      })
      .on('close', () => {
        observableObserver.deactivate()
          .then(() => {
            reject(new Error(`WebSocket closed`));
          });
      })
      .on('message', (event: MessageEvent) => {
        privates.inContext.emit(event.data);
      });
  });
}

export function WebSocketObservableObserverDeactivate(observableObserver: IWebSocketObservableObserver): Promise<void> {
  const privates: IWebSocketObservableObserverPrivate = (observableObserver as IWebSocketObservableObserverInternal)[WEBSOCKET_OBSERVABLE_OBSERVER_PRIVATE];
  return UntilWebSocketClosed(privates.webSocket)
    .then(() => {
      privates.webSocket = null;
      ObservableClearObservers(privates.webSocketListener);
      privates.webSocketListener = null;
      privates.stateContext.dispatch('deactivate');
    });
}

export function UntilWebSocketOpen(webSocket: WebSocket): Promise<void> {
  return new Promise((resolve: any, reject: any) => {
    if (webSocket.readyState === WebSocket.OPEN) {
      resolve();
    } else {
      let timer: any;

      const clear = () => {
        webSocket.removeEventListener('error', onError);
        webSocket.removeEventListener('open', onOpen);
        clearInterval(timer);
      };

      const onOpen = () => {
        clear();
        resolve();
      };

      const onError = () => {
        clear();
        reject(new Error(`Websocket error`));
      };

      webSocket.addEventListener('error', onError);
      webSocket.addEventListener('open', onOpen);

      timer = setInterval(() => {
        if (webSocket.readyState === WebSocket.OPEN) {
          onOpen();
        }
      }, 200);
    }
  });
}

export function UntilWebSocketClosed(webSocket: WebSocket): Promise<void> {
  return new Promise((resolve: any, reject: any) => {
    if (webSocket.readyState === WebSocket.CLOSED) {
      resolve();
    } else {
      let timer: any;

      const clear = () => {
        webSocket.removeEventListener('error', onError);
        webSocket.removeEventListener('close', onClose);
        clearInterval(timer);
      };

      const onClose = () => {
        clear();
        resolve();
      };

      const onError = () => {
        clear();
        reject(new Error(`Websocket error`));
      };

      webSocket.addEventListener('error', onError);
      webSocket.addEventListener('close', onClose);

      timer = setInterval(() => {
        if (webSocket.readyState === WebSocket.CLOSED) {
          onClose();
        }
      }, 200);

      if (webSocket.readyState !== WebSocket.CLOSING) {
        webSocket.close();
      }
    }
  });
}


export function WebSocketObservableObserverGetProtocol(observableObserver: IWebSocketObservableObserver): string | null {
  return ((observableObserver as IWebSocketObservableObserverInternal)[WEBSOCKET_OBSERVABLE_OBSERVER_PRIVATE].webSocket === null)
    ? null
    : (observableObserver as IWebSocketObservableObserverInternal)[WEBSOCKET_OBSERVABLE_OBSERVER_PRIVATE].webSocket.protocol;
}

export function WebSocketObservableObserverSetBinaryType(observableObserver: IWebSocketObservableObserver, binaryType: BinaryType): void {
  switch (binaryType) {
    case 'blob':
    case 'arraybuffer':
      (observableObserver as IWebSocketObservableObserverInternal)[WEBSOCKET_OBSERVABLE_OBSERVER_PRIVATE].binaryType = binaryType;
      if ((observableObserver as IWebSocketObservableObserverInternal)[WEBSOCKET_OBSERVABLE_OBSERVER_PRIVATE].webSocket !== null) {
        (observableObserver as IWebSocketObservableObserverInternal)[WEBSOCKET_OBSERVABLE_OBSERVER_PRIVATE].webSocket.binaryType = binaryType;
      }
      break;
    default:
      throw new TypeError(`Expected 'blob' or 'arraybuffer' as binaryType`);
  }
}


export class WebSocketObservableObserver extends ActivableFactory<INotificationsObservableTypedConstructor<IWebSocketObservableObserverValueMap>>(NotificationsObservable) implements IWebSocketObservableObserver {

  constructor(url: string, options?: IWebSocketObservableObserverOptions) {
    let context: INotificationsObservableContext<IWebSocketObservableObserverValueMap> = void 0;
    super([{
      activate: () => {
        return WebSocketObservableObserverActivate(this);
      },
      deactivate: () => {
        return WebSocketObservableObserverDeactivate(this);
      },
    }], (_context: INotificationsObservableContext<IWebSocketObservableObserverValueMap>) => {
      context = _context;
    });
    ConstructWebSocketObservableObserverPrivates(this, context, url, options);
  }

  get in(): IObservable<TWebSocketData> {
    return ((this as unknown) as IWebSocketObservableObserverInternal)[WEBSOCKET_OBSERVABLE_OBSERVER_PRIVATE].in;
  }

  get out(): IObserver<TWebSocketData> {
    return ((this as unknown) as IWebSocketObservableObserverInternal)[WEBSOCKET_OBSERVABLE_OBSERVER_PRIVATE].out;
  }

  
  get url(): string {
    return ((this as unknown) as IWebSocketObservableObserverInternal)[WEBSOCKET_OBSERVABLE_OBSERVER_PRIVATE].url;
  }

  get protocols(): IReadonlyList<string> {
    return ((this as unknown) as IWebSocketObservableObserverInternal)[WEBSOCKET_OBSERVABLE_OBSERVER_PRIVATE].readonlyProtocols;
  }

  get protocol(): string | null {
    return WebSocketObservableObserverGetProtocol(this);
  }

  get binaryType(): BinaryType {
    return ((this as unknown) as IWebSocketObservableObserverInternal)[WEBSOCKET_OBSERVABLE_OBSERVER_PRIVATE].binaryType;
  }

  set binaryType(value: BinaryType) {
    WebSocketObservableObserverSetBinaryType(this, value);
  }
}


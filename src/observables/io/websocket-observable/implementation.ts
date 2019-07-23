import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IReadonlyList } from '../../../misc/readonly-list/interfaces';
import { IWebSocketIO, IWebSocketIOKeyValueMap, IWebSocketIOOptions, TWebSocketData } from './interfaces';
import { ReadonlyList } from '../../../misc/readonly-list/implementation';
import { EventsObservable } from '../../../notifications/observables/events/events-observable/implementation';
import { IEventsObservable } from '../../../notifications/observables/events/events-observable/interfaces';
import {
  INotificationsObservableContext, KeyValueMapToNotifications, KeyValueMapToNotificationsObservers
} from '../../../notifications/core/notifications-observable/interfaces';
import { Observable, ObservableClearObservers } from '../../../core/observable/implementation';
import { IObservable, IObservableContext } from '../../../core/observable/interfaces';
import { IObserver, Observer } from '../../../core/observer/public';
import { InputOutput } from '../io-observable/implementation';
import { IsIterable, IsObject } from '../../../helpers';
import { WebSocketError } from './WebSocketCloseEvent';


export const WEBSOCKET_IO_PRIVATE = Symbol('websocket-io-private');

export interface IWebSocketIOPrivate {
  url: string;
  protocols: string[];
  readonlyProtocols: IReadonlyList<string>;
  binaryType: BinaryType;

  webSocket: WebSocket | null;
  webSocketListener: IEventsObservable<WebSocketEventMap> | null;

  inContext: IObservableContext<TWebSocketData>;
  stateContext: INotificationsObservableContext<IWebSocketIOKeyValueMap>;
}

export interface IWebSocketIOInternal extends IWebSocketIO {
  [WEBSOCKET_IO_PRIVATE]: IWebSocketIOPrivate;
}

export function ConstructWebSocketIO(
  instance: IWebSocketIO,
  inContext: IObservableContext<TWebSocketData>,
  stateContext: INotificationsObservableContext<IWebSocketIOKeyValueMap>,
  url: string,
  options: IWebSocketIOOptions = {}
): void {
  ConstructClassWithPrivateMembers(instance, WEBSOCKET_IO_PRIVATE);
  const privates: IWebSocketIOPrivate = (instance as IWebSocketIOInternal)[WEBSOCKET_IO_PRIVATE];

  privates.url = url;

  if (options.protocols === void 0) {
    privates.protocols = [];
  } else if (IsIterable(options.protocols)) {
    privates.protocols = Array.from(options.protocols);
  } else {
    throw new TypeError(`Expected array as options.protocols`);
  }

  privates.readonlyProtocols = new ReadonlyList<string>(privates.protocols);
  privates.binaryType = 'blob';

  privates.webSocket = null;
  privates.webSocketListener = null;

  privates.inContext = inContext;
  privates.stateContext = stateContext;
}

export function IsWebSocketIO(value: any): value is IWebSocketIO {
  return IsObject(value)
    && value.hasOwnProperty(WEBSOCKET_IO_PRIVATE);
}


export function WebSocketIOActivate(instance: IWebSocketIO): Promise<void> {
  return new Promise((resolve: any, reject: any) => {
    const privates: IWebSocketIOPrivate = (instance as IWebSocketIOInternal)[WEBSOCKET_IO_PRIVATE];

    privates.webSocket = new WebSocket(privates.url, privates.protocols);
    privates.webSocket.binaryType = privates.binaryType;
    privates.webSocketListener = new EventsObservable<WebSocketEventMap>(privates.webSocket)
      .on('open', () => {
        privates.stateContext.dispatch('activate', void 0);
        resolve();
      })
      .on('error', () => {
        const error = new Error(`WebSocket encountered an error`);
        privates.stateContext.dispatch('error', error);
        reject(error);
      })
      .on('close', (event: CloseEvent) => {
        instance.deactivate()
          .then(() => {
            reject(new WebSocketError(event.code));
          });
      })
      .on('message', (event: MessageEvent) => {
        privates.inContext.emit(event.data);
      });
  });
}

export function WebSocketIODeactivate(instance: IWebSocketIO): Promise<void> {
  const privates: IWebSocketIOPrivate = (instance as IWebSocketIOInternal)[WEBSOCKET_IO_PRIVATE];
  const webSocket: WebSocket = privates.webSocket as WebSocket;
  if (webSocket.readyState !== WebSocket.CLOSING) {
    webSocket.close();
  }
  return CloseWebSocket(webSocket)
    .then(() => {
      privates.webSocket = null;
      ObservableClearObservers<KeyValueMapToNotifications<WebSocketEventMap>>(privates.webSocketListener as IEventsObservable<WebSocketEventMap>);
      privates.webSocketListener = null;
      privates.stateContext.dispatch('deactivate', void 0);
    });
}

export function WebSocketIOOnOutputEmit(instance: IWebSocketIO, value: TWebSocketData): void {
  const privates: IWebSocketIOPrivate = (instance as IWebSocketIOInternal)[WEBSOCKET_IO_PRIVATE];
  if ((privates.webSocket !== null) && (privates.webSocket.readyState === WebSocket.OPEN)) {
    privates.webSocket.send(value);
  }
}


export function UntilWebSocketState(webSocket: WebSocket, state: number): Promise<void> {
  return new Promise((resolve: any, reject: any) => {
    if (webSocket.readyState === state) {
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
        if (webSocket.readyState === state) {
          onOpen();
        }
      }, 200);
    }
  });
}

export function CloseWebSocket(webSocket: WebSocket): Promise<void> {
  if (webSocket.readyState !== WebSocket.CLOSING) {
    webSocket.close();
  }
  return UntilWebSocketState(webSocket, WebSocket.CLOSED);
}


export function WebSocketIOGetProtocol(instance: IWebSocketIO): string | null {
  const privates: IWebSocketIOPrivate = (instance as IWebSocketIOInternal)[WEBSOCKET_IO_PRIVATE];
  return (privates.webSocket === null)
    ? null
    : privates.webSocket.protocol;
}

export function WebSocketIOSetBinaryType(instance: IWebSocketIO, binaryType: BinaryType): void {
  const privates: IWebSocketIOPrivate = (instance as IWebSocketIOInternal)[WEBSOCKET_IO_PRIVATE];
  switch (binaryType) {
    case 'blob':
    case 'arraybuffer':
      privates.binaryType = binaryType;
      if (privates.webSocket !== null) {
        privates.webSocket.binaryType = binaryType;
      }
      break;
    default:
      throw new TypeError(`Expected 'blob' or 'arraybuffer' as binaryType`);
  }
}


// export function WebSocketIOFactory<TBase extends Constructor>(superClass: TBase) {
//   return MakeFactory<IWebSocketIOConstructor, [IInputOutputConstructor], TBase>((superClass) => {
//     return class WebSocketIO extends superClass implements IWebSocketIO {
//
//       constructor(...args: any[]) {
//         const [url, options]: TWebSocketIOConstructorArgs = args[0];
//         super(...args.slice(1));
//         ConstructInputOutput<TKVMap, TObservable, TObserver>(this, observable, observer);
//       }
//
//       get url(): string {
//         return ((this as unknown) as IWebSocketIOInternal)[WEBSOCKET_IO_PRIVATE].url;
//       }
//
//       get protocols(): IReadonlyList<string> {
//         return ((this as unknown) as IWebSocketIOInternal)[WEBSOCKET_IO_PRIVATE].readonlyProtocols;
//       }
//
//       get protocol(): string | null {
//         return WebSocketIOGetProtocol(this);
//       }
//
//       get binaryType(): BinaryType {
//         return ((this as unknown) as IWebSocketIOInternal)[WEBSOCKET_IO_PRIVATE].binaryType;
//       }
//
//       set binaryType(value: BinaryType) {
//         WebSocketIOSetBinaryType(this, value);
//       }
//
//
//       // @type-fix
//       matches(name: string, callback?: (value: any) => void): IterableIterator<KeyValueMapToNotificationsObservers<IWebSocketIOValueMap>> {
//         return super.matches(name, callback) as IterableIterator<KeyValueMapToNotificationsObservers<IWebSocketIOValueMap>>;
//       }
//     };
//   }, [InputOutputBaseFactory], superClass, {
//     name: 'WebSocketIO',
//     waterMarks: [],
//   });
// }


export class WebSocketIO extends InputOutput<IWebSocketIOKeyValueMap, IObservable<TWebSocketData>, IObserver<TWebSocketData>> implements IWebSocketIO {

  constructor(url: string, options?: IWebSocketIOOptions) {
    let inContext: IObservableContext<TWebSocketData>;
    let stateContext: INotificationsObservableContext<IWebSocketIOKeyValueMap>;

    super({
      observable: new Observable<TWebSocketData>((context: IObservableContext<TWebSocketData>) => {
        inContext = context;
      }),
      observer: new Observer<TWebSocketData>((value: TWebSocketData) => {
        WebSocketIOOnOutputEmit(this, value);
      }),
      activate: () => {
        return WebSocketIOActivate(this);
      },
      deactivate: () => {
        return WebSocketIODeactivate(this);
      },
      create: (context: INotificationsObservableContext<IWebSocketIOKeyValueMap>) => {
        stateContext = context;
      }
    });

    // let inContext: IObservableContext<TWebSocketData> = void 0;
    // const observable: IObservable<TWebSocketData> = new Observable<TWebSocketData>((context: IObservableContext<TWebSocketData>) => {
    //   inContext = context;
    // });
    //
    // const observer: IObserver<TWebSocketData> = new Observer<TWebSocketData>((value: TWebSocketData) => {
    //   WebSocketIOOnOutputEmit(this, value);
    // });
    //
    // let stateContext: INotificationsObservableContext<IWebSocketIOKeyValueMap> = void 0;
    // super([
    //     observable,
    //     observer
    //   ], [{
    //     activate: () => {
    //       return WebSocketIOActivate(this);
    //     },
    //     deactivate: () => {
    //       return WebSocketIODeactivate(this);
    //     },
    //   }], [
    //     (context: INotificationsObservableContext<IWebSocketIOKeyValueMap>) => {
    //       stateContext = context;
    //     }
    //   ],
    //   []);

    // @ts-ignore
    ConstructWebSocketIO(this, inContext, stateContext, url, options);
  }

  get url(): string {
    return ((this as unknown) as IWebSocketIOInternal)[WEBSOCKET_IO_PRIVATE].url;
  }

  get protocols(): IReadonlyList<string> {
    return ((this as unknown) as IWebSocketIOInternal)[WEBSOCKET_IO_PRIVATE].readonlyProtocols;
  }

  get protocol(): string | null {
    return WebSocketIOGetProtocol(this);
  }

  get binaryType(): BinaryType {
    return ((this as unknown) as IWebSocketIOInternal)[WEBSOCKET_IO_PRIVATE].binaryType;
  }

  set binaryType(value: BinaryType) {
    WebSocketIOSetBinaryType(this, value);
  }

  // @type-fix
  matches(name: string, callback?: (value: any) => void): IterableIterator<KeyValueMapToNotificationsObservers<IWebSocketIOKeyValueMap>> {
    return super.matches(name, callback) as IterableIterator<KeyValueMapToNotificationsObservers<IWebSocketIOKeyValueMap>>;
  }
}


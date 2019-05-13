import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IReadonlyList } from '../../../misc/readonly-list/interfaces';
import { IIOObservableObserver, IIOObservableObserverValueMap } from './interfaces';
import { ReadonlyList } from '../../../misc/readonly-list/implementation';
import { EventsObservable } from '../events-observable/implementation';
import { INotificationsObservableContext } from '../../core/notifications-observable/interfaces';
import { Observable, ObservableClearObservers } from '../../../core/observable/implementation';
import { IObservable, IObservableContext } from '../../../core/observable/interfaces';
// import { IObserver, Observer } from '../../../core/observer/public';
//
// export const IO_OBSERVABLE_OBSERVER_PRIVATE = Symbol('io-observable-observer-private');
//
// export interface IIOObservableObserverPrivate {
//   url: string;
//   protocols: string[];
//   readonlyProtocols: IReadonlyList<string>;
//   binaryType: BinaryType;
//
//   stateContext: INotificationsObservableContext<IIOObservableObserverValueMap>;
//
//   in: IObservable<TIOData>;
//   inContext: IObservableContext<TIOData>;
//   out: IObserver<TIOData>;
// }
//
// export interface IIOObservableObserverInternal extends IIOObservableObserver/*, INotificationsObservableInternal<IIOObservableKeyValueMap>*/
// {
//   [IO_OBSERVABLE_OBSERVER_PRIVATE]: IIOObservableObserverPrivate;
// }
//
// export function ConstructIOObservableObserver(
//   observableObserver: IIOObservableObserver,
//   context: INotificationsObservableContext<IIOObservableObserverValueMap>,
//   url: string,
//   options: IIOObservableObserverOptions = {}
// ): void {
//   ConstructClassWithPrivateMembers(observableObserver, IO_OBSERVABLE_OBSERVER_PRIVATE);
//   const privates: IIOObservableObserverPrivate = (observableObserver as IIOObservableObserverInternal)[IO_OBSERVABLE_OBSERVER_PRIVATE];
//
//   privates.url = url;
//
//   if (options.protocols === void 0) {
//     privates.protocols = [];
//   } else if (Array.isArray(options.protocols)) {
//     privates.protocols = Array.from(options.protocols);
//   } else {
//     throw new TypeError(`Expected array as options.protocols`);
//   }
//
//   privates.readonlyProtocols = new ReadonlyList<string>(privates.protocols);
//   privates.binaryType = 'blob';
//
//   privates.stateContext = context;
//
//   privates.webSocket = null;
//   privates.webSocketListener = null;
//
//   privates.in = new Observable<TIOData>((context: IObservableContext<TIOData>) => {
//     privates.inContext = context;
//   });
//
//   privates.out = new Observer<TIOData>((value: TIOData) => {
//     if ((privates.webSocket !== null) && (privates.webSocket.readyState === IO.OPEN)) {
//       privates.webSocket.send(value);
//     }
//   });
// }
//
//
// export function IOObservableObserverActivate(observableObserver: IIOObservableObserver): Promise<void> {
//   return new Promise((resolve: any, reject: any) => {
//     const privates: IIOObservableObserverPrivate = (observableObserver as IIOObservableObserverInternal)[IO_OBSERVABLE_OBSERVER_PRIVATE];
//
//     privates.webSocket = new IO(privates.url, privates.protocols);
//     privates.webSocket.binaryType = privates.binaryType;
//     privates.webSocketListener = new EventsObservable<IOEventMap>(privates.webSocket)
//       .on('open', () => {
//         privates.stateContext.dispatch('activate');
//         resolve();
//       })
//       .on('error', () => {
//         const error = new Error(`IO encountered an error`);
//         privates.stateContext.dispatch('error', error);
//         reject(error);
//       })
//       .on('close', () => {
//         observableObserver.deactivate()
//           .then(() => {
//             reject(new Error(`IO closed`));
//           });
//       })
//       .on('message', (event: MessageEvent) => {
//         privates.inContext.emit(event.data);
//       });
//   });
// }
//
// export function IOObservableObserverDeactivate(observableObserver: IIOObservableObserver): Promise<void> {
//   const privates: IIOObservableObserverPrivate = (observableObserver as IIOObservableObserverInternal)[IO_OBSERVABLE_OBSERVER_PRIVATE];
//   return UntilIOClosed(privates.webSocket)
//     .then(() => {
//       privates.webSocket = null;
//       ObservableClearObservers(privates.webSocketListener);
//       privates.webSocketListener = null;
//       privates.stateContext.dispatch('deactivate');
//     });
// }
//
// export function UntilIOOpen(webSocket: IO): Promise<void> {
//   return new Promise((resolve: any, reject: any) => {
//     if (webSocket.readyState === IO.OPEN) {
//       resolve();
//     } else {
//       let timer: any;
//
//       const clear = () => {
//         webSocket.removeEventListener('error', onError);
//         webSocket.removeEventListener('open', onOpen);
//         clearInterval(timer);
//       };
//
//       const onOpen = () => {
//         clear();
//         resolve();
//       };
//
//       const onError = () => {
//         clear();
//         reject(new Error(`Websocket error`));
//       };
//
//       webSocket.addEventListener('error', onError);
//       webSocket.addEventListener('open', onOpen);
//
//       timer = setInterval(() => {
//         if (webSocket.readyState === IO.OPEN) {
//           onOpen();
//         }
//       }, 200);
//     }
//   });
// }
//
// export function UntilIOClosed(webSocket: IO): Promise<void> {
//   return new Promise((resolve: any, reject: any) => {
//     if (webSocket.readyState === IO.CLOSED) {
//       resolve();
//     } else {
//       let timer: any;
//
//       const clear = () => {
//         webSocket.removeEventListener('error', onError);
//         webSocket.removeEventListener('close', onClose);
//         clearInterval(timer);
//       };
//
//       const onClose = () => {
//         clear();
//         resolve();
//       };
//
//       const onError = () => {
//         clear();
//         reject(new Error(`Websocket error`));
//       };
//
//       webSocket.addEventListener('error', onError);
//       webSocket.addEventListener('close', onClose);
//
//       timer = setInterval(() => {
//         if (webSocket.readyState === IO.CLOSED) {
//           onClose();
//         }
//       }, 200);
//
//       if (webSocket.readyState !== IO.CLOSING) {
//         webSocket.close();
//       }
//     }
//   });
// }
//
//
// export function IOObservableObserverGetProtocol(observableObserver: IIOObservableObserver): string | null {
//   return ((observableObserver as IIOObservableObserverInternal)[IO_OBSERVABLE_OBSERVER_PRIVATE].webSocket === null)
//     ? null
//     : (observableObserver as IIOObservableObserverInternal)[IO_OBSERVABLE_OBSERVER_PRIVATE].webSocket.protocol;
// }
//
// export function IOObservableObserverSetBinaryType(observableObserver: IIOObservableObserver, binaryType: BinaryType): void {
//   switch (binaryType) {
//     case 'blob':
//     case 'arraybuffer':
//       (observableObserver as IIOObservableObserverInternal)[IO_OBSERVABLE_OBSERVER_PRIVATE].binaryType = binaryType;
//       if ((observableObserver as IIOObservableObserverInternal)[IO_OBSERVABLE_OBSERVER_PRIVATE].webSocket !== null) {
//         (observableObserver as IIOObservableObserverInternal)[IO_OBSERVABLE_OBSERVER_PRIVATE].webSocket.binaryType = binaryType;
//       }
//       break;
//     default:
//       throw new TypeError(`Expected 'blob' or 'arraybuffer' as binaryType`);
//   }
// }
//
//
// // export type A = INotificationsObservable<IIOObservableObserverValueMap> & IActivable;
// // export function IOObservableObserverFactory<TBase extends Constructor>(superClass: TBase) {
// //   type TKVMap = IIOObservableObserverValueMap;
// //   type TObservable = IObservable<any>;
// //   // type TObservable = any;
// //   type TObserver = IObserver<any>;
// //   // type TObserver = any;
// //
// //   type A = {
// //     new(v: number, ...args: any[]): InstanceType<TBase>
// //   }
// //
// //   // const _superClass = ActivableFactory(NotificationsObservableFactory(ObservableFactory(superClass)));
// //   const _superClass = ActivableFactory(superClass) as any;
// //   return FactoryClass(class IOObservableObserver extends _superClass implements IIOObservableObserver<TKVMap, TObservable, TObserver> {
// //     constructor(...args: any[]) {
// //       const []: TIOObservableObserverConstructorArgs = args[0];
// //       super(...args.slice(1));
// //
// //       // ConstructActivable(this, hook);
// //     }
// //
// //     get in(): TObservable {
// //       return ((this as unknown) as IIOObservableObserverInternal)[IO_OBSERVABLE_OBSERVER_PRIVATE].in;
// //     }
// //
// //     get out(): TObserver {
// //       return ((this as unknown) as IIOObservableObserverInternal)[IO_OBSERVABLE_OBSERVER_PRIVATE].out;
// //     }
// //   })<TIOObservableObserverConstructorArgs>('IOObservableObserver');
// // }
// //
// // export const IOObservableObserver: IIOObservableObserverConstructor = class IOObservableObserver extends IOObservableObserverFactory(ActivableFactory<INotificationsObservableTypedConstructor<IIOObservableObserverValueMap>>(NotificationsObservable)) {
// //   constructor() {
// //     super([], [], []);
// //   }
// // };
//
// // export const IOObservableObserver: IIOObservableObserverConstructor = class IOObservableObserver<TKVMap extends IOKeyValueMapGenericConstraint<TKVMap>, TObservable extends IObservable<any>, TObserver extends IObserver<any>> extends ActivableFactory<INotificationsObservableTypedConstructor<IIOObservableObserverValueMap>>(NotificationsObservable) implements IIOObservableObserver<TKVMap, TObservable, TObserver> {
// //
// //   constructor(url: string, options?: IIOObservableObserverOptions) {
// //     let context: INotificationsObservableContext<IIOObservableObserverValueMap> = void 0;
// //     super([{
// //       activate: () => {
// //         return IOObservableObserverActivate(this);
// //       },
// //       deactivate: () => {
// //         return IOObservableObserverDeactivate(this);
// //       },
// //     }], (_context: INotificationsObservableContext<IIOObservableObserverValueMap>) => {
// //       context = _context;
// //     });
// //     ConstructIOObservableObserver(this, context, url, options);
// //   }
// //
// //   get in(): IObservable<TIOData> {
// //     return ((this as unknown) as IIOObservableObserverInternal)[IO_OBSERVABLE_OBSERVER_PRIVATE].in;
// //   }
// //
// //   get out(): IObserver<TIOData> {
// //     return ((this as unknown) as IIOObservableObserverInternal)[IO_OBSERVABLE_OBSERVER_PRIVATE].out;
// //   }
// //
// //
// //   get url(): string {
// //     return ((this as unknown) as IIOObservableObserverInternal)[IO_OBSERVABLE_OBSERVER_PRIVATE].url;
// //   }
// //
// //   get protocols(): IReadonlyList<string> {
// //     return ((this as unknown) as IIOObservableObserverInternal)[IO_OBSERVABLE_OBSERVER_PRIVATE].readonlyProtocols;
// //   }
// //
// //   get protocol(): string | null {
// //     return IOObservableObserverGetProtocol(this);
// //   }
// //
// //   get binaryType(): BinaryType {
// //     return ((this as unknown) as IIOObservableObserverInternal)[IO_OBSERVABLE_OBSERVER_PRIVATE].binaryType;
// //   }
// //
// //   set binaryType(value: BinaryType) {
// //     IOObservableObserverSetBinaryType(this, value);
// //   }
// // };
// //

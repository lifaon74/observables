// import { ICancellablePromise } from '../../promises/cancellable-promise/interfaces';
// import { DeepMap } from '../../classes/DeepMap';
// import { ICancellableContext, TRegisterCallback } from './interfaces';
// import { ConstructClassWithPrivateMembers } from '../helpers/ClassWithPrivateMembers';
// import { IsObject } from '../../helpers';
// import { IActivableLike } from '../activable/interfaces';
// import { IAdvancedAbortSignal } from '../advanced-abort-controller/advanced-abort-signal/interfaces';
// import { CancellablePromise } from '../../promises/cancellable-promise/implementation';
// import { TPromiseOrValue } from '../../promises/interfaces';
//
// /** PRIVATES **/
//
// export const CANCELLABLE_CONTEXT_PRIVATE = Symbol('cancellable-context-private');
//
// export interface ICancellableContextPrivate {
//   map: DeepMap<ICancellablePromise<any>>;
// }
//
// export interface ICancellableContextInternal extends ICancellableContext {
//   [CANCELLABLE_CONTEXT_PRIVATE]: ICancellableContextPrivate;
// }
//
// /** CONSTRUCTOR **/
//
// export function ConstructCancellableContext(
//   instance: ICancellableContext
// ): void {
//   ConstructClassWithPrivateMembers(instance, CANCELLABLE_CONTEXT_PRIVATE);
//   const privates: ICancellableContextPrivate = (instance as ICancellableContextInternal)[CANCELLABLE_CONTEXT_PRIVATE];
//   privates.map = new DeepMap<ICancellablePromise<any>>();
// }
//
// export function IsCancellableContext(value: any): value is ICancellableContext {
//   return IsObject(value)
//     && value.hasOwnProperty(CANCELLABLE_CONTEXT_PRIVATE as symbol);
// }
//
// /** METHODS **/
//
// /** PRIVATE **/
// export function CancellableContextNormalizeKey(key: string | any[]): any[] {
//   return Array.isArray(key) ? key : [key];
// }
//
// /**
//  * Registers a cancellablePromise with a specific key.
//  *  - Properly clear the map when the promise is resolved or cancelled.
//  */
// export function CancellableContextPrivateRegister<T>(
//   instance: ICancellableContext,
//   key: any[],
//   cancellablePromise: ICancellablePromise<T>
// ): ICancellablePromise<T> {
//   const privates: ICancellableContextPrivate = (instance as ICancellableContextInternal)[CANCELLABLE_CONTEXT_PRIVATE];
//   privates.map.set(key, cancellablePromise);
//   return cancellablePromise.finally(() => {
//     privates.map.delete(key);
//   }, true);
// }
//
// /**
//  * Calls 'callback', generates a CancellablePromise from its result and registers it
//  */
// export function CancellableContextPrivateRegisterFromCallback<T>(
//   instance: ICancellableContext,
//   key: any[],
//   callback: TRegisterCallback<T>,
//   signal?: IAdvancedAbortSignal
// ): ICancellablePromise<T> {
//   return CancellableContextPrivateRegister<T>(instance, key, CancellablePromise.try<T>((signal: IAdvancedAbortSignal) => {
//     if (token !== void 0) {
//       _token.linkWithToken(token);
//     }
//     return callback(_token);
//   }));
// }
//
// /**
//  * Cancels a cancellablePromise and removes it from the map
//  */
// export function CancellableContextPrivateClear<T>(
//   instance: ICancellableContext,
//   cancellablePromise: ICancellablePromise<T>
// ): ICancellablePromise<T> {
//   // INFO: all the cancellable pipeline is cancelled (including .then outside of the factory)
//   cancellablePromise.token.cancel();
//   return cancellablePromise;
// }
//
//
// /**
//  * Await for 'cancellablePromise' to complete, then calls 'callback'
//  */
// export function CancellableContextPrivateQueue<T>(
//   instance: ICancellableContext,
//   cancellablePromise: ICancellablePromise<T>,
//   key: any[],
//   callback: TRegisterCallback<T>,
//   signal?: IAdvancedAbortSignal,
// ): ICancellablePromise<T> {
//   return cancellablePromise
//     .then(
//       () => void 0,
//       (error: any) => {
//         console.warn(error);
//       },
//       () => void 0
//     ) // continues even if previous promise fails
//     .then(() => CancellableContextPrivateRegisterFromCallback<T>(instance, key, callback, token)) as ICancellablePromise<T>;
// }
//
// /**
//  * Cancels 'cancellablePromise', then calls 'callback'
//  */
// export function CancellableContextPrivateReplace<T>(
//   instance: ICancellableContext,
//   cancellablePromise: ICancellablePromise<T>,
//   key: any[],
//   callback: TRegisterCallback<T>,
//   signal?: IAdvancedAbortSignal,
// ): ICancellablePromise<T> {
//   return CancellableContextPrivateQueue<T>(instance, CancellableContextPrivateClear<T>(instance, cancellablePromise), key, callback, token);
// }
//
// /** PUBLIC **/
//
// export function CancellableContextRegister<T>(
//   instance: ICancellableContext,
//   key: string | any[],
//   callback: TRegisterCallback<T>,
//   mode: TRegisterTaskMode = 'warn'
// ): ICancellablePromise<T> {
//   const privates: ICancellableContextPrivate = (instance as ICancellableContextInternal)[CANCELLABLE_CONTEXT_PRIVATE];
//   const _key: any[] = CancellableContextNormalizeKey(key);
//
//   if (typeof callback === 'function') {
//     if (privates.map.has(_key)) {
//       const promise: ICancellablePromise<T> = privates.map.get(_key) as ICancellablePromise<T>;
//
//       switch (mode) {
//         case 'skip':
//           return promise;
//         case 'throw':
//           return CancellablePromise.reject(new Error(`Key '${ key }' uniq and already in use`));
//         case 'warn':
//           console.warn(`Key '${ key }' uniq and already in use => skipped`);
//           return promise;
//         case 'replace':
//           return CancellableContextPrivateReplace<T>(instance, promise, _key, callback);
//         case 'queue':
//           return CancellableContextPrivateQueue<T>(instance, promise, _key, callback);
//         default:
//           return CancellablePromise.reject(new TypeError(`Invalid mode ${ mode }`));
//       }
//     } else {
//       return CancellableContextPrivateRegisterFromCallback<T>(instance, _key, callback);
//     }
//   } else {
//     return CancellablePromise.reject(new TypeError(`Expected function as callback`));
//   }
// }
//
// export function CancellableContextRegisterActivable<T extends IActivableLike>(
//   instance: ICancellableContext,
//   key: string | any[],
//   callback: () => T,
//   mode?: TRegisterActivableMode,
// ): ICancellablePromise<void> {
//   return CancellableContextRegister<void>(instance, key, (signal: IAdvancedAbortSignal) => {
//     return CancellablePromiseFromActivable(callback(), token);
//   }, mode);
// }
//
// export function CancellableContextClear(
//   instance: ICancellableContext,
//   key: string | any[]
// ): ICancellablePromise<any> | undefined {
//   const privates: ICancellableContextPrivate = (instance as ICancellableContextInternal)[CANCELLABLE_CONTEXT_PRIVATE];
//   const _key: any[] = CancellableContextNormalizeKey(key);
//   if (privates.map.has(_key)) {
//     return CancellableContextPrivateClear<any>(instance, privates.map.get(_key) as ICancellablePromise<any>);
//   } else {
//     return void 0;
//   }
// }
//
// export function CancellableContextGet(
//   instance: ICancellableContext,
//   key: string | any[]
// ): ICancellablePromise<any> | undefined {
//   return (instance as ICancellableContextInternal)[CANCELLABLE_CONTEXT_PRIVATE].map.get(CancellableContextNormalizeKey(key));
// }
//
// export function CancellableContextClearAll(
//   instance: ICancellableContext
// ): Promise<void> {
//   const unsubscribe = (): Promise<void> => {
//     const iterator: IterableIterator<[any[], ICancellablePromise<any>]> =
//       (instance as ICancellableContextInternal)[CANCELLABLE_CONTEXT_PRIVATE].map.entries();
//     const result: IteratorResult<[any[], ICancellablePromise<any>]> = iterator.next();
//
//     if (result.done) {
//       return Promise.resolve();
//     } else {
//       return CancellableContextPrivateClear<any>(instance, result.value[1]).then(unsubscribe);
//     }
//   };
//
//   return unsubscribe();
// }
//
//
// /**
//  * HELPERS
//  */
//
// /**
//  * Creates a CancellablePromise from an Activable
//  *  - deactivates the Activable if the CancellablePromise is cancelled
//  *  - resolves when the Activable is deactivated
//  */
// export function CancellablePromiseFromActivable(activable: IActivableLike, signal?: IAdvancedAbortSignal): ICancellablePromise<void> {
//   return new CancellablePromise<void>((
//     resolve: (value?: TPromiseOrValue<void>) => void,
//     reject: (reason?: any) => void,
//     signal: IAdvancedAbortSignal
//   ) => {
//     const tokenCancelListener = signal.addListener('cancel', () => {
//       tokenCancelListener.deactivate();
//       activable.deactivate();
//     });
//     tokenCancelListener.activate();
//
//     resolve(
//       PromiseTry(() => activable.activate())
//         .then(() => UntilActivableDeactivated(activable, token))
//         .then(() => {
//           tokenCancelListener.deactivate();
//         })
//     );
//   }, token);
// }
//
// /**
//  * Creates a promise resolved when the Activable is deactivated
//  */
// export function UntilActivableDeactivated(activable: IActivableLike, signal?: IAdvancedAbortSignal): ICancellablePromise<void> {
//   return new CancellablePromise<void>((resolve: any, reject: any, signal: IAdvancedAbortSignal) => {
//     if (activable.activated) {
//       let stateListener: () => void;
//       let timer: any;
//
//       const _clear = () => {
//         if (stateListener !== void 0) {
//           stateListener();
//         }
//         clearInterval(timer);
//         tokenCancelListener.deactivate();
//       };
//
//       const _resolve = () => {
//         if (!activable.activated) {
//           _clear();
//           resolve();
//         }
//       };
//
//       const tokenCancelListener = token.addListener('cancel', () => {
//         _clear();
//       });
//       tokenCancelListener.activate();
//
//       timer = setInterval(_resolve, 500);
//
//       if (typeof activable.addStateListener === 'function') {
//         stateListener = activable.addStateListener(_resolve);
//       }
//     } else {
//       resolve();
//     }
//   }, token);
// }
//
// /**
//  * CLASS
//  */
//
// export class CancellableContext implements ICancellableContext {
//
//   constructor() {
//     ConstructCancellableContext(this);
//   }
//
//   registerTask<T>(
//     key: string | any[],
//     callback: TRegisterCallback<T>,
//     mode?: TRegisterTaskMode,
//   ): ICancellablePromise<T> {
//     return CancellableContextRegister<T>(this, key, callback, mode);
//   }
//
//   registerActivable<T extends IActivableLike>(
//     key: string | any[],
//     callback: () => T,
//     mode?: TRegisterActivableMode,
//   ): ICancellablePromise<void> {
//     return CancellableContextRegisterActivable(this, key, callback, mode);
//   }
//
//   get(key: string | any[]): ICancellablePromise<any> | undefined {
//     return CancellableContextGet(this, key);
//   }
//
//
//   clear(key: string | any[]): ICancellablePromise<any> | undefined {
//     return CancellableContextClear(this, key);
//   }
//
//   clearAll(): Promise<void> {
//     return CancellableContextClearAll(this);
//   }
// }
//
//
//
// import { ICancellablePromise } from '../../promises/cancellable-promise/interfaces';
// import { DeepMap } from '../../classes/DeepMap';
// import { ICancellableContext, TRegisterCallback } from './interfaces';
// import { ConstructClassWithPrivateMembers } from '../helpers/ClassWithPrivateMembers';
// import { IsObject } from '../../helpers';
// import { IActivableLike } from '../activable/interfaces';
// import { IAdvancedAbortSignal } from '../advanced-abort-controller/advanced-abort-signal/interfaces';
// import { CancellablePromise } from '../../promises/cancellable-promise/implementation';
// import { TPromiseOrValue } from '../../promises/interfaces';
//
// /** PRIVATES **/
//
// export const CANCELLABLE_CONTEXT_PRIVATE = Symbol('cancellable-context-private');
//
// export interface ICancellableContextPrivate {
//   map: DeepMap<ICancellablePromise<any>>;
// }
//
// export interface ICancellableContextInternal extends ICancellableContext {
//   [CANCELLABLE_CONTEXT_PRIVATE]: ICancellableContextPrivate;
// }
//
// /** CONSTRUCTOR **/
//
// export function ConstructCancellableContext(
//   instance: ICancellableContext
// ): void {
//   ConstructClassWithPrivateMembers(instance, CANCELLABLE_CONTEXT_PRIVATE);
//   const privates: ICancellableContextPrivate = (instance as ICancellableContextInternal)[CANCELLABLE_CONTEXT_PRIVATE];
//   privates.map = new DeepMap<ICancellablePromise<any>>();
// }
//
// export function IsCancellableContext(value: any): value is ICancellableContext {
//   return IsObject(value)
//     && value.hasOwnProperty(CANCELLABLE_CONTEXT_PRIVATE as symbol);
// }
//
// /** METHODS **/
//
// /** PRIVATE **/
// export function CancellableContextNormalizeKey(key: string | any[]): any[] {
//   return Array.isArray(key) ? key : [key];
// }
//
// /**
//  * Registers a cancellablePromise with a specific key.
//  *  - Properly clear the map when the promise is resolved or cancelled.
//  */
// export function CancellableContextPrivateRegister<T>(
//   instance: ICancellableContext,
//   key: any[],
//   cancellablePromise: ICancellablePromise<T>
// ): ICancellablePromise<T> {
//   const privates: ICancellableContextPrivate = (instance as ICancellableContextInternal)[CANCELLABLE_CONTEXT_PRIVATE];
//   privates.map.set(key, cancellablePromise);
//   return cancellablePromise.finally(() => {
//     privates.map.delete(key);
//   }, true);
// }
//
// /**
//  * Calls 'callback', generates a CancellablePromise from its result and registers it
//  */
// export function CancellableContextPrivateRegisterFromCallback<T>(
//   instance: ICancellableContext,
//   key: any[],
//   callback: TRegisterCallback<T>,
//   signal?: IAdvancedAbortSignal
// ): ICancellablePromise<T> {
//   return CancellableContextPrivateRegister<T>(instance, key, CancellablePromise.try<T>((signal: IAdvancedAbortSignal) => {
//     if (token !== void 0) {
//       _token.linkWithToken(token);
//     }
//     return callback(_token);
//   }));
// }
//
// /**
//  * Cancels a cancellablePromise and removes it from the map
//  */
// export function CancellableContextPrivateClear<T>(
//   instance: ICancellableContext,
//   cancellablePromise: ICancellablePromise<T>
// ): ICancellablePromise<T> {
//   // INFO: all the cancellable pipeline is cancelled (including .then outside of the factory)
//   cancellablePromise.token.cancel();
//   return cancellablePromise;
// }
//
//
// /**
//  * Await for 'cancellablePromise' to complete, then calls 'callback'
//  */
// export function CancellableContextPrivateQueue<T>(
//   instance: ICancellableContext,
//   cancellablePromise: ICancellablePromise<T>,
//   key: any[],
//   callback: TRegisterCallback<T>,
//   signal?: IAdvancedAbortSignal,
// ): ICancellablePromise<T> {
//   return cancellablePromise
//     .then(
//       () => void 0,
//       (error: any) => {
//         console.warn(error);
//       },
//       () => void 0
//     ) // continues even if previous promise fails
//     .then(() => CancellableContextPrivateRegisterFromCallback<T>(instance, key, callback, token)) as ICancellablePromise<T>;
// }
//
// /**
//  * Cancels 'cancellablePromise', then calls 'callback'
//  */
// export function CancellableContextPrivateReplace<T>(
//   instance: ICancellableContext,
//   cancellablePromise: ICancellablePromise<T>,
//   key: any[],
//   callback: TRegisterCallback<T>,
//   signal?: IAdvancedAbortSignal,
// ): ICancellablePromise<T> {
//   return CancellableContextPrivateQueue<T>(instance, CancellableContextPrivateClear<T>(instance, cancellablePromise), key, callback, token);
// }
//
// /** PUBLIC **/
//
// export function CancellableContextRegister<T>(
//   instance: ICancellableContext,
//   key: string | any[],
//   callback: TRegisterCallback<T>,
//   mode: TRegisterTaskMode = 'warn'
// ): ICancellablePromise<T> {
//   const privates: ICancellableContextPrivate = (instance as ICancellableContextInternal)[CANCELLABLE_CONTEXT_PRIVATE];
//   const _key: any[] = CancellableContextNormalizeKey(key);
//
//   if (typeof callback === 'function') {
//     if (privates.map.has(_key)) {
//       const promise: ICancellablePromise<T> = privates.map.get(_key) as ICancellablePromise<T>;
//
//       switch (mode) {
//         case 'skip':
//           return promise;
//         case 'throw':
//           return CancellablePromise.reject(new Error(`Key '${ key }' uniq and already in use`));
//         case 'warn':
//           console.warn(`Key '${ key }' uniq and already in use => skipped`);
//           return promise;
//         case 'replace':
//           return CancellableContextPrivateReplace<T>(instance, promise, _key, callback);
//         case 'queue':
//           return CancellableContextPrivateQueue<T>(instance, promise, _key, callback);
//         default:
//           return CancellablePromise.reject(new TypeError(`Invalid mode ${ mode }`));
//       }
//     } else {
//       return CancellableContextPrivateRegisterFromCallback<T>(instance, _key, callback);
//     }
//   } else {
//     return CancellablePromise.reject(new TypeError(`Expected function as callback`));
//   }
// }
//
// export function CancellableContextRegisterActivable<T extends IActivableLike>(
//   instance: ICancellableContext,
//   key: string | any[],
//   callback: () => T,
//   mode?: TRegisterActivableMode,
// ): ICancellablePromise<void> {
//   return CancellableContextRegister<void>(instance, key, (signal: IAdvancedAbortSignal) => {
//     return CancellablePromiseFromActivable(callback(), token);
//   }, mode);
// }
//
// export function CancellableContextClear(
//   instance: ICancellableContext,
//   key: string | any[]
// ): ICancellablePromise<any> | undefined {
//   const privates: ICancellableContextPrivate = (instance as ICancellableContextInternal)[CANCELLABLE_CONTEXT_PRIVATE];
//   const _key: any[] = CancellableContextNormalizeKey(key);
//   if (privates.map.has(_key)) {
//     return CancellableContextPrivateClear<any>(instance, privates.map.get(_key) as ICancellablePromise<any>);
//   } else {
//     return void 0;
//   }
// }
//
// export function CancellableContextGet(
//   instance: ICancellableContext,
//   key: string | any[]
// ): ICancellablePromise<any> | undefined {
//   return (instance as ICancellableContextInternal)[CANCELLABLE_CONTEXT_PRIVATE].map.get(CancellableContextNormalizeKey(key));
// }
//
// export function CancellableContextClearAll(
//   instance: ICancellableContext
// ): Promise<void> {
//   const unsubscribe = (): Promise<void> => {
//     const iterator: IterableIterator<[any[], ICancellablePromise<any>]> =
//       (instance as ICancellableContextInternal)[CANCELLABLE_CONTEXT_PRIVATE].map.entries();
//     const result: IteratorResult<[any[], ICancellablePromise<any>]> = iterator.next();
//
//     if (result.done) {
//       return Promise.resolve();
//     } else {
//       return CancellableContextPrivateClear<any>(instance, result.value[1]).then(unsubscribe);
//     }
//   };
//
//   return unsubscribe();
// }
//
//
// /**
//  * HELPERS
//  */
//
// /**
//  * Creates a CancellablePromise from an Activable
//  *  - deactivates the Activable if the CancellablePromise is cancelled
//  *  - resolves when the Activable is deactivated
//  */
// export function CancellablePromiseFromActivable(activable: IActivableLike, signal?: IAdvancedAbortSignal): ICancellablePromise<void> {
//   return new CancellablePromise<void>((
//     resolve: (value?: TPromiseOrValue<void>) => void,
//     reject: (reason?: any) => void,
//     signal: IAdvancedAbortSignal
//   ) => {
//     const tokenCancelListener = signal.addListener('cancel', () => {
//       tokenCancelListener.deactivate();
//       activable.deactivate();
//     });
//     tokenCancelListener.activate();
//
//     resolve(
//       PromiseTry(() => activable.activate())
//         .then(() => UntilActivableDeactivated(activable, token))
//         .then(() => {
//           tokenCancelListener.deactivate();
//         })
//     );
//   }, token);
// }
//
// /**
//  * Creates a promise resolved when the Activable is deactivated
//  */
// export function UntilActivableDeactivated(activable: IActivableLike, signal?: IAdvancedAbortSignal): ICancellablePromise<void> {
//   return new CancellablePromise<void>((resolve: any, reject: any, signal: IAdvancedAbortSignal) => {
//     if (activable.activated) {
//       let stateListener: () => void;
//       let timer: any;
//
//       const _clear = () => {
//         if (stateListener !== void 0) {
//           stateListener();
//         }
//         clearInterval(timer);
//         tokenCancelListener.deactivate();
//       };
//
//       const _resolve = () => {
//         if (!activable.activated) {
//           _clear();
//           resolve();
//         }
//       };
//
//       const tokenCancelListener = token.addListener('cancel', () => {
//         _clear();
//       });
//       tokenCancelListener.activate();
//
//       timer = setInterval(_resolve, 500);
//
//       if (typeof activable.addStateListener === 'function') {
//         stateListener = activable.addStateListener(_resolve);
//       }
//     } else {
//       resolve();
//     }
//   }, token);
// }
//
// /**
//  * CLASS
//  */
//
// export class CancellableContext implements ICancellableContext {
//
//   constructor() {
//     ConstructCancellableContext(this);
//   }
//
//   registerTask<T>(
//     key: string | any[],
//     callback: TRegisterCallback<T>,
//     mode?: TRegisterTaskMode,
//   ): ICancellablePromise<T> {
//     return CancellableContextRegister<T>(this, key, callback, mode);
//   }
//
//   registerActivable<T extends IActivableLike>(
//     key: string | any[],
//     callback: () => T,
//     mode?: TRegisterActivableMode,
//   ): ICancellablePromise<void> {
//     return CancellableContextRegisterActivable(this, key, callback, mode);
//   }
//
//   get(key: string | any[]): ICancellablePromise<any> | undefined {
//     return CancellableContextGet(this, key);
//   }
//
//
//   clear(key: string | any[]): ICancellablePromise<any> | undefined {
//     return CancellableContextClear(this, key);
//   }
//
//   clearAll(): Promise<void> {
//     return CancellableContextClearAll(this);
//   }
// }
//
//
//

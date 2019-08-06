import { ICancelToken } from '../../misc/cancel-token/interfaces';
import { TPromiseOrValue, TPromiseOrValueFactory } from '../interfaces';
import { PromiseTry } from '../helpers';
import { CancelToken, IsCancelToken } from '../../misc/cancel-token/implementation';
import { ToIterator } from '../../helpers';

// export type TRunConcurrentPromisesErrorMode = 'continue' | 'throw' | 'cancel';
//
// export interface IConcurrentPromisesSequentialOptions {
//   concurrent?: number;
//   token?: ICancelToken;
//   errorMode?: TRunConcurrentPromisesErrorMode;
// }
//
// export interface IConcurrentPromisesSequentialOptionsStrict extends Required<IConcurrentPromisesSequentialOptions> {
// }
//
// export const DefaultConcurrentPromisesSequentialOptions: Omit<Required<IConcurrentPromisesSequentialOptions>, 'token'> = {
//   concurrent: 1,
//   errorMode: 'cancel',
// };
//
// export function NormalizeConcurrentPromisesSequentialOptions(
//   options: IConcurrentPromisesSequentialOptions = {},
//   defaultOptions: Omit<Required<IConcurrentPromisesSequentialOptions>, 'token'> = DefaultConcurrentPromisesSequentialOptions
// ): IConcurrentPromisesSequentialOptionsStrict {
//   const _options: IConcurrentPromisesSequentialOptionsStrict = {} as IConcurrentPromisesSequentialOptionsStrict;
//
//   _options.concurrent = (options.concurrent === void 0)
//     ? defaultOptions.concurrent
//     : Number(options.concurrent);
//
//   if (Number.isNaN(_options.concurrent)) {
//     throw new TypeError(`Expected number as options.concurrent`);
//   }
//
//   if (_options.concurrent < 1) {
//     throw new TypeError(`Expected options.concurrent greater than 0`);
//   }
//
//   if (options.errorMode === void 0) {
//     _options.errorMode = defaultOptions.errorMode;
//   } else if (['continue', 'throw', 'cancel'].includes(options.errorMode)){
//     _options.errorMode = options.errorMode;
//   } else {
//     throw new TypeError(`Expected 'continue', 'throw', 'cancel' or void as options.errorMode`);
//   }
//
//   if (options.token === void 0) {
//     _options.token = new CancelToken();
//   } else if (IsCancelToken(options.token)) {
//     _options.token = options.token;
//   } else {
//     throw new TypeError(`Expected CancelToken or void as options.token`);
//   }
//
//   return _options;
// }
//






export function * PromiseFactoriesIteratorToPromiseIterable<T>(iterator: Iterator<TPromiseOrValueFactory<T>>): IterableIterator<Promise<T>> {
  let result: IteratorResult<TPromiseOrValueFactory<T>>;
  while (!(result = iterator.next()).done) {
    yield PromiseTry<T>(result.value);
  }
}

// export async function * PromiseFactoriesToAsyncIterable<T>(factories: TPromiseOrValueFactory<T>[]): AsyncIterableIterator<T> {
//   yield * PromiseFactoriesToIterable<T>(factories);
// }



export function RunConcurrentPromises<T>(iterator: Iterator<TPromiseOrValue<T>>, concurrent: number = 1, token: ICancelToken = new CancelToken()): Promise<void> {
  const next = token.wrapFunction((): TPromiseOrValue<void> => {
    const result: IteratorResult<TPromiseOrValue<T>> = iterator.next();
    if (!result.done) {
      return Promise.resolve(result.value).then(next);
    }
  });

  return Promise.all(
    Array.from({ length: concurrent }, next)
  ).then(() => void 0, (error: any) => {
    token.cancel(error);
    throw error;
  });
}


// export function RunConcurrentPromiseFactories<T>(factories: TCastableToIteratorStrict<TPromiseOrValueFactory<T>>, concurrent?: number, token?: ICancelToken): Promise<void> {
//   return RunConcurrentPromises(
//     PromiseFactoriesIteratorToPromiseIterable(ToIterator(factories)),
//     concurrent,
//     token
//   );
// }

// export function RunConcurrentPromises<T>(iterable: IterableIterator<TPromiseOrValueFactory<T>>, options?: IConcurrentPromisesSequentialOptions): Promise<void> {
//   const _options: IConcurrentPromisesSequentialOptionsStrict = NormalizeConcurrentPromisesSequentialOptions(options);
//
//   const next = (): Promise<any> => {
//
//     if ((_options.token !== void 0) && _options.token.cancelled) {
//       return new Promise(() => {}); // never resolve
//     } else {
//       const result: IteratorResult<TPromiseOrValueFactory<T>> = iterable.next();
//       return result.done
//         ? Promise.resolve()
//         : Promise.resolve(result.value)
//           .then(next, (error: any) => {
//             switch (_options.errorMode) {
//               case 'continue':
//                 return next();
//               case 'cancel':
//                 if (_options.token !== void 0) {
//                   _options.token.cancel(error);
//                 }
//                 return new Promise(() => {}); // never resolve
//               case 'throw':
//                 throw error;
//               default:
//                 throw new TypeError(`Unexpected mode: ${ _options.errorMode }`);
//             }
//           });
//     }
//   };
//
//   return Promise.all(
//     Array.from({ length: _options.concurrent }, next)
//   ).then(() => void 0);
// }


// (async () => {
//   await Async.$delay(2000);
//
//   function promise(): Promise<void> {
//     return (Math.random() > 0.1)
//       ? Async.$delay(100 * Math.random() + 50)
//       : Promise.reject(new Error('ok'));
//   }
//
//   function array(): PromiseFactory<void>[] {
//     const factories: PromiseFactory<void>[] = [];
//     for (let i = 0; i < 100; i++) {
//       factories.push(() => promise());
//     }
//     return factories;
//   }
//
//   function * generator(): IterableIterator<Promise<void>> {
//     for (let i = 0; i < 100; i++) {
//       yield promise();
//     }
//   }
//
//   function * fetchGenerator(): IterableIterator<Promise<any>> {
//     let j = 0;
//     for (let i = 0; i < 100; i++) {
//       console.log('fetch', i);
//       const promise = fetch('http://www.skydigita.com/Upload/PicFiles/SDG3200-11.JPG?' + i, { mode: 'no-cors' })
//         .then((response: Response) => response.blob())
//         .then(() => {
//           j++;
//           console.log('loaded', i, j);
//         });
//       yield promise;
//     }
//   }
//
//
//   const token: PromiseCancelToken = new PromiseCancelToken();
//
//   // ConcurrentPromises.sequential(ConcurrentPromises.promiseFactoriesToIterable(array()), 4)
//   // ConcurrentPromises.sequential(generator(), 4)
//   ConcurrentPromises.sequential(fetchGenerator(), 4, token)
//     .then(() => {
//       console.log('done');
//     });
//
//   (window as any).token = token;
//
// })();

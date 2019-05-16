import { IReadonlyList } from '../../../misc/readonly-list/interfaces';
import { IObserver } from '../../../core/observer/interfaces';
import { IObservable } from '../../../core/observable/interfaces';
import { IInputOutput, IInputOutputKeyValueMap } from '../io-observable/interfaces';

export type TWebSocketData = string | ArrayBufferLike | Blob | ArrayBufferView;


// export interface IWebSocketOut extends IObserver<TWebSocketData> {
// }
//
// export interface IWebSocketIn extends IObservable<TWebSocketData> {
// }

export interface IWebSocketIOKeyValueMap extends IInputOutputKeyValueMap {
}

// export type TWebSocketIOConstructorArgs = [string, IWebSocketIOOptions] | [string];

export interface IWebSocketIOOptions {
  protocols?: Iterable<string>;
}

export interface IWebSocketIOConstructor {
  new(url: string, options?: IWebSocketIOOptions): IWebSocketIO;
}

export interface IWebSocketIO extends IInputOutput<IWebSocketIOKeyValueMap, IObservable<TWebSocketData>, IObserver<TWebSocketData>> {
  readonly url: string;
  readonly protocols: IReadonlyList<string>;
  readonly protocol: string | null;
  binaryType: BinaryType;
}

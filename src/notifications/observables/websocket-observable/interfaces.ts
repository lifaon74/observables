import { IReadonlyList } from '../../../misc/readonly-list/interfaces';
import { IObserver } from '../../../core/observer/interfaces';
import { INotificationsObservable } from '../../core/notifications-observable/interfaces';
import { IActivable } from '../../../classes/activable/interfaces';
import { IObservable } from '../../../core/observable/interfaces';

export type TWebSocketData = string | ArrayBufferLike | Blob | ArrayBufferView;


// export interface IWebSocketOut extends IObserver<TWebSocketData> {
// }
//
// export interface IWebSocketIn extends IObservable<TWebSocketData> {
// }

export interface IWebSocketObservableObserverValueMap {
  activate: undefined;
  deactivate: undefined;
  error: Error;
}


export interface IWebSocketObservableObserverOptions {
  protocols?: string[];
}

export interface IWebSocketObservableObserverConstructor {
  new(url: string, options?: IWebSocketObservableObserverOptions): IWebSocketObservableObserver;
}

export interface IWebSocketObservableObserver extends INotificationsObservable<IWebSocketObservableObserverValueMap>, IActivable {
  readonly in: IObservable<TWebSocketData>;
  readonly out: IObserver<TWebSocketData>;

  readonly url: string;
  readonly protocols: IReadonlyList<string>;
  readonly protocol: string | null;
  binaryType: BinaryType;
}

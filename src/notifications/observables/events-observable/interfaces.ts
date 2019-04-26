import { INotificationsObservable} from '../../core/notifications-observable/interfaces';
import {
  KeyValueMapConstraint, KeyValueMapKeys
} from '../../core/interfaces';

export type EventKeyValueMapConstraint<TKVMap> = KeyValueMapConstraint<TKVMap, Event>;

export type EventsObservableKeyValueMapGeneric = {
  [key: string]: Event;
};

export interface PureEventTarget {
  addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void;
}


export type TargetToEventMap =
    [AbortSignal, AbortSignalEventMap]
  | [AbstractWorker, AbstractWorkerEventMap] // -
  | [Animation, AnimationEventMap]
  | [ApplicationCache, ApplicationCacheEventMap]
  | [AudioBufferSourceNode, AudioScheduledSourceNodeEventMap]
  | [AudioContext, BaseAudioContextEventMap]
  | [AudioScheduledSourceNode, AudioScheduledSourceNodeEventMap]
  | [AudioTrackList, AudioTrackListEventMap]
  | [AudioWorkletNode, AudioWorkletNodeEventMap]
  | [BaseAudioContext, BaseAudioContextEventMap]
  | [BroadcastChannel, BroadcastChannelEventMap]
  | [ConstantSourceNode, AudioScheduledSourceNodeEventMap]
  | [DataCue, TextTrackCueEventMap]
  | [Document, DocumentEventMap]
  | [DocumentAndElementEventHandlers, DocumentAndElementEventHandlersEventMap] // -
  | [Element, ElementEventMap]
  | [FileReader, FileReaderEventMap]
  | [GlobalEventHandlers, GlobalEventHandlersEventMap] // -
  | [HTMLElement, HTMLElementEventMap]
  | [HTMLVideoElement, HTMLVideoElementEventMap]
  | [IDBDatabase, IDBDatabaseEventMap]
  | [IDBOpenDBRequest, IDBOpenDBRequestEventMap]
  | [IDBRequest, IDBRequestEventMap]
  | [IDBTransaction, IDBTransactionEventMap]
  | [MediaDevices, MediaDevicesEventMap]
  | [MediaQueryList, MediaQueryListEventMap]
  | [MediaStream, MediaStreamEventMap]
  | [MediaStreamTrack, MediaStreamTrackEventMap]
  | [MessagePort, MessagePortEventMap]
  | [Notification, NotificationEventMap]
  | [OfflineAudioContext, OfflineAudioContextEventMap]
  | [OscillatorNode, AudioScheduledSourceNodeEventMap]
  | [PaymentRequest, PaymentRequestEventMap]
  | [Performance, PerformanceEventMap]
  | [RTCDTMFSender, RTCDTMFSenderEventMap]
  | [RTCDataChannel, RTCDataChannelEventMap]
  | [RTCDtlsTransport, RTCDtlsTransportEventMap]
  | [RTCDtmfSender, RTCDtmfSenderEventMap]
  | [RTCIceGatherer, RTCIceGathererEventMap]
  | [RTCIceTransport, RTCIceTransportEventMap]
  | [RTCPeerConnection, RTCPeerConnectionEventMap]
  | [RTCSctpTransport, RTCSctpTransportEventMap] // -
  | [RTCSrtpSdesTransport, RTCSrtpSdesTransportEventMap]
  | [SVGAElement, SVGElementEventMap]
  | [SVGAnimateElement, SVGElementEventMap]
  | [SVGAnimateMotionElement, SVGElementEventMap]
  | [SVGAnimateTransformElement, SVGElementEventMap]
  | [ScreenOrientation, ScreenOrientationEventMap]
  | [ScriptProcessorNode, ScriptProcessorNodeEventMap]
  | [ServiceWorker, ServiceWorkerEventMap]
  | [ServiceWorkerContainer, ServiceWorkerContainerEventMap]
  | [ServiceWorkerRegistration, ServiceWorkerRegistrationEventMap]
  | [SpeechRecognition, SpeechRecognitionEventMap]
  | [SpeechSynthesis, SpeechSynthesisEventMap]
  | [SpeechSynthesisUtterance, SpeechSynthesisUtteranceEventMap]
  | [TextTrack, TextTrackEventMap]
  | [TextTrackCue, TextTrackCueEventMap]
  | [TextTrackList, TextTrackListEventMap]
  | [VTTCue, TextTrackCueEventMap]
  | [VideoTrackList, VideoTrackListEventMap]
  | [WebSocket, WebSocketEventMap]
  | [Window, WindowEventMap]
  | [WindowEventHandlers, WindowEventHandlersEventMap] // -
  | [Worker, WorkerEventMap]
  | [XMLDocument, DocumentEventMap]
  | [XMLHttpRequest, XMLHttpRequestEventMap]
  | [XMLHttpRequestEventTarget, XMLHttpRequestEventTargetEventMap]
  | [XMLHttpRequestUpload, XMLHttpRequestEventTargetEventMap]
;

export type Targets<A = TargetToEventMap> =
  A extends [infer TTarget, any]
    ? TTarget
    : never;


export type PredefinedEventsObservables<A = TargetToEventMap> = A extends [infer TTarget, infer TKVMap]
  ? TTarget extends PureEventTarget
    ? TKVMap extends EventKeyValueMapConstraint<TKVMap>
      ? IEventsObservable<TKVMap, TTarget>
      : never
    : never
  : never;

export type CastTargetToEventsObservable<T extends Targets> = Extract<PredefinedEventsObservables, IEventsObservable<any, T>>;

// interface A {
//   // new<T extends EventTarget>(target: T): Cast;
//   new<T extends EventTarget>(target: T): CastTargetToEventsObservable<T>;
// }
//
// const _a: A = null;
// const __a = new _a(window);


export interface IEventsObservableConstructor {
  // new(target: AbortSignal, name?: KeyValueMapKeys<AbortSignalEventMap> | null): IEventsObservable<AbortSignalEventMap, AbortSignal>;
  // // new(target: AbstractWorker, name?: KeyValueMapKeys<AbstractWorkerEventMap> | null): IEventsObservable<AbstractWorkerEventMap, AbstractWorker>;
  // new(target: Animation, name?: KeyValueMapKeys<AnimationEventMap> | null): IEventsObservable<AbstractWorkerEventMap, Animation>;
  // new(target: ApplicationCache, name?: KeyValueMapKeys<ApplicationCacheEventMap> | null): IEventsObservable<ApplicationCacheEventMap, ApplicationCache>;
  // new(target: AudioBufferSourceNode, name?: KeyValueMapKeys<AudioScheduledSourceNodeEventMap> | null): IEventsObservable<AudioScheduledSourceNodeEventMap, AudioBufferSourceNode>;
  // new(target: AudioContext, name?: KeyValueMapKeys<BaseAudioContextEventMap> | null): IEventsObservable<BaseAudioContextEventMap, AudioContext>;
  // new(target: AudioScheduledSourceNode, name?: KeyValueMapKeys<AudioScheduledSourceNodeEventMap> | null): IEventsObservable<AudioScheduledSourceNodeEventMap, AudioScheduledSourceNode>;
  // new(target: AudioTrackList, name?: KeyValueMapKeys<AudioTrackListEventMap> | null): IEventsObservable<AudioTrackListEventMap, AudioTrackList>;
  // new(target: AudioWorkletNode, name?: KeyValueMapKeys<AudioWorkletNodeEventMap> | null): IEventsObservable<AudioWorkletNodeEventMap, AudioWorkletNode>;
  // new(target: BaseAudioContext, name?: KeyValueMapKeys<BaseAudioContextEventMap> | null): IEventsObservable<BaseAudioContextEventMap, BaseAudioContext>;
  // new(target: BroadcastChannel, name?: KeyValueMapKeys<BroadcastChannelEventMap> | null): IEventsObservable<BroadcastChannelEventMap, BroadcastChannel>;
  // new(target: ConstantSourceNode, name?: KeyValueMapKeys<AudioScheduledSourceNodeEventMap> | null): IEventsObservable<AudioScheduledSourceNodeEventMap, ConstantSourceNode>;
  // new(target: DataCue, name?: KeyValueMapKeys<TextTrackCueEventMap> | null): IEventsObservable<TextTrackCueEventMap, DataCue>;
  // new(target: Document, name?: KeyValueMapKeys<DocumentEventMap> | null): IEventsObservable<DocumentEventMap, Document>;
  // // new(target: DocumentAndElementEventHandlers, name?: KeyValueMapKeys<DocumentAndElementEventHandlersEventMap> | null): IEventsObservable<DocumentAndElementEventHandlersEventMap, DocumentAndElementEventHandlers>;
  // new(target: Element, name?: KeyValueMapKeys<ElementEventMap> | null): IEventsObservable<ElementEventMap, Element>;
  // new(target: FileReader, name?: KeyValueMapKeys<FileReaderEventMap> | null): IEventsObservable<FileReaderEventMap, FileReader>;
  // // new(target: GlobalEventHandlers, name?: KeyValueMapKeys<GlobalEventHandlersEventMap> | null): IEventsObservable<GlobalEventHandlersEventMap, GlobalEventHandlers>;
  // new(target: HTMLElement, name?: KeyValueMapKeys<HTMLElementEventMap> | null): IEventsObservable<HTMLElementEventMap, HTMLElement>;
  // new(target: HTMLVideoElement, name?: KeyValueMapKeys<HTMLVideoElementEventMap> | null): IEventsObservable<HTMLVideoElementEventMap, HTMLVideoElement>;
  // new(target: IDBDatabase, name?: KeyValueMapKeys<IDBDatabaseEventMap> | null): IEventsObservable<IDBDatabaseEventMap, IDBDatabase>;
  // new(target: IDBOpenDBRequest, name?: KeyValueMapKeys<IDBOpenDBRequestEventMap> | null): IEventsObservable<IDBOpenDBRequestEventMap, IDBOpenDBRequest>;
  // new(target: IDBRequest, name?: KeyValueMapKeys<IDBRequestEventMap> | null): IEventsObservable<IDBRequestEventMap, IDBRequest>;
  // new(target: IDBTransaction, name?: KeyValueMapKeys<IDBTransactionEventMap> | null): IEventsObservable<IDBTransactionEventMap, IDBTransaction>;
  // new(target: MediaDevices, name?: KeyValueMapKeys<MediaDevicesEventMap> | null): IEventsObservable<MediaDevicesEventMap, MediaDevices>;
  // new(target: MediaQueryList, name?: KeyValueMapKeys<MediaQueryListEventMap> | null): IEventsObservable<MediaQueryListEventMap, MediaQueryList>;
  // new(target: MediaStream, name?: KeyValueMapKeys<MediaStreamEventMap> | null): IEventsObservable<MediaStreamEventMap, MediaStream>;
  // new(target: MediaStreamTrack, name?: KeyValueMapKeys<MediaStreamTrackEventMap> | null): IEventsObservable<MediaStreamTrackEventMap, MediaStreamTrack>;
  // new(target: MessagePort, name?: KeyValueMapKeys<MessagePortEventMap> | null): IEventsObservable<MessagePortEventMap, MessagePort>;
  // new(target: Notification, name?: KeyValueMapKeys<NotificationEventMap> | null): IEventsObservable<NotificationEventMap, Notification>;
  // new(target: OfflineAudioContext, name?: KeyValueMapKeys<OfflineAudioContextEventMap> | null): IEventsObservable<OfflineAudioContextEventMap, OfflineAudioContext>;
  // new(target: OscillatorNode, name?: KeyValueMapKeys<AudioScheduledSourceNodeEventMap> | null): IEventsObservable<AudioScheduledSourceNodeEventMap, OscillatorNode>;
  // new(target: PaymentRequest, name?: KeyValueMapKeys<PaymentRequestEventMap> | null): IEventsObservable<PaymentRequestEventMap, PaymentRequest>;
  // new(target: Performance, name?: KeyValueMapKeys<PerformanceEventMap> | null): IEventsObservable<PerformanceEventMap, Performance>;
  // new(target: RTCDTMFSender, name?: KeyValueMapKeys<RTCDTMFSenderEventMap> | null): IEventsObservable<RTCDTMFSenderEventMap, RTCDTMFSender>;
  // new(target: RTCDataChannel, name?: KeyValueMapKeys<RTCDataChannelEventMap> | null): IEventsObservable<RTCDataChannelEventMap, RTCDataChannel>;
  // new(target: RTCDtlsTransport, name?: KeyValueMapKeys<RTCDtlsTransportEventMap> | null): IEventsObservable<RTCDtlsTransportEventMap, RTCDtlsTransport>;
  // new(target: RTCDtmfSender, name?: KeyValueMapKeys<RTCDtmfSenderEventMap> | null): IEventsObservable<RTCDtmfSenderEventMap, RTCDtmfSender>;
  // new(target: RTCIceGatherer, name?: KeyValueMapKeys<RTCIceGathererEventMap> | null): IEventsObservable<RTCIceGathererEventMap, RTCIceGatherer>;
  // new(target: RTCIceTransport, name?: KeyValueMapKeys<RTCIceTransportEventMap> | null): IEventsObservable<RTCIceTransportEventMap, RTCIceTransport>;
  // new(target: RTCPeerConnection, name?: KeyValueMapKeys<RTCPeerConnectionEventMap> | null): IEventsObservable<RTCPeerConnectionEventMap, RTCPeerConnection>;
  // // new(target: RTCSctpTransport, name?: KeyValueMapKeys<RTCSctpTransportEventMap> | null): IEventsObservable<RTCSctpTransportEventMap, RTCSctpTransport>;
  // new(target: RTCSrtpSdesTransport, name?: KeyValueMapKeys<RTCSrtpSdesTransportEventMap> | null): IEventsObservable<RTCSrtpSdesTransportEventMap, RTCSrtpSdesTransport>;
  // new(target: SVGAElement, name?: KeyValueMapKeys<SVGElementEventMap> | null): IEventsObservable<SVGElementEventMap, SVGAElement>;
  // new(target: SVGAnimateElement, name?: KeyValueMapKeys<SVGElementEventMap> | null): IEventsObservable<SVGElementEventMap, SVGAnimateElement>;
  // new(target: SVGAnimateMotionElement, name?: KeyValueMapKeys<SVGElementEventMap> | null): IEventsObservable<SVGElementEventMap, SVGAnimateMotionElement>;
  // new(target: SVGAnimateTransformElement, name?: KeyValueMapKeys<SVGElementEventMap> | null): IEventsObservable<SVGElementEventMap, SVGAnimateTransformElement>;
  // new(target: ScreenOrientation, name?: KeyValueMapKeys<ScreenOrientationEventMap> | null): IEventsObservable<ScreenOrientationEventMap, ScreenOrientation>;
  // new(target: ScriptProcessorNode, name?: KeyValueMapKeys<ScriptProcessorNodeEventMap> | null): IEventsObservable<ScriptProcessorNodeEventMap, ScriptProcessorNode>;
  // new(target: ServiceWorker, name?: KeyValueMapKeys<ServiceWorkerEventMap> | null): IEventsObservable<ServiceWorkerEventMap, ServiceWorker>;
  // new(target: ServiceWorkerContainer, name?: KeyValueMapKeys<ServiceWorkerContainerEventMap> | null): IEventsObservable<ServiceWorkerContainerEventMap, ServiceWorkerContainer>;
  // new(target: ServiceWorkerRegistration, name?: KeyValueMapKeys<ServiceWorkerRegistrationEventMap> | null): IEventsObservable<ServiceWorkerRegistrationEventMap, ServiceWorkerRegistration>;
  // new(target: SpeechRecognition, name?: KeyValueMapKeys<SpeechRecognitionEventMap> | null): IEventsObservable<SpeechRecognitionEventMap, SpeechRecognition>;
  // new(target: SpeechSynthesis, name?: KeyValueMapKeys<SpeechSynthesisEventMap> | null): IEventsObservable<SpeechSynthesisEventMap, SpeechSynthesis>;
  // new(target: SpeechSynthesisUtterance, name?: KeyValueMapKeys<SpeechSynthesisUtteranceEventMap> | null): IEventsObservable<SpeechSynthesisUtteranceEventMap, SpeechSynthesisUtterance>;
  // new(target: TextTrack, name?: KeyValueMapKeys<TextTrackEventMap> | null): IEventsObservable<TextTrackEventMap, TextTrack>;
  // new(target: TextTrackCue, name?: KeyValueMapKeys<TextTrackCueEventMap> | null): IEventsObservable<TextTrackCueEventMap, TextTrackCue>;
  // new(target: TextTrackList, name?: KeyValueMapKeys<TextTrackListEventMap> | null): IEventsObservable<TextTrackListEventMap, TextTrackList>;
  // new(target: VTTCue, name?: KeyValueMapKeys<TextTrackCueEventMap> | null): IEventsObservable<TextTrackCueEventMap, VTTCue>;
  // new(target: VideoTrackList, name?: KeyValueMapKeys<VideoTrackListEventMap> | null): IEventsObservable<VideoTrackListEventMap, VideoTrackList>;
  // new(target: WebSocket, name?: KeyValueMapKeys<WebSocketEventMap> | null): IEventsObservable<WebSocketEventMap, WebSocket>;
  // new(target: Window, name?: KeyValueMapKeys<WindowEventMap> | null): IEventsObservable<WindowEventMap, Window>;
  // // new(target: WindowEventHandlers, name?: KeyValueMapKeys<WindowEventHandlersEventMap> | null): IEventsObservable<WindowEventHandlersEventMap, WindowEventHandlers>;
  // new(target: Worker, name?: KeyValueMapKeys<WorkerEventMap> | null): IEventsObservable<WorkerEventMap, Worker>;
  // new(target: XMLDocument, name?: KeyValueMapKeys<DocumentEventMap> | null): IEventsObservable<DocumentEventMap, XMLDocument>;
  // new(target: XMLHttpRequest, name?: KeyValueMapKeys<XMLHttpRequestEventMap> | null): IEventsObservable<XMLHttpRequestEventMap, XMLHttpRequest>;
  // new(target: XMLHttpRequestEventTarget, name?: KeyValueMapKeys<XMLHttpRequestEventTargetEventMap> | null): IEventsObservable<XMLHttpRequestEventTargetEventMap, XMLHttpRequestEventTarget>;
  // new(target: XMLHttpRequestUpload, name?: KeyValueMapKeys<XMLHttpRequestEventTargetEventMap> | null): IEventsObservable<XMLHttpRequestEventTargetEventMap, XMLHttpRequestUpload>;

  new<TTarget extends Targets>(target: TTarget): CastTargetToEventsObservable<TTarget>;
  new<TKVMap extends EventKeyValueMapConstraint<TKVMap>, TTarget extends PureEventTarget = PureEventTarget>(target: TTarget, name?: KeyValueMapKeys<TKVMap> | null): IEventsObservable<TKVMap, TTarget>;
}



/**
 * An EventsObservable is a wrapper around a NotificationsObservable,
 * which allows to listen to the Events emitted by 'target'.
 * To force an Event's type you may provide a 'name', else the Event's type will be determined by the NotificationsObservers observing it.
 */
export interface IEventsObservable<TKVMap extends EventKeyValueMapConstraint<TKVMap>, TTarget extends PureEventTarget = PureEventTarget> extends INotificationsObservable<TKVMap> {
  // the target of the events' listener
  readonly target: TTarget;

  // optional name of the event to listen to
  readonly name: KeyValueMapKeys<TKVMap> | null;
}

// const a: IEventsObservableConstructor = null;
// const b = new a(window);
//
// new a(new FileReader())
//   .on('load', () => {
//   })
//   .on('resize', () => {
//   });

// const b: IEventsObservable<AbortSignalEventMap> = null;
// const b: IEventsObservable<AbortSignalEventMap & AbstractWorkerEventMap> = null;
// const b: IEventsObservable<{ a: 1 }> = null;
// const b: IEventsObservable<never> = null;

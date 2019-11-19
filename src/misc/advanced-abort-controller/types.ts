import { IAdvancedAbortSignal } from './advanced-abort-signal/interfaces';

/** TYPES **/

export type TAbortSignalLike = AbortSignal | IAdvancedAbortSignal;
export type TAbortSignalLikeOrUndefined = TAbortSignalLike | undefined;

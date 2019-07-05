// import { INotificationsObservable } from './notifications-observable/interfaces';
// import { INotificationsObserver } from './notifications-observer/interfaces';
// import { KeyValueMapKeys } from './interfaces';
//
// export function typeTest(): void {
//   type a = { a: 1, b: 2 };
//   type b = { [key: string]: number };
//
//   const v: unknown = null;
//
//   (v as INotificationsObservable<a>).pipeTo(v as INotificationsObserver<'a', 1>).activated;
//   (v as INotificationsObservable<a>).pipeTo(v as INotificationsObserver<'a', 2>).activated; // should fail
//   (v as INotificationsObservable<a>).pipeTo(v as INotificationsObserver<'a' | 'c', 1>).activated;
//   (v as INotificationsObservable<a>).pipeTo(v as INotificationsObserver<'a', 1 | 2>).activated;
//   (v as INotificationsObservable<a>).pipeTo(v as INotificationsObserver<'c', 1>).activated; // should fail
//
//   (v as INotificationsObservable<a>).pipeTo(v as INotificationsObserver<string, 1 | 2>).activated;
//   (v as INotificationsObservable<a>).pipeTo(v as INotificationsObserver<string, 4>).activated; // should fail
//   (v as INotificationsObservable<a>).pipeTo(v as INotificationsObserver<string, number>).activated;
//   (v as INotificationsObservable<b>).pipeTo(v as INotificationsObserver<string, 1 | 2>).activated; // should fail
//
//   const a: (('a' | 'b') extends string ? true : false) = true;
//   const a0: KeyValueMapKeys<a> = true;
//   const a1: Extract<KeyValueMapKeys<a>, 'a' | 'c'>;
//   const a2: Extract<'a' | 'c', KeyValueMapKeys<a>>;
//   const a3: a[Extract<KeyValueMapKeys<a>, 'a' | 'c'>] = true;
//   const a4: Extract<KeyValueMapKeys<a>, string> = true;
//   const a5: a[Extract<KeyValueMapKeys<a>, string>] = true;
//
//   const a6: Extract<KeyValueMapKeys<b>, string> = true;
//   const a7: b[Extract<KeyValueMapKeys<b>, string>] = true;
//
// }
//
//
// export async function test(): Promise<void> {
//
// }

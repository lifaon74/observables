export function typeTest(): void {
  type a = { a: 1, b: 2 };
  type b = { [key: string]: number };

  const v: unknown = null;

  const _z0: (Record<string, number> extends Record<number, number> ? true : false) = null as any; // true
  const _z1: (Record<number, number> extends Record<string, number> ? true : false) = null as any; // true
  // => TKey doesnt affect extends
  const _z2: (Record<string, string> extends Record<string, number> ? true : false) = null as any; // false
  const _z3: (Record<string, number> extends Record<string, string> ? true : false) = null as any; // false
  const _z4: (Record<string, string> extends Record<string, number | string> ? true : false) = null as any; // true
  const _z5: (Record<string, string | number> extends Record<string, number> ? true : false) = null as any; // false
  const _z6: (Record<string, string | number> extends object ? true : false) = null as any; // true
  const _z7: (object extends Record<string, string | number> ? true : false) = null as any; // false
  const _z8: (any extends Record<string, string> ? true : false) = null as any; // true | false
  const _z9: (unknown extends Record<string, string> ? true : false) = null as any; // true | false
  const _z10: (Record<number, any> extends { [key: string]: any } ? true : false) = null as any; // true
  const _z11: (Record<number, any> extends object ? true : false) = null as any; // true

  // (v as INotificationsObservable<a>).pipeTo(v as INotificationsObserver<'a', 1>).activated;
  // (v as INotificationsObservable<a>).pipeTo(v as INotificationsObserver<'a', 2>).activated; // should fail
  // (v as INotificationsObservable<a>).pipeTo(v as INotificationsObserver<'a' | 'c', 1>).activated;
  // (v as INotificationsObservable<a>).pipeTo(v as INotificationsObserver<'a', 1 | 2>).activated;
  // (v as INotificationsObservable<a>).pipeTo(v as INotificationsObserver<'c', 1>).activated; // should fail
  //
  // (v as INotificationsObservable<a>).pipeTo(v as INotificationsObserver<string, 1 | 2>).activated;
  // (v as INotificationsObservable<a>).pipeTo(v as INotificationsObserver<string, 4>).activated; // should fail
  // (v as INotificationsObservable<a>).pipeTo(v as INotificationsObserver<string, number>).activated;
  // (v as INotificationsObservable<b>).pipeTo(v as INotificationsObserver<string, 1 | 2>).activated; // should fail

  // const a: (('a' | 'b') extends string ? true : false) = true;
  // const a0: KeyValueMapKeys<a> = true;
  // const a1: Extract<KeyValueMapKeys<a>, 'a' | 'c'>;
  // const a2: Extract<'a' | 'c', KeyValueMapKeys<a>>;
  // const a3: a[Extract<KeyValueMapKeys<a>, 'a' | 'c'>] = true;
  // const a4: Extract<KeyValueMapKeys<a>, string> = true;
  // const a5: a[Extract<KeyValueMapKeys<a>, string>] = true;
  //
  // const a6: Extract<KeyValueMapKeys<b>, string> = true;
  // const a7: b[Extract<KeyValueMapKeys<b>, string>] = true;

}


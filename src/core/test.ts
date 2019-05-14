export function typeTest(): void {
  type a = 'a' | 'b';
  type b = 'a' | 'b' | 'c';
  type c = 'a';
  type d = 'd';

  const v: unknown = null;

  // (v as IObservable<a>).pipeTo(v as IObserver<a>).activated;
  // (v as IObservable<a>).pipeTo(v as IObserver<b>).activated;
  // (v as IObservable<a>).pipeTo(v as IObserver<c>).activated; // should fail
  // (v as IObservable<a>).pipeTo(v as IObserver<d>).activated; // should fail
  // (v as IObservable<a>).pipeTo(v as IObserver<string>).activated;
  // (v as IObservable<a>).pipeTo(v as IObserver<number>).activated; // should fail
  // (v as IObservable<string>).pipeTo(v as IObserver<a>).activated; // should fail
  //
  //
  // (v as IObservable<a>).pipeTo(v as (_: a) => void).activated;
  // (v as IObservable<a>).pipeTo(v as (_: b) => void).activated;
  // (v as IObservable<a>).pipeTo(v as (_: c) => void).activated; // should fail
  // (v as IObservable<a>).pipeTo(v as (_: d) => void).activated; // should fail
  // (v as IObservable<a>).pipeTo(v as (_: string) => void).activated;
  // (v as IObservable<a>).pipeTo(v as (_: number) => void).activated; // should fail
  // (v as IObservable<string>).pipeTo(v as (_: a) => void).activated; // should fail
  //
  // (v as IObservable<a>).pipeThrough(v as IObservableObserver<IObserver<a>, IObservable<any>>).observed;
  // (v as IObservable<a>).pipeThrough(v as IObservableObserver<IObserver<b>, IObservable<any>>).observed;
  // (v as IObservable<a>).pipeThrough(v as IObservableObserver<IObserver<c>, IObservable<any>>).observed; // should fail
  // (v as IObservable<a>).pipeThrough(v as IObservableObserver<IObserver<d>, IObservable<any>>).observed; // should fail
  // (v as IObservable<a>).pipeThrough(v as IObservableObserver<IObserver<string>, IObservable<any>>).observed;
  // (v as IObservable<a>).pipeThrough(v as IObservableObserver<IObserver<number>, IObservable<any>>).observed; // should fail
  // (v as IObservable<string>).pipeThrough(v as IObservableObserver<IObserver<number>, IObservable<any>>).observed;// should fail
  //
  // (v as IObservable<a>).pipe(v as IObservableObserver<IObserver<a>, IObservable<any>>).observable;
  // (v as IObservable<a>).pipe(v as IObservableObserver<IObserver<b>, IObservable<any>>).observable;
  // (v as IObservable<a>).pipe(v as IObservableObserver<IObserver<c>, IObservable<any>>).observable; // should fail
  // (v as IObservable<a>).pipe(v as IObservableObserver<IObserver<d>, IObservable<any>>).observable; // should fail
  // (v as IObservable<a>).pipe(v as IObservableObserver<IObserver<string>, IObservable<any>>).observable;
  // (v as IObservable<a>).pipe(v as IObservableObserver<IObserver<number>, IObservable<any>>).observable; // should fail
  // (v as IObservable<string>).pipe(v as IObservableObserver<IObserver<a>, IObservable<any>>).observable; // should fail
  //
  // (v as IObservable<a>).observedBy(v as IObserver<a>).observed;
  // (v as IObservable<a>).observedBy(v as IObserver<b>).observed;
  // (v as IObservable<a>).observedBy(v as IObserver<c>).observed; // should fail
  // (v as IObservable<a>).observedBy(v as IObserver<d>).observed; // should fail
  // (v as IObservable<a>).observedBy(v as IObserver<string>).observed;
  // (v as IObservable<a>).observedBy(v as IObserver<number>).observed; // should fail
  // (v as IObservable<string>).observedBy(v as IObserver<a>).observed; // should fail
  //
  // (v as IObservable<a>).observedBy(v as (_: a) => void).observed;
  // (v as IObservable<a>).observedBy(v as (_: b) => void).observed;
  // (v as IObservable<a>).observedBy(v as (_: c) => void).observed; // should fail
  // (v as IObservable<a>).observedBy(v as (_: d) => void).observed; // should fail
  // (v as IObservable<a>).observedBy(v as (_: string) => void).observed;
  // (v as IObservable<a>).observedBy(v as (_: number) => void).observed; // should fail
  // (v as IObservable<string>).observedBy(v as (_: a) => void).observed; // should fail
  //
  // (v as IObservable<a>).observedBy(v as IObserver<a>, v as IObserver<b>).observed;
  // (v as IObservable<a>).observedBy(v as IObserver<a>, v as IObserver<c>).observed; // should fail
  // (v as IObservable<a>).observedBy(v as IObserver<a>, v as IObserver<d>).observed; // should fail
  // (v as IObservable<a>).observedBy(v as IObserver<a>, v as (_: a) => void).observed;
  // (v as IObservable<a>).observedBy(v as IObserver<a>, v as (_: b) => void).observed;
  // (v as IObservable<a>).observedBy(v as IObserver<a>, v as (_: c) => void).observed; // should fail
  // (v as IObservable<a>).observedBy(v as IObserver<a>, v as (_: d) => void).observed; // should fail
  // (v as IObservable<a>).observedBy(v as IObserver<a>, v as (_: string) => void).observed;
  // (v as IObservable<string>).observedBy(v as IObserver<a>, v as (_: string) => void).observed; // should fail
  //
  //
  // (v as IObserver<a>).observe(v as IObservable<a>).activated;
  // (v as IObserver<b>).observe(v as IObservable<a>).activated;
  // (v as IObserver<c>).observe(v as IObservable<a>).activated; // should fail
  // (v as IObserver<d>).observe(v as IObservable<a>).activated; // should fail
  // (v as IObserver<string>).observe(v as IObservable<a>).activated;
  // (v as IObserver<number>).observe(v as IObservable<a>).activated; // should fail
  // (v as IObserver<a>).observe(v as IObservable<string>).activated; // should fail
  //
  // (v as IObserver<a | b>).observe(v as IObservable<a>, v as IObservable<b>).activated;
  // (v as IObserver<a | b | c>).observe(v as IObservable<a>, v as IObservable<b>).activated;
  // (v as IObserver<a>).observe(v as IObservable<a>, v as IObservable<b>).activated; // should fail
  // (v as IObserver<a | b | c>).observe(v as IObservable<a>, v as IObservable<d>).activated; // should fail
}


export async function test(): Promise<void> {

}

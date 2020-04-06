import { Notification } from '../../notifications/core/notification/implementation';
import { FromIterableObservable } from '../../notifications/observables/finite-state/built-in/from/iterable/implementation';
import { assertFails, assertObservableEmits } from '../../classes/asserts';
import { noop } from '../../helpers';

export async function testFromIterableObservable() {
  console.log('test testFromIterableObservable');
  const notifications = [
    new Notification('next', 0),
    new Notification('next', 1),
    new Notification('next', 2),
    new Notification('next', 3),
    new Notification('complete', void 0),
  ];

  const values1 = new FromIterableObservable([0, 1, 2, 3], { mode: 'uniq' });

  await assertObservableEmits(
    values1,
    notifications
  );

  await assertFails(() => values1.pipeTo(noop).activate());

  const values2 = new FromIterableObservable([0, 1, 2, 3][Symbol.iterator](), { mode: 'cache' });

  await assertObservableEmits(
    values2,
    notifications
  );

  await assertObservableEmits(
    values2,
    notifications
  );
}

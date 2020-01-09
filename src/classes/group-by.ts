export function GroupBy<TObject extends object, TKey extends keyof TObject>(values: TObject[], key: TKey): Map<TObject[TKey], TObject[]> {
  const grouped: Map<TObject[TKey], TObject[]> = new Map<TObject[TKey], TObject[]>();

  for (let i = 0, l = values.length; i < l; i++) {
    const entry: TObject = values[i];
    const value: TObject[TKey] = entry[key];
    if (!grouped.has(value)) {
      grouped.set(value, []);
    }
    (grouped.get(value) as TObject[]).push(entry);
  }

  return grouped;
}

import { GroupBy } from '../../classes/group-by';

export interface IProgressLike {
  loaded: number;
  total: number;
}

export interface IProgressLikeWithName extends IProgressLike {
  name?: string;
}

/**
 * Aggregates a list of ProgressLike as one
 */
export function AggregateProgresses(progresses: IProgressLike[]): IProgressLike {
  return progresses.reduce<IProgressLike>((previousValue: IProgressLike, currentValue: IProgressLike) => {
    return {
      loaded: previousValue.loaded + currentValue.loaded,
      total: previousValue.total + currentValue.total,
    };
  }, {
    loaded: 0,
    total: 0,
  });
}



export function GroupProgressesByName(progresses: IProgressLikeWithName[]): Map<string | undefined, IProgressLikeWithName[]> {
  return GroupBy<IProgressLikeWithName, 'name'>(progresses, 'name');
}

export function GroupAndAggregateProgressesByName(progresses: IProgressLikeWithName[]): Map<string | undefined, IProgressLikeWithName> {
  return new Map<string | undefined, IProgressLikeWithName>(
    Array.from(GroupProgressesByName(progresses).entries())
      .map(([key, value]) => {
        return [key, AggregateProgresses(value)];
      })
  );
}

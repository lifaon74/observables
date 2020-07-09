interface Task {
  // id: number;
  callback: (...args: any[]) => void;
  args: any[];
  id: number;
}

const pendingTasks: Task[] = [];
let pendingSetImmediate: boolean = false;
let sharedId: number = -1;

export function setImmediateOrdered(callback: (...args: any[]) => void, ...args: any[]): number {
  const id: number = sharedId++;
  pendingTasks.push({
    callback,
    args,
    id,
  });

  if (!pendingSetImmediate) {
    pendingSetImmediate = true;
    setImmediate(() => {
      while (pendingTasks.length > 0) {
        const task: Task = pendingTasks.shift() as Task;
        task.callback.apply(void 0, task.args);
      }
      pendingSetImmediate = false;
    });
  }

  return id;
}

export function clearImmediateOrdered(id: number): void {
  const index: number = pendingTasks.findIndex((task: Task) => (task.id === id));
  if (index !== void 0) {
    pendingTasks.splice(index, 1);
  }
}

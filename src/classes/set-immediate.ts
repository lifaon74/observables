interface Task {
  // id: number;
  callback: (...args: any[]) => void;
  args: any[];
}

type TRegisterImmediate = (handle: number) => void;


// const tasks: Task[] = [];
const tasks: Map<number, Task> = new Map<number, Task>();
let taskRunning: boolean = false;

function runTask(handle: number) {
  if (taskRunning) {
    setTimeout(runTask, 0, handle);
  } else {
    if (tasks.has(handle)) {
      const task: Task = tasks.get(handle) as Task;
      taskRunning = true;
      try {
        task.callback.apply(void 0, task.args);
      } finally {
        clearImmediate(handle);
        taskRunning = false;
      }
    }
  }
}


function NextTickImplementation(process: any): TRegisterImmediate {
  return (handle: number) => {
    process.nextTick(() => {
      runTask(handle);
    });
  };
}

function PostMessageImplementation(global: any): TRegisterImmediate {
  const messagePrefix: string = `setImmediate$${ Math.random() }$`;
  const length: number = messagePrefix.length;
  global.addEventListener('message', (event: MessageEvent) => {
    if (
      (event.source === global)
      && (typeof event.data === 'string')
      && (event.data.indexOf(messagePrefix) === 0)
    ) {
      runTask(+event.data.slice(length));
    }
  }, false);

  return (handle: number) => {
    global.postMessage(messagePrefix + handle, '*');
  };
}

function MessageChannelImplementation(): TRegisterImmediate {
  const channel: MessageChannel = new MessageChannel();
  channel.port1.onmessage = (event: MessageEvent) => {
    const handle: number = event.data;
    runTask(handle);
  };

  return (handle: number) => {
    channel.port2.postMessage(handle);
  };
}

function ReadyStateChangeImplementation(doc: Document): TRegisterImmediate {
  const html: HTMLElement = doc.documentElement;
  return (handle: number) => {
    let script: HTMLScriptElement = doc.createElement('script');
    (script as any)['onreadystatechange'] = () => {
      runTask(handle);
      (script as any)['onreadystatechange'] = null;
      html.removeChild(script);
    };
    html.appendChild(script);
  };
}

function SetTimeoutImplementation(): TRegisterImmediate {
  return (handle: number) => {
    setTimeout(runTask, 0, handle);
  };
}

function CanUsePostMessage(global: any): boolean {
  // The test against `importScripts` prevents this implementation from being installed inside a web worker,
  // where `global.postMessage` means something completely different and can't be used for this purpose.
  if (global.postMessage && !global.importScripts) {
    let postMessageIsAsynchronous: boolean = true;
    let oldOnMessage = global.onmessage;
    global.onmessage = () => {
      postMessageIsAsynchronous = false;
    };
    global.postMessage('', '*');
    global.onmessage = oldOnMessage;
    return postMessageIsAsynchronous;
  } else {
    return false;
  }
}

function GetRegisterImmediateImplementation(global: any): TRegisterImmediate {
  if ({}.toString.call(global.process) === '[object process]') {
    return NextTickImplementation(global.process);
  } else if (CanUsePostMessage(global)) {
    return PostMessageImplementation(global);
  } else if (global.MessageChannel) {
    return MessageChannelImplementation();
  } else if (
    global.document
    && ('onreadystatechange' in global.document.createElement('script'))
  ) {
    return ReadyStateChangeImplementation(global);
  } else {
    return SetTimeoutImplementation();
  }
}


const registerImmediate: TRegisterImmediate = GetRegisterImmediateImplementation(
  (typeof self === 'undefined') ? ((typeof global === 'undefined') ? this : global) : self
);

let nextHandle: number = 1;

export function setImmediate(callback: (...args: any[]) => void, ...args: any[]): number {
  tasks.set(nextHandle, { callback: callback, args: args });
  registerImmediate(nextHandle);
  return nextHandle++;
}

export function clearImmediate(handle: number) {
  tasks.delete(handle);
}


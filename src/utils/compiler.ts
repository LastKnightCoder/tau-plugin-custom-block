import workerSource from "custom-block:compiler-worker";

type Job = { resolve(code: string): void; reject(error: Error): void; timer: ReturnType<typeof setTimeout> };
let worker: Worker | undefined;
let nextId = 0;
let idleTimer: ReturnType<typeof setTimeout> | undefined;
const jobs = new Map<number, Job>();
const inflight = new Map<string, Promise<string>>();

function stopWorker(error: Error) {
  clearTimeout(idleTimer);
  worker?.terminate();
  worker = undefined;
  for (const job of jobs.values()) {
    clearTimeout(job.timer);
    job.reject(error);
  }
  jobs.clear();
}

function getWorker() {
  clearTimeout(idleTimer);
  if (worker) return worker;
  const url = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
  try {
    worker = new Worker(url, { name: "custom-block-compiler" });
  } finally {
    URL.revokeObjectURL(url);
  }
  worker.onmessage = ({ data }: MessageEvent<{ id: number; code?: string; error?: string }>) => {
    const job = jobs.get(data.id);
    if (!job) return;
    jobs.delete(data.id);
    clearTimeout(job.timer);
    if (data.error !== undefined) job.reject(new Error(data.error));
    else job.resolve(data.code ?? "");
    if (!jobs.size) idleTimer = setTimeout(() => stopWorker(new Error("编译器已空闲释放")), 30000);
  };
  worker.onerror = event => {
    event.preventDefault();
    stopWorker(new Error(event.message || "源码编译线程异常"));
  };
  worker.onmessageerror = () => stopWorker(new Error("源码编译结果无法读取"));
  return worker;
}

export function compileTsx(source: string, signal?: AbortSignal): Promise<string> {
  if (signal?.aborted) return Promise.reject(new DOMException("编译已取消", "AbortError"));
  let task = inflight.get(source);
  if (!task) {
    task = new Promise<string>((resolve, reject) => {
      const compiler = getWorker();
      const id = ++nextId;
      const timer = setTimeout(() => stopWorker(new Error("源码编译超时，请缩小组件源码")), 30000);
      jobs.set(id, { resolve, reject, timer });
      try {
        compiler.postMessage({ id, source });
      } catch (error) {
        stopWorker(error instanceof Error ? error : new Error(String(error)));
      }
    }).finally(() => inflight.delete(source));
    inflight.set(source, task);
  }
  if (!signal) return task;
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException("编译已取消", "AbortError"));
    signal.addEventListener("abort", abort, { once: true });
    task.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

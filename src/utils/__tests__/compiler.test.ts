import { afterEach, describe, expect, it, vi } from "vitest";
import { Worker as NodeWorker } from "node:worker_threads";
import workerSource from "custom-block:compiler-worker";

vi.unmock("../compiler");

class TestWorker {
  static instances: TestWorker[] = [];
  onmessage?: (event: { data: unknown }) => void;
  onerror?: (event: { message: string; preventDefault(): void }) => void;
  onmessageerror?: () => void;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() { TestWorker.instances.push(this); }
}

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  TestWorker.instances = [];
});

async function client() {
  vi.resetModules();
  vi.useFakeTimers();
  vi.stubGlobal("Worker", TestWorker);
  vi.stubGlobal("URL", class extends URL {
    static createObjectURL = vi.fn(() => "blob:test");
    static revokeObjectURL = vi.fn();
  });
  return (await import("../compiler")).compileTsx;
}

describe("后台源码编译", () => {
  it("真实线程完成 TSX 转换，语法错误不会杀死线程", async () => {
    const worker = new NodeWorker(`
      const { parentPort } = require('node:worker_threads');
      globalThis.postMessage = data => parentPort.postMessage(data);
      ${workerSource}
      parentPort.on('message', data => globalThis.onmessage({ data }));
    `, { eval: true });
    const send = (id: number, source: string) => new Promise<{ code?: string; error?: string }>((resolve, reject) => {
      worker.once("message", resolve);
      worker.once("error", reject);
      worker.postMessage({ id, source });
    });
    try {
      expect((await send(1, "const Component = () => <div>{1 as number}</div>;")).code).toContain("React.createElement");
      expect((await send(2, "const =")).error).toBeTruthy();
      expect((await send(3, "const Component = () => <span />;")).code).toContain("React.createElement");
    } finally { await worker.terminate(); }
  });

  it("同源并发只发一次，取消一个消费者不影响另一个", async () => {
    const compile = await client();
    const controller = new AbortController();
    const first = compile("same", controller.signal);
    const rejected = expect(first).rejects.toMatchObject({ name: "AbortError" });
    const second = compile("same");
    const worker = TestWorker.instances[0];
    expect(worker.postMessage).toHaveBeenCalledTimes(1);
    controller.abort();
    await rejected;
    worker.onmessage!({ data: { id: worker.postMessage.mock.calls[0][0].id, code: "compiled" } });
    await expect(second).resolves.toBe("compiled");
    await vi.advanceTimersByTimeAsync(30000);
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it("超时终止旧线程，下一次请求可重新创建", async () => {
    const compile = await client();
    const failed = expect(compile("slow")).rejects.toThrow("超时");
    await vi.advanceTimersByTimeAsync(30000);
    await failed;
    const retry = compile("slow");
    const worker = TestWorker.instances[1];
    worker.onmessage!({ data: { id: worker.postMessage.mock.calls[0][0].id, code: "ok" } });
    await expect(retry).resolves.toBe("ok");
  });
});

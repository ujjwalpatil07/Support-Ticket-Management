import { EventEmitter } from 'events';

class AppEventEmitter extends EventEmitter {
  async emitAsync(eventName, payload) {
    const listeners = this.listeners(eventName);
    if (listeners.length === 0) {
      return;
    }

    const results = await Promise.allSettled(
      listeners.map((listener) => Promise.resolve().then(() => listener(payload)))
    );

    for (const result of results) {
      if (result.status === 'rejected') {
        console.error(`[Event Error:${eventName}]`, result.reason?.message || result.reason);
      }
    }
  }
}

export const appEvents = new AppEventEmitter();
appEvents.setMaxListeners(25);

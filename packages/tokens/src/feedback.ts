export type FeedbackTone = "success" | "warning" | "danger" | "info";
export interface ToastOptions {
  title?: string;
  message: string;
  type?: FeedbackTone | "error";
  duration?: number;
  showProgress?: boolean;
  closable?: boolean;
  action?: { label: string; onClick: () => void };
}
export interface ConfirmOptions {
  title?: string;
  message?: string;
  type?: FeedbackTone;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
}
export interface PromptOptions extends Omit<ConfirmOptions, "onConfirm"> {
  initialValue?: string;
  placeholder?: string;
  validator?: (value: string) => boolean | string;
}
export interface ToastItem extends ToastOptions {
  id: number;
  remaining: number;
  startedAt: number;
  paused: boolean;
}
export interface FeedbackRequest {
  id: number;
  kind: "confirm" | "prompt";
  options: ConfirmOptions | PromptOptions;
}
export interface KjunFeedback {
  toast: {
    success(message: string, options?: Partial<ToastOptions>): number;
    error(message: string, options?: Partial<ToastOptions>): number;
    warning(message: string, options?: Partial<ToastOptions>): number;
    info(message: string, options?: Partial<ToastOptions>): number;
    dismiss(id: number): void;
    clearAll(): void;
  };
  confirm(options: string | ConfirmOptions): Promise<boolean>;
  prompt(options: string | PromptOptions): Promise<string | null>;
}
export function createFeedbackController() {
  let sequence = 0,
    disposed = false;
  let current: FeedbackRequest | null = null;
  let toasts: ToastItem[] = [];
  const listeners = new Set<() => void>();
  const pending: FeedbackRequest[] = [];
  const resolvers = new Map<
    number,
    { resolve: (value: any) => void; reject: (reason: unknown) => void }
  >();
  const timers = new Map<number, ReturnType<typeof setTimeout>>();
  const pauseReasons = new Map<number, Set<string | symbol>>();
  let snapshot = { current, toasts } as {
    current: FeedbackRequest | null;
    toasts: ToastItem[];
  };
  const emit = () => {
    snapshot = { current, toasts: [...toasts] };
    listeners.forEach((listener) => listener());
  };
  const dismiss = (id: number) => {
    clearTimeout(timers.get(id));
    timers.delete(id);
    pauseReasons.delete(id);
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  };
  const add = (
    type: ToastOptions["type"],
    message: string,
    options: Partial<ToastOptions> = {}
  ) => {
    if (disposed) return -1;
    const id = ++sequence;
    const duration =
      options.duration ??
      (type === "danger" || type === "error"
        ? 5000
        : type === "warning"
        ? 4000
        : 3000);
    if (toasts.length >= 5) dismiss(toasts[0].id);
    toasts = [
      ...toasts,
      {
        showProgress: true,
        ...options,
        duration,
        id,
        type,
        message,
        remaining: duration,
        startedAt: Date.now(),
        paused: false,
      },
    ];
    emit();
    if (duration > 0)
      timers.set(
        id,
        setTimeout(() => dismiss(id), duration)
      );
    return id;
  };
  const pauseToast = (id: number, reason: string | symbol = "manual") => {
    const toast = toasts.find((item) => item.id === id);
    if (!toast || !toast.duration) return;
    const reasons = pauseReasons.get(id) || new Set<string | symbol>();
    reasons.add(reason);
    pauseReasons.set(id, reasons);
    if (toast.paused) return;
    clearTimeout(timers.get(id));
    timers.delete(id);
    toasts = toasts.map((item) =>
      item.id === id
        ? {
            ...item,
            paused: true,
            remaining: Math.max(
              0,
              item.remaining - (Date.now() - item.startedAt)
            ),
          }
        : item
    );
    emit();
  };
  const resumeToast = (id: number, reason: string | symbol = "manual") => {
    const reasons = pauseReasons.get(id);
    if (!reasons?.delete(reason) || reasons.size) return;
    pauseReasons.delete(id);
    const toast = toasts.find((item) => item.id === id);
    if (!toast || !toast.paused) return;
    toasts = toasts.map((item) =>
      item.id === id ? { ...item, paused: false, startedAt: Date.now() } : item
    );
    timers.set(
      id,
      setTimeout(() => dismiss(id), toast.remaining)
    );
    emit();
  };
  const enqueue = <T>(
    kind: FeedbackRequest["kind"],
    value: string | ConfirmOptions | PromptOptions
  ): Promise<T> => {
    if (disposed)
      return Promise.resolve((kind === "confirm" ? false : null) as T);
    const request = {
      id: ++sequence,
      kind,
      options: typeof value === "string" ? { message: value } : value,
    };
    const result = new Promise<T>((resolve, reject) =>
      resolvers.set(request.id, { resolve, reject })
    );
    pending.push(request);
    if (!current) current = pending.shift()!;
    emit();
    return result;
  };
  const settle = (
    value: boolean | string | null,
    error?: unknown,
    requestId = current?.id
  ) => {
    if (!current || current.id !== requestId) return;
    const handler = resolvers.get(current.id);
    resolvers.delete(current.id);
    error === undefined ? handler?.resolve(value) : handler?.reject(error);
    current = pending.shift() || null;
    emit();
  };
  const api: KjunFeedback = {
    toast: {
      success: (message, options) => add("success", message, options),
      error: (message, options) => add("danger", message, options),
      warning: (message, options) => add("warning", message, options),
      info: (message, options) => add("info", message, options),
      dismiss,
      clearAll: () => {
        [...toasts].forEach((t) => dismiss(t.id));
      },
    },
    confirm: (value) => enqueue<boolean>("confirm", value),
    prompt: (value) => enqueue<string | null>("prompt", value),
  };
  return {
    api,
    settle,
    pauseToast,
    resumeToast,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      disposed = true;
      for (const request of [current, ...pending])
        if (request)
          resolvers
            .get(request.id)
            ?.resolve(request.kind === "confirm" ? false : null);
      resolvers.clear();
      pending.length = 0;
      current = null;
      timers.forEach(clearTimeout);
      timers.clear();
      pauseReasons.clear();
      toasts = [];
      emit();
      listeners.clear();
    },
  };
}

export type FeedbackTone = "success" | "warning" | "danger" | "info";
/** Why a toast left: its time ran out, its close button or a swipe, its action, or the API
 * (dismiss, clearAll, a full stack or the Provider going away). */
export type ToastDismissReason = "timeout" | "close" | "action" | "api";
export interface ToastOptions {
  title?: string;
  message: string;
  type?: FeedbackTone | "error";
  /** ms before the toast closes itself; 0 keeps it until dismissed. Errors stay by default. */
  duration?: number;
  /** @deprecated Toasts no longer draw a countdown; the option is ignored. */
  showProgress?: boolean;
  closable?: boolean;
  /** One short line in a capsule with no close button; ignored when the toast has a title. */
  compact?: boolean;
  /** A toast with the same key replaces the one on screen instead of stacking another. */
  key?: string;
  /** Runs once when the toast leaves, with the reason; replacing it by key or update does not count. */
  onDismiss?: (reason: ToastDismissReason) => void;
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
  /** Starting text; it opens fully selected so typing replaces it (renaming). */
  initialValue?: string;
  placeholder?: string;
  validator?: (value: string) => boolean | string;
  /** Field label above the input; without it the title names the field. */
  label?: string;
  /** Character limit; a count shows beside the label. */
  maxLength?: number;
  /** Confirm stays off until the value equals this exactly, e.g. the name of what will be deleted. */
  requiredValue?: string;
  /** Runs with the value before the dialog closes; an error it throws stays in the dialog as the field error. */
  onConfirm?: (value: string) => void | Promise<void>;
}
export interface ToastItem extends ToastOptions {
  id: number;
  remaining: number;
  startedAt: number;
  paused: boolean;
  /** Shown by toast.promise while it waits: a spinning icon and no timer. */
  loading?: boolean;
}
export type ToastPatch = Partial<Omit<ToastOptions, "key">> & { loading?: boolean };
export interface ToastPromiseMessages<T> {
  loading: string;
  success: string | ((value: T) => string);
  error: string | ((error: unknown) => string);
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
    /** Changes a shown toast in place and restarts its time; a new type without a duration takes that type's default. */
    update(id: number, patch: ToastPatch): void;
    /** Shows a loading toast, then turns it into a success or an error toast; returns the same promise. */
    promise<T>(promise: Promise<T> | (() => Promise<T>), messages: ToastPromiseMessages<T>, options?: Partial<ToastOptions>): Promise<T>;
  };
  confirm(options: string | ConfirmOptions): Promise<boolean>;
  prompt(options: string | PromptOptions): Promise<string | null>;
}
function developmentMode() {
  try { return !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { return false; }
}
/** external: an app-made controller (createKjunFeedback) may have no Provider for a while, so it warns and holds toasts then.
 * A Provider's own controller is always drawn by that Provider and keeps the earlier behavior. */
const defaultDuration = (type: ToastOptions["type"]) =>
  type === "danger" || type === "error" ? 0 : type === "warning" ? 4000 : 3000;
export function createFeedbackController({ external = false } = {}) {
  let sequence = 0,
    // How many toasts stay on screen; KjunFeedbackProvider's maxToasts sets it.
    limit = 3,
    disposed = false,
    // Providers currently drawing this controller; an app-made controller may have none for a while.
    attached = 0,
    warnedUnattached = false,
    warnedShared = false;
  // Checked after the current task: React runs a child's mount effect before the Provider's attach effect.
  const warnUnattached = () => {
    if (!external || attached || warnedUnattached || !developmentMode()) return;
    queueMicrotask(() => {
      if (attached || warnedUnattached) return;
      warnedUnattached = true;
      console.warn("KJUN feedback: no KjunFeedbackProvider is showing this controller yet; the request waits until one mounts.");
    });
  };
  // Toasts wait while no Provider shows them, so their time starts once they are visible.
  const unattached = Symbol("unattached");
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
  const remove = (id: number, reason: ToastDismissReason) => {
    const toast = toasts.find((t) => t.id === id);
    if (!toast) return;
    clearTimeout(timers.get(id));
    timers.delete(id);
    pauseReasons.delete(id);
    toasts = toasts.filter((t) => t.id !== id);
    emit();
    toast.onDismiss?.(reason);
  };
  const dismiss = (id: number) => remove(id, "api");
  // Starts a toast's time from now; a toast hovered or waiting for a Provider stays paused with its full time.
  const schedule = (id: number, duration: number) => {
    clearTimeout(timers.get(id));
    timers.delete(id);
    if (duration <= 0 || pauseReasons.get(id)?.size) return;
    if (attached || !external) { timers.set(id, setTimeout(() => remove(id, "timeout"), duration)); return; }
    // No Provider shows it yet: it waits with its whole time, none of it spent.
    pauseReasons.set(id, new Set([unattached]));
    toasts = toasts.map((t) => (t.id === id ? { ...t, paused: true, remaining: duration } : t));
    emit();
  };
  // At most `limit`: the oldest toast that closes itself makes room first, so a lasting error stays.
  const trim = (room = 0) => {
    while (toasts.length > Math.max(0, limit - room))
      remove((toasts.find((t) => (t.duration ?? 0) > 0) ?? toasts[0]).id, "api");
  };
  const add = (
    type: ToastOptions["type"],
    message: string,
    options: Partial<ToastOptions> = {}
  ) => {
    if (disposed) return -1;
    warnUnattached();
    const same = options.key === undefined ? undefined : toasts.find((t) => t.key === options.key);
    if (same) {
      update(same.id, { ...options, type, message });
      return same.id;
    }
    const id = ++sequence;
    const duration = options.duration ?? defaultDuration(type);
    trim(1);
    toasts = [
      ...toasts,
      {
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
    schedule(id, duration);
    return id;
  };
  const update = (id: number, patch: ToastPatch) => {
    const toast = toasts.find((t) => t.id === id);
    if (!toast || disposed) return;
    const type = patch.type === "error" ? "danger" : patch.type ?? toast.type;
    const duration = patch.duration ?? (type !== toast.type ? defaultDuration(type) : toast.duration ?? 0);
    const held = duration > 0 && !!pauseReasons.get(id)?.size;
    if (!duration) pauseReasons.delete(id);
    toasts = toasts.map((t) => t.id === id
      ? { ...t, ...patch, type, duration, remaining: duration, startedAt: Date.now(), paused: held }
      : t);
    schedule(id, duration);
    emit();
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
      setTimeout(() => remove(id, "timeout"), toast.remaining)
    );
    emit();
  };
  const enqueue = <T>(
    kind: FeedbackRequest["kind"],
    value: string | ConfirmOptions | PromptOptions
  ): Promise<T> => {
    if (disposed)
      return Promise.resolve((kind === "confirm" ? false : null) as T);
    warnUnattached();
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
        const cleared = toasts;
        if (!cleared.length) return;
        for (const t of cleared) { clearTimeout(timers.get(t.id)); timers.delete(t.id); pauseReasons.delete(t.id); }
        toasts = [];
        emit();
        for (const t of cleared) t.onDismiss?.("api");
      },
      update,
      promise: (value, messages, options = {}) => {
        const running = Promise.resolve(typeof value === "function" ? value() : value);
        const id = add("info", messages.loading, { ...options, duration: 0, loading: true } as Partial<ToastOptions>);
        const text = <V>(message: string | ((value: V) => string), result: V) => typeof message === "function" ? message(result) : message;
        running.then(
          (result) => update(id, { type: "success", message: text(messages.success, result), loading: false, duration: options.duration }),
          (error) => update(id, { type: "danger", message: text(messages.error, error), loading: false, duration: options.duration }),
        );
        return running;
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
    /** Closes a toast from its own controls: the close button or a swipe ("close"), or its action ("action"). */
    closeToast: (id: number, reason: "close" | "action") => remove(id, reason),
    /** KjunFeedbackProvider's maxToasts: how many toasts stay on screen at once. */
    setToastLimit(value: number) {
      limit = Math.max(1, Math.floor(value) || 1);
      trim();
    },
    getSnapshot: () => snapshot,
    /** Marks a mounted Provider; returns the detach call. Two at once share one queue, which KJUN does not support. */
    attach() {
      if (!attached++ && external) [...toasts].forEach((toast) => resumeToast(toast.id, unattached));
      if (attached > 1 && !warnedShared && developmentMode()) {
        warnedShared = true;
        console.warn("KJUN feedback: one controller is attached to more than one KjunFeedbackProvider at once; give each Provider its own controller.");
      }
      return () => {
        attached = Math.max(0, attached - 1);
        if (!attached && external && !disposed) [...toasts].forEach((toast) => pauseToast(toast.id, unattached));
      };
    },
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
      const cleared = toasts;
      toasts = [];
      emit();
      listeners.clear();
      for (const t of cleared) t.onDismiss?.("api");
    },
  };
}

export type KjunFeedbackController = ReturnType<typeof createFeedbackController>;
const controllers = new WeakMap<KjunFeedback, KjunFeedbackController>();
/** An app-owned feedback API that plain functions can call; pass it to KjunFeedbackProvider's controller. */
export function createKjunFeedback(): KjunFeedback {
  const controller = createFeedbackController({ external: true });
  controllers.set(controller.api, controller);
  return controller.api;
}
/** The controller behind createKjunFeedback(); Providers use it to draw requests. */
export function feedbackControllerOf(feedback: KjunFeedback): KjunFeedbackController {
  const controller = controllers.get(feedback);
  if (!controller) throw Error("KJUN feedback: pass a value created by createKjunFeedback().");
  return controller;
}

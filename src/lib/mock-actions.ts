import { toast } from "sonner";

/**
 * Simulates a backend-style async action with toast feedback.
 * Returns a promise so callers can chain optimistic UI updates.
 */
export function runMockAction(
  label: string,
  opts: {
    detail?: string;
    duration?: number;
    success?: string;
    error?: string;
    type?: "default" | "success" | "info" | "warning" | "error";
  } = {},
) {
  const id = toast.loading(label, { description: opts.detail });
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      const fn =
        opts.type === "error"
          ? toast.error
          : opts.type === "warning"
            ? toast.warning
            : opts.type === "info"
              ? toast.info
              : toast.success;
      fn(opts.success ?? label, {
        id,
        description: opts.detail,
      });
      resolve();
    }, opts.duration ?? 700);
  });
}

export function notify(message: string, detail?: string) {
  toast(message, { description: detail });
}

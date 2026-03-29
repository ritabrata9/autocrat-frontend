export const toastBus = { current: null };

export function toast(message) {
  toastBus.current?.(message);
}

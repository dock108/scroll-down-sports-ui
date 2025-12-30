type LogPayload = Record<string, unknown>;

const formatPayload = (payload?: LogPayload) => {
  if (!payload) {
    return '';
  }
  try {
    return JSON.stringify(payload);
  } catch {
    return '';
  }
};

export const logger = {
  info(message: string, payload?: LogPayload) {
    const suffix = formatPayload(payload);
    console.info(`[ScrollDownSports] ${message}${suffix ? ` ${suffix}` : ''}`);
  },
  warn(message: string, payload?: LogPayload) {
    const suffix = formatPayload(payload);
    console.warn(`[ScrollDownSports] ${message}${suffix ? ` ${suffix}` : ''}`);
  },
  error(message: string, payload?: LogPayload) {
    const suffix = formatPayload(payload);
    console.error(`[ScrollDownSports] ${message}${suffix ? ` ${suffix}` : ''}`);
  },
};

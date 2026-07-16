import "server-only";

type ServerLogContext = Record<
  string,
  string | number | boolean | null | undefined
>;

function normalizedError(error: unknown): ServerLogContext {
  if (!error || typeof error !== "object") return {};
  const value = error as {
    code?: unknown;
    digest?: unknown;
    name?: unknown;
    status?: unknown;
  };
  return {
    errorCode: typeof value.code === "string" ? value.code : undefined,
    errorDigest: typeof value.digest === "string" ? value.digest : undefined,
    errorName: typeof value.name === "string" ? value.name : undefined,
    errorStatus: typeof value.status === "number" ? value.status : undefined,
  };
}

function record(
  level: "error" | "info" | "warn",
  event: string,
  context: ServerLogContext = {},
) {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
  });
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.info(entry);
}

export function logServerError(
  event: string,
  error: unknown,
  context: ServerLogContext = {},
) {
  record("error", event, { ...context, ...normalizedError(error) });
}

export function logServerEvent(event: string, context: ServerLogContext = {}) {
  record("info", event, context);
}

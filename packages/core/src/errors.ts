import { errResult, type SiteForgeError as SiteForgeErrorShape } from "./schema.js";

export type ErrorCode =
  | "INVALID_URL"
  | "TIMEOUT"
  | "SOURCE_NOT_FOUND"
  | "SECTION_NOT_FOUND"
  | "PATH_ESCAPE"
  | "EXTRACT_FAILED"
  | "DOWNLOAD_FAILED"
  | "PRIVATE_NETWORK_BLOCKED"
  | "INTERNAL";

export class SiteForgeException extends Error {
  readonly code: ErrorCode;
  readonly hint?: string;

  constructor(code: ErrorCode, message: string, hint?: string) {
    super(message);
    this.name = "SiteForgeException";
    this.code = code;
    this.hint = hint;
  }

  toJSON(): SiteForgeErrorShape {
    return errResult(this.code, this.message, this.hint);
  }
}

export function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

export function assertHttpUrl(url: string): void {
  if (!isHttpUrl(url)) {
    throw new SiteForgeException(
      "INVALID_URL",
      "URL must start with http:// or https://",
      "Example: https://example.com",
    );
  }
}

export function toErrorShape(err: unknown): SiteForgeErrorShape {
  if (err instanceof SiteForgeException) return err.toJSON();
  const message = err instanceof Error ? err.message : String(err);
  if (/timeout/i.test(message)) {
    return errResult("TIMEOUT", message, "Increase waitMs/timeoutMs or check network");
  }
  return errResult("INTERNAL", message);
}

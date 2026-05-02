import { validateRuntimeEnv } from "@/lib/env";
import { logError, logInfo } from "@/lib/logger";

export async function register() {
  try {
    validateRuntimeEnv();
    logInfo("runtime.validation.succeeded", {
      nodeEnv: process.env.NODE_ENV ?? "undefined",
    });
  } catch (error) {
    logError("runtime.validation.failed", {
      error,
      nodeEnv: process.env.NODE_ENV ?? "undefined",
    });
    throw error;
  }
}

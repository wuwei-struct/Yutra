function safeString(value, fallback = "") {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return fallback;
}

export function createAdapterError(code, message, details = {}) {
  return {
    code,
    message,
    retryable: details.retryable === true,
    httpStatus: details.httpStatus,
    source: "real-adapter-skeleton",
    details: details.details ?? {}
  };
}

export function resolveRealAdapterConfig(adapterKey, options = {}) {
  const upper = adapterKey.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  const baseUrl =
    options.baseUrl ??
    process.env[`YUTRA_ECOM_${upper}_API_BASE_URL`] ??
    process.env.YUTRA_ECOM_API_BASE_URL ??
    "";

  const timeoutMs = Number(options.timeoutMs ?? process.env.YUTRA_ECOM_TIMEOUT_MS ?? 5000);
  const maxAttempts = Number(options.maxAttempts ?? process.env.YUTRA_ECOM_RETRY_MAX_ATTEMPTS ?? 2);
  const backoffMs = Number(options.backoffMs ?? process.env.YUTRA_ECOM_RETRY_BACKOFF_MS ?? 200);

  return {
    adapterKey,
    dryRun: options.dryRun !== false,
    environment: options.environment ?? process.env.YUTRA_ECOM_ENVIRONMENT ?? "demo",
    baseUrl: safeString(baseUrl),
    authToken: safeString(options.authToken ?? process.env.YUTRA_ECOM_AUTH_TOKEN),
    apiKey: safeString(options.apiKey ?? process.env.YUTRA_ECOM_API_KEY),
    timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : 5000,
    retry: {
      maxAttempts: Number.isFinite(maxAttempts) ? Math.max(1, maxAttempts) : 2,
      backoffMs: Number.isFinite(backoffMs) ? Math.max(0, backoffMs) : 200
    }
  };
}

export function ensureRequiredFields(fields, payload, adapterKey) {
  for (const field of fields) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === "") {
      throw createAdapterError(
        "ADAPTER_CONTRACT_FIELD_MISSING",
        `${adapterKey} adapter missing required field: ${field}`,
        {
          retryable: false,
          details: { field }
        }
      );
    }
  }
}

export async function requestWithRetry(url, init, config) {
  if (config.dryRun) {
    return {
      dryRun: true,
      status: 200,
      json: async () => ({})
    };
  }

  if (!config.baseUrl) {
    throw createAdapterError(
      "ADAPTER_REAL_CONFIG_MISSING",
      `${config.adapterKey} adapter requires API base URL when dryRun is disabled.`,
      { retryable: false }
    );
  }

  let lastError;
  for (let attempt = 1; attempt <= config.retry.maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (response.status === 401 || response.status === 403) {
        throw createAdapterError("ADAPTER_AUTH_FAILED", `Auth failed for ${config.adapterKey} adapter.`, {
          retryable: false,
          httpStatus: response.status
        });
      }

      if (response.status === 429) {
        lastError = createAdapterError("ADAPTER_RATE_LIMITED", `Rate limited by upstream ${config.adapterKey} API.`, {
          retryable: true,
          httpStatus: response.status
        });
      } else if (!response.ok) {
        const retryable = response.status >= 500;
        lastError = createAdapterError("ADAPTER_UPSTREAM_ERROR", `Upstream ${config.adapterKey} API error (${response.status}).`, {
          retryable,
          httpStatus: response.status
        });
        if (!retryable) {
          throw lastError;
        }
      } else {
        return response;
      }
    } catch (error) {
      clearTimeout(timeout);
      if (error?.name === "AbortError") {
        lastError = createAdapterError("ADAPTER_UPSTREAM_TIMEOUT", `Upstream ${config.adapterKey} API timed out.`, {
          retryable: true
        });
      } else if (error?.code) {
        lastError = error;
      } else {
        lastError = createAdapterError("ADAPTER_NETWORK_ERROR", `Network failure in ${config.adapterKey} adapter.`, {
          retryable: true,
          details: { message: String(error?.message ?? error) }
        });
      }
    }

    if (!lastError?.retryable || attempt === config.retry.maxAttempts) {
      throw lastError;
    }

    if (config.retry.backoffMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, config.retry.backoffMs));
    }
  }

  throw lastError;
}

export function baseHeaders(config, extra = {}) {
  return {
    "content-type": "application/json",
    ...(config.authToken ? { authorization: `Bearer ${config.authToken}` } : {}),
    ...(config.apiKey ? { "x-api-key": config.apiKey } : {}),
    ...extra
  };
}

export function dryRunMeta(config) {
  return {
    dryRun: config.dryRun,
    environment: config.environment,
    adapterKey: config.adapterKey,
    retry: config.retry,
    timeoutMs: config.timeoutMs
  };
}

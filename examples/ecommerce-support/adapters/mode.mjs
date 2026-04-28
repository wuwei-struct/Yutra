const ALLOWED_MODES = new Set(["mock", "real"]);

export function resolveAdapterMode(options = {}) {
  const fromOptions = options.adapterMode ?? options.mode;
  const fromContext = options.context?.adapter_mode;
  const fromProfile = options.profile?.adapterMode;
  const fromEnv = process.env.YUTRA_ECOM_ADAPTER_MODE;

  const candidate = [fromOptions, fromContext, fromProfile, fromEnv]
    .map((value) => (typeof value === "string" ? value.trim().toLowerCase() : ""))
    .find((value) => value.length > 0);

  if (candidate && ALLOWED_MODES.has(candidate)) {
    return candidate;
  }

  return "mock";
}

export function getAdapterRuntimeHints(options = {}) {
  return {
    mode: resolveAdapterMode(options),
    dryRun: options.dryRun !== false,
    environment: options.environment ?? process.env.YUTRA_ECOM_ENVIRONMENT ?? "demo"
  };
}

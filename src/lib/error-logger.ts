type ErrorMetadata = Record<string, unknown>;

function hasMetadata(metadata?: ErrorMetadata) {
  return Boolean(metadata && Object.keys(metadata).length > 0);
}

export function logError(scope: string, error: unknown, metadata?: ErrorMetadata) {
  try {
    if (hasMetadata(metadata)) {
      console.error(`[STA Error] ${scope}`, error, metadata);
      return;
    }

    console.error(`[STA Error] ${scope}`, error);
  } catch {
    console.error(`[STA Error] ${scope}`, error);
  }
}

export function registerGlobalErrorLogging() {
  if (typeof window === 'undefined') return;

  const handleGlobalError = (event: Event | ErrorEvent) => {
    if (event instanceof ErrorEvent) {
      logError('window.error', event.error ?? event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
      return;
    }

    const target = event.target;
    const element = target instanceof HTMLElement ? target : null;
    let source: string | null = null;
    if (target instanceof HTMLImageElement) {
      source = target.currentSrc || target.src;
    } else if (target instanceof HTMLScriptElement) {
      source = target.src;
    } else if (target instanceof HTMLLinkElement) {
      source = target.href;
    }

    logError('window.resource-error', new Error('Resource failed to load.'), {
      tagName: element?.tagName,
      source,
    });
  };

  window.addEventListener('error', handleGlobalError, true);

  window.addEventListener('unhandledrejection', (event) => {
    logError('window.unhandledrejection', event.reason);
  });
}

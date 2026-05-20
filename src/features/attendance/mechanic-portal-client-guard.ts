export const KNOWN_EXTERNAL_JSON_RPC_ERROR_CODE = -32603;
export const KNOWN_EXTERNAL_JSON_RPC_ERROR_MESSAGE = "Internal JSON-RPC error.";

export function isKnownExternalJsonRpcError(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as { code?: unknown; message?: unknown };

  return (
    candidate.code === KNOWN_EXTERNAL_JSON_RPC_ERROR_CODE &&
    candidate.message === KNOWN_EXTERNAL_JSON_RPC_ERROR_MESSAGE
  );
}

export function getMechanicPortalClientGuardScript() {
  return `
    (() => {
      const knownCode = ${KNOWN_EXTERNAL_JSON_RPC_ERROR_CODE};
      const knownMessage = ${JSON.stringify(KNOWN_EXTERNAL_JSON_RPC_ERROR_MESSAGE)};

      function isKnownExternalJsonRpcError(value) {
        if (!value || typeof value !== "object") {
          return false;
        }

        return value.code === knownCode && value.message === knownMessage;
      }

      window.addEventListener(
        "unhandledrejection",
        function handleMechanicPortalUnhandledRejection(event) {
          if (!isKnownExternalJsonRpcError(event.reason)) {
            return;
          }

          if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
          }

          event.preventDefault();
        },
        true,
      );
    })();
  `;
}

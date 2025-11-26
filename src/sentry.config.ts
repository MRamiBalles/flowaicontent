import * as Sentry from "@sentry/react";

export const initSentry = () => {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE;

    // Only initialize Sentry if DSN is provided (production/staging)
    if (!dsn || dsn.includes("examplePublicKey")) {
        console.log("Sentry monitoring disabled (no valid DSN configured)");
        return;
    }

    Sentry.init({
        dsn,
        environment,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
            }),
        ],
        // Performance Monitoring
        tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || "0.1"),

        // Session Replay
        replaysSessionSampleRate: parseFloat(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || "0.1"),
        replaysOnErrorSampleRate: parseFloat(import.meta.env.VITE_SENTRY_REPLAYS_ERROR_SAMPLE_RATE || "1.0"),

        // Additional configuration
        beforeSend(event, hint) {
            // Filter out development errors
            if (environment === "development") {
                return null;
            }

            // Log errors to console in development
            if (hint?.originalException) {
                console.error("Sentry captured error:", hint.originalException);
            }

            return event;
        },

        // Ignore errors
        ignoreErrors: [
            // Browser extensions
            "top.GLOBALS",
            // React DevTools
            "__REACT_DEVTOOLS_GLOBAL_HOOK__",
        ],
    });

    console.log(`Sentry monitoring initialized (${environment})`);
};

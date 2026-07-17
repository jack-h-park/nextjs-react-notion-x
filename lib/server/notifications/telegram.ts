import { telemetryLogger } from "@/lib/logging/logger";

export type ChatStartedNotice = {
  question: string;
  sessionId: string | null;
  traceId: string | null;
  environment: string;
};

const QUESTION_PREVIEW_CHARS = 200;

/**
 * Fire-and-forget Telegram notification when a visitor starts a new chat.
 *
 * Enabled only when TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID are set, and only for
 * the environment named in CHAT_NOTIFY_ENV (default "prod") so local/dev runs
 * stay silent. The send is intentionally not awaited by callers — it has the
 * whole streaming window to complete, and failures are debug-logged without
 * ever affecting the request.
 */
export function notifyChatStarted(notice: ChatStartedNotice): void {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    return;
  }
  const notifyEnv = process.env.CHAT_NOTIFY_ENV ?? "prod";
  if (notice.environment !== notifyEnv) {
    return;
  }

  const preview =
    notice.question.length > QUESTION_PREVIEW_CHARS
      ? `${notice.question.slice(0, QUESTION_PREVIEW_CHARS)}…`
      : notice.question;

  // Deep-link to the Langfuse trace when the project id is configured;
  // otherwise fall back to the bare trace id.
  const baseUrl = process.env.LANGFUSE_BASE_URL;
  const projectId = process.env.LANGFUSE_PROJECT_ID;
  const traceUrl =
    notice.traceId && baseUrl && projectId
      ? `${baseUrl.replace(/\/$/, "")}/project/${projectId}/traces/${notice.traceId}`
      : null;

  const text = [
    "💬 New JackGPT chat",
    `Q: ${preview}`,
    notice.sessionId ? `Session: ${notice.sessionId}` : null,
    traceUrl ?? (notice.traceId ? `Trace: ${notice.traceId}` : null),
  ]
    .filter(Boolean)
    .join("\n");

  void fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  })
    .then((res) => {
      if (!res.ok) {
        telemetryLogger.debug("[notify] telegram send failed", {
          status: res.status,
        });
      }
    })
    .catch((err: unknown) => {
      telemetryLogger.debug("[notify] telegram send failed", {
        error: err instanceof Error ? err.message : String(err ?? "unknown"),
      });
    });
}

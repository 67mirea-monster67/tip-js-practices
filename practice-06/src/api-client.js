const ALLOWED_METHODS = ["GET", "POST", "PATCH", "DELETE"];

export class ApiError extends Error {
  constructor(message, { kind, status = null, code = null, details = null, url = null, cause } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    Object.assign(this, { name: "ApiError", kind, status, code, details, url });
  }
}

function normalizeBase(baseUrl) {
  let url;
  try { url = new URL(baseUrl); } catch { throw new TypeError("Нужен абсолютный URL API."); }
  if (!["http:", "https:"].includes(url.protocol) || url.search || url.hash || url.username || url.password)
    throw new TypeError("Некорректный URL API.");
  return url.href.replace(/\/+$/, "");
}

export function buildUrl(baseUrl, path, query = {}) {
  const url = new URL(normalizeBase(baseUrl) + "/" + path.replace(/^\/+/, ""));
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url.href;
}

export function createApiClient({ baseUrl, fetchFn = globalThis.fetch, timeoutMs = 3000 } = {}) {
  baseUrl = normalizeBase(baseUrl);
  const validTime = value => Number.isSafeInteger(value) && value > 0;
  if (typeof fetchFn !== "function" || !validTime(timeoutMs)) throw new TypeError("Неверная конфигурация клиента.");

  async function requestJson(path, { method = "GET", query = {}, body, signal, timeoutMs: limit = timeoutMs } = {}) {
    method = method.toUpperCase();
    if (!ALLOWED_METHODS.includes(method) || (method === "GET" && body !== undefined) || !validTime(limit))
      throw new TypeError("Неверный метод, тело или тайм-аут.");
    const url = buildUrl(baseUrl, path, query);
    const controller = new AbortController();
    let timedOut = false;
    const abort = () => controller.abort(signal.reason);
    if (signal?.aborted) abort();
    else signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, limit);
    try {
      const headers = { Accept: "application/json" };
      const options = { method, headers, signal: controller.signal };
      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
      }
      const response = await fetchFn(url, options);
      if (!response || typeof response.json !== "function" || !response.headers?.get || typeof response.ok !== "boolean")
        throw new ApiError("Некорректный HTTP-ответ.", { kind: "invalid-response", url });
      if (!response.ok) {
        let payload;
        try { payload = await response.json(); } catch { /* HTTP status has priority. */ }
        throw new ApiError(payload?.error?.message || `HTTP ${response.status}`, {
          kind: "http", status: response.status, code: payload?.error?.code ?? null,
          details: payload?.error?.details ?? null, url,
        });
      }
      if (response.status === 204) return null;
      if (!/^application\/json(?:;|$)/i.test(response.headers.get("content-type") ?? ""))
        throw new ApiError("Ожидался JSON.", { kind: "invalid-response", url });
      try { return await response.json(); }
      catch (cause) {
        if (controller.signal.aborted) throw cause;
        throw new ApiError("Некорректный JSON.", { kind: "invalid-response", url, cause });
      }
    } catch (cause) {
      if (cause instanceof ApiError) throw cause;
      const kind = controller.signal.aborted ? (timedOut ? "timeout" : "aborted") : "network";
      throw new ApiError(kind === "timeout" ? "Истекло время запроса." : kind === "aborted"
        ? "Запрос отменён." : "Нет соединения с API.", { kind, url, cause });
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    }
  }
  return { requestJson };
}

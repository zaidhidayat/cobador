export function jsonResponse(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers,
    },
  });
}

export async function readJson<T>(request: Request): Promise<T> {
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) {
    throw new Error("Expected application/json");
  }
  return await request.json() as T;
}

export function notFound(): Response {
  return jsonResponse({ ok: false, error: "Not found" }, { status: 404 });
}

export function badRequest(message: string): Response {
  return jsonResponse({ ok: false, error: message }, { status: 400 });
}

export function unauthorized(message = "Belum login"): Response {
  return jsonResponse({ ok: false, error: message }, { status: 401 });
}

export function withCookies(response: Response, cookies: string[]): Response {
  if (!cookies.length) return response;
  const headers = new Headers(response.headers);
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Cliente HTTP base: adjunta el JWT de Supabase a cada petición al backend
// y normaliza el manejo de errores para toda la capa de servicios.

async function request(path, { token, method = "GET", body } = {}) {
  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = data?.error || `Error ${res.status} al llamar ${path}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  get: (path, token) => request(path, { token, method: "GET" }),
  post: (path, token, body) => request(path, { token, method: "POST", body }),
  put: (path, token, body) => request(path, { token, method: "PUT", body }),
  del: (path, token) => request(path, { token, method: "DELETE" }),
};

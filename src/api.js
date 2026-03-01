export const API_BASE =
  (import.meta.env.VITE_API_BASE && import.meta.env.VITE_API_BASE.replace(/\/$/, "")) ||
  "https://cityhelp-backend-gtpu.onrender.com";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;

  // --- таймаут на запрос ---
  const timeoutMs = options.timeoutMs ?? 12000; // 12s на попытку
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: isFormData
        ? options.headers
        : { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
      signal: controller.signal,
    });

    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    if (!res.ok) {
      const err = new Error("Request failed");
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } finally {
    clearTimeout(t);
  }
}

export async function getBuildings() {
  // 0) мгновенно показываем кэш, чтобы не было пусто
  const cached = sessionStorage.getItem("buildings_cache");
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      // в фоне всё равно обновим
      refreshBuildingsInBackground();
      return parsed;
    } catch {}
  }

  // 1) прогрев: лёгкий запрос на корень (он быстрее/проще)
  // (если бэк спит — этот вызов тоже “разбудит” инстанс)
  await warmupBackend();

  // 2) основной запрос с долгими ретраями под твои 120 секунд
  const data = await requestWithRetry(
    "/buildings/",
    { method: "GET", timeoutMs: 15000 },          // 15s на попытку
    [0, 2000, 5000, 10000, 20000, 30000, 45000]   // суммарно перекрывает 120s+
  );

  try { sessionStorage.setItem("buildings_cache", JSON.stringify(data)); } catch {}
  return data;
}

async function warmupBackend() {
  // чтобы не долбить прогревом постоянно
  const last = Number(sessionStorage.getItem("api_warmup_ts") || 0);
  const now = Date.now();
  if (now - last < 60_000) return; // 1 минута

  sessionStorage.setItem("api_warmup_ts", String(now));

  try {
    // корень у тебя есть: @app.get("/")
    await request("/", { method: "GET", timeoutMs: 8000 });
  } catch {
    // даже если упало — это всё равно запускает “просыпание”
  }
}

async function refreshBuildingsInBackground() {
  try {
    await warmupBackend();
    const data = await requestWithRetry(
      "/buildings/",
      { method: "GET", timeoutMs: 15000 },
      [2000, 5000, 10000]
    );
    sessionStorage.setItem("buildings_cache", JSON.stringify(data));
  } catch {}
}

async function requestWithRetry(path, options, delaysMs) {
  let lastErr;

  for (let i = 0; i < delaysMs.length; i++) {
    if (delaysMs[i] > 0) await new Promise((r) => setTimeout(r, delaysMs[i]));

    try {
      return await request(path, options);
    } catch (e) {
      lastErr = e;

      const status = e?.status;
      const isNetwork = !status; // aborted / failed to fetch / connection closed
      const isRetryStatus = [502, 503, 504].includes(status);

      // если это НЕ сетевое и НЕ 502/503/504 — смысла ретраить нет
      if (!(isNetwork || isRetryStatus)) throw e;
    }
  }

  throw lastErr;
}
export function createBuilding(payload) {
  // payload: {lat, lng, status?, address?}
  return request("/buildings/", { method: "POST", body: JSON.stringify(payload) });
}

export function updateBuildingPosition(buildingId, lat, lng) {
  return request(`/buildings/${buildingId}/position`, {
    method: "PATCH",
    body: JSON.stringify({ lat, lng }),
  });
}

export function getReportsByBuilding(buildingId) {
  return request(`/reports/buildings/${buildingId}/reports`);
}

export const createReport = (data) => {
  const formData = new FormData();

  formData.append("building_id", Number(data.building_id));
  formData.append("category", data.category);
  formData.append("severity", data.severity);
  formData.append("periodicity", data.periodicity);
  formData.append("text", data.text);

  if (data.image) {
    formData.append("image", data.image);
  }

  return request("/reports/", {
    method: "POST",
    body: formData,
  });
};
  
export function confirmPositive(buildingId) {
  return request(`/buildings/${buildingId}/confirm-positive`, {
    method: "POST",
  });
}

export function getHelp(buildingId = null) {
  const query = buildingId ? `?building_id=${buildingId}` : "";
  return request(`/help/${query}`);
}

export function createHelp(payload) {
  return request("/help/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function closeHelp(helpId) {
  return request(`/help/${helpId}/close`, {
    method: "POST",
  });
}

export async function respondToHelp(id, userHash) {
  return request(`/help/${id}/respond`, {
	  method: "POST",
	  headers: { "X-User-Hash": userHash }
	});
}

export function getHelpResponses(id) {
  return request(`/help/${id}/responses`);
}

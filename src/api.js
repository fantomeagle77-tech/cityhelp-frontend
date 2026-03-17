export const API_BASE =
  (import.meta.env.VITE_API_BASE &&
    import.meta.env.VITE_API_BASE.replace(/\/$/, "")) ||
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
  const method = (options.method || "GET").toUpperCase();
  const timeoutMs = options.timeoutMs || 12000;

  const headers = { ...(options.headers || {}) };

  // Для GET не ставим Content-Type, чтобы не вызывать лишний OPTIONS preflight
  if (!isFormData && options.body != null && method !== "GET") {
    headers["Content-Type"] = "application/json";
  }

  // timeoutMs не должен улетать в fetch как левый ключ
  const { timeoutMs: _timeoutMs, ...fetchOptions } = options;

  const res = await fetchWithTimeout(
    `${API_BASE}${path}`,
    {
      ...fetchOptions,
      method,
      headers,
    },
    timeoutMs
  );

  const text = await res.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  console.log(
    "[API]",
    method,
    `${API_BASE}${path}`,
    "status=",
    res.status,
    "text=",
    text?.slice(0, 200)
  );

  if (!res.ok) {
    const err = new Error("Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function getBuildings() {
  const cached = sessionStorage.getItem("buildings_cache");

  // 1. Если есть кэш — отдаем его сразу, без ожидания backend
  if (cached) {
    try {
      const parsed = JSON.parse(cached);

      // Обновление в фоне, но UI уже не блокируем
      refreshBuildingsInBackground();

      return parsed;
    } catch {
      // если кэш битый — идем в обычную загрузку
    }
  }

  // 2. Если кэша нет — тогда уже реально грузим с backend
  const data = await requestWithRetry(
    "/buildings/",
    { method: "GET", timeoutMs: 30000 },
    [0, 3000, 7000, 12000, 20000]
  );

  try {
    sessionStorage.setItem("buildings_cache", JSON.stringify(data));
  } catch {}

  return data;
}

async function warmupBackend() {
  const last = Number(sessionStorage.getItem("api_warmup_ts") || 0);
  const now = Date.now();

  if (now - last < 60_000) return;

  sessionStorage.setItem("api_warmup_ts", String(now));

  try {
    await request("/", { method: "GET", timeoutMs: 8000 });
  } catch {
    // даже если упало — это может разбудить инстанс
  }
}

async function refreshBuildingsInBackground() {
  try {
    const data = await requestWithRetry(
      "/buildings/",
      { method: "GET", timeoutMs: 30000 },
      [0, 3000, 7000]
    );

    try {
      sessionStorage.setItem("buildings_cache", JSON.stringify(data));
    } catch {}
  } catch {}
}

async function requestWithRetry(path, options, delaysMs) {
  let lastErr;

  for (let i = 0; i < delaysMs.length; i++) {
    if (delaysMs[i] > 0) {
      await sleep(delaysMs[i]);
    }

    try {
      return await request(path, options);
    } catch (e) {
      lastErr = e;

      const status = e?.status;
      const isNetwork = !status; // aborted / failed to fetch / connection closed
      const isRetryStatus = [502, 503, 504].includes(status);

      if (!(isNetwork || isRetryStatus)) {
        throw e;
      }
    }
  }

  throw lastErr;
}

export function createBuilding(payload) {
  return request("/buildings/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateBuildingPosition(buildingId, lat, lng) {
  return request(`/buildings/${buildingId}/position`, {
    method: "PATCH",
    body: JSON.stringify({ lat, lng }),
  });
}

export function getReportsByBuilding(buildingId) {
  return request(`/reports/buildings/${buildingId}/reports`, {
    method: "GET",
    timeoutMs: 30000,
  });
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

export function confirmProblem(reportId) {
  return request(`/reports/${reportId}/confirm-problem`, {
    method: "POST",
  });
}

export function confirmResolved(reportId) {
  return request(`/reports/${reportId}/confirm-resolved`, {
    method: "POST",
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
    headers: { "X-User-Hash": userHash },
  });
}

export function getHelpResponses(id) {
  return request(`/help/${id}/responses`);
}

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

  // 3 попытки: 0.8s / 1.5s / 2.5s (Render просыпается)
  const delays = [800, 1500, 2500];
  let lastErr = null;

  for (let i = 0; i < delays.length; i++) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}${path}`, {
        headers: isFormData
          ? (options.headers || {})
          : { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options,
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
    } catch (e) {
      lastErr = e;
      // retry
      if (i < delays.length - 1) await sleep(delays[i]);
    }
  }

  throw lastErr;
}

export function getBuildings({ south, west, north, east } = {}) {
  const params =
    south != null
      ? `?south=${south}&west=${west}&north=${north}&east=${east}`
      : "";
  return request(`/buildings/${params}`);
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

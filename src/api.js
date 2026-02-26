const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${API_BASE}${path}`, {
    headers: isFormData
      ? options.headers
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
}

export function getBuildings() {
  return request("/buildings/");
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
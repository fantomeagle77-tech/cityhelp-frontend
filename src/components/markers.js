// frontend/src/components/markers.js
// Жёстко фиксируем иконки на твои PNG из /public

import L from "leaflet";

const iconConfig = {
  iconSize: [32, 48], // под твои PNG (можешь поменять, если нужно)
  iconAnchor: [16, 48],
  popupAnchor: [0, -44],
};

const iconByStatus = {
  green: L.icon({ iconUrl: "/marker-green.png", ...iconConfig }),
  yellow: L.icon({ iconUrl: "/marker-yellow.png", ...iconConfig }),
  orange: L.icon({ iconUrl: "/marker-orange.png", ...iconConfig }),
  red: L.icon({ iconUrl: "/marker-red.png", ...iconConfig }),
};

export function getIcon(status) {
  return iconByStatus[status] || iconByStatus.green;
}

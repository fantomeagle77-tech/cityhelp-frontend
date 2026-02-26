import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { trackEvent } from "../utils/analytics";
import "leaflet.heat";
import { LayersControl } from "react-leaflet";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";



import SidePanel from "./SidePanel";
import {
  createBuilding,
  getBuildings,
  getReportsByBuilding,
  updateBuildingPosition,
} from "../api";

// --- маркеры строго из /public (НЕ меняем внешний вид) ---
const ICON_SIZE = [35, 56];
const ICON_ANCHOR = [17, 56];
const POPUP_ANCHOR = [0, -50];

const iconByStatus = {
  black: L.icon({
	iconUrl: "/marker-black.png",
	iconSize: ICON_SIZE,
	iconAnchor: ICON_ANCHOR,
	popupAnchor: POPUP_ANCHOR,
  }),
  green: L.icon({
    iconUrl: "/marker-green.png",
    iconSize: ICON_SIZE,
    iconAnchor: ICON_ANCHOR,
    popupAnchor: POPUP_ANCHOR,
  }),
  yellow: L.icon({
    iconUrl: "/marker-yellow.png",
    iconSize: ICON_SIZE,
    iconAnchor: ICON_ANCHOR,
    popupAnchor: POPUP_ANCHOR,
  }),
  orange: L.icon({
    iconUrl: "/marker-orange.png",
    iconSize: ICON_SIZE,
    iconAnchor: ICON_ANCHOR,
    popupAnchor: POPUP_ANCHOR,
  }),
  red: L.icon({
    iconUrl: "/marker-red.png",
    iconSize: ICON_SIZE,
    iconAnchor: ICON_ANCHOR,
    popupAnchor: POPUP_ANCHOR,
  }),
  blue: L.icon({
    iconUrl: "/marker-blue.png",
    iconSize: ICON_SIZE,
    iconAnchor: ICON_ANCHOR,
    popupAnchor: POPUP_ANCHOR,
  }),
  redLarge: L.icon({
	iconUrl: "/marker-red.png",
	iconSize: [45, 72],
	iconAnchor: [22, 72],
	popupAnchor: [0, -60],
  }),
};

function createIconWithHelpBadge(status, helpCount, buildingId) {
  console.log("ICON BUILD:", status, helpCount);
  const baseIcon = iconByStatus[status] || iconByStatus.green;

  if (!helpCount || helpCount === 0) {
    return baseIcon;
  }

  return L.divIcon({
    className: "",
    html: `
      <div style="position: relative;">
        <img src="${baseIcon.options.iconUrl}" 
             width="${baseIcon.options.iconSize[0]}" 
             height="${baseIcon.options.iconSize[1]}" />
        <div
		  onclick="event.stopPropagation(); window.location='/help?building=${buildingId}'"
		  title="${helpCount} активных запросов помощи"
		  style="
			cursor: pointer;
			position: absolute;
			top: -6px;
			right: -16px;
			background: ${helpCount >= 5 ? "#d32f2f" : helpCount >= 2 ? "#f57c00" : "#2563eb"};
			animation: ${helpCount >= 3 ? "pulse 1.2s infinite" : "none"};
			color: white;
			font-size: 10px;
			font-weight: 700;
			padding: 0 6px;
			height: 30px;
			border-radius: 15px;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 3px;
			box-shadow: 0 2px 6px rgba(0,0,0,0.3);
		  "
		>
		  🤝 ${helpCount}
		</div>
      </div>
    `,
    iconSize: baseIcon.options.iconSize,
    iconAnchor: baseIcon.options.iconAnchor,
    popupAnchor: baseIcon.options.popupAnchor,
  });
}

const highPulseIcon = L.divIcon({
  className: "",
  html: `
    <div class="high-marker-wrapper">
      <div class="high-pulse"></div>
      <img src="/marker-red.png" width="45" height="72" />
    </div>
  `,
  iconSize: [35, 56],
  iconAnchor: [17, 56],
  popupAnchor: [0, -50],
});

function getIcon(status) {
  return iconByStatus[status] || iconByStatus.green;
}

function AddMoveEvents({
  addMode,
  addTab,
  onPickLatLng,
  onStartAddRightClick,
  moveMode,
  onMovePick,
}) {
  useMapEvents({
    click(e) {
      if (moveMode) {
        onMovePick(e.latlng);
        return;
      }
      // добавление по ЛКМ не используем — только ПКМ (как ты просил)
    },
    contextmenu(e) {
      // ПКМ по карте:
      // - если идёт сдвиг метки, ПКМ не используем
      if (moveMode) return;

      // если режим добавления ещё не включён — включаем его прямо по ПКМ
      if (!addMode) {
        onStartAddRightClick(e.latlng);
        return;
      }

      // режим добавления включён -> просто обновляем координаты (ПКМ)
      if (addTab === "rightclick") {
        onPickLatLng(e.latlng);
      }
    },
  });
  return null;
}

function Heatmap({ data }) {
  const map = useMapEvents({});

  useEffect(() => {
    if (!data.length) return;

    const points = data.map((b) => [
      b.lat,
      b.lng,
      b.intensity || 1,
    ]);

    const layer = L.heatLayer(points, {
	  radius: 35,
	  blur: 30,
	  maxZoom: 17,
	  max: 10,
	  gradient: {
		0.2: "green",
		0.4: "yellow",
		0.6: "orange",
		1.0: "red",
	  },
	});

    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [data, map]);

  return null;
}


export default function MapView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState([]);
  const heatmapData = buildings
    .filter((b) => (b.high_count || 0) > 0 || (b.medium_count || 0) > 0 || (b.low_count || 0) > 0)
    .map((b) => {
      const weight =
        (b.high_count || 0) * 3 +
        (b.medium_count || 0) * 2 +
        (b.low_count || 0) * 1;

      return {
        lat: Number(b.lat),
        lng: Number(b.lng),
        intensity: weight,
      };
    });
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [problemMode, setProblemMode] = useState(false);
  const [severityFilter, setSeverityFilter] = useState(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const hasCenteredRef = useRef(false);
  const clusterRef = useRef(null);
  const [panelClosing, setPanelClosing] = useState(false);

  // режим добавления метки
  const [addMode, setAddMode] = useState(false);
  const [addTab, setAddTab] = useState("rightclick"); // rightclick | address
  const [newLatLng, setNewLatLng] = useState(null);
  const [address, setAddress] = useState("");
  const [createError, setCreateError] = useState("");

  // режим перемещения метки
  const [moveMode, setMoveMode] = useState(false);
  const [moveLatLng, setMoveLatLng] = useState(null);
  const [moveError, setMoveError] = useState("");

  const [mapCenter, setMapCenter] = useState([53.9, 27.5667]);
  const [mapZoom, setMapZoom] = useState(12);
  const loadTimerRef = useRef(null);
  const lastBboxKeyRef = useRef("");

  async function refreshBuildings() {
    const data = await getBuildings();
    setBuildings(data);
  }

  // Обновить дома + (если выбран) обновить выбранный дом и его жалобы
  async function refreshSelected(buildingId) {
    const data = await getBuildings();
    setBuildings(data);

    const id = buildingId ?? selectedBuilding?.id;
    if (!id) return;

    const updated = data.find((b) => String(b.id) === String(id));
    if (updated) setSelectedBuilding(updated);

    try {
      const list = await getReportsByBuilding(id);
      setReports(list);
    } catch {
      // список жалоб не обязателен для рендера
    }
  }

 const loadBuildingsForView = useCallback(async () => {
  if (!mapRef.current) return;

  const b = mapRef.current.getBounds();
  const south = b.getSouth();
  const west = b.getWest();
  const north = b.getNorth();
  const east = b.getEast();

  // ключ, чтобы не грузить одно и то же
  const key = `${south.toFixed(4)}:${west.toFixed(4)}:${north.toFixed(4)}:${east.toFixed(4)}:${statusFilter}:${problemMode}:${severityFilter}`;
  if (lastBboxKeyRef.current === key) return;
  lastBboxKeyRef.current = key;

  const data = await getBuildings(); // временно без bbox
  setBuildings(data);
}, [statusFilter, problemMode, severityFilter]);
	
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setMapCenter([lat, lng]);
        setMapZoom(13);

        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 13);
        }
      },
      () => {
        // если пользователь запретил — остаёмся на дефолте
      }
    );
  }, []);

  useEffect(() => {
	  if (!mapRef.current) return;
	
	  const map = mapRef.current;
	
	  const schedule = () => {
	    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
	    loadTimerRef.current = setTimeout(() => {
	      loadBuildingsForView().catch(() => {});
	    }, 300);
	  };
	
	  // первая загрузка
	  schedule();
	
	  map.on("moveend", schedule);
	  map.on("zoomend", schedule);
	
	  return () => {
	    map.off("moveend", schedule);
	    map.off("zoomend", schedule);
	    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
	  };
	}, [loadBuildingsForView]);
	
  useEffect(() => {
	  if (!mapRef.current) return;
	  if (!buildings.length) return;

	  const highBuildings = buildings.filter(
		(b) => (b.high_count || 0) > 0
	  );

	  if (!highBuildings.length) return;

	  const bounds = L.latLngBounds(
		highBuildings.map((b) => [
		  Number(b.lat),
		  Number(b.lng)
		])
	  );

	  mapRef.current.fitBounds(bounds, {
		padding: [50, 50]
		
	  });

	}, [buildings]);

  useEffect(() => {
	  if (hasCenteredRef.current) return;

	  const buildingId = searchParams.get("building");
	  if (!buildingId) return;
	  if (!buildings.length) return;

	  const found = buildings.find(
		(b) => String(b.id) === String(buildingId)
	  );

	  if (!found) return;

	  hasCenteredRef.current = true;
	  openReports(found);

	}, [searchParams, buildings]);
  
  useEffect(() => {
	  if (!selectedBuilding) return;
	  if (!mapRef.current) return;

	  const lat = Number(selectedBuilding.lat);
	  const lng = Number(selectedBuilding.lng);

	  mapRef.current.setView([lat, lng], 20, {
		animate: true,
		duration: 0.8,
	  });

	  // открываем popup после зума
	  setTimeout(() => {
		const marker = markersRef.current[selectedBuilding.id];
		if (marker) {
		  marker.openPopup();
		}
	  }, 400);

	}, [selectedBuilding]);

  useEffect(() => {
	  console.log("BUILDINGS:", buildings);
	}, [buildings]);

  
  async function openReports(building) {
    
	trackEvent("open_building", {
	  building_id: building.id,
	});
	setSelectedBuilding(building);
    try {
      const list = await getReportsByBuilding(building.id);
      setReports(list);
    } catch {
      setReports([]);
    }
  }

  function closeSidePanel() {
    setPanelClosing(true);

    setTimeout(() => {
      setSelectedBuilding(null);
      setReports([]);
      cancelMove();
      setPanelClosing(false);
    }, 250);
  }

  function startAddMode() {
    setAddMode(true);
    setAddTab("rightclick");
    setNewLatLng(null);
    setAddress("");
    setCreateError("");
  }

  function cancelAddMode() {
    setAddMode(false);
    setNewLatLng(null);
    setCreateError("");
  }

  function onPickLatLng(latlng) {
    setNewLatLng(latlng);
    // когда есть координаты — можно создавать
  }

  async function submitCreate() {
    setCreateError("");
    try {
      if (addTab === "rightclick") {
        if (!newLatLng) {
          setCreateError("Нужны координаты: кликни по карте ПКМ");
          return;
        }
		trackEvent("create_building", {
		  lat: newLatLng?.lat,
		  lng: newLatLng?.lng,
		});
        const created = await createBuilding({
          lat: newLatLng.lat,
          lng: newLatLng.lng,
          address: address || null,
          status: "green",
        });
        await refreshBuildings();
        cancelAddMode();
        setAddress("");
        if (created) await openReports(created);
        return;
      }

      // по адресу: создаём только если введён адрес. Координаты получит бэк (если умеет) или сохранит как есть.
      if (!address.trim()) {
        setCreateError("Введи адрес");
        return;
      }
      const created = await createBuilding({
        address: address.trim(),
        status: "green",
      });
      await refreshBuildings();
      cancelAddMode();
      setAddress("");
      if (created) await openReports(created);
    } catch (e) {
      setCreateError(String(e?.message || e));
    }
  }

  function startMove() {
    if (!selectedBuilding) return;
    setMoveMode(true);
    setMoveLatLng(null);
    setMoveError("");
  }

  function cancelMove() {
    setMoveMode(false);
    setMoveLatLng(null);
    setMoveError("");
  }

  async function commitMove() {
    if (!selectedBuilding) return;
    if (!moveLatLng) {
      setMoveError("Кликни по карте в новом месте, затем нажми «Зафиксировать»");
      return;
    }
    setMoveError("");
    try {
      await updateBuildingPosition(
	    selectedBuilding.id,
	    Number(moveLatLng.lat),
	    Number(moveLatLng.lng)
	  );
      await refreshBuildings();
      // обновим выбранное здание локально, чтобы панель не показывала старые координаты
      setSelectedBuilding((prev) =>
        prev ? { ...prev, lat: moveLatLng.lat, lng: moveLatLng.lng } : prev
      );
      setMoveMode(false);
      setMoveLatLng(null);
    } catch (e) {
      setMoveError(String(e?.message || e));
    }
  }

  return (
    <div className="layout">
      <div className="map-wrapper">
        <MapContainer
		  center={mapCenter}
		  zoom={mapZoom}
		  style={{ height: "100%", width: "100%" }}
		  whenCreated={(mapInstance) => {
			mapRef.current = mapInstance;
		  }}
		>
		{selectedBuilding && (
		  <div className="map-overlay" />
		)}
          <LayersControl position="topleft">

			  <LayersControl.BaseLayer checked name="Карта">
				<TileLayer
				  attribution="&copy; OpenStreetMap"
				  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
			  </LayersControl.BaseLayer>

			  
			  <LayersControl.BaseLayer name="Топография">
				<TileLayer
				  url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
				/>
			  </LayersControl.BaseLayer>

			  <LayersControl.BaseLayer name="Спутник">
				<TileLayer
				  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
				/>
			  </LayersControl.BaseLayer>

			  <LayersControl.Overlay name="Дороги (поверх)" checked>
			    <TileLayer
				  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				  opacity={0.4}
			    />
			  </LayersControl.Overlay>

			</LayersControl>

          <AddMoveEvents
            addMode={addMode}
            addTab={addTab}
            onPickLatLng={onPickLatLng}
            onStartAddRightClick={(latlng) => {
              // ПКМ без нажатия кнопки «Добавить метку»
              setAddMode(true);
              setAddTab("rightclick");
              setNewLatLng(latlng);
              setCreateError("");
            }}
            moveMode={moveMode}
            onMovePick={(latlng) => {
			  setMoveLatLng({
				lat: latlng.lat,
				lng: latlng.lng,
			  });
			}}
          />

		  <Heatmap data={heatmapData} />
          <MarkerClusterGroup
			  chunkedLoading
			  maxClusterRadius={30}
			  ref={(cluster) => {
				if (cluster) clusterRef.current = cluster;
			  }}
			>
			  {buildings
				.filter((b) => {
				  const statusMatch = statusFilter === "all" || b.status === statusFilter;

				  const severityMatch =
					!severityFilter ||
					(severityFilter === "high" && (b.high_count || 0) > 0) ||
					(severityFilter === "medium" && (b.medium_count || 0) > 0) ||
					(severityFilter === "low" && (b.low_count || 0) > 0);

				  const problemMatch =
					!problemMode ||
					(b.high_count || 0) > 0 ||
					(b.medium_count || 0) > 0 ||
					(b.low_count || 0) > 0;

				  return statusMatch && severityMatch && problemMatch;
				})
				.map((b) => (
				  <Marker
					  key={b.id}
					  position={[Number(b.lat), Number(b.lng)]}
					  icon={
						  createIconWithHelpBadge(
							selectedBuilding && selectedBuilding.id === b.id
							  ? "blue"
							  : b.status || "green",
							b.help_count,
							b.id
						  )
						}
						zIndexOffset={(b.high_count || 0) > 0 ? 1000 : 0}
						opacity={
							selectedBuilding && selectedBuilding.id !== b.id
							  ? 0.7
							  : 1
						  }
					  ref={(marker) => {
						if (marker) {
						  markersRef.current[b.id] = marker;
						}
					  }}
					  eventHandlers={{
					    click: () => openReports(b),
					  }}
					>
					<Popup>
					  <div style={{ minWidth: 240 }}>
						<div style={{ fontWeight: 700 }}>
						  {b.address || `Дом #${b.id}`}
						</div>
						<div>Статус: {b.status || "green"}</div>
					  </div>
					</Popup>
				  </Marker>
				))}
			</MarkerClusterGroup>


          
           {moveMode && moveLatLng && (
		    <Marker
			  position={[moveLatLng.lat, moveLatLng.lng]}
			  icon={getIcon("black")}
		    />
		  )}
        </MapContainer>
		
		<div
		  style={{
			position: "absolute",
			bottom: 20,
			left: 20,
			background: "rgba(255,255,255,0.95)",
			padding: "10px 14px",
			borderRadius: 12,
			boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
			fontSize: 13,
			lineHeight: 1.6,
			zIndex: 1000
		  }}
		>
		  <div><strong>Обозначения:</strong></div>
		  <div>🤝 — запросы помощи</div>
		  <div>🔴 — высокий риск</div>
		  <div>🟠 — средний риск</div>
		  <div>🟡 — низкий риск</div>
		  <div>🟢 — норма</div>
		</div>

        {/* кнопка + режим добавления */}
        <div
		  style={{
			position: "absolute",
			top: 10,
			right: 10,
			zIndex: 1000,
			background: "white",
			padding: 8,
			border: "1px solid #ccc",
		  }}
		>
		  <div style={{ fontSize: 13, marginBottom: 4 }}>Фильтр статуса:</div>

		  <select
			value={statusFilter}
			onChange={(e) => {
			  setStatusFilter(e.target.value);
			  trackEvent("filter_status", {
				status: e.target.value,
			  });
			}}
			style={{ padding: 6 }}
		  >
			<option value="all">Все</option>
			<option value="green">Норма</option>
			<option value="yellow">Есть жалобы</option>
			<option value="orange">Проблемно</option>
			<option value="red">Критично</option>
		  </select>
		  <div style={{ marginTop: 8 }}>
			  <button
				onClick={() => setProblemMode(prev => !prev)}
				style={{
				  padding: "6px 10px",
				  background: problemMode ? "#d32f2f" : "#eee",
				  color: problemMode ? "white" : "black",
				  border: "none",
				  cursor: "pointer",
				  fontWeight: 600
				}}
			  >
				{problemMode ? "Показать все дома" : "Только проблемные"}
			  </button>
			</div>
		</div>

		{!addMode ? (
          <button
		    onClick={startAddMode}
		    className="add-marker-btn"
		  >
            Добавить метку
          </button>
        ) : (
          <div className="status-filter">
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Режим добавления метки</div>
            <div style={{ fontSize: 13, lineHeight: 1.4 }}>
              Правый клик по карте (ПКМ) — запомнит координаты. Потом внизу нажми «Создать».
              <br />
              По адресу — выбери вкладку «По адресу».
            </div>
            <button style={{ marginTop: 8 }} onClick={cancelAddMode}>
              Отменить
            </button>
          </div>
        )}

        {/* модалка добавления метки */}
        {addMode && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.25)",
              zIndex: 1200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onContextMenu={(e) => {
              // важно: чтобы браузерное меню не мешало ПКМ
              e.preventDefault();
            }}
          >
            <div
              style={{
                background: "white",
                width: 900,
                maxWidth: "90vw",
                padding: 20,
                borderRadius: 8,
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={cancelAddMode}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 30,
                  height: 30,
                }}
              >
                ×
              </button>

              <h2 style={{ marginTop: 0 }}>Добавить метку</h2>

              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <button
                  onClick={() => setAddTab("rightclick")}
                  style={{
                    padding: "8px 12px",
                    border:
                      addTab === "rightclick" ? "2px solid #333" : "1px solid #ccc",
                  }}
                >
                  По правому клику
                </button>
                <button
                  onClick={() => setAddTab("address")}
                  style={{
                    padding: "8px 12px",
                    border: addTab === "address" ? "2px solid #333" : "1px solid #ccc",
                  }}
                >
                  По адресу
                </button>
              </div>

              <div style={{ marginBottom: 10 }}>
                Координаты (правый клик по карте):{" "}
                <b>
                  {newLatLng
                    ? `${newLatLng.lat.toFixed(6)}, ${newLatLng.lng.toFixed(6)}`
                    : "—"}
                </b>
              </div>

              <div style={{ fontWeight: 700, marginBottom: 6 }}>Адрес (улица, дом)</div>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Например: Минск, улица Пушкина 10"
                style={{ width: "100%", padding: 10, border: "1px solid #ccc" }}
              />

              {createError ? (
                <div style={{ color: "crimson", marginTop: 10 }}>{createError}</div>
              ) : (
                addTab === "rightclick" &&
                !newLatLng && (
                  <div style={{ color: "crimson", marginTop: 10 }}>
                    Нужны координаты: кликни по карте ПКМ
                  </div>
                )
              )}

              <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={cancelAddMode}>Отмена</button>
                <button onClick={submitCreate}>Создать</button>
              </div>

              <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
                * Можно оставить и правый клик, и добавление по адресу. По адресу метка появится после подтверждения — и
                сразу откроются жалобы.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SidePanel справа */}
      {selectedBuilding && (
        <div className={`panel-wrapper ${panelClosing ? "closing" : ""}`}>
		  <SidePanel
		    building={selectedBuilding}
		    reports={reports}
		    onClose={closeSidePanel}
		    onReportAdded={async () => {
			  await refreshSelected(selectedBuilding.id);
		    }}
			onSeverityFilter={(sev) =>
			  setSeverityFilter((prev) => (prev === sev ? null : sev))
			}
		    moveMode={moveMode}
		    moveLatLng={moveLatLng}
		    moveError={moveError}
		    onStartMove={startMove}
		    onCancelMove={cancelMove}
		    onCommitMove={commitMove}
		  />
	    </div>
	  )}
    </div>
  );
}

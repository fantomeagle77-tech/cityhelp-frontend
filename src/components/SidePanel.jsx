import { useMemo, useState } from "react";
import { createReport, confirmPositive } from "../api";
import { trackEvent } from "../utils/analytics";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function SidePanel({
  building,
  reports,
  onClose,

  // сообщаем MapView, чтобы он обновил список жалоб и статус
  onReportAdded,
   onSeverityFilter,   // ← ВОТ ЭТОГО НЕ ХВАТАЛО

  // перенос метки (опционально, но MapView передаёт)
  moveMode = false,
  moveLatLng = null,
  moveError = "",
  onStartMove,
  onCancelMove,
  onCommitMove,
}) {
  const [category, setCategory] = useState("yard");
  const [severity, setSeverity] = useState("medium");
  const [periodicity, setPeriodicity] = useState("often");
  const [text, setText] = useState("");
  const [submitErr, setSubmitErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [positiveLocked, setPositiveLocked] = useState(false);
  const [reportsHeight, setReportsHeight] = useState(300);
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [zoomed, setZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);
  const draggingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 });
  const navigate = useNavigate();

  const [confirmed, setConfirmed] = useState([]);
  const [tab, setTab] = useState("active");
  const statusColors = {
    open: "#ff9800",
    resolved: "#4caf50",
    outdated: "#9e9e9e"
  };
  
  const handleMouseDown = (e) => {
    if (!zoomed) return;
    draggingRef.current = true;
    startRef.current = {
      x: e.clientX - posRef.current.x,
      y: e.clientY - posRef.current.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!draggingRef.current || !zoomed) return;

    posRef.current = {
      x: e.clientX - startRef.current.x,
      y: e.clientY - startRef.current.y,
    };

    if (imgRef.current) {
      imgRef.current.style.transform =
        `scale(1.8) translate(${posRef.current.x}px, ${posRef.current.y}px)`;
    }
  };

  const handleMouseUp = () => {
    draggingRef.current = false;
  };
  
  const CATEGORY_MAP = {
    "Двор": "yard",
    "Соседи": "neighbors",
    "Шум": "noise",
  };

  const SEVERITY_MAP = {
    "Низкая": "low",
    "Средняя": "medium",
    "Высокая": "high",
  };

  const PERIODICITY_MAP = {
    "Редко": "rare",
    "Часто": "often",
    "Постоянно": "always",
  };

  const CATEGORY_LABEL = {
    yard: "Двор",
    road: "Дорога",
    trashinyard: "Мусор во дворе",
    utiltrash: "Вывоз мусора",
    noise: "Шум",
    JKH: "ЖКХ",
    water: "Вода",
    heating: "Отопление",
    electricity: "Электричество",
    gas: "Газ",
    parking: "Парковка",
    other: "Другое",
  };

  const SEVERITY_LABEL = {
    low: "Низкая",
    medium: "Средняя",
    high: "Высокая",
  };

  const PERIODICITY_LABEL = {
    rare: "Редко",
    often: "Часто",
    always: "Постоянно",
  };

  const title = useMemo(() => building?.address || `Дом #${building?.id}`, [building]);

  const stats = useMemo(() => {
    const high = reports?.filter(r => r.severity === "high").length || 0;
    const medium = reports?.filter(r => r.severity === "medium").length || 0;
    const low = reports?.filter(r => r.severity === "low").length || 0;

    return { high, medium, low };
  }, [reports]);

  async function submit() {
    if (!building) return;
    setSubmitting(true);
    setSubmitErr("");
    try {
      await createReport({
		  building_id: building.id,
		  category,
		  severity,
		  periodicity,
		  text,
		  image,
		});
	  trackEvent("create_report", {
	    building_id: building.id,
	    severity: severity,
	    category: category,
	  });
      setText("");
      if (typeof onReportAdded === "function") {
        await onReportAdded(building.id);
      }
    } catch (e) {
	  // если backend вернул detail
	  const backendMessage =
		e?.data?.detail ||
		e?.response?.data?.detail ||
		"Не удалось отправить жалобу";

	  setSubmitErr(backendMessage);

	  // если это лимит 24 часа — покажем alert
	  if (backendMessage.includes("24")) {
		alert("Вы уже оставляли жалобу за последние 24 часа для этого дома. Через 24 часа, можете оставить новую жалобу!");
	  }
    } finally {
      setSubmitting(false);
	  setImage(null);
    }
  }

  return (
	<>
	  <div
		className="side-panel"
	  
	>
      <button
		  onClick={onClose}
		  style={{
			position: "absolute",
			right: 22,
			top: 12,
			background: "#f3f2f1",
			width: 32,
			height: 32,
			border: "2px solid #ccc",
			cursor: "pointer",
			borderRadius: 6
		  }}
		>
        ×
      </button>

      <div
		  className="panel-top"
		  style={{
			overflowY: "auto",
			height: `calc(100% - ${reportsHeight}px - 60px)`
		  }}
		>
		
	  <h1 className="panel-title">{title}</h1>
	  <button
	    onClick={() => navigate(`/help?building=${building.id}`)}
	    style={{
		  marginBottom: 12,
		  padding: "8px 14px",
		  background: "#2563eb",
		  color: "white",
		  border: "none",
		  borderRadius: 8,
		  cursor: "pointer",
		  fontWeight: 600
	    }}
	  >
	    🤝 Соседская помощь
	  </button>
      <div
		  style={{
			marginBottom: 16,
			display: "flex",
			justifyContent: "space-between",
			alignItems: "center",
			paddingRight: 50   // ← ВОТ ЭТО ДОБАВЬ
		  }}
		>

		  {/* Слева — количество жалоб */}
		  <div style={{ fontSize: 15, color: "#555" }}>
			Всего жалоб: <b>{reports?.length || 0}</b>
		  </div>

		  <div className="house-stats">
		    <div
			  className="stat high"
			  onClick={() => onSeverityFilter("high")}
			  style={{ cursor: "pointer" }}
			>
			  Высоких: {stats.high}
			</div>

			<div
			  className="stat medium"
			  onClick={() => onSeverityFilter("medium")}
			  style={{ cursor: "pointer" }}
			>
			  Средних: {stats.medium}
			</div>

			<div
			  className="stat low"
			  onClick={() => onSeverityFilter("low")}
			  style={{ cursor: "pointer" }}
			>
			  Низких: {stats.low}
			</div>
		  </div>

		  {/* Справа — статус */}
		  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

			

			<div className="status-badge">
			  <span
				className={`status-dot-large status-${building?.status}`}
			  />
			  <span className="status-text">
				{building?.status === "red" && "Критично"}
				{building?.status === "orange" && "Проблемно"}
				{building?.status === "yellow" && "Есть жалобы"}
				{building?.status === "green" && "Норма"}
			  </span>
			</div>
		
		  </div>
		
		</div>



      {/* Перенос метки */}
      {typeof onStartMove === "function" && !moveMode && (
		  <>
			{reports?.length === 0 ? (
			  <button
				onClick={onStartMove}
				style={{ padding: "8px 12px", marginBottom: 12 }}
			  >
				Сдвинуть метку
			  </button>
			) : (
			  <div
				style={{
				  marginBottom: 12,
				  padding: 8,
				  background: "#fff3e0",
				  borderRadius: 6,
				  fontSize: 14,
				  color: "#e65100"
				}}
			  >
				Перенос отключён — у дома уже есть жалобы
			  </div>
			)}
		  </>
		)}
      {moveMode && (
        <div style={{ marginBottom: 12, padding: 10, border: "1px solid #ccc" }}>
          <div style={{ marginBottom: 8 }}>
            Режим сдвига: кликни по карте в новом месте.
            {moveLatLng ? (
              <div style={{ marginTop: 6, fontSize: 14 }}>
                Новые координаты: <b>{moveLatLng.lat.toFixed(6)}, {moveLatLng.lng.toFixed(6)}</b>
              </div>
            ) : null}
          </div>
          {moveError ? <div style={{ color: "crimson", marginBottom: 8 }}>{moveError}</div> : null}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onCommitMove} style={{ padding: "8px 12px" }}>
              Зафиксировать
            </button>
            <button onClick={onCancelMove} style={{ padding: "8px 12px" }}>
              Отмена
            </button>
          </div>
        </div>
      )}
	  {/* 👍 Подтверждение нормы */}
		<div
		  style={{
			marginBottom: 16,
			padding: 12,
			background: "#f4f8f4",
			borderRadius: 10,
			border: "1px solid #e0f2e0"
		  }}
		>
		  <div style={{ fontSize: 14, marginBottom: 6 }}>
			👍 Подтвердили норму: <b>{building?.positive_count || 0}</b>
		  </div>

		  <button
			disabled={positiveLocked}
			onClick={async () => {
			   try {
					await confirmPositive(building.id);
					await onReportAdded(building.id);
					setPositiveLocked(true);
				  } catch (e) {
					alert("Вы уже подтверждали норму за последние 24 часа");
					setPositiveLocked(true);
				  }
			}}
			style={{
			  padding: "6px 12px",
			  background: "#4caf50",
			  color: "white",
			  border: "none",
			  borderRadius: 6,
			  cursor: "pointer"
			}}
		  >
			👍 Дом в порядке
		  </button>
		</div>

      <hr />

      <h2 style={{ marginTop: 0 }}>Добавить жалобу</h2>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Категория</div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", padding: 8 }}>
          <option value="yard">Двор</option>
          <option value="road">Дорога</option>
          <option value="trashinyard">Мусор во дворе</option>
		  <option value="utiltrash">Вывоз мусора</option>
          <option value="noise">Шум</option>
		  <option value="JKH">ЖКХ</option>
		  <option value="water">Вода</option>
		  <option value="heating">Отопление</option>
		  <option value="electricity">Электричество</option>
		  <option value="gas">Газ</option>
		  <option value="parking">Парковка</option>
		  <option value="other">Другое</option>

        </select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Серьёзность</div>
        <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={{ width: "100%", padding: 8 }}>
          <option value="low">Низкая</option>
          <option value="medium">Средняя</option>
          <option value="high">Высокая</option>
        </select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Периодичность</div>
        <select value={periodicity} onChange={(e) => setPeriodicity(e.target.value)} style={{ width: "100%", padding: 8 }}>
          <option value="rare">Редко</option>
          <option value="often">Часто</option>
          <option value="always">Постоянно</option>
        </select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Текст жалобы</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Например: яма у подъезда, не вывозят мусор..."
          style={{ width: "100%", padding: 8, border: "1px solid #ccc" }}
        />
		<div style={{ marginBottom: 10 }}>
		  <div style={{ fontWeight: 700, marginBottom: 6 }}>Фото (необязательно)</div>
		  <input
			type="file"
			accept="image/*"
			onChange={(e) => {
			  if (e.target.files && e.target.files[0]) {
				const file = e.target.files[0];
				setImage(file);
				setPreviewUrl(URL.createObjectURL(file));
			  }
			}}
		  />
		  {previewUrl && (
		    <div style={{ marginTop: 10 }}>
			  <img
			    src={previewUrl}
			    alt="preview"
			    style={{
				  width: "100%",
				  maxHeight: 250,
				  objectFit: "cover",
				  borderRadius: 8,
			    }}
			  />
			  <button
			    style={{
				  marginTop: 6,
				  background: "#eee",
				  border: "1px solid #ccc",
				  padding: "4px 8px",
				  cursor: "pointer",
			    }}
			    onClick={() => {
				  setImage(null);
				  setPreviewUrl(null);
			    }}
			  >
			    Удалить фото
			  </button>
		    </div>
		  )}
			
		</div>
      </div>

      {submitErr ? <div style={{ color: "crimson", marginBottom: 10 }}>{submitErr}</div> : null}

      <button
        onClick={submit}
        disabled={submitting || !text.trim()}
        style={{ width: "100%", padding: "10px 12px" }}
      >
        Добавить жалобу
      </button>

      </div>
	        <div
				style={{
				  height: 8,
				  background: "#e0e0e0",
				  cursor: "row-resize"
				}}
				onMouseDown={(e) => {
				  const startY = e.clientY;
				  const startHeight = reportsHeight;

				  const onMouseMove = (moveEvent) => {
					const diff = moveEvent.clientY - startY;
					const newHeight = startHeight - diff;

					if (newHeight > 150 && newHeight < 800) {
					  setReportsHeight(newHeight);
					}
				  };

				  const onMouseUp = () => {
					window.removeEventListener("mousemove", onMouseMove);
					window.removeEventListener("mouseup", onMouseUp);
				  };

				  window.addEventListener("mousemove", onMouseMove);
				  window.addEventListener("mouseup", onMouseUp);
				}}
			  />

	  <h2 className="section-title">Жалобы</h2>
	
	  <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
		  <button
			onClick={() => setTab("active")}
			style={{
			  background: tab === "active" ? "#1976d2" : "#eee",
			  color: tab === "active" ? "white" : "black",
			  padding: "6px 12px",
			  border: "none",
			  cursor: "pointer"
			}}
		  >
			Активные
		  </button>

		  <button
			onClick={() => setTab("history")}
			style={{
			  background: tab === "history" ? "#1976d2" : "#eee",
			  color: tab === "history" ? "white" : "black",
			  padding: "6px 12px",
			  border: "none",
			  cursor: "pointer"
			}}
		  >
			История
		  </button>
		</div>

	  {reports?.filter(r =>
		  tab === "active"
			? r.status === "open"
			: r.status !== "open"
		).length ? (
		  <div
			  className="reports-list panel-bottom"
			  style={{
				height: reportsHeight,
				overflowY: "auto"
			  }}
			>
			{reports
			  .filter(r =>
				tab === "active"
				  ? r.status === "open"
				  : r.status !== "open"
			  )
			  .map((r) => (
				<div
				  key={r.id}
				  className="report-card"
				  style={{
					background: "white",
					borderRadius: 12,
					padding: 16,
					marginBottom: 16,
					boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
					border: "1px solid #f0f0f0"
				  }}
				>

				  <div className="report-title">
					{CATEGORY_LABEL[r.category] || r.category}
					{" — "}
					{SEVERITY_LABEL[r.severity] || r.severity}
				  </div>

				  <div
					style={{
					  display: "inline-block",
					  padding: "4px 10px",
					  borderRadius: 12,
					  background:
						r.status === "open"
						  ? "#ff9800"
						  : r.status === "resolved"
						  ? "#4caf50"
						  : "#9e9e9e",
					  color: "white",
					  fontSize: 12,
					  fontWeight: 600,
					  marginBottom: 6
					}}
				  >
					{r.status === "open"
					  ? `Открыта (${r.problem_confirmations} из 3)`
					  : r.status === "resolved"
					  ? "Решена"
					  : "Устарела"}
				  </div>

				  
				  <div
					  style={{
						maxHeight: r.status === "open" ? 500 : 0,
						opacity: r.status === "open" ? 1 : 0,
						overflow: "hidden",
						transition: "max-height 0.3s ease, opacity 0.2s ease"
					  }}
					>
					  {r.status === "open" && (
						<div style={{ marginTop: 8 }}>

						  {/* Прогресс проблемы */}
						  <div style={{ fontSize: 13, marginBottom: 4 }}>
							Подтверждения проблемы: {r.problem_confirmations}/3
						  </div>

						  <div
							style={{
							  height: 6,
							  background: "#eee",
							  borderRadius: 6,
							  overflow: "hidden",
							  marginBottom: 8
							}}
						  >
							<div
							  style={{
								height: "100%",
								width: `${(r.problem_confirmations / 3) * 100}%`,
								background: "#ff9800",
								transition: "width 0.3s ease"
							  }}
							/>
						  </div>

						  <button
							  disabled={r.problem_confirmations >= 3}
							  onClick={async () => {
								await fetch(
								  `http://127.0.0.1:8000/reports/${r.id}/confirm-problem`,
								  { method: "POST" }
								);
								await onReportAdded(building.id);
							  }}
							  style={{
								marginBottom: 12,
								opacity: r.problem_confirmations >= 3 ? 0.5 : 1,
								cursor: r.problem_confirmations >= 3 ? "not-allowed" : "pointer"
							  }}
							>
							  Подтвердить проблему
							</button>

						  {/* Прогресс решения */}
						  <div style={{ fontSize: 13, marginBottom: 4 }}>
							Подтверждение решения проблемы: {r.resolved_confirmations}/3
						  </div>

						  <div
							style={{
							  height: 6,
							  background: "#eee",
							  borderRadius: 6,
							  overflow: "hidden",
							  marginBottom: 8
							}}
						  >
							<div
							  style={{
								height: "100%",
								width: `${(r.resolved_confirmations / 3) * 100}%`,
								background: "#4caf50",
								transition: "width 0.3s ease"
							  }}
							/>
						  </div>

						  <button
							  disabled={r.resolved_confirmations >= 3}
							  onClick={async () => {
								await fetch(
								  `http://127.0.0.1:8000/reports/${r.id}/confirm-resolved`,
								  { method: "POST" }
								);
								await onReportAdded(building.id);
							  }}
							  style={{
								opacity: r.resolved_confirmations >= 3 ? 0.5 : 1,
								cursor: r.resolved_confirmations >= 3 ? "not-allowed" : "pointer"
							  }}
							>
							  Проблема решена
							</button>

						</div>
					  )}
					</div>


				  <div style={{ marginTop: 8, fontSize: 14, color: "#444" }}>
					{r.text}
					{r.image_path && (
					  <div style={{ marginTop: 8 }}>
						<img
						  src={`http://127.0.0.1:8000${r.image_path}`}
						  alt="report"
						  style={{
							width: "100%",
							maxHeight: 300,
							objectFit: "cover",
							borderRadius: 8,
							cursor: "pointer",
						  }}
						  onClick={() =>
							setLightboxImage(`http://127.0.0.1:8000${r.image_path}`)
						  }
						/>
					  </div>
					)}
				  </div>

				  <div className="report-date">
					{new Date(r.created_at).toLocaleDateString("ru-RU")}
				  </div>

				  <div className="report-periodicity">
					{PERIODICITY_LABEL[r.periodicity] || r.periodicity}
				  </div>

				</div>
			  ))}
		  </div>
		) : (
		  <div style={{ color: "#666" }}>Жалоб пока нет.</div>
		)}
	  </div>

	  {lightboxImage && (
	    <div
		  onClick={() => {
		    setLightboxImage(null);
		    setZoomed(false);
		  }}
		  style={{
		    position: "fixed",
		    inset: 0,
		    background: "rgba(0,0,0,0.9)",
		    zIndex: 9999,
		    overflow: "hidden",   // ВАЖНО
		  }}
	    >
		  <img
		    src={lightboxImage}
		    alt="full"
		    onClick={(e) => {
			  e.stopPropagation();
			  setZoomed(!zoomed);
			  setPosition({ x: 0, y: 0 });
		    }}
		    onMouseDown={(e) => {
			  if (!zoomed) return;
			  setDragging(true);
			  setStart({
			    x: e.clientX - position.x,
			    y: e.clientY - position.y,
			  });
		    }}
		    onMouseMove={(e) => {
			  if (!dragging || !zoomed) return;
			  setPosition({
			    x: e.clientX - start.x,
			    y: e.clientY - start.y,
			  });
		    }}
		    onMouseUp={() => setDragging(false)}
		    onMouseLeave={() => setDragging(false)}
		    style={{
			  display: "block",
			  margin: "0 auto",
			  borderRadius: 12,
			  cursor: zoomed
			    ? dragging
				  ? "grabbing"
				  : "grab"
			    : "zoom-in",
			  transform: `scale(${zoomed ? 1.8 : 1}) translate(${position.x}px, ${position.y}px)`,
			  transformOrigin: "center center",
			  transition: dragging ? "none" : "transform 0.3s ease",
		    }}
		  />
	    </div>
	  )}

	  </>
	  );
	}

import { useEffect, useState } from "react";
import { getBuildings, getHelp, createHelp, getHelpResponses, respondToHelp } from "../api";
import { useSearchParams } from "react-router-dom";
import Seo from "../components/Seo";

export default function HelpPage() {
  const [items, setItems] = useState([]);

  const [buildings, setBuildings] = useState([]);
  const [responses, setResponses] = useState({});
  const [revealed, setRevealed] = useState({});
  const [searchParams] = useSearchParams();
  const buildingId = searchParams.get("building");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortMode, setSortMode] = useState("newest");
  const [noResponsesOnly, setNoResponsesOnly] = useState(false);
  const [buildingSearch, setBuildingSearch] = useState("");
  const [filteredBuildings, setFilteredBuildings] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [form, setForm] = useState({
    building_id: "",
    category: "repair",
    title: "",
    description: "",
    contact: "",
  });

  async function load() {
	const data = await getHelp(null);
    setItems(data);

    const newResponses = {};

    for (let item of data) {
      const res = await getHelpResponses(item.id);
      newResponses[item.id] = res.count;
    }

    setResponses(newResponses);
  }

  useEffect(() => {
    getBuildings().then(setBuildings);
  }, []);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!buildingSearch.trim()) {
        setFilteredBuildings([]);
        return;
      }

      const results = buildings
        .filter(b =>
          (b.address || `Дом #${b.id}`)
            .toLowerCase()
            .includes(buildingSearch.toLowerCase())
        )
        .slice(0, 20);

      setFilteredBuildings(results);
    }, 300);

    return () => clearTimeout(timeout);
  }, [buildingSearch, buildings]);
  
  useEffect(() => {
    if (!buildings.length) return;

    const buildingFromUrl = searchParams.get("building");
    if (!buildingFromUrl) return;

    const found = buildings.find(
      b => String(b.id) === String(buildingFromUrl)
    );

    if (found) {
      setForm(prev => ({
        ...prev,
        building_id: String(found.id),
      }));

      // ВАЖНО — сразу ставим текст в поле
      setBuildingSearch(found.address || `Дом #${found.id}`);
      setShowDropdown(false);
    }
  }, [buildings, searchParams]);
  
  useEffect(() => {
    load();
  }, []);

function getUserHash() {
  let hash = localStorage.getItem("user_hash");
  if (!hash) {
    hash = crypto.randomUUID();
    localStorage.setItem("user_hash", hash);
  }
  return hash;
}

function formatTimeAgo(dateString) {
  if (!dateString) return "";

  // приводим к локальному времени
  const created = new Date(dateString + "Z");
  const now = new Date();

  const diff = Math.floor((now.getTime() - created.getTime()) / 1000);

  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} дн назад`;
}

function isHot(item, responseCount) {
  if (!item.created_at) return false;

  // принудительно говорим что это UTC
  const created = new Date(item.created_at + "Z");
  const diffHours = (Date.now() - created.getTime()) / 1000 / 3600;

  console.log("HOT CHECK:", diffHours);

  return diffHours < 2;
}

  async function submit() {
	  if (!form.building_id || !form.title || !form.description || !form.contact) {
		alert("Укажите контакт для связи");
		return;
	  }

	  try {
		await createHelp({
		  building_id: Number(form.building_id),
		  category: form.category,
		  title: form.title,
		  description: form.description,
		  contact: form.contact,
		});

		setForm({
		  building_id: "",
		  category: "repair",
		  title: "",
		  description: "",
		  contact: "",
		});

		load();

	  } catch (err) {
		alert(
		  err.response?.data?.detail ||
		  "Ошибка создания заявки"
		);
	  }
	}
  
  const filteredByBuilding = buildingId
    ? items.filter(i => String(i.building_id) === String(buildingId))
    : items;

  const totalCount = filteredByBuilding.length;

  const noResponseCount = filteredByBuilding.filter(
    item => (responses[item.id] || 0) === 0
  ).length;

  const todayCount = filteredByBuilding.filter(item => {
    if (!item.created_at) return false;
    const created = new Date(item.created_at + "Z");
    const now = new Date();
    return created.toDateString() === now.toDateString();
  }).length;
  
  async function closeHelpLocal(id) {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: "closed" } : item
      )
    );
  }

  return (
	  <>
	    <Seo
	      title="Соседская помощь CityHelp — запросы рядом с домом"
	      description="Раздел соседской помощи CityHelp: создавайте запросы по дому и откликайтесь на просьбы соседей."
	      canonical="https://cityhelp.app/help"
	    />
	
	    <div
	      className="help-container"
	      style={{
	        padding: "60px 40px",
	        maxWidth: 1200,
	        margin: "0 auto"
	      }}
	    >
		<div style={{ marginBottom: 40 }}>
		  <h1
			style={{
			  fontSize: 34,
			  marginBottom: 10,
			  fontWeight: 700
			}}
		  >
			🤝 Соседская помощь рядом с вами
		  </h1>

		  <div
			style={{
			  fontSize: 16,
			  color: "#555",
			  maxWidth: 600,
			  lineHeight: 1.5
			}}
		  >
			Соседи помогают соседям. Найдите поддержку рядом с домом или откликнитесь на чей-то запрос.
		  </div>
		</div>

		<div style={{ 
		  color: "#666", 
		  marginBottom: 30,
		  fontSize: 16 
		}}>
		  Помогайте соседям и находите помощь рядом с домом.
		</div>

		{/* GRID */}
		<div
		  style={{
			display: "grid",
			gridTemplateColumns: "420px 1fr",
			gap: 50,
			alignItems: "start"
		  }}
		>

		  {/* ЛЕВАЯ КОЛОНКА */}
		  <div>

			{/* ФОРМА */}
			<div className="help-card help-form"
			  style={{
				padding: 24,
				borderRadius: 18,
				background: "#ffffff",
				boxShadow: "0 22px 30px rgba(0,0,0,0.15)"
			  }}>
			  <h2 style={{ marginTop: 0 }}>Создать запрос</h2>

			  <div style={{ marginBottom: 10, position: "relative" }}>
				<input
				  placeholder="Начните вводить адрес дома..."
				  value={
					form.building_id
					  ? buildings.find(b => String(b.id) === String(form.building_id))?.address
					  : buildingSearch
				  }
				  onChange={(e) => {
					setForm({ ...form, building_id: "" });
					setBuildingSearch(e.target.value);
					setShowDropdown(true);
				  }}
				  onFocus={() => setShowDropdown(true)}
				  style={{ width: "100%", padding: 8 }}
				/>

				{showDropdown && filteredBuildings.length > 0 && (
				  <div
					style={{
					  position: "absolute",
					  top: "100%",
					  left: 0,
					  right: 0,
					  background: "white",
					  border: "1px solid #ddd",
					  maxHeight: 250,
					  overflowY: "auto",
					  zIndex: 1000,
					}}
				  >
					{filteredBuildings.map((b) => (
					  <div
						key={b.id}
						onClick={() => {
						  setForm({ ...form, building_id: String(b.id) });
						  setBuildingSearch("");
						  setShowDropdown(false);
						}}
						style={{
						  padding: 8,
						  cursor: "pointer",
						  borderBottom: "1px solid #eee"
						}}
					  >
						{b.address || `Дом #${b.id}`}
					  </div>
					))}
				  </div>
				)}
			  </div>

			  <div style={{ marginBottom: 10 }}>
				<div style={{ fontWeight: 700, marginBottom: 6 }}>Категория</div>
				<select
				  value={form.category}
				  onChange={(e) =>
					setForm({ ...form, category: e.target.value })
				  }
				  style={{ width: "100%", padding: 8 }}
				>
				  <option value="repair">🛠 Ремонт</option>
				  <option value="move">🚚 Переезд</option>
				  <option value="buy">🛒 Купить / привезти</option>
				  <option value="elder">🧓 Помощь пожилым</option>
				  <option value="household">🧼 Бытовая помощь</option>
				  <option value="other">📦 Разное</option>
				</select>
			  </div>

			  <input
				placeholder="Заголовок"
				value={form.title}
				onChange={(e) =>
				  setForm({ ...form, title: e.target.value })
				}
				style={{ width: "100%", marginBottom: 10, padding: 8 }}
			  />

			  <textarea
				placeholder="Описание"
				value={form.description}
				onChange={(e) =>
				  setForm({ ...form, description: e.target.value })
				}
				style={{ width: "100%", marginBottom: 10, padding: 8 }}
			  />

			  <input
				placeholder="Контакт (телефон / telegram)"
				value={form.contact}
				onChange={(e) =>
				  setForm({ ...form, contact: e.target.value })
				}
				style={{ width: "100%", marginBottom: 10, padding: 8 }}
			  />

			  <button
				  onClick={submit}
				  style={{
					background: "#3b82f6",
					color: "white",
					padding: "12px 18px",
					borderRadius: 12,
					border: "none",
					fontWeight: 600,
					cursor: "pointer",
					boxShadow: "0 6px 15px rgba(59,130,246,0.3)"
				  }}
				>
				  Создать заявку
				</button>
			</div>

		  </div>

		  {/* ПРАВАЯ КОЛОНКА */}
		  <div>

			<div style={{ marginBottom: 20, display: "flex", gap: 10 }}>

			  <select
				value={sortMode}
				onChange={(e) => setSortMode(e.target.value)}
			  >
				<option value="newest">Сначала новые</option>
				<option value="noResponses">Без откликов</option>
				<option value="hot">Горячие</option>
			  </select>

			  <select
				value={categoryFilter}
				onChange={(e) => setCategoryFilter(e.target.value)}
			  >
				<option value="all">Все категории</option>
				<option value="repair">🛠 Ремонт</option>
				<option value="move">🚚 Переезд</option>
				<option value="buy">🛒 Купить / привезти</option>
				<option value="elder">🧓 Помощь пожилым</option>
				<option value="household">🧼 Бытовая помощь</option>
				<option value="other">📦 Разное</option>
			  </select>

			</div>

			<div style={{ marginBottom: 10 }}>
			  <label style={{ fontSize: 14 }}>
				<input
				  type="checkbox"
				  checked={noResponsesOnly}
				  onChange={(e) => setNoResponsesOnly(e.target.checked)}
				  style={{ marginRight: 6 }}
				/>
				Только без откликов
			  </label>
			</div>

			<div
			  className="help-card"
			  style={{
				padding: 24,
				borderRadius: 18,
				background: "#ffffff",
				boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
				maxHeight: "75vh",
				overflowY: "auto"
			  }}
			>
			  <h2 style={{
				  fontSize: 26,
				  marginBottom: 8
				}}>
				  🔎 Активные запросы ({totalCount})
				</h2>

				<div style={{
				  fontSize: 14,
				  color: "#666",
				  marginBottom: 20
				}}>
				  {totalCount} всего • {noResponseCount} без откликов • {todayCount} сегодня
				</div>

			  {items.length === 0 && (
			    <div>Пока нет запросов</div>
			  )}

			  {items
			  .filter(item => {
			    const buildingMatch =
				  !buildingId || String(item.building_id) === String(buildingId);

			    const categoryMatch =
				  categoryFilter === "all" || item.category === categoryFilter;

			    const responseMatch =
				  !noResponsesOnly || (responses[item.id] || 0) === 0;

			    return buildingMatch && categoryMatch && responseMatch;
			  })
			  .sort((a, b) => {
				if (sortMode === "newest") {
				  return new Date(b.created_at) - new Date(a.created_at);
				}

				if (sortMode === "noResponses") {
				  return (responses[a.id] || 0) - (responses[b.id] || 0);
				}

				if (sortMode === "hot") {
				  const hotA = isHot(a, responses[a.id] || 0) ? 1 : 0;
				  const hotB = isHot(b, responses[b.id] || 0) ? 1 : 0;
				  return hotB - hotA;
				}

				return 0;
			  })
			  .map((item) => (
				  <div
					  key={item.id}
					  className={`help-item ${
						(() => {
						  if (!item.created_at) return "";
						  const created = new Date(item.created_at + "Z");
						  const diffMinutes = (Date.now() - created.getTime()) / 1000 / 60;
						  return diffMinutes < 2 ? "new" : "";
						})()
					  }`}
					onMouseEnter={(e) => {
					  e.currentTarget.style.transform = "translateY(-2px)";
					}}
					onMouseLeave={(e) => {
					  e.currentTarget.style.transform = "translateY(0)";
					}}
					style={{ borderLeft: "6px solid #2563eb", cursor: "pointer" }}
				  >
					<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
					  <span style={{ fontSize: 20 }}>
						{item.category === "repair" && "🛠"}
						{item.category === "move" && "🚚"}
						{item.category === "buy" && "🛒"}
						{item.category === "elder" && "🧓"}
						{item.category === "household" && "🧼"}
						{item.category === "other" && "📦"}
					  </span>

					  <div style={{ fontSize: 18, fontWeight: 600 }}>
						  {isHot(item, responses[item.id] || 0) && (
							<span style={{ marginRight: 6 }}>🔥</span>
						  )}
						  {item.title}
						</div>
					</div>

					<div style={{ fontSize: 14, color: "#666", marginBottom: 10 }}>
					  Дом: {
						buildings.find(b => b.id === item.building_id)?.address
						|| `Дом #${item.building_id}`
					  }
					</div>
					<div style={{ fontSize: 13, color: "#999", marginBottom: 6 }}>
					  Создано: {formatTimeAgo(item.created_at)}
					</div>

					<div style={{ fontSize: 14, color: "#666", marginBottom: 10 }}>
					  {(responses[item.id] || 0) === 0 ? (
						  <div style={{ color: "#777", fontSize: 14, marginBottom: 10 }}>
							Пока никто не откликнулся — станьте первым 🙌
						  </div>
						) : (
						  <div style={{ color: "#2e7d32", fontSize: 14, marginBottom: 10 }}>
							Откликнулись: {responses[item.id]}
						  </div>
						)}
					</div>

					<div 
					  style={{ 
						marginBottom: 10,
						wordBreak: "break-word",
						lineHeight: 1.5
					  }}
					>
					  {item.description}
					</div>

					{revealed[item.id] && item.contact && (
					  <div style={{ marginBottom: 10 }}>
						📞 {item.contact}
					  </div>
					)}

					<div style={{ marginBottom: 12 }}>

					  {/* Статус */}
					  <span
						style={{
						  display: "inline-block",
						  padding: "6px 12px",
						  borderRadius: 12,
						  background: item.status === "open" ? "#22c55e" : "#9ca3af",
						  color: "white",
						  fontSize: 13,
						  fontWeight: 600,
						  marginRight: 10
						}}
					  >
						{item.status === "open" ? "Открыт" : "Закрыт"}
					  </span>

					  {/* Кнопка закрытия */}
					  {item.status === "open" && (
						<button
						  style={{
							background: "#ef4444",
							color: "white",
							border: "none",
							padding: "6px 12px",
							borderRadius: 8,
							cursor: "pointer"
						  }}
						  onClick={() => closeHelpLocal(item.id)}
						>
						  Закрыть
						</button>
					  )}

					</div>

					{item.status === "open" && !revealed[item.id] && (
					  <button
						onClick={() =>
						  setRevealed(prev => ({
							...prev,
							[item.id]: true
						  }))
						}
					  >
						Откликнуться
					  </button>
					)}
					
					<button
					  style={{ marginLeft: 10 }}
					  onClick={() => {
						navigator.clipboard.writeText(
						  window.location.origin + "/help?item=" + item.id
						);
						alert("Ссылка скопирована");
					  }}
					>
					  Скопировать ссылку
					</button>

					{revealed[item.id] && (
					  <div style={{ marginTop: 8, fontSize: 13, color: "#4caf50" }}>
						Контакт раскрыт
					  </div>
					)}
				  </div>
				))
			  }
			</div>

		  </div>

    </div>

  </div>
  </>
);
}

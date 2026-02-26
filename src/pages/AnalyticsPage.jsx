import { useEffect, useState } from "react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  TrendingUp,
  Activity,
  ShieldCheck
} from "lucide-react";
import { Legend } from "recharts";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const useCounter = (value) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 600;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = value / steps;

    const interval = setInterval(() => {
      start += increment;
      if (start >= value) {
        clearInterval(interval);
        setDisplay(value);
      } else {
        setDisplay(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, [value]);

  return display;
};

const COLORS = ["#22c55e", "#facc15", "#f97316", "#ef4444"];

const severityMap = {
  green: "Норма",
  yellow: "Есть жалобы",
  orange: "Проблемно",
  red: "Критично",
};

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [topBuildings, setTopBuildings] = useState([]);
  const [severityStats, setSeverityStats] = useState([]);
  const [period, setPeriod] = useState("all"); 
  
  const [dailyStats, setDailyStats] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
 
  useEffect(() => {
	  fetch("http://127.0.0.1:8000/analytics/top-buildings")
		.then((r) => r.json())
		.then(setTopBuildings);

	  fetch("http://127.0.0.1:8000/analytics/severity-stats")
		  .then((r) => r.json())
		  .then((data) => {
		  // Создаём полный объект со всеми типами
		  const base = {
			high: 0,
			medium: 0,
			low: 0,
			red: 0,
			orange: 0,
			yellow: 0,
			green: 0
		  };

		  // Заполняем тем, что реально пришло
		  data.forEach(item => {
			base[item.severity] = item.count;
		  });

		  // Формируем массив для графика
		  const formatted = Object.entries(base)
			.filter(([_, count]) => count > 0)
			.map(([severity, count]) => ({
			  severity,
			  severityLabel: severityMap[severity] || severity,
			  count
			}));

		  setSeverityStats(formatted);

		 
		});

	  fetch("http://127.0.0.1:8000/analytics/reports-by-day")
		  .then((r) => r.json())
		  .then((data) => {
			setDailyStats(data);
		  });
	}, []);
  
  useEffect(() => {
	  if (darkMode) {
		document.body.classList.add("dark");
	  } else {
		document.body.classList.remove("dark");
	  }
	}, [darkMode]);
  
const high = severityStats.find(s => s.severity === "high")?.count || 0;
const medium = severityStats.find(s => s.severity === "medium")?.count || 0;
const low = severityStats.find(s => s.severity === "low")?.count || 0;

const total = high + medium + low;

const highCount = useCounter(high);
const mediumCount = useCounter(medium);
const lowCount = useCounter(low);

const totalCount = useCounter(total)

const filteredDailyStats = dailyStats.filter(item => {
	if (period === "all") return true;

	const date = new Date(item.date);
	const now = new Date();

	const diffDays = (now - date) / (1000 * 60 * 60 * 24);

	if (period === "7") return diffDays <= 7;
	if (period === "30") return diffDays <= 30;

	return true;
});



  return (
    <div className="analytics-container">
      <h1 className="analytics-main-title">Аналитика</h1>
	  <button
	    className="theme-toggle"
	    onClick={() => setDarkMode(!darkMode)}
	  >
	    {darkMode ? "Светлая тема" : "Тёмная тема"}
	  </button>
	  <div className="kpi-grid">

		  <div className="kpi-card total">
			<div className="kpi-icon">
			  <Activity size={22} />
			</div>
			<div>
			  <div className="kpi-title">Всего жалоб</div>
			  <div className="kpi-value">{totalCount}</div>
			</div>
		  </div>

		  <div className="kpi-card red">
			<div className="kpi-icon">
			  <AlertTriangle size={22} />
			</div>
			<div>
			  <div className="kpi-title">Высоких</div>
			  <div className="kpi-value">{highCount}</div>
			</div>
		  </div>

		  <div className="kpi-card orange">
			<div className="kpi-icon">
			  <TrendingUp size={22} />
			</div>
			<div>
			  <div className="kpi-title">Средних</div>
			  <div className="kpi-value">{mediumCount}</div>
			</div>
		  </div>

		  <div className="kpi-card yellow">
			<div className="kpi-icon">
			  <ShieldCheck size={22} />
			</div>
			<div>
			  <div className="kpi-title">Низких</div>
			  <div className="kpi-value">{lowCount}</div>
			</div>
		  </div>

		</div>


      {/* ТОП ДОМОВ */}
      <div className="analytics-card">
        <div className="analytics-title">Топ проблемных домов</div>
        <ResponsiveContainer width="100%" height={300}>
		  <BarChart
			  data={topBuildings}
			  onClick={(state) => {
				if (!state || !state.activePayload) return;

				const buildingId = state.activePayload[0]?.payload?.id;
				if (!buildingId) return;

				window.location.href = `/?building=${buildingId}`;
			  }}
			>
			<CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />

			<XAxis
			  dataKey="address"
			  label={{ value: "Адрес", position: "insideBottom", offset: -5 }}
			/>

			<YAxis
			  label={{
				value: "Количество жалоб",
				angle: -90,
				position: "insideLeft",
			  }}
			/>

			<Tooltip
			  formatter={(value) => [`${value} жалоб`, "Количество"]}
			  labelFormatter={(label) => `Дом: ${label}`}
			/>

			<Bar
			  dataKey="reports_count"
			  fill="#ef4444"
			  activeBar={false}
			  onClick={(data) => {
				if (!data || !data.id) return;
				  navigate(`/?building=${data.id}`);

			  }}
			/>
		  </BarChart>
		</ResponsiveContainer>

      </div>

      {/* СЕРЬЁЗНОСТЬ */}
      <div className="analytics-card">
		  <div className="analytics-title">Распределение по серьёзности</div>

		  <ResponsiveContainer width="100%" height={350}>
			<PieChart>
			  <Pie
				  data={severityStats}
				  dataKey="count"
				  nameKey="severityLabel"
				  outerRadius={150}
				  innerRadius={60}
				  labelLine={false}
				  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
					const RADIAN = Math.PI / 180;
					const radius = innerRadius + (outerRadius - innerRadius) * 0.6;

					const x = cx + radius * Math.cos(-midAngle * RADIAN);
					const y = cy + radius * Math.sin(-midAngle * RADIAN);

					return (
					  <text
						x={x}
						y={y}
						fill="white"
						textAnchor="middle"
						dominantBaseline="central"
						fontSize="16"
						fontWeight="600"
					  >
						{(percent * 100).toFixed(0)}%
					  </text>
					);
				  }}
				>
				  {severityStats.map((_, index) => (
					<Cell
					  key={index}
					  fill={COLORS[index % COLORS.length]}
					/>
				  ))}
				</Pie>

			  {/* 👇 ДОБАВЬ ЭТО */}
			  <text
				x="50%"
				y="50%"
				textAnchor="middle"
				dominantBaseline="middle"
				style={{
				  fontSize: "22px",
				  fontWeight: 700,
				  fill: darkMode ? "#fff" : "#0f172a"
				}}
			  >
				{total}
			  </text>
			  <Tooltip
			    formatter={(value) => [`${value} жалоб`, "Количество"]}
			    contentStyle={{
				  background: "rgba(30,41,59,0.9)",
				  border: "none",
				  borderRadius: "5px",
				  color: "white"
			    }}
			  />
			  <Legend />
			</PieChart>
		  </ResponsiveContainer>
		</div>

      {/* ПО ДНЯМ */}
      <div className="period-switch">
		  <div
			className="period-indicator"
			style={{
			  transform:
				period === "7"
				  ? "translateX(0%)"
				  : period === "30"
				  ? "translateX(100%)"
				  : "translateX(200%)"
			}}
		  />

		  <button
			className={period === "7" ? "active" : ""}
			onClick={() => setPeriod("7")}
		  >
			7 дней
		  </button>

		  <button
			className={period === "30" ? "active" : ""}
			onClick={() => setPeriod("30")}
		  >
			30 дней
		  </button>

		  <button
			className={period === "all" ? "active" : ""}
			onClick={() => setPeriod("all")}
		  >
			Всё
		  </button>
		</div>
	  <div className="analytics-card">
        <div className="analytics-title">Жалобы по дням</div>
        <ResponsiveContainer width="100%" height={300}>
			
          <LineChart
		    key={period} //анимация линии
		    data={filteredDailyStats}
		  >
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />

            <XAxis
              dataKey="date"
              label={{ value: "Дата", position: "insideBottom", offset: -5 }}
            />

            <YAxis
              label={{
                value: "Количество жалоб",
                angle: -90,
                position: "insideLeft",
              }}
            />

            <Tooltip
              formatter={(value) => [`${value} жалоб`, "Количество"]}
            />

            <Line
			  type="monotone"
			  dataKey="count"
			  stroke="#2563eb"
			  strokeWidth={4}
			  dot={{ r: 5 }}
			  activeDot={{ r: 7 }}
			  isAnimationActive={true}
			  animationDuration={600}
			  animationEasing="ease-in-out"
			/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

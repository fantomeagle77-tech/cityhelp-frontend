import { Routes, Route } from "react-router-dom";
import MapView from "./components/MapView";
import Header from "./components/Header";
import AboutPage from "./components/AboutPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import { useState } from "react";
import "./styles.css";
import HelpPage from "./pages/HelpPage";
import { useLocation } from "react-router-dom";

function App() {
  const [started, setStarted] = useState(false);
  const location = useLocation();
  
  if (!started && location.pathname === "/") {
    return (
      <div className="landing">
        <video autoPlay muted loop className="landing-video">
          <source src="/bg.mp4" type="video/mp4" />
        </video>

        <div className="landing-content">
          <h1>Аналитика городской среды</h1>
		  <p>Открытая статистика обращений и состояния жилых домов в вашем районе.</p>

          <button
            className="start-btn"
            onClick={() => setStarted(true)}
          >
            ПЕРЕЙТИ К КАРТЕ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header />

      <div className="app-content">
        <Routes>
          <Route path="/" element={<MapView />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
		  <Route path="/help" element={<HelpPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;

import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function Header() {
  return (
    <div className="app-header">
      <div className="logo">Правда о районах</div>

      <div className="nav">
        <NavLink to="/" end>
          Карта
        </NavLink>

        <NavLink to="/analytics">
          Аналитика
        </NavLink>

		<NavLink to="/help">
		  Помощь
		</NavLink>

        <NavLink to="/about">
          О проекте
        </NavLink>
      </div>
    </div>
  );
}

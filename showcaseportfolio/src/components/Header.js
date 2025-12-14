import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router";
import "../styling/Header.css";

export default function Header({ current }) {
  const indicatorRef = useRef(null);
  const navRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const activeBtn = navRef.current.querySelector(".active");
    if (!activeBtn || !indicatorRef.current) return;

    const btnRect = activeBtn.getBoundingClientRect();
    const navRect = navRef.current.getBoundingClientRect();

    const centerX =
      btnRect.left - navRect.left + btnRect.width / 2 - 7.5;

    indicatorRef.current.style.transform = `translateX(${centerX}px)`;
  }, [location.pathname]);

  return (
    <header className="header-container">
      <div className="name-block">
        <h3>Damian</h3>
        <span className="profession">???</span>
      </div>

      <nav className="nav-links" ref={navRef}>
        <NavLink to="/" end className="nav-btn">
          Home
        </NavLink>
        <NavLink to="/about" className="nav-btn">
          About
        </NavLink>
        <NavLink to="/contact" className="nav-btn">
          Contact
        </NavLink>

        <div className="indicator" ref={indicatorRef} />
      </nav>

      <div className="separator"></div>
    </header>
  );
}

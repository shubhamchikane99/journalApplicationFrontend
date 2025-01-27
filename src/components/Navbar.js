import React from "react";
import { Link } from "react-router-dom";
import "../styles/NavBar.css"; // Import the CSS file

const NavBar = ({ onLogout }) => {
  return (
    <nav className="navbar">
      <Link to="/chat">Chat</Link>
      <Link to="/journal-entry">Journal Entry</Link>
      <Link to="/tic-tac-toe">Tic Tac Toe</Link>
      <button onClick={onLogout}>Logout</button>
    </nav>
  );
};

export default NavBar;

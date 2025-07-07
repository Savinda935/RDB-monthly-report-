import React from 'react';
import { Link } from 'react-router-dom';
import './sidebar.css';

function Sidebar() {
  return (
    <div className="sidebar-container">
      <h3 className="sidebar-title">Menu</h3>
      <ul className="sidebar-list">
        <li><Link className="sidebar-link" to="/upload">Upload Excel</Link></li>
      </ul>
    </div>
  );
}

export default Sidebar;

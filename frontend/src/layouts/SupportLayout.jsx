import React from 'react';
import { Outlet } from 'react-router-dom';
import SupportSidebar from '../components/sidebar/SupportSidebar';
import Navbar from '../components/navbar/Navbar';
import './SupportLayout.css';

const SupportLayout = () => {
  return (
    <div className="layout-container">
      <SupportSidebar />
      <div className="layout-content-wrapper">
        <Navbar />
        <main className="layout-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SupportLayout;

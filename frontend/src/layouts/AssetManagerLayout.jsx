import React from 'react';
import { Outlet } from 'react-router-dom';
import AssetManagerSidebar from '../components/sidebar/AssetManagerSidebar';
import Navbar from '../components/navbar/Navbar';
import './AssetManagerLayout.css';

const AssetManagerLayout = () => {
  return (
    <div className="layout-container">
      <AssetManagerSidebar />
      <div className="layout-content-wrapper">
        <Navbar />
        <main className="layout-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AssetManagerLayout;

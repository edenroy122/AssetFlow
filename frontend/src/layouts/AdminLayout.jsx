import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/sidebar/AdminSidebar';
import Navbar from '../components/navbar/Navbar';
import './AdminLayout.css';

const AdminLayout = () => {
  return (
    <div className="layout-container">
      <AdminSidebar />
      <div className="layout-content-wrapper">
        <Navbar />
        <main className="layout-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

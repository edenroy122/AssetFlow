import React from 'react';
import { Outlet } from 'react-router-dom';
import EmployeeSidebar from '../components/sidebar/EmployeeSidebar';
import Navbar from '../components/navbar/Navbar';
import './EmployeeLayout.css';

const EmployeeLayout = () => {
  return (
    <div className="layout-container">
      <EmployeeSidebar />
      <div className="layout-content-wrapper">
        <Navbar />
        <main className="layout-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;

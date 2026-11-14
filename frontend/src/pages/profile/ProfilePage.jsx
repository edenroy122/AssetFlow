import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar/Navbar';
import AdminSidebar from '../../components/sidebar/AdminSidebar';
import AssetManagerSidebar from '../../components/sidebar/AssetManagerSidebar';
import SupportSidebar from '../../components/sidebar/SupportSidebar';
import EmployeeSidebar from '../../components/sidebar/EmployeeSidebar';
import Profile from './Profile';

const ProfilePage = () => {
  const { user } = useAuth();
  const Sidebars = {
    Admin: AdminSidebar,
    'Asset Manager': AssetManagerSidebar,
    'Support Team': SupportSidebar,
    Employee: EmployeeSidebar
  };
  const Sidebar = Sidebars[user?.role];

  if (!Sidebar) return <Navigate to="/" replace />;

  return (
    <div className="layout-container">
      <Sidebar />
      <div className="layout-content-wrapper">
        <Navbar />
        <main className="layout-main-content">
          <Profile />
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;

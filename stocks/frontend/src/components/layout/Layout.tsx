import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ToastContainer } from '../ui/Toast';
import { TripBasketDrawer } from '../trips/TripBasketDrawer';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <Navbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
      <TripBasketDrawer />
      <ToastContainer />
    </div>
  );
};

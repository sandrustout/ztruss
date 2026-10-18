import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ThemeToggle } from './ThemeToggle';
import { AuthMenu } from './AuthMenu';
import { apiClient } from '../../lib/api';
import { Trip } from '../../types';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const { data: trips } = useQuery({
    queryKey: ['my-trips'],
    queryFn: () => apiClient.get<Trip[]>('/trips'),
    staleTime: 15000,
  });
  const tripCount = trips?.length || 0;

  const navLinks = [
    { label: 'Explore', href: '/' },
    { label: 'My Trips', href: '/trips', count: tripCount },
    { label: 'History', href: '/history' },
    { label: 'About', href: '/about' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-bg/90 backdrop-blur-md border-b border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Wordmark (Text only, no icon needed per rule 6.1) */}
        <Link to="/" className="flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-brand-brown dark:text-brand-cream">
            Trip<span className="text-primary">Wise</span>
          </span>
        </Link>

        {/* Primary Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3.5 py-1.5 rounded-input text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'text-primary font-semibold bg-bg-elevated'
                    : 'text-text-muted hover:text-text hover:bg-bg-elevated/60'
                }`}
              >
                <span>{link.label}</span>
                {link.count !== undefined && link.count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-[#FDFBD4] leading-none">
                    {link.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls: Theme Toggle & Authentication */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <AuthMenu />
        </div>
      </div>
    </header>
  );
};

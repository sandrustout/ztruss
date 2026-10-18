import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinOff, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-bg-elevated mx-auto flex items-center justify-center border border-border">
          <MapPinOff className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-text">Destination Not Found</h1>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            The travel route or page you requested does not exist or has been relocated.
          </p>
        </div>
        <div>
          <Link to="/">
            <Button variant="primary" size="md" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Explore</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

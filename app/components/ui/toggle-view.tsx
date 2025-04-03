'use client';

import React from 'react';
import { Grid, List } from 'lucide-react';
import { Button } from './button';

export type ViewMode = 'grid' | 'profile';

interface ToggleViewProps {
  currentView: ViewMode;
  onChange: (view: ViewMode) => void;
}

export function ToggleView({ currentView, onChange }: ToggleViewProps) {
  return (
    <div className="flex bg-gray-100 rounded-md p-1">
      <Button 
        variant={currentView === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('grid')}
        className={`px-2 ${currentView === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
      >
        <Grid className="h-4 w-4 mr-1" />
        <span>Grid</span>
      </Button>
      <Button 
        variant={currentView === 'profile' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('profile')}
        className={`px-2 ${currentView === 'profile' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
      >
        <List className="h-4 w-4 mr-1" />
        <span>Profile</span>
      </Button>
    </div>
  );
} 
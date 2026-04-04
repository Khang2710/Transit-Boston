'use client';

import { useState } from 'react';

interface NavbarProps {
  onMenuToggle?: (isOpen: boolean) => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onMenuToggle) {
      onMenuToggle(newState);
    }
  };

  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black text-white rounded-full px-8 py-3 mt-3 shadow-lg flex items-center justify-between w-full max-w-4xl">
      <div className="text-xl font-bold">Transit Explorer</div>
      
      {/* Menu Button - moved to the right */}
      <button 
        onClick={toggleMenu}
        className="p-2 rounded-full hover:bg-gray-800 transition-colors ml-auto"
        aria-label="Toggle menu"
      >
        <div className="flex flex-col space-y-1">
          <div className="w-6 h-0.5 bg-white"></div>
          <div className="w-6 h-0.5 bg-white"></div>
          <div className="w-6 h-0.5 bg-white"></div>
        </div>
      </button>
    </nav>
  );
}
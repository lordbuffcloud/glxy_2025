'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';

const planets = [
  { name: 'home', label: 'Home', icon: '🏠' },
  { name: 'wardrobe', label: 'Wardrobe Planet', icon: '👔' },
  { name: 'chat', label: 'Chat Planet', icon: '💬' },
  { name: 'code', label: 'Code Planet', icon: '💻' },
  { name: 'art', label: 'Art Planet', icon: '🎨' },
  { name: 'music', label: 'Music Planet', icon: '🎵' },
];

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const { profile } = useUser();

  const isActivePlanet = (planetName: string) => {
    if (planetName === 'home') {
      return pathname === '/dashboard';
    }
    return pathname === `/planets/${planetName}`;
  };

  return (
    <motion.div
      initial={{ x: -200 }}
      animate={{ x: 0 }}
      className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-900 shadow-lg transition-all duration-300 ${
        isExpanded ? 'w-64' : 'w-20'
      }`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-8 bg-indigo-600 text-white rounded-full p-1 shadow-lg"
      >
        {isExpanded ? '◀' : '▶'}
      </button>

      <div className="p-4">
        <div className="flex items-center justify-center mb-8">
          {isExpanded ? (
            <h1 className="text-2xl font-bold text-indigo-600">GLXY</h1>
          ) : (
            <span className="text-2xl">🌌</span>
          )}
        </div>

        <div className="space-y-2">
          {planets.map((planet) => (
            <Link
              key={planet.name}
              href={planet.name === 'home' ? '/dashboard' : `/planets/${planet.name}`}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                  isActivePlanet(planet.name)
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-xl">{planet.icon}</span>
                {isExpanded && <span className="ml-3">{planet.label}</span>}
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {isExpanded && profile && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                {profile.name.charAt(0)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {profile.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ⭐ {profile.stardust} Stardust
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
} 
'use client';

import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';

const planetInfo = {
  chat: {
    title: 'Chat Planet',
    description: 'Engage in AI-powered conversations and get instant responses.',
    color: 'from-blue-500 to-purple-600',
    icon: '💬',
  },
  code: {
    title: 'Code Planet',
    description: 'Get help with coding, debugging, and technical solutions.',
    color: 'from-green-500 to-blue-600',
    icon: '💻',
  },
  art: {
    title: 'Art Planet',
    description: 'Generate and explore AI-created artwork and designs.',
    color: 'from-pink-500 to-purple-600',
    icon: '🎨',
  },
  music: {
    title: 'Music Planet',
    description: 'Create and discover AI-generated music compositions.',
    color: 'from-yellow-500 to-red-600',
    icon: '🎵',
  },
};

export default function PlanetPage() {
  const params = useParams();
  const planetName = params.planetName as string;
  const planet = planetInfo[planetName as keyof typeof planetInfo];

  if (!planet) {
    return (
      <AppLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Planet not found</h1>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className={`p-8 rounded-2xl bg-gradient-to-r ${planet.color} text-white mb-8`}>
          <div className="flex items-center space-x-4">
            <span className="text-4xl">{planet.icon}</span>
            <div>
              <h1 className="text-3xl font-bold">{planet.title}</h1>
              <p className="text-lg opacity-90">{planet.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
          >
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Your recent interactions will appear here.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
          >
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
                New Interaction
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AppLayout>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import AppLayout from '@/components/layout/AppLayout';
import { useWardrobe } from '@/hooks/useWardrobe';
import { ClothingItem, OutfitSuggestion } from '@/types';

export default function WardrobePlanet() {
  const { uploadClothing, getWardrobe, getSuggestion, loading, error } = useWardrobe();
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [suggestion, setSuggestion] = useState<OutfitSuggestion | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ClothingItem['category']>('top');
  const [userTags, setUserTags] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    const loadWardrobe = async () => {
      const items = await getWardrobe();
      setWardrobe(items);
    };
    loadWardrobe();
  }, [getWardrobe]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a file first');
      return;
    }

    const tags = userTags.split(',').map((tag) => tag.trim()).filter(Boolean);
    const item = await uploadClothing(uploadFile, selectedCategory, tags);
    if (item) {
      setWardrobe((prev) => [item, ...prev]);
      setUploadOpen(false);
      setUserTags('');
      setUploadFile(null);
    }
  };

  const handleGetSuggestion = async () => {
    if (wardrobe.length < 2) {
      alert('Please add more items to your wardrobe first');
      return;
    }

    const suggestion = await getSuggestion('casual');
    if (suggestion) {
      setSuggestion(suggestion);
    }
  };

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Wardrobe Planet</h1>
              <p className="text-lg opacity-90">Your AI-powered personal stylist</p>
            </div>
            <button
              onClick={() => setUploadOpen(true)}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
            >
              Add Clothing
            </button>
          </div>
        </div>

        {/* Upload Modal */}
        {uploadOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Item</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as ClothingItem['category'])}
                    className="w-full border rounded-md p-2 text-gray-900"
                    required
                  >
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="dress">Dress</option>
                    <option value="outerwear">Outerwear</option>
                    <option value="shoes">Shoes</option>
                    <option value="accessory">Accessory</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={userTags}
                    onChange={(e) => setUserTags(e.target.value)}
                    className="w-full border rounded-md p-2 text-gray-900"
                    placeholder="casual, summer, cotton"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">
                    Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full text-gray-900"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setUploadOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </span>
                    ) : (
                      'Upload'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Wardrobe Section */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Wardrobe</h2>
              <button
                onClick={handleGetSuggestion}
                disabled={wardrobe.length < 2}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Get Outfit Suggestion
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
            ) : wardrobe.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Your wardrobe is empty. Add some clothes to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {wardrobe.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.tags.join(', ')}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                      <p className="text-white text-sm">{item.category}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Suggestion Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Outfit Suggestion</h2>
            {suggestion ? (
              <div className="space-y-4">
                <p className="text-gray-600">{suggestion.explanation}</p>
                <div className="grid grid-cols-2 gap-2">
                  {suggestion.items.map((item) => (
                    <div
                      key={item.id}
                      className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                    >
                      <Image
                        src={item.imageUrl}
                        alt={item.tags.join(', ')}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Style: {suggestion.style}
                    <br />
                    Season: {suggestion.season}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">
                Get an AI-powered outfit suggestion based on your wardrobe items.
                {wardrobe.length < 2 && (
                  <span className="block mt-2 text-sm text-indigo-600">
                    Add at least 2 items to get suggestions.
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
} 
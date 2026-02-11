'use client';

import { Check, Eye, Briefcase, Star, Clock, Sparkles } from 'lucide-react';
import { categories } from './constants';

interface CategoryStepProps {
  category: string;
  setCategory: (category: string) => void;
  setJudgePreferences: (prefs: { type: string; category: string }) => void;
  onContinue: () => void;
}

export function CategoryStep({
  category,
  setCategory,
  setJudgePreferences,
  onContinue,
}: CategoryStepProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom duration-700">
      {/* Category selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = category === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`group relative p-8 rounded-2xl border-2 transition-all duration-500 text-left ${
                isSelected
                  ? `border-indigo-500 ${cat.bgColor} shadow-xl scale-105`
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg hover:scale-102'
              }`}
            >
              <div className="flex items-start gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  isSelected
                    ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                    : `${cat.bgColor} ${cat.iconColor} group-hover:scale-110`
                }`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className={`text-2xl font-bold transition-colors ${
                    isSelected ? 'text-gray-900' : 'text-gray-800 group-hover:text-gray-900'
                  }`}>
                    {cat.label}
                  </h3>
                  <p className={`text-base transition-colors ${
                    isSelected ? 'text-gray-700' : 'text-gray-600'
                  }`}>
                    {cat.description}
                  </p>
                  {isSelected && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 animate-in fade-in duration-300">
                      <Check className="w-4 h-4" />
                      Selected
                    </div>
                  )}
                </div>
              </div>
              {isSelected && (
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Judge preferences shown once category is chosen */}
      {category && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center space-y-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900">
              How we choose your judges
            </h3>
            <p className="text-gray-600">
              You don&apos;t need to pick anything here — we automatically balance expertise, quality, and speed for your {category} request.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Industry experts</h4>
                <p className="text-sm text-gray-600">Professionals in your field when it&apos;s relevant.</p>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Top rated judges</h4>
                <p className="text-sm text-gray-600">People with consistently helpful feedback.</p>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Fast responders</h4>
                <p className="text-sm text-gray-600">Judges who typically reply within minutes.</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                setJudgePreferences({ type: 'auto', category });
                onContinue();
              }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
            >
              Continue - Auto-match my judges
              <Sparkles className="w-5 h-5" />
            </button>
            <p className="text-sm text-gray-500 mt-3">
              We&apos;ll pick 3 judges for you — you can always see who responded later.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

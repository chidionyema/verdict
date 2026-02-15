'use client';

import { useState } from 'react';
import {
  Heart,
  Briefcase,
  Palette,
  Music,
  Dumbbell,
  Plane,
  Book,
  Gamepad2,
  Camera,
  Coffee,
  Sparkles,
  Lock,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Info,
} from 'lucide-react';

interface PsychographicFilter {
  interests?: string[];
  values?: string[];
  lifestyle?: string[];
  personality?: string[];
}

interface PsychographicTargetingProps {
  value: PsychographicFilter;
  onChange: (filters: PsychographicFilter) => void;
  isPremium?: boolean;
  onUpgrade?: () => void;
}

const interestCategories = [
  {
    id: 'creative',
    label: 'Creative',
    icon: Palette,
    options: ['Photography', 'Art & Design', 'Fashion', 'Music', 'Writing', 'Film & Video'],
  },
  {
    id: 'fitness',
    label: 'Fitness & Health',
    icon: Dumbbell,
    options: ['Fitness', 'Nutrition', 'Yoga', 'Sports', 'Wellness', 'Outdoor Activities'],
  },
  {
    id: 'tech',
    label: 'Technology',
    icon: Gamepad2,
    options: ['Gaming', 'Tech & Gadgets', 'Social Media', 'AI & Innovation', 'Startups'],
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    icon: Coffee,
    options: ['Travel', 'Food & Dining', 'Home & Decor', 'Parenting', 'Pets', 'Self-Improvement'],
  },
  {
    id: 'professional',
    label: 'Professional',
    icon: Briefcase,
    options: ['Business', 'Finance', 'Marketing', 'Entrepreneurship', 'Career Development'],
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    icon: Music,
    options: ['Pop Culture', 'Celebrities', 'TV & Streaming', 'Books & Reading', 'Podcasts'],
  },
];

const valueOptions = [
  { id: 'authenticity', label: 'Authenticity', description: 'Values genuine, real content' },
  { id: 'aesthetics', label: 'Aesthetics', description: 'Appreciates visual beauty' },
  { id: 'professionalism', label: 'Professionalism', description: 'Values polished, business-ready content' },
  { id: 'creativity', label: 'Creativity', description: 'Appreciates unique, artistic expression' },
  { id: 'simplicity', label: 'Simplicity', description: 'Prefers clean, minimalist style' },
  { id: 'boldness', label: 'Boldness', description: 'Drawn to confident, striking visuals' },
];

const lifestyleOptions = [
  { id: 'urban', label: 'Urban Professional', icon: Briefcase },
  { id: 'traveler', label: 'Frequent Traveler', icon: Plane },
  { id: 'fitness_enthusiast', label: 'Fitness Enthusiast', icon: Dumbbell },
  { id: 'creative_pro', label: 'Creative Professional', icon: Camera },
  { id: 'bookworm', label: 'Bookworm', icon: Book },
  { id: 'social_butterfly', label: 'Social Butterfly', icon: Heart },
];

const personalityOptions = [
  { id: 'introverted', label: 'Introverted' },
  { id: 'extroverted', label: 'Extroverted' },
  { id: 'analytical', label: 'Analytical' },
  { id: 'creative', label: 'Creative' },
  { id: 'practical', label: 'Practical' },
  { id: 'adventurous', label: 'Adventurous' },
];

export function PsychographicTargeting({
  value,
  onChange,
  isPremium = false,
  onUpgrade,
}: PsychographicTargetingProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'interests' | 'values' | 'lifestyle' | 'personality'>('interests');

  const toggleInterest = (interest: string) => {
    const current = value.interests || [];
    const updated = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest];
    onChange({ ...value, interests: updated });
  };

  const toggleValue = (val: string) => {
    const current = value.values || [];
    const updated = current.includes(val)
      ? current.filter(v => v !== val)
      : [...current, val];
    onChange({ ...value, values: updated });
  };

  const toggleLifestyle = (style: string) => {
    const current = value.lifestyle || [];
    const updated = current.includes(style)
      ? current.filter(l => l !== style)
      : [...current, style];
    onChange({ ...value, lifestyle: updated });
  };

  const togglePersonality = (trait: string) => {
    const current = value.personality || [];
    const updated = current.includes(trait)
      ? current.filter(p => p !== trait)
      : [...current, trait];
    onChange({ ...value, personality: updated });
  };

  const totalSelections =
    (value.interests?.length || 0) +
    (value.values?.length || 0) +
    (value.lifestyle?.length || 0) +
    (value.personality?.length || 0);

  if (!isPremium) {
    return (
      <div className="border border-purple-200 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-4">
            <Lock className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Psychographic Targeting
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Target judges based on interests, values, and lifestyle. Get feedback from people
            who truly understand your niche.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {['Photography lovers', 'Fitness enthusiasts', 'Creative pros', 'Tech-savvy'].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-white/70 rounded-full text-sm text-purple-700"
              >
                {tag}
              </span>
            ))}
          </div>
          <button
            onClick={onUpgrade}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <Sparkles className="h-4 w-4" />
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold text-gray-900">Psychographic Targeting</h3>
            <span className="px-2 py-0.5 bg-purple-200 text-purple-700 rounded-full text-xs font-medium">
              Premium
            </span>
          </div>
          {totalSelections > 0 && (
            <span className="text-sm text-purple-600 font-medium">
              {totalSelections} filters selected
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex border-b border-gray-100"
        role="tablist"
        aria-label="Psychographic filter categories"
      >
        {(['interests', 'values', 'lifestyle', 'personality'] as const).map((tab, index) => {
          const tabs = ['interests', 'values', 'lifestyle', 'personality'] as const;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`tabpanel-psycho-${tab}`}
              id={`tab-psycho-${tab}`}
              tabIndex={activeTab === tab ? 0 : -1}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  const nextTab = tabs[(index + 1) % tabs.length];
                  setActiveTab(nextTab);
                  document.getElementById(`tab-psycho-${nextTab}`)?.focus();
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const prevTab = tabs[(index - 1 + tabs.length) % tabs.length];
                  setActiveTab(prevTab);
                  document.getElementById(`tab-psycho-${prevTab}`)?.focus();
                }
              }}
              className={`flex-1 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 ${
                activeTab === tab
                  ? 'text-purple-600 border-b-2 border-purple-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {value[tab]?.length ? (
                <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs" aria-label={`${value[tab]?.length} selected`}>
                  {value[tab]?.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div
        className="p-4"
        role="tabpanel"
        id={`tabpanel-psycho-${activeTab}`}
        aria-labelledby={`tab-psycho-${activeTab}`}
      >
        {/* Interests Tab */}
        {activeTab === 'interests' && (
          <div className="space-y-3">
            {interestCategories.map((category) => {
              const Icon = category.icon;
              const isExpanded = expandedCategory === category.id;
              const selectedCount = category.options.filter(
                (opt) => value.interests?.includes(opt)
              ).length;

              return (
                <div
                  key={category.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedCategory(isExpanded ? null : category.id)
                    }
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <Icon className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="font-medium text-gray-900">
                        {category.label}
                      </span>
                      {selectedCount > 0 && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                          {selectedCount} selected
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 flex flex-wrap gap-2">
                      {category.options.map((option) => {
                        const isSelected = value.interests?.includes(option);
                        return (
                          <button
                            key={option}
                            onClick={() => toggleInterest(option)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                              isSelected
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 inline mr-1" />}
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Values Tab */}
        {activeTab === 'values' && (
          <div className="grid grid-cols-2 gap-3">
            {valueOptions.map((val) => {
              const isSelected = value.values?.includes(val.id);
              return (
                <button
                  key={val.id}
                  onClick={() => toggleValue(val.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-medium ${isSelected ? 'text-purple-700' : 'text-gray-900'}`}>
                      {val.label}
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-purple-500" />}
                  </div>
                  <p className="text-xs text-gray-500">{val.description}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Lifestyle Tab */}
        {activeTab === 'lifestyle' && (
          <div className="grid grid-cols-2 gap-3">
            {lifestyleOptions.map((style) => {
              const Icon = style.icon;
              const isSelected = value.lifestyle?.includes(style.id);
              return (
                <button
                  key={style.id}
                  onClick={() => toggleLifestyle(style.id)}
                  className={`p-3 rounded-lg border flex items-center gap-3 transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-purple-200' : 'bg-gray-100'}`}>
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-purple-700' : 'text-gray-600'}`} />
                  </div>
                  <span className={`font-medium ${isSelected ? 'text-purple-700' : 'text-gray-900'}`}>
                    {style.label}
                  </span>
                  {isSelected && <Check className="h-4 w-4 text-purple-500 ml-auto" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Personality Tab */}
        {activeTab === 'personality' && (
          <div>
            <div className="flex items-center gap-2 mb-3 p-3 bg-blue-50 rounded-lg">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-blue-700">
                Select personality traits that match your target audience
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {personalityOptions.map((trait) => {
                const isSelected = value.personality?.includes(trait.id);
                return (
                  <button
                    key={trait.id}
                    onClick={() => togglePersonality(trait.id)}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${
                      isSelected
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 inline mr-1" />}
                    {trait.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Filters Summary */}
        {totalSelections > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Selected Filters</span>
              <button
                onClick={() => onChange({})}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {value.interests?.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                >
                  {interest}
                  <button
                    onClick={() => toggleInterest(interest)}
                    className="hover:text-purple-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {value.values?.map((val) => (
                <span
                  key={val}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {valueOptions.find(v => v.id === val)?.label}
                  <button
                    onClick={() => toggleValue(val)}
                    className="hover:text-blue-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {value.lifestyle?.map((style) => (
                <span
                  key={style}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                >
                  {lifestyleOptions.find(l => l.id === style)?.label}
                  <button
                    onClick={() => toggleLifestyle(style)}
                    className="hover:text-green-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {value.personality?.map((trait) => (
                <span
                  key={trait}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-sm"
                >
                  {personalityOptions.find(p => p.id === trait)?.label}
                  <button
                    onClick={() => togglePersonality(trait)}
                    className="hover:text-amber-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

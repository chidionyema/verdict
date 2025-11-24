'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Filter, 
  Globe, 
  Briefcase, 
  GraduationCap, 
  MapPin,
  Star,
  Info,
  RefreshCw,
  CheckCircle,
  X,
  Sparkles
} from 'lucide-react';

export interface JudgePreferences {
  age_ranges: string[];
  genders: string[];
  ethnicities: string[];
  education_levels: string[];
  professions: string[];
  locations: string[];
  lifestyle_tags: string[];
  interests: string[];
  priority_mode: 'balanced' | 'speed' | 'diversity' | 'expertise';
}

interface JudgePool {
  total_available: number;
  estimated_response_time: string;
  diversity_score: number;
  expertise_match: number;
  demographics_breakdown: {
    age: Record<string, number>;
    gender: Record<string, number>;
    profession: Record<string, number>;
    location: Record<string, number>;
  };
}

const AGE_OPTIONS = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const GENDER_OPTIONS = ['Women', 'Men', 'Non-binary', 'All genders'];
const ETHNICITY_OPTIONS = ['Asian', 'Black/African American', 'Hispanic/Latino', 'White/Caucasian', 'Mixed/Multiracial', 'All ethnicities'];
const EDUCATION_OPTIONS = ['High School', 'College', 'Graduate Degree', 'Professional', 'Trade/Vocational'];
const PROFESSION_OPTIONS = ['Tech', 'Healthcare', 'Finance', 'Creative', 'Education', 'Business', 'Service', 'Other'];
const LOCATION_OPTIONS = ['Urban', 'Suburban', 'Rural', 'International', 'Same region'];

const PRIORITY_MODES = [
  {
    id: 'speed',
    name: 'Fastest Response',
    description: 'Get results in under 5 minutes',
    icon: RefreshCw,
    color: 'green'
  },
  {
    id: 'diversity',
    name: 'Maximum Diversity',
    description: 'Widest range of perspectives',
    icon: Globe,
    color: 'purple'
  },
  {
    id: 'expertise',
    name: 'Subject Experts',
    description: 'Judges with relevant experience',
    icon: Star,
    color: 'blue'
  },
  {
    id: 'balanced',
    name: 'Balanced Mix',
    description: 'Good balance of speed and diversity',
    icon: Sparkles,
    color: 'orange'
  }
];

export function JudgePreferences({ 
  category, 
  onPreferencesChange 
}: { 
  category: string;
  onPreferencesChange: (preferences: JudgePreferences) => void;
}) {
  const [preferences, setPreferences] = useState<JudgePreferences>({
    age_ranges: [],
    genders: ['All genders'],
    ethnicities: ['All ethnicities'],
    education_levels: [],
    professions: [],
    locations: [],
    lifestyle_tags: [],
    interests: [],
    priority_mode: 'balanced'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [poolData, setPoolData] = useState<JudgePool>({
    total_available: 89,
    estimated_response_time: '7 minutes',
    diversity_score: 8.5,
    expertise_match: 7.2,
    demographics_breakdown: {
      age: { '18-24': 15, '25-34': 35, '35-44': 25, '45-54': 15, '55+': 10 },
      gender: { 'Women': 52, 'Men': 45, 'Non-binary': 3 },
      profession: { 'Tech': 25, 'Creative': 20, 'Business': 18, 'Healthcare': 15, 'Other': 22 },
      location: { 'Urban': 45, 'Suburban': 35, 'Rural': 12, 'International': 8 }
    }
  });

  const handleMultiSelect = (field: keyof JudgePreferences, value: string, isExclusive = false) => {
    const currentArray = preferences[field] as string[];
    
    if (isExclusive) {
      // For "All" options, clear others
      setPreferences({ 
        ...preferences, 
        [field]: value.includes('All') ? [value] : [value]
      });
    } else {
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray.filter(item => !item.includes('All')), value];
      
      setPreferences({ ...preferences, [field]: newArray });
    }
  };

  const getEstimatedPool = () => {
    // Simulate pool calculation based on filters
    const basePool = 120;
    const filters = [
      ...preferences.age_ranges,
      ...preferences.genders.filter(g => !g.includes('All')),
      ...preferences.ethnicities.filter(e => !e.includes('All')),
      ...preferences.education_levels,
      ...preferences.professions,
      ...preferences.locations
    ].length;
    
    const adjustment = Math.max(0.3, 1 - (filters * 0.15));
    return Math.floor(basePool * adjustment);
  };

  const getResponseTime = () => {
    const poolSize = getEstimatedPool();
    const speedBonus = preferences.priority_mode === 'speed' ? 0.5 : 1;
    const baseTime = Math.max(3, 15 - (poolSize / 10)) * speedBonus;
    return `${Math.round(baseTime)} min`;
  };

  const renderFilterSection = (
    title: string, 
    options: string[], 
    field: keyof JudgePreferences,
    icon: React.ElementType,
    hasAllOption = false
  ) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {React.createElement(icon, { className: "w-4 h-4 text-purple-600" })}
        <h3 className="font-medium">{title}</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((option) => {
          const isSelected = (preferences[field] as string[]).includes(option);
          const isAllOption = option.includes('All');
          
          return (
            <TouchButton
              key={option}
              variant={isSelected ? "default" : "outline"}
              onClick={() => handleMultiSelect(field, option, isAllOption)}
              className={`text-xs py-2 px-3 ${
                isSelected 
                  ? isAllOption 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-purple-600 text-white'
                  : 'border-gray-200'
              }`}
            >
              {option}
              {isSelected && <CheckCircle className="w-3 h-3 ml-1" />}
            </TouchButton>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Filter className="w-5 h-5 text-purple-600" />
                Choose Your Judges
              </h2>
              <p className="text-gray-600 mt-1">Select the type of people you want feedback from</p>
            </div>
            
            <Badge className="bg-green-100 text-green-800 px-3 py-1">
              {getEstimatedPool()} judges available
            </Badge>
          </div>

          {/* Priority Mode Selection */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">What matters most to you?</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {PRIORITY_MODES.map((mode) => {
                const Icon = mode.icon;
                const isSelected = preferences.priority_mode === mode.id;
                
                return (
                  <TouchButton
                    key={mode.id}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => setPreferences({ ...preferences, priority_mode: mode.id as any })}
                    className={`p-4 h-auto text-left flex flex-col items-start gap-1 whitespace-normal break-words ${
                      isSelected ? `bg-${mode.color}-600 text-white` : ''
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-white' : `text-${mode.color}-600`}`} />
                    <div className="font-medium text-sm">{mode.name}</div>
                    <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-600'}`}>
                      {mode.description}
                    </div>
                  </TouchButton>
                );
              })}
            </div>
          </div>

          {/* Quick Filters */}
          <div className="space-y-4">
            {renderFilterSection('Gender', GENDER_OPTIONS, 'genders', Users, true)}
            {renderFilterSection('Age Groups', AGE_OPTIONS, 'age_ranges', Users)}
          </div>

          {/* Advanced Filters */}
          <div className="mt-6">
            <TouchButton
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-purple-600 hover:text-purple-700"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
              <Filter className="w-4 h-4 ml-2" />
            </TouchButton>

            {showAdvanced && (
              <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                {renderFilterSection('Background', ETHNICITY_OPTIONS, 'ethnicities', Globe, true)}
                {renderFilterSection('Education', EDUCATION_OPTIONS, 'education_levels', GraduationCap)}
                {renderFilterSection('Profession', PROFESSION_OPTIONS, 'professions', Briefcase)}
                {renderFilterSection('Location Type', LOCATION_OPTIONS, 'locations', MapPin)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Judge Pool Preview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium">Your Judge Pool</h3>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{getEstimatedPool()}</div>
              <div className="text-sm text-gray-600">Available Judges</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{getResponseTime()}</div>
              <div className="text-sm text-gray-600">Est. Response</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">8.5/10</div>
              <div className="text-sm text-gray-600">Diversity Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">7.2/10</div>
              <div className="text-sm text-gray-600">Expertise Match</div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Perfect! Your selection will give you:</p>
                <ul className="space-y-1">
                  <li>• Diverse perspectives from {getEstimatedPool()} qualified judges</li>
                  <li>• Response time of approximately {getResponseTime()}</li>
                  <li>• High-quality feedback from verified reviewers</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <TouchButton
              variant="outline"
              onClick={() => {
                setPreferences({
                  age_ranges: [],
                  genders: ['All genders'],
                  ethnicities: ['All ethnicities'],
                  education_levels: [],
                  professions: [],
                  locations: [],
                  lifestyle_tags: [],
                  interests: [],
                  priority_mode: 'balanced'
                });
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Filters
            </TouchButton>

            <TouchButton
              onClick={() => onPreferencesChange(preferences)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Continue with These Judges
              <CheckCircle className="w-4 h-4 ml-2" />
            </TouchButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
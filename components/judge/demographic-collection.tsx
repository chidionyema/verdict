'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TouchButton } from '@/components/ui/touch-button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Globe, 
  Briefcase, 
  GraduationCap, 
  MapPin,
  Calendar,
  Eye,
  EyeOff,
  Info,
  CheckCircle,
  ArrowRight,
  Shield
} from 'lucide-react';
import { LinkedInVerification } from '@/components/verification/LinkedInVerification';
import { createClient } from '@/lib/supabase/client';

interface DemographicData {
  age_range: string;
  gender: string;
  ethnicity: string[];
  location: string;
  education: string;
  profession: string;
  relationship_status: string;
  income_range: string;
  lifestyle: string[];
  interests: string[];
  visibility_preferences: {
    show_age: boolean;
    show_gender: boolean;
    show_ethnicity: boolean;
    show_location: boolean;
    show_education: boolean;
    show_profession: boolean;
  };
}

const AGE_RANGES = [
  '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
];

const GENDER_OPTIONS = [
  'Woman', 'Man', 'Non-binary', 'Prefer not to say', 'Self-describe'
];

const ETHNICITY_OPTIONS = [
  'Asian', 'Black/African American', 'Hispanic/Latino', 'Native American',
  'Pacific Islander', 'White/Caucasian', 'Middle Eastern', 'Mixed/Multiracial',
  'Prefer not to say', 'Self-describe'
];

const EDUCATION_LEVELS = [
  'High School', 'Some College', 'Bachelor\'s Degree', 'Master\'s Degree',
  'Doctoral Degree', 'Professional Degree', 'Trade School', 'Other'
];

const PROFESSIONS = [
  'Technology', 'Healthcare', 'Education', 'Finance', 'Marketing',
  'Creative/Arts', 'Legal', 'Retail', 'Manufacturing', 'Government',
  'Non-profit', 'Student', 'Retired', 'Other'
];

const RELATIONSHIP_STATUS = [
  'Single', 'In a relationship', 'Married', 'Divorced', 
  'Widowed', 'Prefer not to say'
];

const INCOME_RANGES = [
  'Under $25k', '$25k-$50k', '$50k-$75k', '$75k-$100k',
  '$100k-$150k', '$150k+', 'Prefer not to say'
];

const LIFESTYLE_OPTIONS = [
  'Urban', 'Suburban', 'Rural', 'Parent', 'Pet owner',
  'Fitness enthusiast', 'Traveler', 'Foodie', 'Tech-savvy',
  'Environmentally conscious', 'Fashion-forward'
];

const INTEREST_CATEGORIES = [
  'Fashion & Style', 'Technology', 'Business & Career', 'Health & Fitness',
  'Travel', 'Food & Dining', 'Entertainment', 'Sports', 'Arts & Culture',
  'Relationships', 'Finance', 'Education'
];

interface DemographicCollectionProps {
  onComplete?: (data: DemographicData) => void;
}

export function DemographicCollection({ onComplete }: DemographicCollectionProps = {}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<Partial<DemographicData>>({
    ethnicity: [],
    lifestyle: [],
    interests: [],
    visibility_preferences: {
      show_age: true,
      show_gender: true,
      show_ethnicity: false,
      show_location: true,
      show_education: false,
      show_profession: true,
    }
  });
  const [customGender, setCustomGender] = useState('');
  const [customEthnicity, setCustomEthnicity] = useState('');

  const steps = [
    { title: 'Basic Demographics', icon: Users },
    { title: 'Background', icon: GraduationCap },
    { title: 'Lifestyle & Interests', icon: Globe },
    { title: 'Privacy Settings', icon: Eye }
  ];

  const handleMultiSelect = (field: keyof DemographicData, value: string) => {
    const currentArray = (data[field] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    setData({ ...data, [field]: newArray });
  };

  const handleVisibilityToggle = (field: keyof DemographicData['visibility_preferences']) => {
    setData({
      ...data,
      visibility_preferences: {
        ...data.visibility_preferences!,
        [field]: !data.visibility_preferences![field]
      }
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Basic Demographics</h2>
              <p className="text-gray-600">Help us match you with requests that value your perspective</p>
            </div>

            {/* Age Range */}
            <div>
              <label className="block text-sm font-medium mb-3">Age Range *</label>
              <div className="grid grid-cols-3 gap-3">
                {AGE_RANGES.map((range) => (
                  <button
                    key={range}
                    onClick={() => setData({ ...data, age_range: range })}
                    className={`p-3 text-sm rounded-lg border transition-all ${
                      data.age_range === range
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium mb-3">Gender Identity</label>
              <div className="space-y-2">
                {GENDER_OPTIONS.map((gender) => (
                  <label key={gender} className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value={gender}
                      checked={data.gender === gender}
                      onChange={(e) => setData({ ...data, gender: e.target.value })}
                      className="mr-3"
                    />
                    {gender}
                  </label>
                ))}
                {data.gender === 'Self-describe' && (
                  <input
                    type="text"
                    placeholder="Please specify"
                    value={customGender}
                    onChange={(e) => setCustomGender(e.target.value)}
                    className="mt-2 w-full p-2 border rounded-lg"
                  />
                )}
              </div>
            </div>

            {/* Ethnicity */}
            <div>
              <label className="block text-sm font-medium mb-3">Ethnicity (Select all that apply)</label>
              <div className="grid grid-cols-2 gap-2">
                {ETHNICITY_OPTIONS.map((ethnicity) => (
                  <label key={ethnicity} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={data.ethnicity?.includes(ethnicity) || false}
                      onChange={() => handleMultiSelect('ethnicity', ethnicity)}
                      className="mr-3"
                    />
                    <span className="text-sm">{ethnicity}</span>
                  </label>
                ))}
              </div>
              {data.ethnicity?.includes('Self-describe') && (
                <input
                  type="text"
                  placeholder="Please specify"
                  value={customEthnicity}
                  onChange={(e) => setCustomEthnicity(e.target.value)}
                  className="mt-2 w-full p-2 border rounded-lg"
                />
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium mb-3">Location (City, State/Country)</label>
              <input
                type="text"
                placeholder="e.g., New York, NY or London, UK"
                value={data.location || ''}
                onChange={(e) => setData({ ...data, location: e.target.value })}
                className="w-full p-3 border rounded-lg"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <GraduationCap className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Background</h2>
              <p className="text-gray-600">Your education and professional background</p>
            </div>

            {/* Education */}
            <div>
              <label className="block text-sm font-medium mb-3">Education Level</label>
              <div className="grid grid-cols-2 gap-3">
                {EDUCATION_LEVELS.map((education) => (
                  <button
                    key={education}
                    onClick={() => setData({ ...data, education })}
                    className={`p-3 text-sm rounded-lg border transition-all ${
                      data.education === education
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {education}
                  </button>
                ))}
              </div>
            </div>

            {/* Profession */}
            <div>
              <label className="block text-sm font-medium mb-3">Profession/Industry</label>
              <div className="grid grid-cols-2 gap-3">
                {PROFESSIONS.map((profession) => (
                  <button
                    key={profession}
                    onClick={() => setData({ ...data, profession })}
                    className={`p-3 text-sm rounded-lg border transition-all ${
                      data.profession === profession
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {profession}
                  </button>
                ))}
              </div>
            </div>

            {/* Relationship Status */}
            <div>
              <label className="block text-sm font-medium mb-3">Relationship Status</label>
              <div className="grid grid-cols-2 gap-3">
                {RELATIONSHIP_STATUS.map((status) => (
                  <button
                    key={status}
                    onClick={() => setData({ ...data, relationship_status: status })}
                    className={`p-3 text-sm rounded-lg border transition-all ${
                      data.relationship_status === status
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Income */}
            <div>
              <label className="block text-sm font-medium mb-3">Household Income</label>
              <div className="grid grid-cols-2 gap-3">
                {INCOME_RANGES.map((income) => (
                  <button
                    key={income}
                    onClick={() => setData({ ...data, income_range: income })}
                    className={`p-3 text-sm rounded-lg border transition-all ${
                      data.income_range === income
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {income}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Globe className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Lifestyle & Interests</h2>
              <p className="text-gray-600">Help us understand your perspective and expertise areas</p>
            </div>

            {/* Lifestyle */}
            <div>
              <label className="block text-sm font-medium mb-3">Lifestyle (Select all that apply)</label>
              <div className="grid grid-cols-3 gap-2">
                {LIFESTYLE_OPTIONS.map((lifestyle) => (
                  <button
                    key={lifestyle}
                    onClick={() => handleMultiSelect('lifestyle', lifestyle)}
                    className={`p-3 text-sm rounded-lg border transition-all ${
                      data.lifestyle?.includes(lifestyle)
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {lifestyle}
                  </button>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium mb-3">Areas of Interest/Expertise</label>
              <div className="grid grid-cols-2 gap-2">
                {INTEREST_CATEGORIES.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => handleMultiSelect('interests', interest)}
                    className={`p-3 text-sm rounded-lg border transition-all ${
                      data.interests?.includes(interest)
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Eye className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Privacy Settings</h2>
              <p className="text-gray-600">Choose what information is visible to users when they select judges</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">How this works:</p>
                  <p>Users can filter judges by demographics, but your personal identity remains completely anonymous. Only the categories you allow will be shown (e.g., "25-34, Tech Professional, Urban").</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: 'show_age', label: 'Age Range', value: data.age_range },
                { key: 'show_gender', label: 'Gender', value: data.gender },
                { key: 'show_ethnicity', label: 'Ethnicity', value: data.ethnicity?.join(', ') },
                { key: 'show_location', label: 'Location', value: data.location },
                { key: 'show_education', label: 'Education', value: data.education },
                { key: 'show_profession', label: 'Profession', value: data.profession },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-gray-600">{item.value || 'Not specified'}</div>
                  </div>
                  <button
                    onClick={() => handleVisibilityToggle(item.key as keyof DemographicData['visibility_preferences'])}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      data.visibility_preferences?.[item.key as keyof DemographicData['visibility_preferences']]
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {data.visibility_preferences?.[item.key as keyof DemographicData['visibility_preferences']] ? (
                      <>
                        <Eye className="w-4 h-4" />
                        Visible
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Hidden
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">Your profile preview:</p>
                  <p className="mt-1">
                    {[
                      data.visibility_preferences?.show_age && data.age_range,
                      data.visibility_preferences?.show_gender && data.gender,
                      data.visibility_preferences?.show_profession && data.profession,
                      data.visibility_preferences?.show_location && data.location,
                    ].filter(Boolean).join(' • ') || 'Anonymous Judge'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canContinue = () => {
    switch (currentStep) {
      case 0:
        return data.age_range;
      case 1:
        return true; // Optional fields
      case 2:
        return true; // Optional fields
      case 3:
        return true; // Just settings
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    index <= currentStep
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      index < currentStep ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Judge Profile Setup</h1>
          <p className="text-gray-600">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
          </p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-8">
          {renderStep()}

          <div className="flex justify-between mt-8">
            <TouchButton
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </TouchButton>
            
            {currentStep < steps.length - 1 ? (
              <TouchButton
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canContinue()}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </TouchButton>
            ) : (
              <TouchButton
                onClick={() => {
                  // Prepare the data for submission
                  const finalData: any = {
                    age_range: data.age_range || '',
                    gender: data.gender || customGender || '',
                    ethnicity: data.ethnicity?.includes('Self-describe') 
                      ? [...data.ethnicity.filter(e => e !== 'Self-describe'), customEthnicity].filter(Boolean)
                      : data.ethnicity || [],
                    location: data.location || '',
                    education: data.education || '',
                    profession: data.profession || '',
                    relationship_status: data.relationship_status || '',
                    income_range: data.income_range || '',
                    lifestyle_tags: data.lifestyle || [],
                    interest_areas: data.interests || [],
                    visibility_preferences: data.visibility_preferences || {
                      show_age: true,
                      show_gender: true,
                      show_ethnicity: false,
                      show_location: true,
                      show_education: false,
                      show_profession: true
                    }
                  };
                  
                  if (onComplete) {
                    onComplete(finalData);
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Complete Setup
                <CheckCircle className="w-4 h-4 ml-2" />
              </TouchButton>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { User as UserIcon, Globe, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface ProfileSetupProps {
  user: User;
  onComplete: () => void;
  loading?: boolean;
}

interface ProfileData {
  display_name: string;
  country: string;
  age_range: string;
  gender: string;
  interests: string[];
  bio: string;
}

const countries = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 
  'Spain', 'Italy', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Japan', 
  'South Korea', 'Singapore', 'New Zealand', 'Ireland', 'Belgium', 'Switzerland',
  'Other'
];

const ageRanges = [
  '18-24', '25-34', '35-44', '45-54', '55+'
];

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
  { value: '', label: 'Prefer not to say' }
];

const interestOptions = [
  'Fashion & Style', 'Career & Professional', 'Dating & Relationships', 
  'Creative Writing', 'Life Decisions', 'Photography', 'Business & Entrepreneurship',
  'Health & Fitness', 'Travel', 'Technology', 'Art & Design', 'Music',
  'Sports', 'Food & Cooking', 'Home & Garden', 'Parenting', 'Education'
];

export function ProfileSetup({ user, onComplete, loading = false }: ProfileSetupProps) {
  const [profile, setProfile] = useState<ProfileData>({
    display_name: '',
    country: '',
    age_range: '',
    gender: '',
    interests: [],
    bio: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(user);
  const supabase = createClient();

  useEffect(() => {
    loadExistingProfile();
  }, [user.id]);

  const loadExistingProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, country, age_range, gender, interests, bio')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setProfile({
          display_name: (data as any).display_name || '',
          country: (data as any).country || '',
          age_range: (data as any).age_range || '',
          gender: (data as any).gender || '',
          interests: (data as any).interests || [],
          bio: (data as any).bio || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const validateProfile = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!profile.display_name.trim()) {
      newErrors.display_name = 'Display name is required';
    } else if (profile.display_name.length < 2) {
      newErrors.display_name = 'Display name must be at least 2 characters';
    } else if (profile.display_name.length > 50) {
      newErrors.display_name = 'Display name must be less than 50 characters';
    }

    if (!profile.country) {
      newErrors.country = 'Country is required';
    }

    if (!profile.age_range) {
      newErrors.age_range = 'Age range is required';
    }

    if (profile.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInterestToggle = (interest: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSave = async () => {
    if (!validateProfile()) return;

    setSaving(true);
    try {
      const { error } = await (supabase
        .from('profiles')
        .update as any)({
          display_name: profile.display_name.trim(),
          country: profile.country,
          age_range: profile.age_range,
          gender: profile.gender,
          interests: profile.interests,
          bio: profile.bio.trim(),
          profile_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrors({ general: 'Failed to save profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const isValid = profile.display_name.trim() && profile.country && profile.age_range;

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div className="bg-indigo-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <UserIcon className="h-6 w-6 text-indigo-600" />
          <h3 className="text-lg font-semibold text-indigo-900">Complete Your Profile</h3>
        </div>
        <p className="text-indigo-800 leading-relaxed">
          Help us personalize your experience and connect you with relevant feedback. 
          This information helps reviewers understand your perspective and background.
        </p>
      </div>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{errors.general}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Basic Information
          </h4>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name *
            </label>
            <input
              type="text"
              value={profile.display_name}
              onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
              placeholder="What should we call you?"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.display_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.display_name && (
              <p className="mt-1 text-sm text-red-600">{errors.display_name}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              This is how other users will see you (can be changed later)
            </p>
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="inline h-4 w-4 mr-1" />
              Country *
            </label>
            <select
              value={profile.country}
              onChange={(e) => setProfile(prev => ({ ...prev, country: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.country ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Select your country</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            {errors.country && (
              <p className="mt-1 text-sm text-red-600">{errors.country}</p>
            )}
          </div>

          {/* Age Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Age Range *
            </label>
            <select
              value={profile.age_range}
              onChange={(e) => setProfile(prev => ({ ...prev, age_range: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.age_range ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Select age range</option>
              {ageRanges.map(range => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
            {errors.age_range && (
              <p className="mt-1 text-sm text-red-600">{errors.age_range}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender (Optional)
            </label>
            <select
              value={profile.gender}
              onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {genderOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Interests and Bio */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-gray-900">Personalization</h4>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Interests (Optional)
            </label>
            <p className="text-sm text-gray-600 mb-4">
              Select topics you're interested in to get more relevant requests to review
            </p>
            <div className="grid grid-cols-2 gap-2">
              {interestOptions.map(interest => (
                <label
                  key={interest}
                  className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    profile.interests.includes(interest)
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={profile.interests.includes(interest)}
                    onChange={() => handleInterestToggle(interest)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{interest}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Selected: {profile.interests.length} interests
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio (Optional)
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us a bit about yourself... (optional)"
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${
                errors.bio ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.bio && (
              <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {profile.bio.length}/500 characters
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Note */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-medium text-gray-900 mb-2">Privacy & Safety</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Your real name and email are never shared with other users</li>
          <li>• Only your display name and general location (country) are visible to others</li>
          <li>• You can update your profile information at any time</li>
          <li>• All interactions remain anonymous unless you choose to share personal details</li>
        </ul>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!isValid || saving || loading}
          className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving || loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving Profile...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5" />
              Save Profile & Continue
            </>
          )}
        </button>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { User, MapPin, Briefcase, Heart, GraduationCap, DollarSign, Sparkles, Check, ChevronRight } from 'lucide-react';
import { toast } from '@/components/ui/toast';

interface JudgeDemographics {
  age_range: string | null;
  gender: string | null;
  location: string | null;
  education_level: string | null;
  profession: string | null;
  relationship_status: string | null;
  income_range: string | null;
  interests: string[];
}

interface JudgeDemographicsFormProps {
  onComplete?: () => void;
  onSkip?: () => void;
  compact?: boolean;
  requiredFields?: (keyof JudgeDemographics)[];
}

const AGE_RANGES = [
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45-54', label: '45-54' },
  { value: '55-64', label: '55-64' },
  { value: '65+', label: '65+' },
];

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const EDUCATION_LEVELS = [
  { value: 'high-school', label: 'High School' },
  { value: 'some-college', label: 'Some College' },
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'masters', label: "Master's Degree" },
  { value: 'doctorate', label: 'Doctorate' },
  { value: 'other', label: 'Other' },
];

const RELATIONSHIP_STATUSES = [
  { value: 'single', label: 'Single' },
  { value: 'dating', label: 'Dating' },
  { value: 'in-relationship', label: 'In a Relationship' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const INCOME_RANGES = [
  { value: 'under-25k', label: 'Under $25,000' },
  { value: '25k-50k', label: '$25,000 - $50,000' },
  { value: '50k-75k', label: '$50,000 - $75,000' },
  { value: '75k-100k', label: '$75,000 - $100,000' },
  { value: '100k-150k', label: '$100,000 - $150,000' },
  { value: 'over-150k', label: 'Over $150,000' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const INTERESTS = [
  'Fashion & Style',
  'Technology',
  'Fitness & Health',
  'Travel',
  'Food & Dining',
  'Gaming',
  'Business & Career',
  'Arts & Culture',
  'Music',
  'Sports',
  'Photography',
  'Movies & TV',
  'Reading',
  'Outdoor Activities',
  'Home & Garden',
  'Parenting',
];

const PROFESSIONS = [
  'Technology / IT',
  'Healthcare',
  'Education',
  'Finance / Banking',
  'Marketing / Advertising',
  'Sales',
  'Creative / Design',
  'Engineering',
  'Legal',
  'Real Estate',
  'Hospitality',
  'Retail',
  'Manufacturing',
  'Student',
  'Retired',
  'Other',
];

export function JudgeDemographicsForm({
  onComplete,
  onSkip,
  compact = false,
  requiredFields = ['age_range', 'gender'],
}: JudgeDemographicsFormProps) {
  const [demographics, setDemographics] = useState<JudgeDemographics>({
    age_range: null,
    gender: null,
    location: null,
    education_level: null,
    profession: null,
    relationship_status: null,
    income_range: null,
    interests: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);

  const steps = compact
    ? [{ title: 'Basic Info', fields: ['age_range', 'gender', 'location'] as const, icon: User }]
    : [
        { title: 'Basic Info', fields: ['age_range', 'gender'] as const, icon: User },
        { title: 'Background', fields: ['location', 'education_level', 'profession'] as const, icon: Briefcase },
        { title: 'Lifestyle', fields: ['relationship_status', 'income_range'] as const, icon: Heart },
        { title: 'Interests', fields: ['interests'] as const, icon: Sparkles },
      ];

  useEffect(() => {
    fetchDemographics();
  }, []);

  const fetchDemographics = async () => {
    try {
      const res = await fetch('/api/judge/demographics');
      if (res.ok) {
        const data = await res.json();
        if (data.demographics) {
          setDemographics({
            age_range: data.demographics.age_range || null,
            gender: data.demographics.gender || null,
            location: data.demographics.location || null,
            education_level: data.demographics.education_level || null,
            profession: data.demographics.profession || null,
            relationship_status: data.demographics.relationship_status || null,
            income_range: data.demographics.income_range || null,
            interests: data.demographics.interest_areas || [],
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch demographics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    for (const field of requiredFields) {
      if (!demographics[field] || (Array.isArray(demographics[field]) && demographics[field].length === 0)) {
        toast.error(`Please complete all required fields`);
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch('/api/judge/demographics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age_range: demographics.age_range,
          gender: demographics.gender,
          location: demographics.location,
          education_level: demographics.education_level,
          profession: demographics.profession,
          relationship_status: demographics.relationship_status,
          income_range: demographics.income_range,
          interest_areas: demographics.interests,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save demographics');
      }

      toast.success('Demographics saved successfully!');
      onComplete?.();
    } catch (error) {
      toast.error('Failed to save demographics. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof JudgeDemographics, value: any) => {
    setDemographics((prev) => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interest: string) => {
    setDemographics((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const isStepComplete = (stepIndex: number) => {
    const stepFields = steps[stepIndex].fields;
    return stepFields.every((field) => {
      const value = demographics[field];
      if (field === 'interests') return true; // Interests are optional
      return value !== null && value !== '';
    });
  };

  const canProceed = () => {
    if (step < steps.length - 1) {
      return isStepComplete(step);
    }
    return requiredFields.every((field) => {
      const value = demographics[field];
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== '';
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const renderField = (field: keyof JudgeDemographics) => {
    const isRequired = requiredFields.includes(field);

    switch (field) {
      case 'age_range':
        return (
          <div key={field} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Age Range {isRequired && <span className="text-red-500">*</span>}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {AGE_RANGES.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateField('age_range', option.value)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition cursor-pointer ${
                    demographics.age_range === option.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'gender':
        return (
          <div key={field} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Gender {isRequired && <span className="text-red-500">*</span>}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GENDERS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateField('gender', option.value)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition cursor-pointer ${
                    demographics.gender === option.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'location':
        return (
          <div key={field} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <MapPin className="inline h-4 w-4 mr-1" />
              Location {isRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={demographics.location || ''}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder="City, Country"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        );

      case 'education_level':
        return (
          <div key={field} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <GraduationCap className="inline h-4 w-4 mr-1" />
              Education Level {isRequired && <span className="text-red-500">*</span>}
            </label>
            <select
              value={demographics.education_level || ''}
              onChange={(e) => updateField('education_level', e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select...</option>
              {EDUCATION_LEVELS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'profession':
        return (
          <div key={field} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Briefcase className="inline h-4 w-4 mr-1" />
              Profession {isRequired && <span className="text-red-500">*</span>}
            </label>
            <select
              value={demographics.profession || ''}
              onChange={(e) => updateField('profession', e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select...</option>
              {PROFESSIONS.map((profession) => (
                <option key={profession} value={profession}>
                  {profession}
                </option>
              ))}
            </select>
          </div>
        );

      case 'relationship_status':
        return (
          <div key={field} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Heart className="inline h-4 w-4 mr-1" />
              Relationship Status {isRequired && <span className="text-red-500">*</span>}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {RELATIONSHIP_STATUSES.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateField('relationship_status', option.value)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition cursor-pointer ${
                    demographics.relationship_status === option.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'income_range':
        return (
          <div key={field} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <DollarSign className="inline h-4 w-4 mr-1" />
              Household Income {isRequired && <span className="text-red-500">*</span>}
            </label>
            <select
              value={demographics.income_range || ''}
              onChange={(e) => updateField('income_range', e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select...</option>
              {INCOME_RANGES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'interests':
        return (
          <div key={field} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Sparkles className="inline h-4 w-4 mr-1" />
              Interests (select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition cursor-pointer ${
                    demographics.interests.includes(interest)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {demographics.interests.includes(interest) && (
                    <Check className="inline h-3 w-3 mr-1" />
                  )}
                  {interest}
                </button>
              ))}
            </div>
            {demographics.interests.length > 0 && (
              <p className="text-sm text-gray-500">
                {demographics.interests.length} selected
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (compact) {
    return (
      <div className="space-y-4">
        {steps[0].fields.map((field) => renderField(field))}
        <div className="flex gap-3 pt-4">
          {onSkip && (
            <button
              onClick={onSkip}
              className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 cursor-pointer"
            >
              Skip for now
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!canProceed() || saving}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition cursor-pointer ${
              canProceed() && !saving
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  const currentStep = steps[step];
  const StepIcon = currentStep.icon || User;

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition ${
                i < step
                  ? 'bg-emerald-500 text-white'
                  : i === step
                  ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-1 ${
                  i < step ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 mb-3">
          <StepIcon className="h-6 w-6 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">{currentStep.title}</h2>
        <p className="text-sm text-gray-600 mt-1">
          Help us match you with relevant tests
        </p>
      </div>

      {/* Fields */}
      <div className="space-y-6 mb-8">
        {currentStep.fields.map((field) => renderField(field))}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 cursor-pointer"
          >
            Back
          </button>
        )}
        {onSkip && step === 0 && (
          <button
            onClick={onSkip}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 cursor-pointer"
          >
            Skip for now
          </button>
        )}
        <div className="flex-1" />
        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!isStepComplete(step)}
            className={`px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 cursor-pointer ${
              isStepComplete(step)
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={!canProceed() || saving}
            className={`px-6 py-2 rounded-lg font-medium transition cursor-pointer ${
              canProceed() && !saving
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving...' : 'Complete Setup'}
          </button>
        )}
      </div>
    </div>
  );
}

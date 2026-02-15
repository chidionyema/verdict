'use client';

import { useState } from 'react';
import {
  Users,
  Plus,
  X,
  Edit2,
  Check,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface Segment {
  id: string;
  name: string;
  demographicFilters: {
    age_range?: string[];
    gender?: string[];
    location?: string[];
  };
  psychographicFilters?: {
    interests?: string[];
    values?: string[];
  };
  targetCount: number;
  estimatedAvailable?: number;
}

interface SegmentBuilderProps {
  segments: Segment[];
  onSegmentsChange: (segments: Segment[]) => void;
  maxSegments?: number;
  minSegments?: number;
  creditCostPerVerdict?: number;
}

const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
];
const SAMPLE_SIZES = [3, 5, 10];

const SEGMENT_PRESETS = [
  {
    id: 'gender-comparison',
    name: 'Gender Comparison',
    description: 'Compare responses between men and women',
    segments: [
      { name: 'Men', filters: { gender: ['male'] } },
      { name: 'Women', filters: { gender: ['female'] } },
    ],
  },
  {
    id: 'age-groups',
    name: 'Age Groups',
    description: 'Compare younger vs older demographics',
    segments: [
      { name: 'Young Adults (18-34)', filters: { age_range: ['18-24', '25-34'] } },
      { name: 'Adults (35-54)', filters: { age_range: ['35-44', '45-54'] } },
    ],
  },
  {
    id: 'detailed-age',
    name: 'Detailed Age Breakdown',
    description: 'Four age segments for detailed analysis',
    segments: [
      { name: '18-24', filters: { age_range: ['18-24'] } },
      { name: '25-34', filters: { age_range: ['25-34'] } },
      { name: '35-44', filters: { age_range: ['35-44'] } },
      { name: '45+', filters: { age_range: ['45-54', '55-64', '65+'] } },
    ],
  },
];

export function SegmentBuilder({
  segments,
  onSegmentsChange,
  maxSegments = 5,
  minSegments = 2,
  creditCostPerVerdict = 0.4,
}: SegmentBuilderProps) {
  const [editingSegment, setEditingSegment] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(segments.length === 0);
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);

  const addSegment = () => {
    if (segments.length >= maxSegments) return;

    const newSegment: Segment = {
      id: `segment-${Date.now()}`,
      name: `Segment ${segments.length + 1}`,
      demographicFilters: {},
      targetCount: 5,
    };

    onSegmentsChange([...segments, newSegment]);
    setEditingSegment(newSegment.id);
    setExpandedSegment(newSegment.id);
  };

  const removeSegment = (id: string) => {
    onSegmentsChange(segments.filter((s) => s.id !== id));
  };

  const updateSegment = (id: string, updates: Partial<Segment>) => {
    onSegmentsChange(
      segments.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const applyPreset = (presetId: string) => {
    const preset = SEGMENT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const newSegments: Segment[] = preset.segments.map((s, i) => ({
      id: `segment-${Date.now()}-${i}`,
      name: s.name,
      demographicFilters: s.filters,
      targetCount: 5,
    }));

    onSegmentsChange(newSegments);
    setShowPresets(false);
  };

  const toggleFilter = (
    segmentId: string,
    filterType: 'age_range' | 'gender',
    value: string
  ) => {
    const segment = segments.find((s) => s.id === segmentId);
    if (!segment) return;

    const currentValues = segment.demographicFilters[filterType] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    updateSegment(segmentId, {
      demographicFilters: {
        ...segment.demographicFilters,
        [filterType]: newValues.length > 0 ? newValues : undefined,
      },
    });
  };

  const totalVerdicts = segments.reduce((sum, s) => sum + s.targetCount, 0);
  const totalCost = Math.ceil(totalVerdicts * creditCostPerVerdict);

  const hasFilters = (segment: Segment) => {
    const { demographicFilters } = segment;
    return (
      (demographicFilters.age_range?.length || 0) > 0 ||
      (demographicFilters.gender?.length || 0) > 0 ||
      (demographicFilters.location?.length || 0) > 0
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            Audience Segments
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Define who should judge your test for segmented insights
          </p>
        </div>
        {segments.length > 0 && (
          <div className="text-right">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-lg font-semibold text-indigo-600">
              {totalVerdicts} verdicts • {totalCost} credits
            </div>
          </div>
        )}
      </div>

      {/* Presets */}
      {showPresets && segments.length === 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span className="font-medium text-indigo-900">Quick Start Presets</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SEGMENT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className="text-left p-3 bg-white rounded-lg border border-indigo-200 hover:border-indigo-400 transition cursor-pointer"
              >
                <div className="font-medium text-gray-900">{preset.name}</div>
                <div className="text-sm text-gray-600">{preset.description}</div>
                <div className="text-xs text-indigo-600 mt-1">
                  {preset.segments.length} segments
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setShowPresets(false);
              addSegment();
            }}
            className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            Or create custom segments
          </button>
        </div>
      )}

      {/* Segments List */}
      {segments.length > 0 && (
        <div className="space-y-3">
          {segments.map((segment, index) => (
            <div
              key={segment.id}
              className={`border rounded-xl transition ${
                expandedSegment === segment.id
                  ? 'border-indigo-300 bg-indigo-50/50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Segment Header */}
              <button
                type="button"
                className="w-full p-4 flex items-center justify-between cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 rounded-xl"
                onClick={() =>
                  setExpandedSegment(
                    expandedSegment === segment.id ? null : segment.id
                  )
                }
                aria-expanded={expandedSegment === segment.id}
                aria-controls={`segment-content-${segment.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    {editingSegment === segment.id ? (
                      <input
                        type="text"
                        value={segment.name}
                        onChange={(e) =>
                          updateSegment(segment.id, { name: e.target.value })
                        }
                        onBlur={() => setEditingSegment(null)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && setEditingSegment(null)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-gray-900 border-b border-indigo-500 bg-transparent focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {segment.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSegment(segment.id);
                          }}
                          className="text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      {hasFilters(segment) ? (
                        <>
                          {segment.demographicFilters.gender?.join(', ')}
                          {segment.demographicFilters.gender &&
                            segment.demographicFilters.age_range &&
                            ' • '}
                          {segment.demographicFilters.age_range?.join(', ')}
                        </>
                      ) : (
                        <span className="text-amber-600">No filters set</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {segment.targetCount} verdicts
                    </div>
                    <div className="text-xs text-gray-500">
                      ~{Math.ceil(segment.targetCount * creditCostPerVerdict)} credits
                    </div>
                  </div>
                  {segments.length > minSegments && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSegment(segment.id);
                      }}
                      className="text-gray-400 hover:text-red-500 transition cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                  {expandedSegment === segment.id ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {expandedSegment === segment.id && (
                <div
                  id={`segment-content-${segment.id}`}
                  className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4"
                  role="region"
                  aria-label={`${segment.name} settings`}
                >
                  {/* Gender Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {GENDERS.map((gender) => (
                        <button
                          key={gender.value}
                          onClick={() =>
                            toggleFilter(segment.id, 'gender', gender.value)
                          }
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition cursor-pointer ${
                            segment.demographicFilters.gender?.includes(
                              gender.value
                            )
                              ? 'bg-indigo-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {segment.demographicFilters.gender?.includes(
                            gender.value
                          ) && <Check className="inline h-3 w-3 mr-1" />}
                          {gender.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age Range
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AGE_RANGES.map((age) => (
                        <button
                          key={age}
                          onClick={() =>
                            toggleFilter(segment.id, 'age_range', age)
                          }
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition cursor-pointer ${
                            segment.demographicFilters.age_range?.includes(age)
                              ? 'bg-indigo-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {segment.demographicFilters.age_range?.includes(
                            age
                          ) && <Check className="inline h-3 w-3 mr-1" />}
                          {age}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sample Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verdicts per Segment
                    </label>
                    <div className="flex gap-2">
                      {SAMPLE_SIZES.map((size) => (
                        <button
                          key={size}
                          onClick={() =>
                            updateSegment(segment.id, { targetCount: size })
                          }
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                            segment.targetCount === size
                              ? 'bg-indigo-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {size} verdicts
                        </button>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {segment.targetCount === 3 && 'Quick signal'}
                      {segment.targetCount === 5 && 'Moderate confidence'}
                      {segment.targetCount === 10 && 'High confidence'}
                    </div>
                  </div>

                  {/* Validation Warning */}
                  {!hasFilters(segment) && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        Add at least one filter to target specific demographics.
                        Without filters, this segment will receive verdicts from
                        any judge.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Segment Button */}
      {segments.length > 0 && segments.length < maxSegments && (
        <button
          onClick={addSegment}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          Add Segment ({segments.length}/{maxSegments})
        </button>
      )}

      {/* Validation */}
      {segments.length > 0 && segments.length < minSegments && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            You need at least {minSegments} segments for a split test. Add{' '}
            {minSegments - segments.length} more.
          </div>
        </div>
      )}

      {/* Summary */}
      {segments.length >= minSegments && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Split Test Summary</div>
              <div className="text-sm text-gray-600">
                {segments.length} segments • {totalVerdicts} total verdicts
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">
                {totalCost} credits
              </div>
              <div className="text-xs text-gray-500">Estimated cost</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

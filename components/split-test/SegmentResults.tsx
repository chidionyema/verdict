'use client';

import { useState } from 'react';
import {
  Trophy,
  Users,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  Share2,
  BarChart3,
  Star,
} from 'lucide-react';
import Image from 'next/image';

interface SegmentResult {
  id: string;
  name: string;
  demographicFilters: {
    age_range?: string[];
    gender?: string[];
  };
  targetCount: number;
  completedCount: number;
  winner: 'A' | 'B' | 'tie' | null;
  consensusStrength: number | null;
  avgRatingA: number | null;
  avgRatingB: number | null;
  votesA: number;
  votesB: number;
}

interface SegmentResultsProps {
  segments: SegmentResult[];
  photoAUrl: string;
  photoBUrl: string;
  overallWinner: 'A' | 'B' | 'tie' | null;
  overallConsensus: number | null;
  onExport?: () => void;
  onShare?: () => void;
}

export function SegmentResults({
  segments,
  photoAUrl,
  photoBUrl,
  overallWinner,
  overallConsensus,
  onExport,
  onShare,
}: SegmentResultsProps) {
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);

  const completedSegments = segments.filter((s) => s.winner !== null);
  const hasDivergence = completedSegments.length > 1 &&
    !completedSegments.every((s) => s.winner === completedSegments[0].winner);

  const getWinnerColor = (winner: 'A' | 'B' | 'tie' | null) => {
    if (winner === 'A') return 'text-green-600 bg-green-50 border-green-200';
    if (winner === 'B') return 'text-blue-600 bg-blue-50 border-blue-200';
    if (winner === 'tie') return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-gray-500 bg-gray-50 border-gray-200';
  };

  const getWinnerLabel = (winner: 'A' | 'B' | 'tie' | null) => {
    if (winner === 'A') return 'Photo A';
    if (winner === 'B') return 'Photo B';
    if (winner === 'tie') return 'Tie';
    return 'Pending';
  };

  return (
    <div className="space-y-6">
      {/* Divergence Alert */}
      {hasDivergence && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900">
                Divergence Detected
              </h3>
              <p className="text-sm text-purple-800 mt-1">
                Different audience segments prefer different options. This insight
                can help you target the right audience for each photo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Segment Comparison Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            Results by Segment
          </h3>
          <div className="flex items-center gap-2">
            {onExport && (
              <button
                onClick={onExport}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            )}
            {onShare && (
              <button
                onClick={onShare}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            )}
          </div>
        </div>

        {/* Header Row */}
        <div
          className="hidden sm:grid grid-cols-4 gap-4 p-4 bg-gray-50 text-sm font-medium text-gray-600"
          role="row"
          aria-hidden="true"
        >
          <div>Segment</div>
          <div className="text-center">Photo A</div>
          <div className="text-center">Photo B</div>
          <div className="text-center">Winner</div>
        </div>

        {/* Segment Rows */}
        <div role="list" aria-label="Segment results">
          {segments.map((segment) => (
          <div key={segment.id} className="border-t border-gray-100" role="listitem">
            <button
              className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-4 items-center cursor-pointer hover:bg-gray-50 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={() =>
                setExpandedSegment(
                  expandedSegment === segment.id ? null : segment.id
                )
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setExpandedSegment(
                    expandedSegment === segment.id ? null : segment.id
                  );
                }
              }}
              aria-expanded={expandedSegment === segment.id}
              aria-controls={`segment-details-${segment.id}`}
            >
              {/* Segment Name */}
              <div className="col-span-2 sm:col-span-1">
                <div className="font-medium text-gray-900">{segment.name}</div>
                <div className="text-xs text-gray-500">
                  {segment.completedCount}/{segment.targetCount} verdicts
                </div>
              </div>

              {/* Winner - on mobile, show first */}
              <div className="text-center flex items-center justify-end sm:justify-center gap-2 order-first sm:order-last col-span-2 sm:col-span-1 mb-2 sm:mb-0">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getWinnerColor(
                    segment.winner
                  )}`}
                >
                  {segment.winner && <Trophy className="inline h-3 w-3 mr-1" aria-hidden="true" />}
                  {getWinnerLabel(segment.winner)}
                </span>
                {expandedSegment === segment.id ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                )}
              </div>

              {/* Photo A Stats */}
              <div className="text-center">
                <div className="text-xs text-gray-500 sm:hidden mb-1">Photo A</div>
                {segment.winner !== null ? (
                  <>
                    <div className="text-lg font-semibold text-green-600">
                      {segment.votesA}
                    </div>
                    <div className="text-xs text-gray-500">
                      {segment.avgRatingA?.toFixed(1) || '-'}/10 avg
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400">-</div>
                )}
              </div>

              {/* Photo B Stats */}
              <div className="text-center">
                <div className="text-xs text-gray-500 sm:hidden mb-1">Photo B</div>
                {segment.winner !== null ? (
                  <>
                    <div className="text-lg font-semibold text-blue-600">
                      {segment.votesB}
                    </div>
                    <div className="text-xs text-gray-500">
                      {segment.avgRatingB?.toFixed(1) || '-'}/10 avg
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400">-</div>
                )}
              </div>
            </button>

            {/* Expanded Details */}
            {expandedSegment === segment.id && segment.winner !== null && (
              <div
                id={`segment-details-${segment.id}`}
                className="px-4 pb-4 bg-gray-50"
                role="region"
                aria-label={`Details for ${segment.name}`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Visual Bar */}
                  <div className="col-span-1 sm:col-span-2">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-sm text-gray-600">Vote Distribution</span>
                      <span className="text-sm text-gray-400">
                        ({segment.consensusStrength}% consensus)
                      </span>
                    </div>
                    <div
                      className="h-4 rounded-full overflow-hidden flex"
                      role="img"
                      aria-label={`Photo A: ${segment.votesA} votes, Photo B: ${segment.votesB} votes`}
                    >
                      <div
                        className="bg-green-500 transition-all"
                        style={{
                          width: `${
                            (segment.votesA /
                              (segment.votesA + segment.votesB)) *
                            100
                          }%`,
                        }}
                      />
                      <div
                        className="bg-blue-500 transition-all"
                        style={{
                          width: `${
                            (segment.votesB /
                              (segment.votesA + segment.votesB)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Photo A: {segment.votesA} votes</span>
                      <span>Photo B: {segment.votesB} votes</span>
                    </div>
                  </div>

                  {/* Filter Info */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      Demographic Filters
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {segment.demographicFilters.gender?.map((g) => (
                        <span
                          key={g}
                          className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs"
                        >
                          {g}
                        </span>
                      ))}
                      {segment.demographicFilters.age_range?.map((a) => (
                        <span
                          key={a}
                          className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs"
                        >
                          {a}
                        </span>
                      ))}
                      {!segment.demographicFilters.gender?.length &&
                        !segment.demographicFilters.age_range?.length && (
                          <span className="text-xs text-gray-400">
                            No filters (general audience)
                          </span>
                        )}
                    </div>
                  </div>

                  {/* Rating Comparison */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      Average Ratings
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-green-500" />
                        <span className="text-sm">
                          A: {segment.avgRatingA?.toFixed(1) || '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-blue-500" />
                        <span className="text-sm">
                          B: {segment.avgRatingB?.toFixed(1) || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          ))}
        </div>
      </div>

      {/* Cross-Tab Matrix */}
      {completedSegments.length >= 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            Cross-Segment Analysis
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">
                    Segment
                  </th>
                  <th className="text-center py-2 px-3 font-medium text-green-600">
                    Photo A %
                  </th>
                  <th className="text-center py-2 px-3 font-medium text-blue-600">
                    Photo B %
                  </th>
                  <th className="text-center py-2 px-3 font-medium text-gray-600">
                    Consensus
                  </th>
                </tr>
              </thead>
              <tbody>
                {completedSegments.map((segment) => {
                  const total = segment.votesA + segment.votesB;
                  const pctA = total > 0 ? Math.round((segment.votesA / total) * 100) : 0;
                  const pctB = total > 0 ? Math.round((segment.votesB / total) * 100) : 0;

                  return (
                    <tr key={segment.id} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-medium text-gray-900">
                        {segment.name}
                      </td>
                      <td
                        className={`text-center py-2 px-3 ${
                          segment.winner === 'A'
                            ? 'font-semibold text-green-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {pctA}%
                      </td>
                      <td
                        className={`text-center py-2 px-3 ${
                          segment.winner === 'B'
                            ? 'font-semibold text-blue-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {pctB}%
                      </td>
                      <td className="text-center py-2 px-3 text-gray-600">
                        {segment.consensusStrength}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audience Fit Recommendation */}
      {completedSegments.length >= 2 && hasDivergence && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
          <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Audience Fit Recommendations
          </h3>
          <div className="space-y-3">
            {['A', 'B'].map((photo) => {
              const preferringSegments = completedSegments.filter(
                (s) => s.winner === photo
              );
              if (preferringSegments.length === 0) return null;

              return (
                <div key={photo} className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                      photo === 'A' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                  >
                    {photo}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      Photo {photo} resonates with:
                    </div>
                    <div className="text-sm text-gray-600">
                      {preferringSegments.map((s) => s.name).join(', ')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

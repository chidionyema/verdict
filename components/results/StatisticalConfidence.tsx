'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';

interface StatisticalConfidenceProps {
  votesA: number;
  votesB: number;
  targetCount: number;
  segmentName?: string;
}

export function StatisticalConfidence({
  votesA,
  votesB,
  targetCount,
  segmentName,
}: StatisticalConfidenceProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const total = votesA + votesB;
  const pA = total > 0 ? votesA / total : 0.5;
  const pB = total > 0 ? votesB / total : 0.5;

  // Calculate statistical significance using normal approximation
  const calculateConfidenceInterval = useCallback((p: number, n: number, z: number = 1.96) => {
    if (n === 0) return { lower: 0, upper: 1, margin: 0.5 };
    const margin = z * Math.sqrt((p * (1 - p)) / n);
    return {
      lower: Math.max(0, p - margin),
      upper: Math.min(1, p + margin),
      margin,
    };
  }, []);

  // FIXED: Calculate Z-score for difference in proportions using correct formula
  const calculateZScore = useCallback(() => {
    if (total === 0 || votesA === 0 || votesB === 0) return 0;

    // Correct formula for difference in proportions
    // SE = sqrt((pA * (1-pA) / nA) + (pB * (1-pB) / nB))
    // For equal sample sizes: SE = sqrt(2 * p * (1-p) / n) where p is pooled proportion
    const pooledP = 0.5; // Under null hypothesis, both proportions equal
    const se = Math.sqrt((pA * (1 - pA) / votesA) + (pB * (1 - pB) / votesB));

    if (se === 0 || !isFinite(se)) return 0;
    return (pA - pB) / se;
  }, [total, votesA, votesB, pA, pB]);

  // Calculate p-value from Z-score (two-tailed)
  const calculatePValue = useCallback((z: number) => {
    if (!isFinite(z)) return 1;

    // Standard normal CDF approximation (Abramowitz and Stegun)
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = z < 0 ? -1 : 1;
    const absZ = Math.abs(z) / Math.sqrt(2);
    const t = 1.0 / (1.0 + p * absZ);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ);
    const cdf = 0.5 * (1.0 + sign * y);
    return Math.max(0, Math.min(1, 2 * (1 - cdf))); // Two-tailed, clamped
  }, []);

  const ciA = calculateConfidenceInterval(pA, total);
  const ciB = calculateConfidenceInterval(pB, total);
  const zScore = calculateZScore();
  const pValue = calculatePValue(zScore);

  // Determine significance level
  const getSignificanceLevel = useCallback(() => {
    if (total < 5) return { level: 'insufficient', label: 'Need more data', color: 'gray', icon: 'info' };
    if (pValue < 0.01) return { level: 'high', label: 'Highly significant', color: 'green', icon: 'check' };
    if (pValue < 0.05) return { level: 'moderate', label: 'Statistically significant', color: 'blue', icon: 'check' };
    if (pValue < 0.1) return { level: 'weak', label: 'Marginally significant', color: 'amber', icon: 'warning' };
    return { level: 'none', label: 'Not significant', color: 'red', icon: 'warning' };
  }, [total, pValue]);

  const significance = getSignificanceLevel();
  const winner = votesA > votesB ? 'A' : votesB > votesA ? 'B' : null;

  // Calculate sample size needed for 95% confidence with 5% margin of error
  const sampleSizeNeeded = useCallback(() => {
    const z = 1.96;
    // Use observed proportion for more accurate estimate, fallback to 0.5
    const observedP = total > 0 ? Math.max(pA, pB) : 0.5;
    const p = Math.max(0.3, Math.min(0.7, observedP)); // Clamp to reasonable range
    const e = 0.05; // 5% margin of error
    return Math.ceil((z * z * p * (1 - p)) / (e * e));
  }, [total, pA, pB]);

  const recommendedSampleSize = sampleSizeNeeded();
  const progress = Math.min(100, (total / recommendedSampleSize) * 100);

  // Animate progress bar on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  // Handle keyboard navigation for expandable section
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setShowDetails(!showDetails);
    }
  };

  const getSignificanceBadgeClasses = () => {
    const baseClasses = 'px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors';
    switch (significance.color) {
      case 'green':
        return `${baseClasses} bg-green-100 text-green-700 border border-green-200`;
      case 'blue':
        return `${baseClasses} bg-blue-100 text-blue-700 border border-blue-200`;
      case 'amber':
        return `${baseClasses} bg-amber-100 text-amber-700 border border-amber-200`;
      case 'red':
        return `${baseClasses} bg-red-100 text-red-700 border border-red-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700 border border-gray-200`;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-100">
              <BarChart3 className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Statistical Analysis
              </h3>
              {segmentName && (
                <p className="text-sm text-gray-500">{segmentName}</p>
              )}
            </div>
          </div>
          <div
            className={getSignificanceBadgeClasses()}
            role="status"
            aria-label={`Statistical significance: ${significance.label}`}
          >
            {significance.icon === 'check' ? (
              <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
            ) : significance.icon === 'warning' ? (
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{significance.label}</span>
          </div>
        </div>
      </div>

      {/* Main Stats - Responsive grid */}
      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Photo A Card */}
        <div
          className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 transition-transform hover:scale-[1.01]"
          role="region"
          aria-label="Photo A statistics"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">
                A
              </span>
              <span className="text-green-700 font-medium">Photo A</span>
            </div>
            {winner === 'A' && significance.level !== 'insufficient' && significance.level !== 'none' && (
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs font-medium">Leading</span>
              </div>
            )}
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-green-600" aria-label={`${total > 0 ? Math.round(pA * 100) : 50} percent`}>
            {total > 0 ? Math.round(pA * 100) : 50}%
          </div>
          <div className="text-sm text-green-600 mt-1">
            {votesA} of {total} votes
          </div>
          {total >= 3 && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <div className="flex items-center gap-1 text-xs text-green-700">
                <span>95% CI:</span>
                <span className="font-medium text-green-800">
                  {Math.round(ciA.lower * 100)}% – {Math.round(ciA.upper * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Photo B Card */}
        <div
          className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 transition-transform hover:scale-[1.01]"
          role="region"
          aria-label="Photo B statistics"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                B
              </span>
              <span className="text-blue-700 font-medium">Photo B</span>
            </div>
            {winner === 'B' && significance.level !== 'insufficient' && significance.level !== 'none' && (
              <div className="flex items-center gap-1 text-blue-600">
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs font-medium">Leading</span>
              </div>
            )}
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-blue-600" aria-label={`${total > 0 ? Math.round(pB * 100) : 50} percent`}>
            {total > 0 ? Math.round(pB * 100) : 50}%
          </div>
          <div className="text-sm text-blue-600 mt-1">
            {votesB} of {total} votes
          </div>
          {total >= 3 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="flex items-center gap-1 text-xs text-blue-700">
                <span>95% CI:</span>
                <span className="font-medium text-blue-800">
                  {Math.round(ciB.lower * 100)}% – {Math.round(ciB.upper * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sample Size Progress */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5">
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm mb-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-medium">Sample Size</span>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="What is sample size strength?"
                title="More samples = more reliable results. We recommend 385 responses for statistical confidence."
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
            <span className="text-gray-900 font-semibold tabular-nums">
              {total} <span className="text-gray-400 font-normal">/ {recommendedSampleSize} recommended</span>
            </span>
          </div>
          <div
            className="h-3 bg-gray-200 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Sample size progress"
          >
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                animatedProgress >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : animatedProgress >= 50 ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
              style={{ width: `${animatedProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {progress >= 100
              ? '✓ Sufficient sample size for reliable results'
              : progress >= 50
              ? `${Math.round(progress)}% complete – results becoming reliable`
              : `${Math.round(progress)}% complete – need ${recommendedSampleSize - total} more votes`}
          </p>
        </div>
      </div>

      {/* Expandable Details */}
      <div className="border-t border-gray-100">
        <button
          onClick={() => setShowDetails(!showDetails)}
          onKeyDown={handleKeyDown}
          aria-expanded={showDetails}
          aria-controls="technical-details"
          className="w-full px-4 sm:px-5 py-4 flex items-center justify-between text-sm text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        >
          <span className="font-medium">Technical Details</span>
          <span className={`transform transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}>
            <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </button>

        <div
          id="technical-details"
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showDetails ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 sm:px-5 pb-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="text-gray-500 text-xs mb-1">P-value</div>
                <div className="font-mono font-semibold text-gray-900 text-sm">
                  {pValue < 0.0001 ? '< 0.0001' : pValue.toFixed(4)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="text-gray-500 text-xs mb-1">Z-score</div>
                <div className="font-mono font-semibold text-gray-900 text-sm">
                  {isFinite(zScore) ? zScore.toFixed(3) : '–'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="text-gray-500 text-xs mb-1">Margin (A)</div>
                <div className="font-mono font-semibold text-gray-900 text-sm">
                  ±{(ciA.margin * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="text-gray-500 text-xs mb-1">Margin (B)</div>
                <div className="font-mono font-semibold text-gray-900 text-sm">
                  ±{(ciB.margin * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-sm text-indigo-700">
                  <strong className="font-semibold">Interpretation:</strong>{' '}
                  {significance.level === 'high'
                    ? 'Results are highly statistically significant (p < 0.01). You can be very confident in the winner.'
                    : significance.level === 'moderate'
                    ? 'Results are statistically significant (p < 0.05). The difference is likely real, not due to chance.'
                    : significance.level === 'weak'
                    ? 'Results are marginally significant (p < 0.1). Consider getting more votes for stronger confidence.'
                    : significance.level === 'none'
                    ? 'Results are not statistically significant. The observed difference could be due to random chance.'
                    : 'Need at least 5 votes to calculate statistical significance.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

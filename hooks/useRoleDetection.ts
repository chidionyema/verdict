'use client';

import { useState, useEffect, useCallback } from 'react';

export interface RoleMetrics {
  requestCount: number;
  verdictCount: number;
  primaryRole: 'seeker' | 'judge' | 'balanced';
  isJudge: boolean;
  hasActivity: boolean;
  loading: boolean;
}

const detectPrimaryRole = (
  requests: number,
  verdicts: number
): 'seeker' | 'judge' | 'balanced' => {
  if (requests === 0 && verdicts === 0) return 'balanced';
  const ratio = verdicts / (requests || 1);
  if (ratio > 2) return 'judge'; // 2x more verdicts than requests
  if (ratio < 0.5) return 'seeker'; // 2x more requests than verdicts
  return 'balanced';
};

export function useRoleDetection(): RoleMetrics {
  const [metrics, setMetrics] = useState<RoleMetrics>({
    requestCount: 0,
    verdictCount: 0,
    primaryRole: 'balanced',
    isJudge: false,
    hasActivity: false,
    loading: true,
  });

  const fetchMetrics = useCallback(async () => {
    try {
      // Fetch both requests and judge stats in parallel
      const [requestsRes, statsRes] = await Promise.all([
        fetch('/api/requests'),
        fetch('/api/judge/stats'),
      ]);

      let requestCount = 0;
      let verdictCount = 0;
      let isJudge = false;

      if (requestsRes.ok) {
        const { requests } = await requestsRes.json();
        requestCount = requests?.length || 0;
      }

      if (statsRes.ok) {
        const stats = await statsRes.json();
        verdictCount = stats?.verdicts_given || 0;
        isJudge = true; // If stats endpoint works, user is a judge
      }

      const primaryRole = detectPrimaryRole(requestCount, verdictCount);
      const hasActivity = requestCount > 0 || verdictCount > 0;

      setMetrics({
        requestCount,
        verdictCount,
        primaryRole,
        isJudge,
        hasActivity,
        loading: false,
      });
    } catch (error) {
      console.error('Role detection error:', error);
      setMetrics((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return metrics;
}

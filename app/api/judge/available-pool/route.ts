import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/judge/available-pool - Get available judge pool for preferences
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      age_ranges = [],
      genders = [],
      ethnicities = [],
      education_levels = [],
      professions = [],
      locations = [],
      lifestyle_tags = [],
      interests = [],
      priority_mode = 'balanced'
    } = body;

    // Build dynamic query based on filters
    let query = supabase
      .from('judge_demographics')
      .select(`
        judge_id,
        age_range,
        gender,
        profession,
        location,
        education_level,
        quality_score,
        judge_availability!inner(
          is_available,
          avg_response_time_minutes,
          current_daily_verdicts,
          max_daily_verdicts
        )
      `)
      .eq('judge_availability.is_available', true)
      .lt('judge_availability.current_daily_verdicts', 'judge_availability.max_daily_verdicts');

    // Apply demographic filters
    if (age_ranges.length > 0 && !age_ranges.includes('All ages')) {
      query = query.in('age_range', age_ranges);
    }

    if (genders.length > 0 && !genders.includes('All genders')) {
      query = query.in('gender', genders);
    }

    if (ethnicities.length > 0 && !ethnicities.includes('All ethnicities')) {
      query = query.overlaps('ethnicity', ethnicities);
    }

    if (education_levels.length > 0) {
      query = query.in('education_level', education_levels);
    }

    if (professions.length > 0) {
      query = query.in('profession', professions);
    }

    if (interests.length > 0) {
      query = query.overlaps('interest_areas', interests);
    }

    if (lifestyle_tags.length > 0) {
      query = query.overlaps('lifestyle_tags', lifestyle_tags);
    }

    const { data: availableJudges, error } = await query;

    if (error) {
      console.error('Available judges query error:', error);
      return NextResponse.json({ 
        error: 'Database error',
        details: error.message 
      }, { status: 500 });
    }

    // Calculate metrics
    const poolSize = availableJudges?.length || 0;
    
    const avgResponseTime = poolSize > 0 
      ? Math.round(
          availableJudges.reduce((sum, judge) => 
            sum + (judge.judge_availability?.avg_response_time_minutes || 30), 0
          ) / poolSize
        )
      : 30;

    // Calculate diversity score
    const demographics = {
      age_groups: new Set(availableJudges?.map(j => j.age_range).filter(Boolean)).size,
      genders: new Set(availableJudges?.map(j => j.gender).filter(Boolean)).size,
      professions: new Set(availableJudges?.map(j => j.profession).filter(Boolean)).size,
      locations: new Set(availableJudges?.map(j => j.location).filter(Boolean)).size,
    };

    const diversityScore = Math.min(10, 
      (demographics.age_groups * 2) + 
      (demographics.genders * 2) + 
      (demographics.professions * 1.5) + 
      (demographics.locations * 1)
    );

    // Calculate expertise match
    const expertiseScore = poolSize > 0
      ? Math.min(10, 
          availableJudges.reduce((sum, judge) => 
            sum + (judge.quality_score || 5), 0
          ) / poolSize
        )
      : 5;

    // Estimate response time based on priority mode
    let estimatedResponseTime = avgResponseTime;
    switch (priority_mode) {
      case 'speed':
        estimatedResponseTime = Math.max(5, avgResponseTime * 0.7);
        break;
      case 'diversity':
        estimatedResponseTime = avgResponseTime * 1.3;
        break;
      case 'expertise':
        estimatedResponseTime = avgResponseTime * 1.1;
        break;
      default: // balanced
        estimatedResponseTime = avgResponseTime;
    }

    // Demographics breakdown for display
    const breakdown = {
      age: {},
      gender: {},
      profession: {},
      location: {}
    };

    availableJudges?.forEach(judge => {
      if (judge.age_range) {
        breakdown.age[judge.age_range] = (breakdown.age[judge.age_range] || 0) + 1;
      }
      if (judge.gender) {
        breakdown.gender[judge.gender] = (breakdown.gender[judge.gender] || 0) + 1;
      }
      if (judge.profession) {
        breakdown.profession[judge.profession] = (breakdown.profession[judge.profession] || 0) + 1;
      }
      if (judge.location) {
        const locationType = judge.location.toLowerCase().includes('new york') || 
                           judge.location.toLowerCase().includes('los angeles') ||
                           judge.location.toLowerCase().includes('chicago') ? 'Urban' : 'Other';
        breakdown.location[locationType] = (breakdown.location[locationType] || 0) + 1;
      }
    });

    return NextResponse.json({
      pool: {
        total_available: poolSize,
        estimated_response_time: `${Math.round(estimatedResponseTime)} min`,
        diversity_score: Math.round(diversityScore * 10) / 10,
        expertise_match: Math.round(expertiseScore * 10) / 10,
        demographics_breakdown: breakdown
      },
      judges: availableJudges?.slice(0, 20) // Return top 20 for preview
    });
  } catch (error) {
    console.error('POST /api/judge/available-pool error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
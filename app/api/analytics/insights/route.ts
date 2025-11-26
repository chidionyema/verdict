import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('user_type') || 'requester';

    if (userType === 'judge') {
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('is_judge')
        .eq('id', user.id)
        .single();

      if (!profile?.is_judge) {
        return NextResponse.json({ error: 'Access denied. Judge account required.' }, { status: 403 });
      }

      return getJudgeInsights(user.id, supabase);
    } else {
      return getRequesterInsights(user.id, supabase);
    }

  } catch (error) {
    log.error('Analytics insights error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getRequesterInsights(userId: string, supabase: any) {
  try {
    const insights = [];

    // Get user data
    const { data: requests } = await supabase
      .from('verdict_requests')
      .select(`
        *,
        verdict_responses(rating, helpfulness, created_at)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!requests || requests.length === 0) {
      insights.push({
        type: 'tip',
        title: 'Get Started with Your First Request',
        description: 'Submit your first verdict request to start getting valuable feedback from our community of judges.',
        action: 'Create Request',
        action_url: '/start',
        priority: 'high',
      });
      
      return NextResponse.json({ insights });
    }

    // Response rate insight
    const totalRequests = requests.length;
    const requestsWithResponses = requests.filter(
      (r: any) => r.verdict_responses.length > 0
    ).length;
    const responseRate = requestsWithResponses / totalRequests;

    if (responseRate < 0.3) {
      insights.push({
        type: 'warning',
        title: 'Low Response Rate',
        description: `Only ${Math.round(responseRate * 100)}% of your requests have received responses. Try improving your request context and adding clear photos.`,
        action: 'View Tips',
        action_url: '/help/improving-requests',
        priority: 'high',
      });
    }

    // Category performance insight
    const categoryStats = requests.reduce(
      (acc: Record<string, any>, req: any) => {
        if (!acc[req.category]) {
          acc[req.category] = { count: 0, totalRating: 0, responses: 0 };
        }
        acc[req.category].count++;
        
        const avgRating =
          req.verdict_responses.length > 0
            ? req.verdict_responses.reduce(
                (sum: number, r: any) => sum + (r.rating || 0),
                0
              ) / req.verdict_responses.length
            : 0;
        
        if (avgRating > 0) {
          acc[req.category].totalRating += avgRating;
          acc[req.category].responses++;
        }
        
        return acc;
      },
      {} as Record<string, any>
    );

    let bestCategory = '';
    let bestRating = 0;
    
    Object.entries(categoryStats).forEach(([category, stats]) => {
      const s = stats as any;
      if (s.responses > 0) {
        const avgRating = s.totalRating / s.responses;
        if (avgRating > bestRating) {
          bestRating = avgRating;
          bestCategory = category;
        }
      }
    });

    if (bestCategory && bestRating > 7) {
      insights.push({
        type: 'success',
        title: `Strong Performance in ${bestCategory}`,
        description: `Your ${bestCategory.toLowerCase()} requests average ${bestRating.toFixed(1)}/10 rating. Consider focusing more requests in this category.`,
        priority: 'medium',
      });
    }

    // Credit usage insight
    const creditSpending = transactions
      .filter((t: any) => t.type === 'verdict_request')
      .slice(0, 10);
    
    if (creditSpending.length >= 5) {
      const recentSpending = creditSpending.slice(0, 5);
      const olderSpending = creditSpending.slice(5);
      
      const recentAvg =
        recentSpending.reduce(
          (sum: number, t: any) =>
            sum + Math.abs(t.credits_delta || 0),
          0
        ) / recentSpending.length;
      const olderAvg =
        olderSpending.reduce(
          (sum: number, t: any) =>
            sum + Math.abs(t.credits_delta || 0),
          0
        ) / olderSpending.length;
      
      if (recentAvg > olderAvg * 1.5) {
        insights.push({
          type: 'info',
          title: 'Increased Activity Detected',
          description: 'Your request frequency has increased recently. Consider a subscription plan for better value.',
          action: 'View Plans',
          action_url: '/pricing',
          priority: 'medium',
        });
      }
    }

    // Time-based insights
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentRequests = requests.filter(
      (r: any) => new Date(r.created_at) > last30Days
    );

    if (recentRequests.length === 0 && requests.length > 0) {
      const lastRequest = new Date(requests[0].created_at);
      const daysSince = Math.floor((now.getTime() - lastRequest.getTime()) / (1000 * 60 * 60 * 24));
      
      insights.push({
        type: 'tip',
        title: 'Welcome Back!',
        description: `It's been ${daysSince} days since your last request. Get fresh perspectives on new content.`,
        action: 'Create Request',
        action_url: '/start',
        priority: 'medium',
      });
    }

    // Response time insight
    const responseTimes = requests
      .filter((r: any) => r.verdict_responses.length > 0)
      .map((r: any) => {
        const requestTime = new Date(r.created_at);
        const firstResponse = r.verdict_responses
          .sort(
            (a: any, b: any) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          )[0];
        return (
          (new Date(firstResponse.created_at).getTime() -
            requestTime.getTime()) /
          (1000 * 60 * 60)
        );
      });

    if (responseTimes.length > 0) {
      const avgResponseTime =
        responseTimes.reduce(
          (sum: number, time: number) => sum + time,
          0
        ) / responseTimes.length;
      
      if (avgResponseTime < 2) {
        insights.push({
          type: 'success',
          title: 'Fast Response Times',
          description: `Your requests typically get responses within ${avgResponseTime.toFixed(1)} hours. Great job creating engaging content!`,
          priority: 'low',
        });
      }
    }

    return NextResponse.json({ 
      insights: insights.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
      })
    });

  } catch (error) {
    log.error('Requester insights error', error);
    throw error;
  }
}

async function getJudgeInsights(judgeId: string, supabase: any) {
  try {
    const insights = [];

    // Get judge data
    const { data: responses } = await supabase
      .from('verdict_responses')
      .select(`
        *,
        verdict_requests!inner(category, created_at)
      `)
      .eq('judge_id', judgeId)
      .order('created_at', { ascending: false });

    const { data: earnings } = await supabase
      .from('judge_earnings')
      .select('*')
      .eq('judge_id', judgeId)
      .order('created_at', { ascending: false });

    if (!responses || responses.length === 0) {
      insights.push({
        type: 'tip',
        title: 'Start Judging to Earn',
        description: 'Begin reviewing verdict requests to earn money and build your reputation as a judge.',
        action: 'View Queue',
        action_url: '/judge',
        priority: 'high',
      });
      
      return NextResponse.json({ insights });
    }

    // Rating performance insight
    const avgRating =
      responses.reduce(
        (sum: number, r: any) => sum + (r.rating || 0),
        0
      ) / responses.length;
    
    if (avgRating >= 8) {
      insights.push({
        type: 'success',
        title: 'Excellent Judge Rating',
        description: `Your average rating of ${avgRating.toFixed(1)}/10 puts you in the top tier of judges. Keep up the great work!`,
        priority: 'medium',
      });
    } else if (avgRating < 6) {
      insights.push({
        type: 'warning',
        title: 'Improve Your Ratings',
        description: `Your average rating is ${avgRating.toFixed(1)}/10. Focus on providing more detailed, helpful feedback to improve your scores.`,
        action: 'View Tips',
        action_url: '/help/judge-guidelines',
        priority: 'high',
      });
    }

    // Specialty category insight
    const categoryStats = responses.reduce(
      (acc: Record<string, any>, resp: any) => {
        const category = resp.verdict_requests.category;
        if (!acc[category]) {
          acc[category] = {
            count: 0,
            totalRating: 0,
            totalHelpfulness: 0,
          };
        }
        acc[category].count++;
        acc[category].totalRating += resp.rating || 0;
        acc[category].totalHelpfulness += resp.helpfulness || 0;
        return acc;
      },
      {} as Record<string, any>
    );

    let bestCategory = '';
    let bestScore = 0;
    
    Object.entries(categoryStats).forEach(([category, stats]) => {
      const s = stats as any;
      if (s.count >= 3) {
        const avgScore =
          (s.totalRating + s.totalHelpfulness) / (s.count * 2);
        if (avgScore > bestScore) {
          bestScore = avgScore;
          bestCategory = category;
        }
      }
    });

    if (bestCategory && bestScore > 7) {
      insights.push({
        type: 'info',
        title: `${bestCategory} Specialist`,
        description: `You excel at ${bestCategory.toLowerCase()} requests with an average score of ${bestScore.toFixed(1)}/10. Consider specializing in this category.`,
        priority: 'medium',
      });
    }

    // Earnings insights
    if (earnings && earnings.length > 0) {
      const totalEarnings = earnings.reduce(
        (sum: number, e: any) => sum + e.net_amount_cents,
        0
      );
      const availableEarnings = earnings
        .filter((e: any) => e.payout_status === 'available')
        .reduce((sum: number, e: any) => sum + e.net_amount_cents, 0);

      if (availableEarnings >= 1000) { // $10+
        insights.push({
          type: 'info',
          title: 'Payout Available',
          description: `You have $${(availableEarnings / 100).toFixed(2)} available for payout. Minimum payout is $10.`,
          action: 'Request Payout',
          action_url: '/judge/earnings',
          priority: 'medium',
        });
      }

      // Earnings trend
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentEarnings = earnings.filter(
        (e: any) => new Date(e.created_at) > last30Days
      );
      
      if (recentEarnings.length > 0) {
        const monthlyEarnings = recentEarnings.reduce(
          (sum: number, e: any) => sum + e.net_amount_cents,
          0
        );
        const projectedMonthly = (monthlyEarnings / recentEarnings.length) * 30;
        
        if (projectedMonthly > 5000) { // $50+/month projected
          insights.push({
            type: 'success',
            title: 'Strong Earning Potential',
            description: `At your current pace, you're projected to earn $${(projectedMonthly / 100).toFixed(2)} this month.`,
            priority: 'low',
          });
        }
      }
    }

    // Response time insight
    const responseTimes = responses.map((resp: any) => {
      const requestTime = new Date(resp.verdict_requests.created_at);
      const responseTime = new Date(resp.created_at);
      return (responseTime.getTime() - requestTime.getTime()) / (1000 * 60 * 60);
    });

    if (responseTimes.length > 0) {
      const avgResponseTime =
        responseTimes.reduce((sum: number, time: number) => sum + time, 0) /
        responseTimes.length;
      
      if (avgResponseTime < 2) {
        insights.push({
          type: 'success',
          title: 'Lightning Fast Responses',
          description: `Your average response time of ${avgResponseTime.toFixed(1)} hours makes you a valuable judge.`,
          priority: 'low',
        });
      } else if (avgResponseTime > 24) {
        insights.push({
          type: 'tip',
          title: 'Improve Response Time',
          description: `Try to respond within 24 hours for better ratings. Your current average is ${avgResponseTime.toFixed(1)} hours.`,
          priority: 'medium',
        });
      }
    }

    // Activity consistency
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentResponses = responses.filter(
      (r: any) => new Date(r.created_at) > last7Days
    );
    
    if (recentResponses.length === 0 && responses.length > 0) {
      insights.push({
        type: 'tip',
        title: 'Stay Active',
        description: 'Regular activity helps maintain your judge ranking and maximizes your earnings potential.',
        action: 'View Queue',
        action_url: '/judge',
        priority: 'medium',
      });
    }

    return NextResponse.json({ 
      insights: insights.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
      })
    });

  } catch (error) {
    log.error('Judge insights error', error);
    throw error;
  }
}
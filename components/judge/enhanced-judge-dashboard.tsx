'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JudgeStatusBadge } from '@/components/ui/status-badge';
import { TouchButton, TouchToggle } from '@/components/ui/touch-button';
import { LoadingState } from '@/components/ui/loading-state';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Clock, 
  DollarSign, 
  Star, 
  TrendingUp, 
  Filter,
  Eye,
  MessageSquare,
  Award,
  Target,
  Zap
} from 'lucide-react';

interface JudgeStats {
  isAvailable: boolean;
  totalEarnings: number;
  todayEarnings: number;
  verdictCount: number;
  averageRating: number;
  responseTime: number;
  queueCount: number;
}

interface QueueRequest {
  id: string;
  category: string;
  subcategory?: string;
  mediaType: 'photo' | 'text';
  preview: string;
  timePosted: string;
  payout: number;
  urgency: 'low' | 'medium' | 'high';
}

const MOCK_STATS: JudgeStats = {
  isAvailable: false,
  totalEarnings: 127.50,
  todayEarnings: 12.25,
  verdictCount: 85,
  averageRating: 4.7,
  responseTime: 3.2,
  queueCount: 7
};

const MOCK_QUEUE: QueueRequest[] = [
  {
    id: '1',
    category: 'appearance',
    subcategory: 'outfit',
    mediaType: 'photo',
    preview: 'Rate this casual Friday outfit for a software company',
    timePosted: '2 minutes ago',
    payout: 0.75,
    urgency: 'high'
  },
  {
    id: '2',
    category: 'writing',
    subcategory: 'message',
    mediaType: 'text',
    preview: 'Does this follow-up message come across as too pushy?',
    timePosted: '5 minutes ago',
    payout: 0.50,
    urgency: 'medium'
  }
];

export function EnhancedJudgeDashboard() {
  const [stats, setStats] = useState<JudgeStats>(MOCK_STATS);
  const [queue, setQueue] = useState<QueueRequest[]>(MOCK_QUEUE);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const handleAvailabilityToggle = async (available: boolean) => {
    setIsLoading(true);
    try {
      // API call to update availability
      setStats(prev => ({ ...prev, isAvailable: available }));
    } catch (error) {
      console.error('Failed to update availability:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  if (isLoading) {
    return <LoadingState message="Updating availability..." />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Judge Dashboard</h1>
          <p className="text-gray-600">Review requests and earn money for quality feedback</p>
        </div>
        
        <JudgeStatusBadge
          isAvailable={stats.isAvailable}
          queueCount={stats.queueCount}
          earningsToday={stats.todayEarnings}
        />
      </div>

      {/* Availability Toggle */}
      <Card className="border-2 border-dashed">
        <CardContent className="p-6">
          <TouchToggle
            checked={stats.isAvailable}
            onChange={handleAvailabilityToggle}
            label={stats.isAvailable ? "You're available to judge" : "You're currently unavailable"}
            description={
              stats.isAvailable 
                ? `${stats.queueCount} requests waiting • Earning potential: $${(stats.queueCount * 0.65).toFixed(2)}`
                : "Toggle on to start receiving verdict requests and earning money"
            }
            className="w-full"
          />
          
          {!stats.isAvailable && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-900 font-medium mb-2">
                <Zap className="w-4 h-4" />
                Quick Start Tips
              </div>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Toggle availability to see available requests</li>
                <li>• Higher-rated feedback earns more per verdict</li>
                <li>• Respond quickly to increase your priority in the queue</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Earned</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${stats.totalEarnings.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Verdicts Given</p>
                <p className="text-lg font-semibold text-gray-900">{stats.verdictCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Response</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.responseTime}min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Available Requests
              <Badge variant="secondary">{queue.length}</Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm border rounded-md px-2 py-1"
              >
                <option value="all">All Categories</option>
                <option value="appearance">Appearance</option>
                <option value="writing">Writing</option>
                <option value="decision">Decisions</option>
              </select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {!stats.isAvailable ? (
            <div className="text-center py-8">
              <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Toggle availability to see requests</h3>
              <p className="text-gray-600 mb-4">Turn on availability above to start reviewing requests and earning money</p>
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requests available</h3>
              <p className="text-gray-600">Check back soon for new verdict requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {queue.map((request) => (
                <Card key={request.id} className="border border-gray-200 hover:border-blue-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="capitalize">
                            {request.category}
                          </Badge>
                          {request.subcategory && (
                            <Badge variant="secondary" className="capitalize text-xs">
                              {request.subcategory}
                            </Badge>
                          )}
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getUrgencyColor(request.urgency)}`}
                          >
                            {request.urgency} priority
                          </Badge>
                          <span className="text-xs text-gray-500">{request.timePosted}</span>
                        </div>
                        
                        <p className="text-sm text-gray-900 mb-3">{request.preview}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              {request.mediaType === 'photo' ? (
                                <Eye className="w-3 h-3" />
                              ) : (
                                <MessageSquare className="w-3 h-3" />
                              )}
                              {request.mediaType}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-medium text-green-600">
                                +${request.payout.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">per verdict</p>
                            </div>
                            
                            <TouchButton size="sm">
                              Review
                            </TouchButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      {stats.verdictCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-800 font-medium">Quality Score</p>
                <p className="text-2xl font-bold text-green-900">{stats.averageRating}/5.0</p>
                <p className="text-xs text-green-600">Above average!</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-blue-800 font-medium">Response Speed</p>
                <p className="text-2xl font-bold text-blue-900">{stats.responseTime}min</p>
                <p className="text-xs text-blue-600">Excellent pace</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-purple-800 font-medium">This Week</p>
                <p className="text-2xl font-bold text-purple-900">${(stats.todayEarnings * 7).toFixed(2)}</p>
                <p className="text-xs text-purple-600">On track for goal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
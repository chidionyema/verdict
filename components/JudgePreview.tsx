'use client';

import { Star, Badge, Clock, Award, Users, Zap } from 'lucide-react';

interface JudgeProfile {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  credentials: string;
  rating: number;
  verdictCount: number;
  responseTime: string;
  expertise: string[];
  successRate: number;
}

interface JudgePreviewProps {
  judges: JudgeProfile[];
  category: string;
}

export default function JudgePreview({ judges, category }: JudgePreviewProps) {
  const topJudges = judges.slice(0, 3);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Your Expert Judges Are Ready
        </h3>
        <p className="text-gray-600">
          Top-rated {category} experts will review your submission
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {topJudges.map((judge, index) => (
          <div key={judge.id} className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-center">
              <div className="relative mb-3">
                <img 
                  src={judge.avatar} 
                  alt={judge.name}
                  className="w-16 h-16 rounded-full mx-auto"
                />
                {index === 0 && (
                  <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              
              <h4 className="font-semibold text-gray-900 mb-1">{judge.name}</h4>
              <p className="text-sm text-indigo-600 mb-2">{judge.specialty}</p>
              <p className="text-xs text-gray-500 mb-3">{judge.credentials}</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">{judge.rating}</span>
                  <span className="text-xs text-gray-500">({judge.verdictCount})</span>
                </div>
                
                <div className="flex items-center justify-center gap-1 text-green-600">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">~{judge.responseTime}</span>
                </div>
                
                <div className="flex items-center justify-center gap-1 text-purple-600">
                  <Zap className="h-3 w-3" />
                  <span className="text-xs">{judge.successRate}% success rate</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg p-4 border border-green-100 bg-green-50">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Badge className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-green-800">Quality Guarantee</span>
        </div>
        <p className="text-sm text-green-700 text-center">
          All judges are verified experts. Love your verdict or get your credit back.
        </p>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          <Users className="inline h-4 w-4 mr-1" />
          <strong>2,847 people</strong> improved their {category} this month
        </p>
      </div>
    </div>
  );
}
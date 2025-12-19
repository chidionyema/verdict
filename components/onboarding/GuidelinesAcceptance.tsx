'use client';

import { useState } from 'react';
import { Shield, Heart, AlertTriangle, CheckCircle, Eye, MessageCircle } from 'lucide-react';

interface GuidelinesAcceptanceProps {
  onAccept: () => void;
  loading?: boolean;
}

const guidelines = [
  {
    category: 'Be Respectful',
    icon: Heart,
    color: 'text-pink-600 bg-pink-50',
    rules: [
      'Treat everyone with kindness and respect',
      'Focus on constructive feedback, not personal attacks',
      'Be honest but considerate in your responses',
      'Respect different perspectives and backgrounds'
    ]
  },
  {
    category: 'Stay Safe',
    icon: Shield,
    color: 'text-blue-600 bg-blue-50',
    rules: [
      'Never share personal information (phone, address, etc.)',
      'Report inappropriate content immediately',
      'Don\'t engage with harassment or abuse',
      'Keep interactions within the platform'
    ]
  },
  {
    category: 'Give Quality Feedback',
    icon: MessageCircle,
    color: 'text-green-600 bg-green-50',
    rules: [
      'Provide specific, actionable advice',
      'Explain your reasoning when possible',
      'Be honest about your expertise level',
      'Focus on what was asked, not other aspects'
    ]
  },
  {
    category: 'Content Guidelines',
    icon: Eye,
    color: 'text-purple-600 bg-purple-50',
    rules: [
      'No explicit, offensive, or inappropriate content',
      'Respect copyright and privacy of others',
      'Don\'t submit fake or misleading information',
      'Follow local laws and platform terms'
    ]
  }
];

const consequences = [
  {
    violation: 'Minor rule violations',
    consequence: 'Warning and guidance',
    severity: 'low'
  },
  {
    violation: 'Repeated inappropriate behavior',
    consequence: 'Temporary account restrictions',
    severity: 'medium'
  },
  {
    violation: 'Harassment, abuse, or dangerous content',
    consequence: 'Immediate account suspension',
    severity: 'high'
  }
];

export function GuidelinesAcceptance({ onAccept, loading = false }: GuidelinesAcceptanceProps) {
  const [accepted, setAccepted] = useState(false);
  const [readSections, setReadSections] = useState<Set<number>>(new Set());

  const handleSectionRead = (index: number) => {
    setReadSections(prev => new Set(prev).add(index));
  };

  const allSectionsRead = readSections.size === guidelines.length;

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="bg-indigo-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-6 w-6 text-indigo-600" />
          <h3 className="text-lg font-semibold text-indigo-900">Community Guidelines</h3>
        </div>
        <p className="text-indigo-800 leading-relaxed">
          Our community thrives on honest, respectful feedback. These guidelines ensure 
          everyone has a safe and positive experience giving and receiving feedback.
        </p>
      </div>

      {/* Guidelines sections */}
      <div className="space-y-4">
        {guidelines.map((section, index) => {
          const isRead = readSections.has(index);
          const Icon = section.icon;
          
          return (
            <div
              key={section.category}
              className={`border-2 rounded-lg transition-all ${
                isRead 
                  ? 'border-green-200 bg-green-50/50' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${section.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="font-semibold text-gray-900">{section.category}</h4>
                  </div>
                  {isRead && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
                
                <ul className="space-y-2">
                  {section.rules.map((rule, ruleIndex) => (
                    <li key={ruleIndex} className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                      {rule}
                    </li>
                  ))}
                </ul>
                
                {!isRead && (
                  <button
                    onClick={() => handleSectionRead(index)}
                    className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    ✓ Mark as read
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Consequences section */}
      {allSectionsRead && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <h3 className="text-lg font-semibold text-amber-900">Enforcement</h3>
          </div>
          
          <div className="space-y-3">
            {consequences.map((item, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-3 rounded-lg ${
                  item.severity === 'high' 
                    ? 'bg-red-50 border border-red-200'
                    : item.severity === 'medium'
                    ? 'bg-orange-50 border border-orange-200'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <span className="text-sm font-medium text-gray-800">{item.violation}</span>
                <span className={`text-sm font-medium ${
                  item.severity === 'high' ? 'text-red-700' :
                  item.severity === 'medium' ? 'text-orange-700' : 'text-yellow-700'
                }`}>
                  {item.consequence}
                </span>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-amber-800 mt-4">
            We believe in second chances and will work with users to resolve issues. 
            Our goal is education and community building, not punishment.
          </p>
        </div>
      )}

      {/* Acceptance */}
      {allSectionsRead && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <input
              id="guidelines-accept"
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="guidelines-accept" className="text-sm text-gray-700 leading-relaxed">
              I have read and understand the community guidelines. I agree to follow these 
              rules and understand that violations may result in account restrictions. 
              I commit to treating all community members with respect and providing 
              constructive, helpful feedback.
            </label>
          </div>
          
          <button
            onClick={onAccept}
            disabled={!accepted || loading}
            className="mt-6 w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Accept Guidelines & Continue
              </>
            )}
          </button>
        </div>
      )}

      {/* Progress indicator */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Read sections: {readSections.size} of {guidelines.length}
        </p>
        {!allSectionsRead && (
          <p className="text-xs text-gray-500 mt-1">
            Please read all sections before accepting the guidelines
          </p>
        )}
      </div>
    </div>
  );
}
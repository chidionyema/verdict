'use client';

import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Clock, DollarSign, Zap, Info, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface EarningScenario {
  label: string;
  hours: number;
  verdicts: number;
  earnings: number;
  description: string;
}

export function JudgeEarningsCalculator() {
  const [hoursPerWeek, setHoursPerWeek] = useState(5);
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'expert'>('beginner');
  const [includeBonus, setIncludeBonus] = useState(true);
  
  // Realistic verdicts per hour based on experience
  const verdictsPerHour = {
    beginner: 8,      // New judges: ~7.5 min per verdict
    intermediate: 12, // Experienced: ~5 min per verdict
    expert: 15       // Expert judges: ~4 min per verdict
  };

  // Average earnings per verdict by experience level
  const earningsPerVerdict = {
    beginner: 0.60,      // Basic tier mostly
    intermediate: 0.85,  // Mix of tiers
    expert: 1.20        // Higher tier + bonuses
  };

  // Calculate earnings
  const calculateEarnings = () => {
    const baseVerdicts = hoursPerWeek * verdictsPerHour[experience];
    const baseEarnings = baseVerdicts * earningsPerVerdict[experience];
    
    // Bonuses: streak bonus, quality bonus, peak hour bonus
    const bonusMultiplier = includeBonus ? 1.25 : 1.0;
    
    return {
      weekly: {
        verdicts: Math.floor(baseVerdicts),
        earnings: baseEarnings * bonusMultiplier
      },
      monthly: {
        verdicts: Math.floor(baseVerdicts * 4.33),
        earnings: baseEarnings * bonusMultiplier * 4.33
      },
      yearly: {
        verdicts: Math.floor(baseVerdicts * 52),
        earnings: baseEarnings * bonusMultiplier * 52
      }
    };
  };

  const earnings = calculateEarnings();

  // Example scenarios
  const scenarios: EarningScenario[] = [
    {
      label: 'Coffee Money',
      hours: 3,
      verdicts: 36,
      earnings: 30,
      description: 'Perfect for spare time'
    },
    {
      label: 'Side Hustle',
      hours: 10,
      verdicts: 120,
      earnings: 120,
      description: 'Nice weekend income'
    },
    {
      label: 'Part Time',
      hours: 20,
      verdicts: 240,
      earnings: 280,
      description: 'Substantial extra income'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-8 shadow-xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md mb-4">
          <Calculator className="h-5 w-5 text-indigo-600" />
          <span className="font-semibold text-gray-900">Earnings Calculator</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          How Much Can You Earn as a Judge?
        </h3>
        <p className="text-gray-600">
          Calculate your potential earnings based on your availability
        </p>
      </div>

      {/* Calculator Controls */}
      <div className="space-y-6 mb-8">
        {/* Hours per week slider */}
        <div>
          <label className="flex items-center justify-between mb-3">
            <span className="font-medium text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hours per week
            </span>
            <span className="text-2xl font-bold text-indigo-600">{hoursPerWeek}</span>
          </label>
          <input
            type="range"
            min="1"
            max="40"
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(Number(e.target.value))}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(hoursPerWeek / 40) * 100}%, #e5e7eb ${(hoursPerWeek / 40) * 100}%, #e5e7eb 100%)`
            }}
          />
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>1 hour</span>
            <span>Part-time job</span>
            <span>40 hours</span>
          </div>
        </div>

        {/* Experience level */}
        <div>
          <label className="font-medium text-gray-900 flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4" />
            Your experience level
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['beginner', 'intermediate', 'expert'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setExperience(level)}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  experience === level
                    ? 'bg-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {experience === 'beginner' && 'New judges: ~8 verdicts/hour'}
            {experience === 'intermediate' && 'Experienced: ~12 verdicts/hour'}
            {experience === 'expert' && 'Expert judges: ~15 verdicts/hour'}
          </p>
        </div>

        {/* Include bonuses toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={includeBonus}
            onChange={(e) => setIncludeBonus(e.target.checked)}
            className="w-5 h-5 text-indigo-600 rounded"
          />
          <div>
            <span className="font-medium text-gray-900">Include bonuses</span>
            <p className="text-sm text-gray-500">Streak, quality, and peak hour bonuses (~25% extra)</p>
          </div>
        </label>
      </div>

      {/* Earnings Display */}
      <motion.div 
        key={`${hoursPerWeek}-${experience}-${includeBonus}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-lg border border-indigo-100 mb-6"
      >
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Your Estimated Earnings
        </h4>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Weekly</p>
            <p className="text-2xl font-bold text-gray-900">${earnings.weekly.earnings.toFixed(0)}</p>
            <p className="text-xs text-gray-500">{earnings.weekly.verdicts} verdicts</p>
          </div>
          <div className="text-center border-x border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Monthly</p>
            <p className="text-2xl font-bold text-indigo-600">${earnings.monthly.earnings.toFixed(0)}</p>
            <p className="text-xs text-gray-500">{earnings.monthly.verdicts} verdicts</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Yearly</p>
            <p className="text-2xl font-bold text-gray-900">${earnings.yearly.earnings.toFixed(0)}</p>
            <p className="text-xs text-gray-500">{earnings.yearly.verdicts} verdicts</p>
          </div>
        </div>
      </motion.div>

      {/* Example Scenarios */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">Popular Scenarios</h4>
        <div className="space-y-3">
          {scenarios.map((scenario) => (
            <button
              key={scenario.label}
              onClick={() => setHoursPerWeek(scenario.hours)}
              className="w-full bg-white rounded-lg p-4 text-left hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-indigo-600">
                    {scenario.label}
                  </p>
                  <p className="text-sm text-gray-500">
                    {scenario.hours} hours/week • {scenario.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-indigo-600">
                    ${scenario.earnings}/week
                  </p>
                  <p className="text-xs text-gray-500">
                    ~{scenario.verdicts} verdicts
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 rounded-lg p-4 flex gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">How we calculate</p>
          <p className="text-blue-700">
            Based on real judge data: verdict completion times, tier distribution, and average bonuses. 
            Expert judges earn more through higher-tier requests and quality bonuses.
          </p>
        </div>
      </div>

      {/* CTA */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => window.location.href = '/judge/qualify'}
        className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2"
      >
        <Sparkles className="h-5 w-5" />
        Start Earning Today
        <span className="text-indigo-200">(5 min qualification)</span>
      </motion.button>
    </div>
  );
}
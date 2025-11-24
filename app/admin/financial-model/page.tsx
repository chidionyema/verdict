'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calculator, AlertTriangle, CheckCircle } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/validations';

interface FinancialModel {
  // Pricing
  creditPrice: number;
  verdictsPerRequest: number;
  judgePayout: number;
  
  // Costs
  stripeFeePercent: number;
  stripeFeeFixed: number;
  
  // Results
  revenuePerRequest: number;
  costPerRequest: number;
  profitPerRequest: number;
  marginPercent: number;
  breakEvenPrice: number;
}

const DEFAULT_MODEL: FinancialModel = {
  creditPrice: 3.49, // Updated pricing: $3.49/credit for 40%+ margin
  verdictsPerRequest: 3, // Reduced to 3 for optimal unit economics
  judgePayout: 0.50,
  stripeFeePercent: 2.9,
  stripeFeeFixed: 0.30,
  revenuePerRequest: 0,
  costPerRequest: 0,
  profitPerRequest: 0,
  marginPercent: 0,
  breakEvenPrice: 0,
};

export default function FinancialModelPage() {
  const [model, setModel] = useState<FinancialModel>(DEFAULT_MODEL);
  const [monthlyVolume, setMonthlyVolume] = useState(100);
  const [freeCredits, setFreeCredits] = useState(3);

  useEffect(() => {
    calculateModel();
  }, [model.creditPrice, model.verdictsPerRequest, model.judgePayout, model.stripeFeePercent, model.stripeFeeFixed]);

  const calculateModel = () => {
    const revenuePerRequest = model.creditPrice;
    const costPerRequest = model.verdictsPerRequest * model.judgePayout;
    const stripeFee = (revenuePerRequest * model.stripeFeePercent / 100) + model.stripeFeeFixed;
    const netRevenue = revenuePerRequest - stripeFee;
    const profitPerRequest = netRevenue - costPerRequest;
    const marginPercent = netRevenue > 0 ? (profitPerRequest / netRevenue) * 100 : 0;
    const breakEvenPrice = costPerRequest + stripeFee;

    setModel(prev => ({
      ...prev,
      revenuePerRequest,
      costPerRequest,
      profitPerRequest,
      marginPercent,
      breakEvenPrice,
    }));
  };

  const monthlyProjection = {
    revenue: monthlyVolume * model.revenuePerRequest,
    costs: monthlyVolume * model.costPerRequest,
    stripeFees: monthlyVolume * ((model.revenuePerRequest * model.stripeFeePercent / 100) + model.stripeFeeFixed),
    profit: monthlyVolume * model.profitPerRequest,
    freeCreditCost: freeCredits * model.creditPrice * (monthlyVolume / 10), // Assume 10% signup rate
  };

  const isViable = model.profitPerRequest >= 0;
  const isHealthy = model.marginPercent >= 15;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Model Calculator</h1>
          <p className="text-gray-600">Analyze unit economics and business model viability</p>
        </div>

        {/* Alert if not viable */}
        {!isViable && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">⚠️ Model Not Viable</h3>
                <p className="text-red-700 mb-2">
                  You're losing ${Math.abs(model.profitPerRequest).toFixed(2)} per request. 
                  Break-even price: <strong>${model.breakEvenPrice.toFixed(2)}/credit</strong>
                </p>
                <p className="text-red-600 text-sm">
                  Current price: ${model.creditPrice.toFixed(2)} | Required: ${model.breakEvenPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {isViable && !isHealthy && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ Low Margin</h3>
                <p className="text-yellow-700">
                  Margin is {model.marginPercent.toFixed(1)}%. Consider increasing prices for healthier margins (target: 15%+).
                </p>
              </div>
            </div>
          </div>
        )}

        {isViable && isHealthy && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <CheckCircle className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">✅ Model Viable</h3>
                <p className="text-green-700">
                  Healthy margin of {model.marginPercent.toFixed(1)}% with ${model.profitPerRequest.toFixed(2)} profit per request.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Inputs */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Model Parameters
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credit Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={model.creditPrice}
                    onChange={(e) => setModel(prev => ({ ...prev, creditPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Average price per credit</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verdicts Per Request
                  </label>
                  <input
                    type="number"
                    value={model.verdictsPerRequest}
                    onChange={(e) => setModel(prev => ({ ...prev, verdictsPerRequest: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Judge Payout ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={model.judgePayout}
                    onChange={(e) => setModel(prev => ({ ...prev, judgePayout: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Per verdict</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stripe Fee (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={model.stripeFeePercent}
                    onChange={(e) => setModel(prev => ({ ...prev, stripeFeePercent: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stripe Fixed Fee ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={model.stripeFeeFixed}
                    onChange={(e) => setModel(prev => ({ ...prev, stripeFeeFixed: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Current Credit Packages */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Packages</h3>
              <div className="space-y-2">
                {Object.entries(CREDIT_PACKAGES).map(([id, pkg]) => (
                  <div key={id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{pkg.name}</span>
                    <span className="text-sm text-gray-600">
                      ${(pkg.price_cents / 100).toFixed(2)} ({pkg.credits} credits)
                    </span>
                    <span className="text-xs text-gray-500">
                      ${((pkg.price_cents / 100) / pkg.credits).toFixed(2)}/credit
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Unit Economics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Unit Economics (Per Request)</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${isViable ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Revenue</span>
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold">${model.revenuePerRequest.toFixed(2)}</p>
                </div>

                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Cost (Judges)</span>
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  </div>
                  <p className="text-2xl font-bold">${model.costPerRequest.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {model.verdictsPerRequest} × ${model.judgePayout.toFixed(2)}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Stripe Fees</span>
                  </div>
                  <p className="text-2xl font-bold">
                    ${((model.revenuePerRequest * model.stripeFeePercent / 100) + model.stripeFeeFixed).toFixed(2)}
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${isViable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Profit/Loss</span>
                    {isViable ? (
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <p className={`text-2xl font-bold ${isViable ? 'text-green-700' : 'text-red-700'}`}>
                    {isViable ? '+' : ''}${model.profitPerRequest.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Margin: {model.marginPercent.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-sm font-medium text-indigo-900 mb-1">Break-Even Price</p>
                <p className="text-lg font-bold text-indigo-700">${model.breakEvenPrice.toFixed(2)}/credit</p>
                <p className="text-xs text-indigo-600 mt-1">
                  Minimum price needed to cover costs
                </p>
              </div>
            </div>

            {/* Monthly Projections */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Monthly Projections</h2>
                <input
                  type="number"
                  value={monthlyVolume}
                  onChange={(e) => setMonthlyVolume(parseInt(e.target.value) || 0)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Volume"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Revenue</p>
                  <p className="text-2xl font-bold">${monthlyProjection.revenue.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Costs</p>
                  <p className="text-2xl font-bold">${monthlyProjection.costs.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Stripe Fees</p>
                  <p className="text-2xl font-bold">${monthlyProjection.stripeFees.toFixed(2)}</p>
                </div>
                <div className={`p-4 rounded-lg ${monthlyProjection.profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-sm text-gray-600 mb-1">Net Profit</p>
                  <p className={`text-2xl font-bold ${monthlyProjection.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {monthlyProjection.profit >= 0 ? '+' : ''}${monthlyProjection.profit.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  Annual Profit: <strong>${(monthlyProjection.profit * 12).toFixed(2)}</strong>
                </p>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h2>
              <div className="space-y-3">
                {!isViable && (
                  <>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-medium text-red-900 mb-1">🚨 Critical: Increase Prices</p>
                      <p className="text-xs text-red-700">
                        Need to charge at least <strong>${model.breakEvenPrice.toFixed(2)}/credit</strong> to break even.
                        Current: ${model.creditPrice.toFixed(2)} | Gap: ${(model.breakEvenPrice - model.creditPrice).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium text-yellow-900 mb-1">💡 Alternative: Reduce Verdicts</p>
                      <p className="text-xs text-yellow-700">
                        To break even at ${model.creditPrice.toFixed(2)}/credit, need {(model.creditPrice / model.judgePayout).toFixed(1)} verdicts max.
                        Current: {model.verdictsPerRequest}
                      </p>
                    </div>
                  </>
                )}
                {isViable && !isHealthy && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-900 mb-1">⚠️ Low Margin Warning</p>
                    <p className="text-xs text-yellow-700">
                      Current margin: {model.marginPercent.toFixed(1)}%. Target: 15%+. 
                      Consider increasing price to ${((model.costPerRequest + ((model.revenuePerRequest * model.stripeFeePercent / 100) + model.stripeFeeFixed)) * 1.15).toFixed(2)}/credit.
                    </p>
                  </div>
                )}
                {isViable && isHealthy && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-900 mb-1">✅ Model Looks Good</p>
                    <p className="text-xs text-green-700">
                      Healthy margin of {model.marginPercent.toFixed(1)}%. Monitor conversion rates and judge satisfaction.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


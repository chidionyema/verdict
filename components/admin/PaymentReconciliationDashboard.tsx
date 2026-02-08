'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, DollarSign, RefreshCw } from 'lucide-react';
import { reconciliationManager, type PaymentDiscrepancy, type ReconciliationReport } from '@/lib/payment-reconciliation';

export function PaymentReconciliationDashboard() {
  const [report, setReport] = useState<ReconciliationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoFixing, setAutoFixing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const runAnalysis = async (hoursBack = 24) => {
    setLoading(true);
    try {
      const newReport = await reconciliationManager.analyzeDiscrepancies(hoursBack);
      setReport(newReport);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to analyze discrepancies:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoFixSafeDiscrepancies = async () => {
    if (!report) return;

    setAutoFixing(true);
    try {
      const safeDiscrepancies = report.discrepancies.filter(d => 
        d.type === 'missing_transaction' || d.type === 'pending_transaction'
      );
      
      const result = await reconciliationManager.autoFixDiscrepancies(safeDiscrepancies);
      
      // Refresh the report after fixing
      await runAnalysis();
      
      alert(`Fixed ${result.fixed} issues, ${result.errors} errors`);
    } catch (error) {
      console.error('Failed to auto-fix discrepancies:', error);
    } finally {
      setAutoFixing(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payment Reconciliation</h1>
        <div className="flex gap-3">
          <button
            onClick={() => runAnalysis()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyzing...' : 'Refresh Analysis'}
          </button>
          
          {report && report.discrepancies.length > 0 && (
            <button
              onClick={autoFixSafeDiscrepancies}
              disabled={autoFixing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="h-4 w-4" />
              {autoFixing ? 'Fixing...' : 'Auto-Fix Safe Issues'}
            </button>
          )}
        </div>
      </div>

      {lastUpdated && (
        <p className="text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleString()}
        </p>
      )}

      {/* Summary Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                <p className="text-xl font-bold text-gray-900">{report.summary.totalSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Discrepancies</p>
                <p className="text-xl font-bold text-gray-900">{report.summary.totalDiscrepancies}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Critical Issues</p>
                <p className="text-xl font-bold text-gray-900">{report.summary.criticalIssues}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Credits Affected</p>
                <p className="text-xl font-bold text-gray-900">{report.summary.totalCreditsAffected}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {report && report.recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Recommendations</h3>
          <ul className="space-y-1">
            {report.recommendations.map((rec, index) => (
              <li key={index} className="text-blue-800 text-sm">• {rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Discrepancy List */}
      {report && report.discrepancies.length > 0 && (
        <div className="bg-white border rounded-lg">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Payment Discrepancies</h3>
          </div>
          <div className="divide-y">
            {report.discrepancies.map((discrepancy, index) => (
              <div key={index} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(discrepancy.severity)}`}>
                        {discrepancy.severity.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {discrepancy.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{discrepancy.description}</p>
                    <p className="text-xs text-gray-500">
                      Session: {discrepancy.sessionId} | User: {discrepancy.userId} | Credits: {discrepancy.expectedCredits}
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className="text-xs text-gray-400">Action Required:</span>
                    <p className="text-sm text-gray-700 max-w-xs">{discrepancy.actionRequired}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Issues State */}
      {report && report.discrepancies.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">All Clear!</h3>
          <p className="text-green-700">No payment discrepancies found in the last 24 hours.</p>
        </div>
      )}
    </div>
  );
}
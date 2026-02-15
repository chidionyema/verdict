'use client';

import { useState } from 'react';
import {
  Download,
  Share2,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  Mail,
  Link2,
  Twitter,
  Linkedin,
  FileSpreadsheet,
  Loader2,
  X,
} from 'lucide-react';

interface Verdict {
  id: string;
  created_at: string;
  chosen_photo: 'A' | 'B';
  confidence_score: number;
  reasoning: string;
  photo_a_rating: number;
  photo_b_rating: number;
  judge_tier?: string;
}

interface Segment {
  id: string;
  name: string;
  winner: 'A' | 'B' | 'tie' | null;
  completed_count: number;
  consensus_strength?: number;
}

interface ResultsExportProps {
  testId: string;
  testType: 'ab-test' | 'split-test';
  question?: string;
  verdicts: Verdict[];
  segments?: Segment[];
  winner?: 'A' | 'B' | 'tie' | null;
  photoAUrl?: string;
  photoBUrl?: string;
}

export function ResultsExport({
  testId,
  testType,
  question,
  verdicts,
  segments,
  winner,
}: ResultsExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/results/${testId}`;

  const votesA = verdicts.filter((v) => v.chosen_photo === 'A').length;
  const votesB = verdicts.filter((v) => v.chosen_photo === 'B').length;
  const total = verdicts.length;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const exportToCSV = () => {
    setExporting('csv');

    const headers = [
      'Verdict ID',
      'Date',
      'Chosen Photo',
      'Confidence',
      'Photo A Rating',
      'Photo B Rating',
      'Judge Tier',
      'Reasoning',
    ];

    const rows = verdicts.map((v) => [
      v.id,
      new Date(v.created_at).toISOString(),
      v.chosen_photo,
      v.confidence_score,
      v.photo_a_rating,
      v.photo_b_rating,
      v.judge_tier || 'standard',
      `"${v.reasoning.replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csv, `verdict-results-${testId}.csv`, 'text/csv');
    setExporting(null);
  };

  const exportToJSON = () => {
    setExporting('json');

    const data = {
      testId,
      testType,
      question,
      exportedAt: new Date().toISOString(),
      summary: {
        totalVerdicts: total,
        votesA,
        votesB,
        winner,
        percentageA: total > 0 ? Math.round((votesA / total) * 100) : 0,
        percentageB: total > 0 ? Math.round((votesB / total) * 100) : 0,
      },
      segments: segments?.map((s) => ({
        id: s.id,
        name: s.name,
        winner: s.winner,
        completedCount: s.completed_count,
        consensusStrength: s.consensus_strength,
      })),
      verdicts: verdicts.map((v) => ({
        id: v.id,
        createdAt: v.created_at,
        chosenPhoto: v.chosen_photo,
        confidence: v.confidence_score,
        photoARating: v.photo_a_rating,
        photoBRating: v.photo_b_rating,
        judgeTier: v.judge_tier,
        reasoning: v.reasoning,
      })),
    };

    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `verdict-results-${testId}.json`, 'application/json');
    setExporting(null);
  };

  const exportToPDF = async () => {
    setExporting('pdf');

    // Generate HTML for PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verdict Results - ${testId}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #1a1a1a; border-bottom: 2px solid #f97316; padding-bottom: 10px; }
          .summary { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .stat { display: inline-block; margin-right: 30px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #f97316; }
          .stat-label { font-size: 12px; color: #6b7280; }
          .verdict { border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .winner-a { border-left: 4px solid #22c55e; }
          .winner-b { border-left: 4px solid #3b82f6; }
          .reasoning { color: #4b5563; font-style: italic; margin-top: 10px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Verdict Results</h1>
        ${question ? `<p><strong>Question:</strong> ${question}</p>` : ''}

        <div class="summary">
          <div class="stat">
            <div class="stat-value">${total}</div>
            <div class="stat-label">Total Verdicts</div>
          </div>
          <div class="stat">
            <div class="stat-value" style="color: #22c55e;">${votesA}</div>
            <div class="stat-label">Photo A Votes</div>
          </div>
          <div class="stat">
            <div class="stat-value" style="color: #3b82f6;">${votesB}</div>
            <div class="stat-label">Photo B Votes</div>
          </div>
          ${winner ? `
          <div class="stat">
            <div class="stat-value">${winner === 'tie' ? 'Tie' : `Photo ${winner}`}</div>
            <div class="stat-label">Winner</div>
          </div>
          ` : ''}
        </div>

        <h2>Individual Verdicts</h2>
        ${verdicts
          .map(
            (v) => `
          <div class="verdict ${v.chosen_photo === 'A' ? 'winner-a' : 'winner-b'}">
            <strong>Photo ${v.chosen_photo}</strong> chosen with ${v.confidence_score}/10 confidence
            <br>
            <small>Ratings: A=${v.photo_a_rating}/10, B=${v.photo_b_rating}/10</small>
            <div class="reasoning">"${v.reasoning}"</div>
          </div>
        `
          )
          .join('')}

        <div class="footer">
          Generated by Verdict • ${new Date().toLocaleDateString()}
        </div>
      </body>
      </html>
    `;

    // Use browser print for PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }

    setExporting(null);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const shareToTwitter = () => {
    const text = winner
      ? `My ${testType === 'split-test' ? 'Split Test' : 'A/B Test'} results are in! Photo ${winner} won with ${winner === 'A' ? votesA : votesB} votes out of ${total}. 📊`
      : `Just finished a ${testType === 'split-test' ? 'Split Test' : 'A/B Test'} with ${total} verdicts! 📊`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const shareViaEmail = () => {
    const subject = `Verdict Results: ${question || 'Photo Comparison'}`;
    const body = `Check out my ${testType === 'split-test' ? 'Split Test' : 'A/B Test'} results!\n\nTotal Verdicts: ${total}\nPhoto A: ${votesA} votes (${Math.round((votesA / total) * 100)}%)\nPhoto B: ${votesB} votes (${Math.round((votesB / total) * 100)}%)\n${winner ? `Winner: Photo ${winner}` : ''}\n\nView full results: ${shareUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <>
      {/* Trigger Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
        <button
          onClick={() => copyToClipboard(shareUrl)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Export & Share</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Share Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share Link
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 truncate">
                    {shareUrl}
                  </div>
                  <button
                    onClick={() => copyToClipboard(shareUrl)}
                    className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <Copy className="h-5 w-5 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Social Share */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share on Social
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={shareToTwitter}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                    <span className="text-xs text-gray-600">Twitter</span>
                  </button>
                  <button
                    onClick={shareToLinkedIn}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Linkedin className="h-5 w-5 text-[#0A66C2]" />
                    <span className="text-xs text-gray-600">LinkedIn</span>
                  </button>
                  <button
                    onClick={shareViaEmail}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Mail className="h-5 w-5 text-gray-600" />
                    <span className="text-xs text-gray-600">Email</span>
                  </button>
                </div>
              </div>

              {/* Export Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Download Results
                </label>
                <div className="space-y-2">
                  <button
                    onClick={exportToCSV}
                    disabled={exporting !== null}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {exporting === 'csv' ? (
                      <Loader2 className="h-5 w-5 text-green-600 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    )}
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">CSV Spreadsheet</div>
                      <div className="text-xs text-gray-500">For Excel, Google Sheets</div>
                    </div>
                  </button>
                  <button
                    onClick={exportToJSON}
                    disabled={exporting !== null}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {exporting === 'json' ? (
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    ) : (
                      <FileText className="h-5 w-5 text-blue-600" />
                    )}
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">JSON Data</div>
                      <div className="text-xs text-gray-500">Structured data format</div>
                    </div>
                  </button>
                  <button
                    onClick={exportToPDF}
                    disabled={exporting !== null}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {exporting === 'pdf' ? (
                      <Loader2 className="h-5 w-5 text-red-600 animate-spin" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-red-600" />
                    )}
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">PDF Report</div>
                      <div className="text-xs text-gray-500">Printable summary</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

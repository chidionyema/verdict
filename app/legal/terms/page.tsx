'use client';

import { FileText, AlertTriangle, Scale, Users, Shield, DollarSign } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600 text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Agreement to Terms</h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <p className="text-blue-800 text-sm">
                <strong>Important:</strong> By accessing or using Verdict, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our platform.
              </p>
            </div>
            <p className="text-gray-600 leading-relaxed">
              These Terms of Service ("Terms") govern your use of the Verdict platform operated by Verdict Inc. ("we", "us", or "our"). 
              These terms apply to all users of the service, including browsers, customers, judges, and contributors of content.
            </p>
          </section>

          {/* Platform Description */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Platform Description</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Verdict is a feedback platform that connects users seeking honest opinions with qualified judges who provide constructive feedback on:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Photos and visual content</li>
              <li>Dating and professional profiles</li>
              <li>Written content and communications</li>
              <li>Life decisions and choices</li>
            </ul>
          </section>

          {/* User Accounts */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">User Accounts</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Creation</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>You must be at least 18 years old to create an account</li>
                  <li>Provide accurate and complete information during registration</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>You are responsible for all activities that occur under your account</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Responsibilities</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Keep your contact information up to date</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                  <li>Do not share your account with others or create multiple accounts</li>
                  <li>Comply with all applicable laws and regulations</li>
                </ul>
              </div>
            </div>
          </section>

          {/* User Content */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">User Content and Conduct</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Guidelines</h3>
                <p className="text-gray-600 mb-2">When submitting content for verdicts or providing feedback, you agree to:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Only submit content that you own or have permission to use</li>
                  <li>Ensure content is appropriate and does not violate our community guidelines</li>
                  <li>Provide honest, constructive, and respectful feedback</li>
                  <li>Respect the privacy and dignity of all users</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Prohibited Content</h3>
                <p className="text-gray-600 mb-2">The following content is strictly prohibited:</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <ul className="list-disc list-inside text-red-800 space-y-1 text-sm">
                    <li>Nudity, sexually explicit, or suggestive content</li>
                    <li>Content involving minors (under 18)</li>
                    <li>Harassment, bullying, or discriminatory content</li>
                    <li>Illegal activities or content that violates any laws</li>
                    <li>Spam, deceptive practices, or fraudulent content</li>
                    <li>Content that infringes on intellectual property rights</li>
                    <li>Violent, threatening, or harmful content</li>
                    <li>Content that promotes self-harm or eating disorders</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Content License</h3>
                <p className="text-gray-600">
                  By submitting content to Verdict, you grant us a non-exclusive, royalty-free license to use, 
                  display, and distribute your content for the purpose of providing our services. This includes 
                  showing your content to judges for feedback purposes.
                </p>
              </div>
            </div>
          </section>

          {/* Judge Program */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Scale className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Judge Program</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Judge Responsibilities</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Provide honest, constructive, and helpful feedback</li>
                  <li>Respond to verdict requests in a timely manner</li>
                  <li>Maintain professionalism and respect in all interactions</li>
                  <li>Follow platform guidelines and quality standards</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Judge Compensation</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Judges earn money for each qualified verdict response</li>
                  <li>Earnings depend on response quality and user ratings</li>
                  <li>Minimum payout threshold is $10.00</li>
                  <li>Payments are processed through Stripe Connect</li>
                  <li>Platform fees apply to all judge earnings</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Judge Standards</h3>
                <p className="text-gray-600">
                  Judges must maintain high standards of quality and conduct. Consistently low-rated responses 
                  or violations of our guidelines may result in removal from the judge program.
                </p>
              </div>
            </div>
          </section>

          {/* Payment Terms */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <DollarSign className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Payment Terms</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Credit System</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Verdict uses a credit-based system for requests</li>
                  <li>Credits are non-refundable once purchased</li>
                  <li>Credits do not expire but may be subject to account closures</li>
                  <li>Free credits may have expiration dates or restrictions</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Subscriptions</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Subscriptions auto-renew unless canceled</li>
                  <li>You can cancel your subscription at any time</li>
                  <li>Cancellations take effect at the end of the current billing period</li>
                  <li>No refunds for partial billing periods</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Refund Policy</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Limited Refunds:</strong> Credits and subscriptions are generally non-refundable. 
                    In exceptional circumstances, we may consider refunds on a case-by-case basis. 
                    Contact support for assistance.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Platform Policies */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Platform Policies</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Moderation</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>We reserve the right to review and moderate all content</li>
                  <li>Content may be removed without notice if it violates our guidelines</li>
                  <li>Repeated violations may result in account suspension or termination</li>
                  <li>We use both automated and manual moderation systems</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Suspension and Termination</h3>
                <p className="text-gray-600 mb-2">We may suspend or terminate your account for:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Violations of these Terms of Service</li>
                  <li>Fraudulent or abusive behavior</li>
                  <li>Spam or repetitive content violations</li>
                  <li>Legal requirements or court orders</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Appeals Process</h3>
                <p className="text-gray-600">
                  If you believe your account was suspended or content was removed in error, 
                  you may appeal the decision by contacting our support team within 30 days 
                  of the action.
                </p>
              </div>
            </div>
          </section>

          {/* Disclaimers */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Disclaimers and Limitations</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Availability</h3>
                <p className="text-gray-600">
                  We strive to keep Verdict available 24/7, but we do not guarantee uninterrupted service. 
                  The platform may be temporarily unavailable for maintenance, updates, or due to 
                  circumstances beyond our control.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Feedback Disclaimer</h3>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-orange-800 text-sm">
                    <strong>Important:</strong> Feedback provided on Verdict represents the opinions of individual judges 
                    and does not constitute professional advice. Users should use their own judgment when 
                    considering feedback for important decisions.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Limitation of Liability</h3>
                <p className="text-gray-600 text-sm">
                  To the maximum extent permitted by law, Verdict shall not be liable for any indirect, 
                  incidental, special, consequential, or punitive damages, including but not limited to 
                  loss of profits, data, or other intangible losses resulting from your use of the platform.
                </p>
              </div>
            </div>
          </section>

          {/* Privacy */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy</h2>
            <p className="text-gray-600">
              Your privacy is important to us. Please review our{' '}
              <a href="/legal/privacy" className="text-indigo-600 hover:text-indigo-800 underline">
                Privacy Policy
              </a>{' '}
              to understand how we collect, use, and protect your information.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
            <p className="text-gray-600">
              We reserve the right to modify these Terms of Service at any time. We will notify users of 
              material changes by posting the updated terms on this page and updating the "Last updated" 
              date. Your continued use of the platform after changes are posted constitutes acceptance 
              of the new terms.
            </p>
          </section>

          {/* Governing Law */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law and Disputes</h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                These Terms shall be governed by and construed in accordance with the laws of 
                [State/Country], without regard to its conflict of law provisions.
              </p>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Dispute Resolution</h3>
                <p className="text-gray-600">
                  Any disputes arising from these Terms or your use of Verdict shall be resolved through 
                  binding arbitration, except for claims that may be brought in small claims court. 
                  You waive your right to participate in class action lawsuits.
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-600 mb-4">
                If you have questions about these Terms of Service, please contact us:
              </p>
              
              <div className="space-y-2 text-gray-600">
                <p><strong>Email:</strong> legal@verdict.com</p>
                <p><strong>Support:</strong> support@verdict.com</p>
                <p><strong>Address:</strong> Verdict Inc., [Address], [City, State, ZIP]</p>
              </div>
            </div>
          </section>

          {/* Acknowledgment */}
          <section className="mb-8">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-indigo-900 mb-2">Acknowledgment</h3>
              <p className="text-indigo-800 text-sm">
                By using Verdict, you acknowledge that you have read, understood, and agree to be bound by these 
                Terms of Service. If you do not agree to these terms, you must not access or use our platform.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
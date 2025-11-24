'use client';

import { Shield, Eye, Lock, Database, UserCheck, Globe } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              At Verdict, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
              disclose, and safeguard your information when you use our platform. By using Verdict, you 
              consent to the practices described in this policy.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Database className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Information</h3>
                <p className="text-gray-600 mb-2">When you create an account or use our services, we may collect:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Name and email address</li>
                  <li>Profile information and preferences</li>
                  <li>Payment and billing information (processed securely through Stripe)</li>
                  <li>Communications with our support team</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Information</h3>
                <p className="text-gray-600 mb-2">Information related to your use of the platform:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Photos, text, and other content you submit for verdicts</li>
                  <li>Feedback and judgments you provide to other users</li>
                  <li>Comments, ratings, and interactions on the platform</li>
                  <li>Messages and communications through our platform</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Technical Information</h3>
                <p className="text-gray-600 mb-2">Automatically collected when you use our services:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>IP address and device information</li>
                  <li>Browser type and operating system</li>
                  <li>Usage patterns and platform interactions</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <UserCheck className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Provision</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Facilitate verdict requests and judge responses</li>
                  <li>Process payments and manage your account</li>
                  <li>Provide customer support and respond to inquiries</li>
                  <li>Send important service notifications and updates</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Platform Improvement</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Analyze usage patterns to improve our services</li>
                  <li>Develop new features and functionality</li>
                  <li>Conduct research and analytics</li>
                  <li>Ensure platform security and prevent fraud</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Communication</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Send you updates about your account and activities</li>
                  <li>Provide customer support and technical assistance</li>
                  <li>Send promotional content (with your consent)</li>
                  <li>Notify you of important policy changes</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Information Sharing */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Globe className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Information Sharing</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">With Other Users</h3>
                <p className="text-gray-600">
                  When you submit content for verdicts, it may be viewed by judges on our platform. 
                  We do not share your personal information (name, email) with other users unless you 
                  choose to include it in your content.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">With Service Providers</h3>
                <p className="text-gray-600 mb-2">We may share information with trusted third parties who assist us in:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Payment processing (Stripe)</li>
                  <li>Cloud hosting and storage (Supabase)</li>
                  <li>Analytics and performance monitoring</li>
                  <li>Customer support tools</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal Requirements</h3>
                <p className="text-gray-600">
                  We may disclose your information if required by law, to protect our rights, or to 
                  investigate fraud or security issues. We will notify you of such disclosures when 
                  legally permitted.
                </p>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Lock className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Data Security</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                We implement industry-standard security measures to protect your information:
              </p>
              
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security audits and monitoring</li>
                <li>PCI-compliant payment processing</li>
                <li>Limited access to personal information by employees</li>
                <li>Secure cloud infrastructure with enterprise-grade protection</li>
              </ul>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Important:</strong> While we implement strong security measures, no system is 100% secure. 
                  Please use strong passwords and keep your account credentials confidential.
                </p>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Eye className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Your Privacy Rights</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">You have the following rights regarding your personal information:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Access</h3>
                  <p className="text-sm text-gray-600">
                    Request a copy of the personal information we hold about you
                  </p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Correction</h3>
                  <p className="text-sm text-gray-600">
                    Update or correct any inaccurate personal information
                  </p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Deletion</h3>
                  <p className="text-sm text-gray-600">
                    Request deletion of your personal information (subject to legal requirements)
                  </p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Portability</h3>
                  <p className="text-sm text-gray-600">
                    Receive your data in a portable format for transfer to another service
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
                <h3 className="font-semibold text-indigo-900 mb-2">How to Exercise Your Rights</h3>
                <p className="text-indigo-800 text-sm">
                  To exercise any of these rights, contact us at{' '}
                  <a href="mailto:privacy@verdict.com" className="underline">privacy@verdict.com</a>{' '}
                  or through your account settings. We will respond to your request within 30 days.
                </p>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Tracking</h2>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                We use cookies and similar technologies to enhance your experience and analyze platform usage:
              </p>
              
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Essential Cookies</h3>
                  <p className="text-gray-600 text-sm">
                    Required for basic platform functionality, authentication, and security.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Analytics Cookies</h3>
                  <p className="text-gray-600 text-sm">
                    Help us understand how users interact with our platform to improve our services.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Preference Cookies</h3>
                  <p className="text-gray-600 text-sm">
                    Remember your settings and preferences for a personalized experience.
                  </p>
                </div>
              </div>

              <p className="text-gray-600 text-sm">
                You can manage your cookie preferences through your browser settings, though disabling 
                certain cookies may affect platform functionality.
              </p>
            </div>
          </section>

          {/* Children's Privacy */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
            <p className="text-gray-600">
              Verdict is not intended for users under 18 years of age. We do not knowingly collect 
              personal information from children under 18. If we become aware that we have collected 
              such information, we will take steps to delete it promptly.
            </p>
          </section>

          {/* International Users */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">International Users</h2>
            <p className="text-gray-600">
              Verdict is operated from the United States. If you are accessing our services from outside 
              the U.S., your information may be transferred to, stored, and processed in the United States. 
              By using our services, you consent to this transfer.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
            <p className="text-gray-600">
              We may update this Privacy Policy from time to time. We will notify you of any material 
              changes by posting the new policy on this page and updating the "Last updated" date. 
              We encourage you to review this policy periodically.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-600 mb-4">
                If you have questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              
              <div className="space-y-2 text-gray-600">
                <p><strong>Email:</strong> privacy@verdict.com</p>
                <p><strong>Support:</strong> support@verdict.com</p>
                <p><strong>Address:</strong> Verdict Inc., [Address], [City, State, ZIP]</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
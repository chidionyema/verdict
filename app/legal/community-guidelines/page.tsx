'use client';

import { Users, Heart, Shield, AlertTriangle, CheckCircle, MessageSquare } from 'lucide-react';

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Community Guidelines</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Our guidelines help create a safe, respectful, and constructive environment for everyone in the Verdict community.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Community Values */}
          <section className="mb-8">
            <div className="flex items-center mb-6">
              <Heart className="h-6 w-6 text-red-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Our Community Values</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Constructive Feedback</h3>
                <p className="text-sm text-gray-600">
                  We provide honest, helpful feedback that empowers users to improve and grow.
                </p>
              </div>
              
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <Shield className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Mutual Respect</h3>
                <p className="text-sm text-gray-600">
                  We treat all community members with dignity, kindness, and understanding.
                </p>
              </div>
              
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Safe Environment</h3>
                <p className="text-sm text-gray-600">
                  We maintain a welcoming space where everyone feels safe to share and learn.
                </p>
              </div>
            </div>
          </section>

          {/* Content Guidelines */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Content Guidelines</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  What We Encourage
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <ul className="space-y-2 text-green-800">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Honest, constructive feedback that helps users improve</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Clear, appropriate photos for dating profiles, headshots, and style advice</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Written content seeking genuine feedback and improvement</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Respectful discussions about appearance, style, and personal choices</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Specific questions that help judges provide targeted advice</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  Prohibited Content
                </h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <ul className="space-y-2 text-red-800">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Nudity or sexually explicit content</strong> - This includes partial nudity, suggestive poses, or sexual content</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Content involving minors</strong> - Any content featuring individuals under 18 years old</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Harassment or bullying</strong> - Personal attacks, insults, or deliberately hurtful comments</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Discriminatory content</strong> - Content based on race, gender, religion, sexual orientation, or other protected characteristics</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Spam or promotional content</strong> - Advertising, self-promotion, or repetitive content</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Violent or threatening content</strong> - Content depicting violence, threats, or harmful activities</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Feedback Standards */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Feedback Standards</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-700">✓ Constructive Feedback</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                  <p className="text-green-800 text-sm"><strong>Example:</strong> "The lighting in this photo makes it hard to see your features clearly. Try taking photos near a window during the day for better natural lighting."</p>
                  <ul className="text-green-700 text-sm space-y-1">
                    <li>• Specific and actionable</li>
                    <li>• Focuses on improvements</li>
                    <li>• Respectful tone</li>
                    <li>• Explains the reasoning</li>
                  </ul>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-700">✗ Unhelpful Feedback</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                  <p className="text-red-800 text-sm"><strong>Example:</strong> "You look terrible. This photo is awful and you should give up."</p>
                  <ul className="text-red-700 text-sm space-y-1">
                    <li>• Purely negative</li>
                    <li>• No actionable advice</li>
                    <li>• Personal attacks</li>
                    <li>• Discouraging tone</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Tips for Quality Feedback</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Start with something positive when possible</li>
                <li>• Be specific about what could be improved and how</li>
                <li>• Consider the person's goals and context</li>
                <li>• Use "I" statements ("I think..." rather than "You are...")</li>
                <li>• Focus on changeable aspects rather than inherent traits</li>
              </ul>
            </div>
          </section>

          {/* Judge Guidelines */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Judge Guidelines</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Professional Standards</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Provide thoughtful, detailed feedback that takes time and consideration</li>
                  <li>Respond to verdict requests within 24 hours when possible</li>
                  <li>Maintain objectivity and avoid personal bias</li>
                  <li>Respect user privacy and confidentiality</li>
                  <li>Disclose any potential conflicts of interest</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Quality Expectations</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700 mb-3">High-quality feedback should include:</p>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Clear assessment of the submitted content</li>
                    <li>• Specific suggestions for improvement</li>
                    <li>• Explanation of reasoning behind recommendations</li>
                    <li>• Encouragement and positive reinforcement where appropriate</li>
                    <li>• Professional and respectful tone throughout</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Safety and Privacy */}
          <section className="mb-8">
            <div className="flex items-center mb-6">
              <Shield className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Safety and Privacy</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Protecting Your Privacy</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Never share personal information like addresses, phone numbers, or social media handles</li>
                  <li>Avoid identifying information in photos (name tags, license plates, etc.)</li>
                  <li>Be cautious about sharing location-specific information</li>
                  <li>Report any attempts to solicit personal information</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Staying Safe</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Trust your instincts if something feels inappropriate</li>
                  <li>Report suspicious behavior or concerning content immediately</li>
                  <li>Never agree to meet users from the platform in person</li>
                  <li>Keep all interactions within the Verdict platform</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Reporting and Enforcement */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Reporting and Enforcement</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Report Issues</h3>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-orange-800 mb-3">If you encounter content or behavior that violates our guidelines:</p>
                  <ul className="text-orange-700 space-y-1">
                    <li>• Use the "Report" button on any content or profile</li>
                    <li>• Contact our support team at support@verdict.com</li>
                    <li>• Provide as much detail as possible about the violation</li>
                    <li>• Include screenshots if helpful (remove personal information)</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Enforcement Actions</h3>
                <p className="text-gray-600 mb-3">Violations may result in:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-3 text-center">
                    <AlertTriangle className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                    <h4 className="font-medium text-yellow-900">Warning</h4>
                    <p className="text-xs text-yellow-700">First-time minor violations</p>
                  </div>
                  
                  <div className="border border-orange-200 bg-orange-50 rounded-lg p-3 text-center">
                    <AlertTriangle className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                    <h4 className="font-medium text-orange-900">Temporary Suspension</h4>
                    <p className="text-xs text-orange-700">Repeated or moderate violations</p>
                  </div>
                  
                  <div className="border border-red-200 bg-red-50 rounded-lg p-3 text-center">
                    <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                    <h4 className="font-medium text-red-900">Permanent Ban</h4>
                    <p className="text-xs text-red-700">Severe or repeated violations</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Appeals Process</h3>
                <p className="text-gray-600">
                  If you believe enforcement action was taken in error, you can appeal by contacting 
                  support@verdict.com within 30 days. Include your username and details about why 
                  you believe the action was incorrect.
                </p>
              </div>
            </div>
          </section>

          {/* Community Standards */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Building a Better Community</h2>
            
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-indigo-900 mb-3">How You Can Help</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ul className="text-indigo-800 space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-indigo-600 mr-2" />
                    <span>Lead by example with respectful behavior</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-indigo-600 mr-2" />
                    <span>Provide constructive, helpful feedback</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-indigo-600 mr-2" />
                    <span>Report violations when you see them</span>
                  </li>
                </ul>
                <ul className="text-indigo-800 space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-indigo-600 mr-2" />
                    <span>Welcome new community members</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-indigo-600 mr-2" />
                    <span>Share feedback about community improvements</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-indigo-600 mr-2" />
                    <span>Encourage others to follow guidelines</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions or Concerns</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-600 mb-4">
                If you have questions about these community guidelines or need to report an issue:
              </p>
              
              <div className="space-y-2 text-gray-600">
                <p><strong>Email:</strong> support@verdict.com</p>
                <p><strong>Community Team:</strong> community@verdict.com</p>
                <p><strong>Safety Issues:</strong> safety@verdict.com</p>
              </div>
            </div>
          </section>

          {/* Commitment */}
          <section>
            <div className="bg-indigo-600 text-white rounded-lg p-6 text-center">
              <h3 className="text-xl font-bold mb-3">Our Commitment to You</h3>
              <p className="text-indigo-100 max-w-2xl mx-auto">
                We're committed to maintaining a safe, supportive community where everyone can get honest, 
                constructive feedback. These guidelines help us create an environment where users feel 
                comfortable sharing and judges can provide their best insights.
              </p>
              <p className="text-indigo-200 text-sm mt-4">
                Thank you for being part of the Verdict community!
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
'use client';

import Link from 'next/link';
import { Scale, Shield, Mail, HelpCircle } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center text-white font-bold text-xl mb-4">
              <Scale className="h-6 w-6 mr-2" />
              AskVerdict
            </Link>
            <p className="text-gray-400 mb-4 max-w-md">
              Get honest feedback from real people in minutes. Life's tough decisions made clearer 
              with anonymous, constructive opinions from our community of judges.
            </p>
            <div className="flex space-x-4">
              <a 
                href="mailto:support@askverdict.app" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Contact Support"
              >
                <Mail className="h-5 w-5" />
              </a>
              <Link 
                href="/help" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Help & Support"
              >
                <HelpCircle className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/start-simple" className="text-gray-400 hover:text-white transition-colors">
                  Get Feedback
                </Link>
              </li>
              <li>
                <Link href="/become-a-judge" className="text-gray-400 hover:text-white transition-colors">
                  Become a Judge
                </Link>
              </li>
              <li>
                <Link href="/credits" className="text-gray-400 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-gray-400 hover:text-white transition-colors">
                  Help & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/legal/terms" 
                  className="text-gray-400 hover:text-white transition-colors flex items-center"
                >
                  <Scale className="h-4 w-4 mr-2" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  href="/legal/privacy" 
                  className="text-gray-400 hover:text-white transition-colors flex items-center"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/legal/community-guidelines" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} AskVerdict Inc. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 sm:mt-0">
              <Link 
                href="/legal/terms" 
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Terms
              </Link>
              <Link 
                href="/legal/privacy" 
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Privacy
              </Link>
              <a 
                href="mailto:support@askverdict.app" 
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
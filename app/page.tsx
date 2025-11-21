'use client';

import { useRouter } from 'next/navigation';
import { Camera, MessageSquare, Clock, Shield } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Get Honest Feedback in Minutes
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload a photo or text and receive 10 anonymous, honest opinions from real people.
            No social pressure. Just truth.
          </p>

          <button
            onClick={() => router.push('/start')}
            className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition cursor-pointer"
          >
            Get Started - 3 Free Verdicts
          </button>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-20">
            <div className="text-center">
              <Camera className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Upload Anything</h3>
              <p className="text-gray-600">Photos, text, or decisions</p>
            </div>
            <div className="text-center">
              <Clock className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">5 Minute Results</h3>
              <p className="text-gray-600">Get 10 verdicts fast</p>
            </div>
            <div className="text-center">
              <Shield className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">100% Anonymous</h3>
              <p className="text-gray-600">No profiles or identity</p>
            </div>
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Quality Feedback</h3>
              <p className="text-gray-600">From verified humans</p>
            </div>
          </div>

          <div className="mt-20 bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-indigo-600 font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">Upload</h4>
                <p className="text-gray-600 text-sm">Share what you need feedback on</p>
              </div>
              <div className="text-center">
                <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-indigo-600 font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">Wait</h4>
                <p className="text-gray-600 text-sm">10 judges review your submission</p>
              </div>
              <div className="text-center">
                <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-indigo-600 font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">Decide</h4>
                <p className="text-gray-600 text-sm">Get honest feedback to make your choice</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

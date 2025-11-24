'use client';

import { DemographicCollection } from '@/components/judge/demographic-collection';

export default function JudgeDemographicsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-12">
        <DemographicCollection />
      </div>
    </div>
  );
}
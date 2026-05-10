import { Suspense } from 'react';
import PairClient from './pair-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function PairPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-slate-100 flex items-center justify-center px-6">
          <div className="card max-w-lg w-full text-center">
            <h1 className="text-2xl font-bold mb-3">Phone Pairing</h1>
            <p className="text-slate-300">Loading pairing session...</p>
          </div>
        </div>
      }
    >
      <PairClient />
    </Suspense>
  );
}

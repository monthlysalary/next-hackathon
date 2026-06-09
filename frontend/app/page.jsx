'use client'

import PhoneFrame from '@/components/PhoneFrame'
import AppContent from '@/components/AppContent'

export default function Home() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-bg overflow-hidden">
      {/* Branding outside the phone */}
      <div className="absolute top-8 left-8 hidden lg:block">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">TableFor</h1>
        <p className="text-sm text-text-secondary mt-1">Group Dining Agent</p>
      </div>

      <PhoneFrame>
        <AppContent />
      </PhoneFrame>
    </div>
  )
}

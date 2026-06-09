'use client'

import PhoneFrame from '@/components/PhoneFrame'
import AppContent from '@/components/AppContent'

export default function Home() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0f] overflow-hidden">
      {/* Background decorative gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

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

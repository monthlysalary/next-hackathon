'use client'

import PhoneFrame from '@/components/PhoneFrame'
import AppContent from '@/components/AppContent'
import AuthProvider from '@/components/AuthProvider'

export default function Home() {
  return (
    <AuthProvider>
      <div className="h-screen w-screen flex items-center justify-center bg-bg overflow-hidden">
        {/* Branding outside the phone */}
        <div className="absolute top-8 left-8 hidden lg:flex items-center gap-3">
          <img src="/logo.jpg" alt="TableFor" className="h-10 w-auto rounded-lg" />
          <div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">TableFor</h1>
            <p className="text-xs text-text-secondary">Group Dining Agent</p>
          </div>
        </div>

        <PhoneFrame>
          <AppContent />
        </PhoneFrame>
      </div>
    </AuthProvider>
  )
}

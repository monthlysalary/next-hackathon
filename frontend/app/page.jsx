'use client'

import AppContent from '@/components/AppContent'
import AuthProvider from '@/components/AuthProvider'
import AppBackground from '@/components/AppBackground'

export default function Home() {
  return (
    <AuthProvider>
      <AppBackground>
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto app-scroll">
            <AppContent />
          </div>
        </div>
      </AppBackground>
    </AuthProvider>
  )
}

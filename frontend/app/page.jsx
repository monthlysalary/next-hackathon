'use client'

import PhoneFrame from '@/components/PhoneFrame'
import AppContent from '@/components/AppContent'
import AuthProvider from '@/components/AuthProvider'
import AppBackground from '@/components/AppBackground'

export default function Home() {
  return (
    <AuthProvider>
      <AppBackground>
        <PhoneFrame>
          <AppContent />
        </PhoneFrame>
      </AppBackground>
    </AuthProvider>
  )
}

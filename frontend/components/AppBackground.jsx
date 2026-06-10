'use client'

export default function AppBackground({ children, className = '' }) {
  return (
    <div
      className={`tablefor-app-bg relative h-[100dvh] max-h-[100dvh] w-full overflow-hidden ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[#fdf6f0]/35" aria-hidden="true" />
      <div className="relative z-[1] flex h-full min-h-0 w-full flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}

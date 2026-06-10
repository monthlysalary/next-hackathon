'use client'

export default function PhoneFrame({ children }) {
  return (
    <div className="relative flex h-full w-full min-h-0 flex-col overflow-hidden bg-transparent">
      <div className="phone-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain">
        {children}
      </div>
    </div>
  )
}

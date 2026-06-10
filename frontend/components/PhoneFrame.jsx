'use client'

export default function PhoneFrame({ children }) {
  return (
    <div className="relative">
      {/* Outer phone body */}
      <div className="relative w-[390px] h-[844px] rounded-[55px] bg-[#faf3ec] p-[10px] shadow-phone border border-[#e8ddd4]">
        {/* Inner bezel */}
        <div className="relative w-full h-full rounded-[46px] overflow-hidden bg-white">
          {/* Dynamic Island */}
          <div className="absolute top-0 left-0 right-0 z-50 flex justify-center pt-3 pointer-events-none">
            <div className="w-[120px] h-[32px] bg-[#1a1a2e] rounded-full flex items-center justify-center gap-2">
              <div className="w-[10px] h-[10px] rounded-full bg-[#2a2a3e] ring-1 ring-gray-700" />
            </div>
          </div>

          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-8 pt-[14px] text-[11px] text-text-primary font-medium pointer-events-none">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
              </svg>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
              </svg>
            </div>
          </div>

          {/* App content area */}
          <div className="absolute inset-0 pt-[52px] pb-[20px] overflow-hidden">
            <div className="h-full overflow-y-auto phone-scroll">
              {children}
            </div>
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
            <div className="w-32 h-1 rounded-full bg-text-secondary/20" />
          </div>
        </div>
      </div>
    </div>
  )
}

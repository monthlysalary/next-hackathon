import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f5ede8] px-6">
      <div className="w-full max-w-[360px] bg-white rounded-[40px] p-8 shadow-sm border border-[#f0e8e0]">

        {/* Logo */}
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0">
            <svg viewBox="0 0 100 100" width="56" height="56" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" rx="18" fill="#F28155"/>
              <text x="50" y="62" fontSize="58" textAnchor="middle" fill="#3B3BD4" fontFamily="Georgia, serif" fontWeight="bold">4</text>
              <circle cx="24" cy="24" r="5" fill="#FFD166" opacity="0.9"/>
              <circle cx="78" cy="38" r="4" fill="#FFD166" opacity="0.9"/>
              <circle cx="22" cy="72" r="4" fill="#FFD166" opacity="0.9"/>
              <polygon points="68,18 71,12 74,18 80,18 75,22 77,28 71,24 65,28 67,22 62,18" fill="white" opacity="0.9"/>
              <polygon points="30,40 32,35 34,40 39,40 35,43 36,48 32,45 28,48 29,43 25,40" fill="white" opacity="0.9"/>
              <polygon points="76,70 78,65 80,70 85,70 81,73 82,78 78,75 74,78 75,73 71,70" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <span className="text-3xl font-bold text-[#1a1a1a] tracking-tight">TableFor</span>
        </div>

        <p className="text-[#aaa] text-sm mb-8 pl-0.5">Find your seat at the table.</p>

        {/* Email */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Email</label>
          <div className="bg-[#f5ede8] rounded-2xl flex items-center px-4 h-[52px] gap-3">
            <Mail size={18} className="text-[#bbb] flex-shrink-0" />
            <input
              type="email"
              placeholder="hello@tablefor.app"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-[#555] flex-1 placeholder-[#bbb]"
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-7">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-[#1a1a1a]">Password</label>
            <button className="text-sm text-[#F28155]">Forgot?</button>
          </div>
          <div className="bg-[#f5ede8] rounded-2xl flex items-center px-4 h-[52px] gap-3">
            <Lock size={18} className="text-[#bbb] flex-shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-[#555] flex-1 placeholder-[#bbb]"
            />
            <button onClick={() => setShowPassword(v => !v)} className="text-[#bbb]">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Sign In */}
        <button
          onClick={onLogin}
          className="w-full bg-[#F28155] text-white rounded-2xl h-[54px] text-base font-semibold flex items-center justify-center gap-2 mb-5 active:opacity-90 transition-opacity"
        >
          Sign In <ArrowRight size={18} />
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-[#e8ddd8]" />
          <span className="text-xs text-[#bbb] tracking-wider">OR</span>
          <div className="flex-1 h-px bg-[#e8ddd8]" />
        </div>

        {/* Social */}
        <div className="grid grid-cols-2 gap-3 mb-7">
          <button className="border border-[#e8ddd8] bg-white rounded-2xl h-[50px] flex items-center justify-center gap-2 text-sm font-medium text-[#1a1a1a] active:bg-[#fafafa]">
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Google
          </button>
          <button className="border border-[#e8ddd8] bg-white rounded-2xl h-[50px] flex items-center justify-center gap-2 text-sm font-medium text-[#1a1a1a] active:bg-[#fafafa]">
            <svg width="18" height="18" viewBox="0 0 814 1000">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.3-150.3-109.2c-38.8-55.2-71.9-143.8-71.9-226.8 0-192.4 131.8-293.7 261.3-293.7 69.6 0 127.3 45.8 171.3 45.8 42.8 0 109.5-48.4 188.4-48.4 30.2 0 108.2 2.6 168.6 71.3z" fill="#1a1a1a"/>
              <path d="M554.7 111c28.5-34.2 50-81.6 50-129 0-6.5-.6-13-1.9-18.2-47.5 1.9-104.1 31.8-138.2 71.3-26.7 30.8-52.2 78.1-52.2 126.2 0 7.1 1.3 14.3 1.9 16.5 3.2.6 8.4 1.3 13.5 1.3 42.8 0 96.1-28.6 126.9-68.1z" fill="#1a1a1a"/>
            </svg>
            Apple
          </button>
        </div>

        <p className="text-center text-sm text-[#999]">
          Don't have an account?{" "}
          <button className="text-[#F28155] font-medium">Sign Up</button>
        </p>
      </div>
    </div>
  );
}

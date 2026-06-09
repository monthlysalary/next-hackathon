import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  Users,
  Search,
  User,
  Plus,
  ChevronRight,
  MapPin,
  X,
  ArrowLeft,
  Mail,
} from "lucide-react";

type Tab = "home" | "explore" | "groups" | "profile";
type GroupStep = "idle" | "name" | "friends" | "location";

function HomeTab() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
      <div className="w-24 h-24 rounded-full bg-[#fff5ef] border-2 border-dashed border-[#F28155]/30 flex items-center justify-center">
        <Users size={36} className="text-[#F28155]/50" />
      </div>
      <div>
        <p className="text-lg font-bold text-[#1a1a1a] mb-1">No groups yet</p>
        <p className="text-sm text-[#bbb] leading-relaxed">
          Create a group with friends to start finding places you'll all love.
        </p>
      </div>
    </div>
  );
}

function ExploreTab() {
  const categories = ["🍕 Italian", "🍣 Sushi", "🌮 Mexican", "🍔 Burgers", "🥗 Healthy", "☕ Cafés"];
  return (
    <div className="flex-1 overflow-auto px-5 py-4">
      <p className="text-xs font-bold text-[#bbb] uppercase tracking-widest mb-3">Browse By Cuisine</p>
      <div className="grid grid-cols-2 gap-3">
        {categories.map(cat => (
          <button
            key={cat}
            className="bg-white rounded-2xl border border-[#ecddd6] h-16 flex items-center justify-center text-sm font-semibold text-[#1a1a1a] active:bg-[#fff5ef] transition-colors"
          >
            {cat}
          </button>
        ))}
      </div>
      <p className="text-xs font-bold text-[#bbb] uppercase tracking-widest mb-3 mt-6">Near You</p>
      {[
        { name: "Olive Garden", cuisine: "Italian · 0.3 mi", rating: "4.5" },
        { name: "Blue Sushi", cuisine: "Japanese · 0.6 mi", rating: "4.8" },
        { name: "The Green Bowl", cuisine: "Healthy · 0.9 mi", rating: "4.3" },
      ].map(r => (
        <div key={r.name} className="bg-white rounded-2xl border border-[#ecddd6] p-4 mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1a1a1a]">{r.name}</p>
            <p className="text-xs text-[#bbb]">{r.cuisine}</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-[#F28155] font-bold">★ {r.rating}</span>
            <ChevronRight size={14} className="text-[#ddd]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileTab() {
  return (
    <div className="flex-1 px-5 py-4">
      <div className="flex items-center gap-4 mb-6 bg-white rounded-2xl p-4 border border-[#ecddd6]">
        <div className="w-14 h-14 rounded-full bg-[#F28155] flex items-center justify-center">
          <User size={24} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-[#1a1a1a]">Your Profile</p>
          <p className="text-xs text-[#bbb]">hello@tablefor.app</p>
        </div>
      </div>
      {["Dietary Restrictions", "Allergies", "Notifications", "Privacy", "Help"].map(item => (
        <div key={item} className="flex items-center justify-between py-4 border-b border-[#f0e8e0] last:border-0">
          <span className="text-sm font-medium text-[#1a1a1a]">{item}</span>
          <ChevronRight size={16} className="text-[#ddd]" />
        </div>
      ))}
    </div>
  );
}

interface GroupsTabProps {
  onCreateGroup: () => void;
}

function GroupsTab({ onCreateGroup }: GroupsTabProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
      <div className="w-24 h-24 rounded-full bg-[#fff5ef] border-2 border-dashed border-[#F28155]/30 flex items-center justify-center">
        <Users size={36} className="text-[#F28155]/50" />
      </div>
      <div>
        <p className="text-lg font-bold text-[#1a1a1a] mb-1">No groups yet</p>
        <p className="text-sm text-[#bbb] leading-relaxed">
          Start by creating a group and inviting your friends.
        </p>
      </div>
      <button
        onClick={onCreateGroup}
        className="flex items-center gap-2 bg-[#F28155] text-white px-6 py-3 rounded-2xl font-semibold text-sm active:opacity-90 transition-opacity"
      >
        <Plus size={16} /> Create a Group
      </button>
    </div>
  );
}

interface FriendsSheetProps {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

function FriendsSheet({ open, onClose, onDone }: FriendsSheetProps) {
  const [friends, setFriends] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const addFriend = () => {
    const val = input.trim().toLowerCase();
    if (!val || friends.includes(val)) return;
    setFriends(prev => [...prev, val]);
    setInput("");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 z-20"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-30 p-6 pb-10"
          >
            <div className="w-10 h-1 bg-[#e0d8d4] rounded-full mx-auto mb-5" />
            <h2 className="text-xl font-extrabold text-[#1a1a1a] mb-1">Invite Friends</h2>
            <p className="text-sm text-[#bbb] mb-5">Enter your friends' Gmail addresses to add them to the group.</p>

            <div className="flex gap-2.5 mb-4">
              <div className="flex-1 bg-[#f5ede8] rounded-2xl flex items-center px-4 h-[50px] gap-2.5">
                <Mail size={16} className="text-[#bbb]" />
                <input
                  type="email"
                  placeholder="friend@gmail.com"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addFriend()}
                  className="flex-1 bg-transparent outline-none text-sm text-[#1a1a1a] placeholder-[#bbb]"
                />
              </div>
              <button
                onClick={addFriend}
                className="w-[50px] h-[50px] bg-[#F28155] rounded-2xl flex items-center justify-center flex-shrink-0"
              >
                <Plus size={20} className="text-white" />
              </button>
            </div>

            {friends.length > 0 && (
              <div className="flex flex-col gap-2 mb-5 max-h-36 overflow-auto">
                {friends.map(f => (
                  <div key={f} className="flex items-center justify-between bg-[#fdf6f0] border border-[#ecddd6] rounded-2xl px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#F28155] flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{f[0].toUpperCase()}</span>
                      </div>
                      <span className="text-sm text-[#1a1a1a] font-medium">{f}</span>
                    </div>
                    <button onClick={() => setFriends(prev => prev.filter(x => x !== f))}>
                      <X size={14} className="text-[#bbb]" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onDone}
              disabled={friends.length === 0}
              className="w-full bg-[#F28155] text-white rounded-2xl h-[52px] font-bold text-base disabled:opacity-40 active:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface LocationSheetProps {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

function LocationSheet({ open, onClose, onDone }: LocationSheetProps) {
  const [location, setLocation] = useState("");
  const [detecting, setDetecting] = useState(false);

  const detectLocation = () => {
    setDetecting(true);
    setTimeout(() => {
      setLocation("123 Main St, San Francisco, CA");
      setDetecting(false);
    }, 1200);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 z-20"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-30 p-6 pb-10"
          >
            <div className="w-10 h-1 bg-[#e0d8d4] rounded-full mx-auto mb-5" />
            <div className="w-12 h-12 rounded-2xl bg-[#fff5ef] flex items-center justify-center mb-4">
              <MapPin size={22} className="text-[#F28155]" />
            </div>
            <h2 className="text-xl font-extrabold text-[#1a1a1a] mb-1">Your Location</h2>
            <p className="text-sm text-[#bbb] mb-5">So we can find great restaurants near your group.</p>

            <div className="bg-[#f5ede8] rounded-2xl flex items-center px-4 h-[52px] gap-2.5 mb-3">
              <MapPin size={16} className="text-[#bbb] flex-shrink-0" />
              <input
                type="text"
                placeholder="Enter your address or city..."
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-[#1a1a1a] placeholder-[#bbb]"
              />
            </div>

            <button
              onClick={detectLocation}
              className="w-full border border-[#ecddd6] bg-white rounded-2xl h-[46px] text-sm font-medium text-[#F28155] flex items-center justify-center gap-2 mb-5 active:bg-[#fff5ef]"
            >
              {detecting ? (
                <span className="animate-pulse">Detecting location...</span>
              ) : (
                <>
                  <MapPin size={14} /> Use my current location
                </>
              )}
            </button>

            <button
              onClick={onDone}
              disabled={!location.trim()}
              className="w-full bg-[#F28155] text-white rounded-2xl h-[52px] font-bold text-base disabled:opacity-40 active:opacity-90 transition-opacity"
            >
              Find Restaurants 🍽️
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function MainApp() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [groupStep, setGroupStep] = useState<GroupStep>("idle");
  const [groupName, setGroupName] = useState("");
  const [showFriends, setShowFriends] = useState(false);
  const [showLocation, setShowLocation] = useState(false);

  const handleCreateGroup = () => setGroupStep("name");
  const handleGroupNameNext = () => {
    if (!groupName.trim()) return;
    setShowFriends(true);
  };
  const handleFriendsDone = () => {
    setShowFriends(false);
    setShowLocation(true);
  };
  const handleLocationDone = () => {
    setShowLocation(false);
    setGroupStep("idle");
    setGroupName("");
  };

  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: "home", icon: <Home size={22} />, label: "Home" },
    { id: "explore", icon: <Search size={22} />, label: "Explore" },
    { id: "groups", icon: <Users size={22} />, label: "Groups" },
    { id: "profile", icon: <User size={22} />, label: "Profile" },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f5ede8]">
      {/* Phone frame */}
      <div className="relative w-full max-w-[390px] h-[844px] bg-[#fdf6f0] rounded-[44px] shadow-2xl border border-[#ecddd6] overflow-hidden flex flex-col">

        {/* Status bar */}
        <div className="flex items-center justify-between px-7 pt-4 pb-2 flex-shrink-0">
          <span className="text-xs font-semibold text-[#1a1a1a]">9:41</span>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-2.5 rounded-sm border border-[#1a1a1a] relative">
              <div className="absolute inset-0.5 left-0.5 right-1 bg-[#1a1a1a] rounded-sm" />
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-2 pb-4 flex-shrink-0">
          {groupStep === "name" ? (
            <button onClick={() => setGroupStep("idle")} className="flex items-center gap-2 text-[#F28155]">
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">Back</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl overflow-hidden">
                <svg viewBox="0 0 100 100" width="32" height="32">
                  <rect width="100" height="100" rx="18" fill="#F28155"/>
                  <text x="50" y="62" fontSize="58" textAnchor="middle" fill="#3B3BD4" fontFamily="Georgia, serif" fontWeight="bold">4</text>
                </svg>
              </div>
              <span className="font-bold text-[#1a1a1a]">TableFor</span>
            </div>
          )}
          <div className="w-9 h-9 rounded-full bg-[#F28155] flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
        </div>

        {/* Page title area */}
        <div className="px-6 mb-2 flex-shrink-0">
          {groupStep === "name" ? (
            <h1 className="text-2xl font-extrabold text-[#1a1a1a]">New Group</h1>
          ) : (
            <div>
              <p className="text-sm text-[#bbb]">
                {activeTab === "home" && "Welcome back 👋"}
                {activeTab === "explore" && "Discover restaurants"}
                {activeTab === "groups" && "Your dining groups"}
                {activeTab === "profile" && "Your account"}
              </p>
              <h1 className="text-2xl font-extrabold text-[#1a1a1a] capitalize">{activeTab}</h1>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {groupStep === "name" ? (
            <div className="flex-1 flex flex-col px-6 py-4">
              <p className="text-sm text-[#999] mb-6 leading-relaxed">
                Give your group a name — something your friends will recognize.
              </p>
              <div className="bg-white border border-[#ecddd6] rounded-2xl flex items-center px-4 h-[56px] mb-3">
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Saturday Crew 🍕"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleGroupNameNext()}
                  className="flex-1 bg-transparent outline-none text-base text-[#1a1a1a] placeholder-[#ccc] font-medium"
                />
              </div>
              <p className="text-xs text-[#bbb] mb-8">You'll invite friends in the next step.</p>
              <button
                onClick={handleGroupNameNext}
                disabled={!groupName.trim()}
                className="w-full bg-[#F28155] text-white rounded-2xl h-[54px] font-bold text-base disabled:opacity-40 active:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                Next — Add Friends <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <>
              {activeTab === "home" && <HomeTab />}
              {activeTab === "explore" && <ExploreTab />}
              {activeTab === "groups" && <GroupsTab onCreateGroup={handleCreateGroup} />}
              {activeTab === "profile" && <ProfileTab />}
            </>
          )}

          {/* Sheets */}
          <FriendsSheet
            open={showFriends}
            onClose={() => setShowFriends(false)}
            onDone={handleFriendsDone}
          />
          <LocationSheet
            open={showLocation}
            onClose={() => setShowLocation(false)}
            onDone={handleLocationDone}
          />
        </div>

        {/* Bottom Nav */}
        <div className="flex-shrink-0 bg-white border-t border-[#f0e8e0] px-4 pt-3 pb-6 flex items-center justify-around">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id && groupStep === "idle";
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setGroupStep("idle");
                  setActiveTab(tab.id);
                }}
                className="flex flex-col items-center gap-1 min-w-[56px]"
              >
                <div className={`transition-colors ${isActive ? "text-[#F28155]" : "text-[#ccc]"}`}>
                  {tab.icon}
                </div>
                <span className={`text-[10px] font-semibold transition-colors ${isActive ? "text-[#F28155]" : "text-[#ccc]"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

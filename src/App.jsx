import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SocketProvider, useSocket } from "./context/SocketContext";
import Level1 from "./components/Level1";
import Level2 from "./components/Level2";
import Level3 from "./components/Level3";
import Questions from "./components/Questions";

// Komponent z paskiem nagłówkowym (wspólny dla wszystkich poziomów)
function Layout() {
  const { state, users } = useSocket();
  const location = useLocation();

  const levelObjectives = {
    1: "Uruchom wszystkie wymagane systemy showroomu bez przeciążenia sieci.",
    2: "Zlokalizuj beacon i zaktualizuj etykiety E-INK przez MQTT.",
    3: "Rozwiąż wszystkie incydenty bezpieczeństwa.",
  };

  // Wyciągamy numer poziomu z URL (dla wyświetlenia odpowiedniego opisu)
  const currentLevelFromPath = 
    location.pathname === "/level2" ? 2 :
    location.pathname === "/level3" ? 3 : 1;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/90 border border-slate-800 rounded-2xl px-6 py-5 mb-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <h1 className="text-4xl font-black tracking-tight">
              IoT Digital Twin Simulation
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-slate-400">Active Users: {users.length}/30</p>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-cyan-400 font-semibold">
                LEVEL {currentLevelFromPath}
              </p>
            </div>
          </div>
          <div className="max-w-xl">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
              Aktualny cel
            </div>
            <div className="text-sm text-slate-200">
              {levelObjectives[currentLevelFromPath]}
            </div>
          </div>
        </div>
      </div>

      {/* Miejsce na właściwy poziom (komponenty dziecięce) */}
      <Routes>
        <Route path="/" element={<Level1 />} />
        <Route path="/level1" element={<Level1 />} />
        <Route path="/level2" element={<Level2 />} />
        <Route path="/level3" element={<Level3 />} />
        <Route path="/questions" element={<Questions />} />

      </Routes>
    </div>
  );
}

// Główny komponent App z providerem socketów i routerem
export default function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </SocketProvider>
  );
}
import { SocketProvider, useSocket } from "./context/SocketContext";
import Level1 from "./components/Level1";
import Level2 from "./components/Level2";
import Level3 from "./components/Level3";

function Dashboard() {
  const { state, users, socket } = useSocket();

  if (!state) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const levelCompleted = state.levelCompleted || false;

  const levelObjectives = {
    1: "Uruchom wszystkie wymagane systemy showroomu bez przeciążenia sieci.",
    2: "Zlokalizuj beacon i zaktualizuj etykiety E-INK przez MQTT.",
    3: "Rozwiąż wszystkie incydenty bezpieczeństwa.",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/90 border border-slate-800 rounded-2xl px-6 py-5 mb-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <h1 className="text-4xl font-black tracking-tight">
              IoT Digital Twin Simulation
            </h1>

            <div className="flex items-center gap-4 mt-2">
              <p className="text-slate-400">
                Active Users: {users.length}/30
              </p>

              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

              <p className="text-cyan-400 font-semibold">
                LEVEL {state.currentLevel}
              </p>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
              Aktualny cel
            </div>

            <div className="text-sm text-slate-200">
              {levelObjectives[state.currentLevel]}
            </div>
          </div>

          {levelCompleted ? (
            <button
              onClick={() => socket.emit("adminNextLevel")}
              className="
                bg-emerald-500
                hover:bg-emerald-400
                transition-all
                px-6
                py-3
                rounded-2xl
                font-black
                tracking-wide
                shadow-lg
                shadow-emerald-500/20
              "
            >
              NEXT LEVEL
            </button>
          ) : (
            <div
              className="
                bg-slate-900
                border
                border-slate-700
                px-5
                py-3
                rounded-2xl
                text-sm
                text-slate-400
              "
            >
              Zadanie nieukończone
            </div>
          )}
        </div>
      </div>

      {state.currentLevel === 1 && <Level1 />}
      {state.currentLevel === 2 && <Level2 />}
      {state.currentLevel === 3 && <Level3 />}
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <Dashboard />
    </SocketProvider>
  );
}
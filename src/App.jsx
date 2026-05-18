import { SocketProvider, useSocket } from "./context/SocketContext";
import Level1 from "./components/Level1";
import Level2 from "./components/Level2";
import Level3 from "./components/Level3";
import { Users } from "lucide-react";

function Dashboard() {
  const { state, users, socket } = useSocket();

  if (!state) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold">
            IoT Digital Twin Simulation
          </h1>

          <p className="text-slate-400">
            Active Users: {users.length}/30
          </p>
        </div>

        <button
          onClick={() => socket.emit("adminNextLevel")}
          className="bg-cyan-600 px-4 py-2 rounded-lg"
        >
          NEXT LEVEL
        </button>
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
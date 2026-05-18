import { useSocket } from "../context/SocketContext";
import {
  ShieldAlert,
  Siren,
  CheckCircle,
} from "lucide-react";

export default function Level3() {
  const { state, socket } = useSocket();

  const incidents = state.level3.incidents;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">
        Level 3 — Smart Office Security
      </h2>

      <div className="space-y-4">
        {incidents.map((incident) => (
          <div
            key={incident.id}
            className={`p-5 rounded-xl border ${
              incident.resolved
                ? "bg-green-900 border-green-600"
                : "bg-red-950 border-red-700"
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {incident.type === "SOS" ? (
                  <Siren />
                ) : (
                  <ShieldAlert />
                )}

                <div>
                  <div className="font-bold">
                    {incident.type}
                  </div>

                  <div className="text-sm text-slate-300">
                    Room: {incident.room}
                  </div>
                </div>
              </div>

              {!incident.resolved && (
                <button
                  onClick={() =>
                    socket.emit(
                      "resolveIncident",
                      incident.id
                    )
                  }
                  className="bg-cyan-600 px-4 py-2 rounded-lg"
                >
                  Resolve
                </button>
              )}

              {incident.resolved && (
                <CheckCircle className="text-green-400" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
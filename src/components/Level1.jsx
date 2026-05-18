import { useSocket } from "../context/SocketContext";
import { Power } from "lucide-react";
import { motion } from "framer-motion";

export default function Level1() {
  const { state, socket } = useSocket();

  const level = state.level1;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">
          Level 1 — NETIO Energy Grid
        </h2>

        <div className="text-xl">
          Total Power: {level.totalPower}W / 18000W
        </div>

        {level.breakerTriggered && (
          <div className="text-red-500 text-2xl mt-2">
            BREAKER TRIGGERED
          </div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-4">
        {level.strips.map((strip) => (
          <motion.div
            key={strip.id}
            whileHover={{ scale: 1.03 }}
            className="bg-slate-900 p-4 rounded-xl border border-slate-700"
          >
            <h3 className="mb-3 font-bold">
              Rack #{strip.id + 1}
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {strip.sockets.map((active, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    socket.emit("toggleSocket", {
                      stripId: strip.id,
                      socketIndex: idx,
                    })
                  }
                  className={`p-4 rounded-lg flex justify-center ${
                    active
                      ? "bg-green-500"
                      : "bg-slate-700"
                  }`}
                >
                  <Power />
                </button>
              ))}
            </div>

            <div className="mt-3 text-sm text-slate-400">
              {strip.powerUsage}W
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
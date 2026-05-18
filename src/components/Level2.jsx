import { useSocket } from "../context/SocketContext";
import { Radio, Tag } from "lucide-react";

export default function Level2() {
  const { state, socket } = useSocket();

  const level = state.level2;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-4">
        Level 2 — BLE / ESL Warehouse
      </h2>

      <div className="relative w-full h-[500px] bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
        {level.gateways.map((g) => (
          <button
            key={g.id}
            onClick={() =>
              socket.emit("scanGateway", {
                gatewayId: g.id,
              })
            }
            className="absolute bg-cyan-500 p-3 rounded-full"
            style={{
              left: g.x,
              top: g.y,
            }}
          >
            <Radio size={18} />
          </button>
        ))}

        {level.beacons.map((b) => (
          <div
            key={b.id}
            className="absolute bg-yellow-400 w-5 h-5 rounded-full"
            style={{
              left: b.x,
              top: b.y,
            }}
          />
        ))}

        {level.products.map((p) => (
          <div
            key={p.id}
            className="absolute bg-slate-800 border border-slate-600 p-2 rounded"
            style={{
              left: p.x,
              top: p.y,
            }}
          >
            <Tag size={18} />
            <div className="text-xs">{p.name}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        {level.einkLabels.map((label) => (
          <div
            key={label.id}
            className="bg-white text-black p-4 rounded-xl"
          >
            <div className="font-bold">
              ESL #{label.id}
            </div>

            <div className="text-2xl my-2">
              {label.text}
            </div>

            <button
              onClick={() =>
                socket.emit("updatePrice", {
                  labelId: label.id,
                  newPrice:
                    Math.floor(Math.random() * 500) + 50,
                })
              }
              className="bg-black text-white px-3 py-2 rounded"
            >
              MQTT Update
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
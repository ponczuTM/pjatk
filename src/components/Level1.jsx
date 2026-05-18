import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ServerCrash,
  Monitor,
  Cpu,
  Printer,
  LampDesk,
  Coffee,
  Wifi,
  Camera,
  Tv,
  Gamepad2,
  ShieldAlert,
  HardDrive,
  Speaker,
  AirVent,
  Power,
  PowerOff,
  AlertTriangle,
  CheckCircle2,
  Zap,
  XCircle,
  Bot,
  Router,
} from "lucide-react";

import { useSocket } from "../context/SocketContext";
import styles from "./Level1.module.css";

const POWER_LIMIT = 26000;

const stripsDefinition = [
];
// ----------------------------------------------------------------

export default function Level1() {
  const navigate = useNavigate();
  const { socket, state } = useSocket();
  const [awaitingLevel2, setAwaitingLevel2] = useState(false);

  // ✅ ZMIANA: Serwerownia (id 9) startuje włączona ze wszystkimi gniazdami ON.
  // Pozostałe listwy startują wyłączone, gniazda OFF.
  const [devices, setDevices] = useState(() => {
    return stripsDefinition.map((strip) => ({
      ...strip,
      enabled: strip.id === 9,
      sockets: strip.devices.map(() => strip.id === 9),
    }));
  });

  const [notifications, setNotifications] = useState([]);
  const [blackout, setBlackout] = useState(false);
  const [serverDown, setServerDown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [levelCompletedLocally, setLevelCompletedLocally] = useState(false);

  const addNotification = (text, type = "warning") => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [{ id, text, type }, ...prev.slice(0, 5)]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 9000);
  };

  const resetAll = () => {
    setDevices((prev) =>
      prev.map((strip) => ({
        ...strip,
        enabled: true,
        sockets: strip.sockets.map(() => false),
      }))
    );
    setLevelCompletedLocally(false);
  };

  const totalPower = useMemo(() => {
    let total = 0;
    devices.forEach((strip) => {
      if (!strip.enabled) return;
      strip.devices.forEach((device, idx) => {
        if (strip.sockets[idx]) total += device.power;
      });
    });
    return total;
  }, [devices]);

  const requiredCompleted = useMemo(() => {
    return devices.every((strip) =>
      strip.devices.every((device, idx) => {
        if (!device.required) return true;
        return strip.sockets[idx];
      })
    );
  }, [devices]);

  const isSuccess = requiredCompleted && totalPower <= POWER_LIMIT && !blackout && !serverDown;

  useEffect(() => {
    if (isSuccess && !levelCompletedLocally) {
      setLevelCompletedLocally(true);
      addNotification("✅ Poziom ukończony! Możesz przejść dalej.", "success");
    }
    if (!isSuccess && levelCompletedLocally) {
      setLevelCompletedLocally(false);
    }
  }, [isSuccess, levelCompletedLocally]);

  useEffect(() => {
    if (socket && levelCompletedLocally) {
      socket.emit("level1Completed");
    }
  }, [socket, levelCompletedLocally]);

  useEffect(() => {
    if (awaitingLevel2 && state?.currentLevel >= 2) {
      setAwaitingLevel2(false);
      navigate("/level2");
    }
  }, [awaitingLevel2, state?.currentLevel, navigate]);

  // Blackout z powodu przeciążenia
  useEffect(() => {
    if (totalPower > POWER_LIMIT && !blackout) {
      setBlackout(true);
      setCountdown(5);
      addNotification("⚠️ PRZECIĄŻENIE! Wywaliło bezpieczniki w showroomie.", "danger");
      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            resetAll();
            setBlackout(false);
            addNotification("Zasilanie wróciło. System wystartował od nowa.", "success");
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [totalPower]);

  const shutdownServerRoom = () => {
    setServerDown(true);
    setCountdown(10);
    addNotification("❌ WYŁĄCZONO GŁÓWNY SERWER. Wszystkie systemy offline.", "danger");
    resetAll();
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setServerDown(false);
          addNotification("Serwerownia wróciła online. Można uruchamiać showroom.", "success");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  };

  const toggleSocket = (stripId, socketIndex) => {
    if (blackout || serverDown) return;
    if (socket) {
      socket.emit("toggleSocket", { stripId, socketIndex });
    }
    setDevices((prev) =>
      prev.map((strip) => {
        if (strip.id !== stripId) return strip;
        const updated = [...strip.sockets];
        updated[socketIndex] = !updated[socketIndex];
        const device = strip.devices[socketIndex];
        if (device.server && strip.id === 9 && updated[socketIndex] === false) {
          setTimeout(() => shutdownServerRoom(), 300);
        }
        if (device.annoying && updated[socketIndex] === false) {
          setTimeout(() => {
            const currentStillOff = devices.find((s) => s.id === stripId)?.sockets[socketIndex] === false;
            if (currentStillOff) {
              addNotification(`📞 Pracownik zgłasza problem: "${device.name} nie działa..."`, "warning");
            }
          }, 5000);
        }
        return { ...strip, sockets: updated };
      })
    );
  };

  const toggleStrip = (stripId) => {
    if (blackout || serverDown) return;
    setDevices((prev) =>
      prev.map((strip) => {
        if (strip.id !== stripId) return strip;
        const nextState = !strip.enabled;
        if (!nextState && strip.critical) shutdownServerRoom();
        return { ...strip, enabled: nextState };
      })
    );
  };

  const goToNextLevel = () => {
    if (!levelCompletedLocally) return;
    if (socket) {
      socket.emit("adminNextLevel");
      setAwaitingLevel2(true);
    }
  };

  return (
    <div className="pb-32">
      {/* Pasek mocy */}
      <div className={styles.topbar}>
        <div className="flex items-center gap-3">
          <Zap className="text-cyan-400" />
          <div>
            <div className="text-sm text-slate-400">Pobór mocy showroomu</div>
            <div className="text-2xl font-bold">{totalPower}W / {POWER_LIMIT}W</div>
          </div>
        </div>
        <div className="w-[300px] bg-slate-800 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              totalPower > POWER_LIMIT * 0.9 ? "bg-red-500" : "bg-cyan-500"
            }`}
            style={{ width: `${Math.min((totalPower / POWER_LIMIT) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Overlay awarii */}
      {(blackout || serverDown) && (
        <div className={styles.overlay}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <AlertTriangle size={90} className="mx-auto mb-6 text-red-500" />
            <h2 className="text-5xl font-black mb-4">{serverDown ? "SERWER OFFLINE" : "BLACKOUT SHOWROOMU"}</h2>
            <p className="text-xl text-slate-300">Restart systemu za {countdown}s</p>
          </motion.div>
        </div>
      )}

      {/* Nagłówek */}
      <div className="mb-8 mt-24">
        <h2 className="text-3xl font-black mb-3">Level 1 — Zarządzanie Energią Showroomu</h2>
        <p className="text-slate-400 max-w-4xl">
          Uruchom wszystkie KLUCZOWE systemy showroomu, ale nie przekrocz limitu mocy. Wyłączaj zbędne urządzenia.
        </p>
      </div>

      {/* Panel wymaganych urządzeń */}
<div className="mb-8 p-5 rounded-2xl border border-slate-700 bg-slate-900/60">
  <div className="flex items-center gap-2 mb-4">
    <CheckCircle2 size={20} className="text-emerald-400" />
    <h3 className="text-lg font-bold text-emerald-400">Do przeprowadzenia prezentacji wymagane są:</h3>
  </div>
  <div className="flex flex-wrap gap-2">
    {stripsDefinition.flatMap((strip) =>
      strip.devices
        .filter((d) => d.required)
        .map((device, idx) => {
          const Icon = device.icon;
          // sprawdź czy to urządzenie jest już włączone
          const stripState = devices.find((s) => s.id === strip.id);
          const deviceIdx = strip.devices.indexOf(device);
          const active = stripState?.enabled && stripState?.sockets[deviceIdx];
          return (
            <div
              key={`${strip.id}-${idx}`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                active
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              <Icon size={14} />
              <span>{device.name}</span>
              {active ? (
                <CheckCircle2 size={13} className="text-emerald-400" />
              ) : (
                <XCircle size={13} className="text-red-500" />
              )}
            </div>
          );
        })
    )}
  </div>
  {/* Pasek postępu wymaganych */}
  <div className="mt-4 flex items-center gap-3">
    <span className="text-xs text-slate-500">Postęp:</span>
    <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
      <div
        className="h-full bg-emerald-500 transition-all duration-500"
        style={{
          width: `${
            (() => {
              const allRequired = stripsDefinition.flatMap((strip) =>
                strip.devices.filter((d) => d.required).map((d, _) => ({
                  stripId: strip.id,
                  deviceIdx: strip.devices.indexOf(d),
                }))
              );
              const doneCount = allRequired.filter(({ stripId, deviceIdx }) => {
                const s = devices.find((s) => s.id === stripId);
                return s?.enabled && s?.sockets[deviceIdx];
              }).length;
              return Math.round((doneCount / allRequired.length) * 100);
            })()
          }%`,
        }}
      />
    </div>
    <span className="text-xs text-slate-400 tabular-nums">
      {(() => {
        const allRequired = stripsDefinition.flatMap((strip) =>
          strip.devices.filter((d) => d.required).map((d) => ({
            stripId: strip.id,
            deviceIdx: strip.devices.indexOf(d),
          }))
        );
        const doneCount = allRequired.filter(({ stripId, deviceIdx }) => {
          const s = devices.find((s) => s.id === stripId);
          return s?.enabled && s?.sockets[deviceIdx];
        }).length;
        return `${doneCount}/${allRequired.length}`;
      })()}
    </span>
  </div>
</div>

      {/* Przycisk NEXT LEVEL – pojawia się po ukończeniu */}
      {levelCompletedLocally && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={styles.successBox}
        >
          <CheckCircle2 size={60} className="text-green-400" />
          <div>
            <h2 className="text-3xl font-black mb-2">Showroom działa stabilnie</h2>
            <p className="text-slate-300">Wszystkie wymagane systemy są aktywne.</p>
          </div>
          <button
            onClick={goToNextLevel}
            disabled={awaitingLevel2}
            className={`${styles.nextButton} ${awaitingLevel2 ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {awaitingLevel2 ? "Oczekiwanie na serwer..." : "NASTĘPNY POZIOM → LEVEL 2"}
          </button>
        </motion.div>
      )}

      {/* Listwy zasilające */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {devices.map((strip) => (
          <motion.div
            key={strip.id}
            layout
            className={`${styles.stripCard} ${!strip.enabled ? styles.stripDisabled : ""}`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold">{strip.title}</h3>
                <p className="text-slate-400 text-sm">4-portowa listwa zasilająca IoT</p>
              </div>
              <button
                onClick={() => toggleStrip(strip.id)}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 ${
                  strip.enabled ? "bg-emerald-600" : "bg-red-600"
                }`}
              >
                {strip.enabled ? <><Power size={18} /> LISTWA ON</> : <><PowerOff size={18} /> LISTWA OFF</>}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strip.devices.map((device, idx) => {
                const Icon = device.icon;
                const active = strip.enabled && strip.sockets[idx];
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    className={`${styles.deviceCard} ${active ? styles.deviceOn : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <div className={`p-3 rounded-xl ${active ? "bg-cyan-500/20" : "bg-slate-800"}`}>
                          <Icon size={24} />
                        </div>
                        <div>
                          <div className="font-bold">{device.name}</div>
                          <div className="text-sm text-slate-400">{device.power}W</div>
                          {device.required ? (
                            <div className="text-xs text-emerald-400 mt-1"></div>
                          ) : (
                            <div className="text-xs text-orange-400 mt-1"></div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSocket(strip.id, idx)}
                        className={`w-14 h-8 rounded-full transition-all relative ${
                          active ? "bg-cyan-500" : "bg-slate-700"
                        }`}
                      >
                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${active ? "left-7" : "left-1"}`} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Powiadomienia */}
      <div className={styles.notifications}>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className={`${styles.notification} ${
              n.type === "danger"
                ? styles.notificationDanger
                : n.type === "success"
                ? styles.notificationSuccess
                : styles.notificationWarning
            }`}
          >
            {n.type === "danger" ? <XCircle /> : n.type === "success" ? <CheckCircle2 /> : <AlertTriangle />}
            <span>{n.text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
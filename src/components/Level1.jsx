import { useEffect, useMemo, useState } from "react";
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
  ScanFace,
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
  {
    id: 0,
    title: "Fotobudka Showroom",
    critical: false,
    devices: [
      {
        name: "Ekran fotobudki",
        power: 900,
        required: true,
        icon: Monitor,
      },
      {
        name: "Komputer fotobudki",
        power: 1200,
        required: true,
        icon: Cpu,
      },
      {
        name: "Drukarka zdjęć",
        power: 1400,
        required: true,
        icon: Printer,
        annoying: true,
      },
      {
        name: "Lampka LED dekoracyjna",
        power: 250,
        required: false,
        icon: LampDesk,
      },
    ],
  },

  {
    id: 1,
    title: "Stół Multimedialny",
    devices: [
      {
        name: "Ekran dotykowy stołu",
        power: 1200,
        required: true,
        icon: Monitor,
      },
      {
        name: "PC stołu multimedialnego",
        power: 1000,
        required: true,
        icon: Cpu,
      },
      {
        name: "Nagłośnienie stołu",
        power: 450,
        required: false,
        icon: Speaker,
      },
      {
        name: "Ładowarka demo",
        power: 150,
        required: false,
        icon: Zap,
      },
    ],
  },

  {
    id: 2,
    title: "Totem Android Showroom",
    devices: [
      {
        name: "Ekran OLED totemu",
        power: 900,
        required: true,
        icon: Tv,
      },
      {
        name: "Android Box",
        power: 500,
        required: true,
        icon: Cpu,
      },
      {
        name: "Router WiFi demo",
        power: 300,
        required: true,
        icon: Router,
      },
      {
        name: "Podświetlenie RGB",
        power: 500,
        required: false,
        icon: LampDesk,
      },
    ],
  },

  {
    id: 3,
    title: "Recepcja Smart Office",
    devices: [
      {
        name: "Komputer recepcji",
        power: 900,
        required: true,
        icon: Cpu,
      },
      {
        name: "Monitor recepcji",
        power: 400,
        required: true,
        icon: Monitor,
      },
      {
        name: "Drukarka recepcji",
        power: 1200,
        required: false,
        icon: Printer,
        annoying: true,
      },
      {
        name: "Czajnik recepcji",
        power: 2000,
        required: false,
        icon: Coffee,
        annoying: true,
      },
    ],
  },

  {
    id: 4,
    title: "Strefa VR",
    devices: [
      {
        name: "Gaming PC VR",
        power: 1800,
        required: true,
        icon: Cpu,
      },
      {
        name: "Gogle VR",
        power: 300,
        required: true,
        icon: Gamepad2,
      },
      {
        name: "Telewizor VR",
        power: 700,
        required: true,
        icon: Tv,
      },
      {
        name: "Wentylator VR",
        power: 250,
        required: false,
        icon: AirVent,
      },
    ],
  },

  {
    id: 5,
    title: "Monitoring AI",
    devices: [
      {
        name: "Serwer AI Vision",
        power: 2400,
        required: true,
        icon: HardDrive,
        server: true,
      },
      {
        name: "Kamery showroom",
        power: 600,
        required: true,
        icon: Camera,
      },
      {
        name: "Switch PoE",
        power: 350,
        required: true,
        icon: Wifi,
      },
      {
        name: "Podświetlenie techniczne",
        power: 250,
        required: false,
        icon: LampDesk,
      },
    ],
  },

  {
    id: 6,
    title: "Magazyn",
    devices: [
      {
        name: "Lampka magazynu",
        power: 400,
        required: false,
        icon: LampDesk,
      },
      {
        name: "Odkurzacz magazynu",
        power: 1600,
        required: false,
        icon: Bot,
      },
      {
        name: "Ładowarka paleciaka",
        power: 1200,
        required: false,
        icon: Zap,
      },
      {
        name: "Tablet magazynu",
        power: 200,
        required: true,
        icon: Monitor,
      },
    ],
  },

  {
    id: 7,
    title: "Security Center",
    devices: [
      {
        name: "Serwer kontroli dostępu",
        power: 1900,
        required: true,
        icon: ShieldAlert,
        server: true,
      },
      {
        name: "Monitor CCTV",
        power: 400,
        required: true,
        icon: Monitor,
      },
      {
        name: "Alarm demo",
        power: 250,
        required: true,
        icon: ShieldAlert,
      },
      {
        name: "Ekspres do kawy ochrony",
        power: 1700,
        required: false,
        icon: Coffee,
        annoying: true,
      },
    ],
  },

  {
    id: 8,
    title: "Sala Konferencyjna",
    devices: [
      {
        name: "Projektor",
        power: 1100,
        required: true,
        icon: Tv,
      },
      {
        name: "Mini PC sali",
        power: 600,
        required: true,
        icon: Cpu,
      },
      {
        name: "Soundbar",
        power: 300,
        required: true,
        icon: Speaker,
      },
      {
        name: "Lampka ambient",
        power: 200,
        required: false,
        icon: LampDesk,
      },
    ],
  },

  {
    id: 9,
    title: "Serwerownia",
    critical: true,
    devices: [
      {
        name: "GŁÓWNY SERWER SHOWROOM",
        power: 3000,
        required: true,
        icon: ServerCrash,
        server: true,
      },
      {
        name: "Backup NAS",
        power: 900,
        required: true,
        icon: HardDrive,
      },
      {
        name: "Switch Core",
        power: 500,
        required: true,
        icon: Wifi,
      },
      {
        name: "Klimatyzacja rack",
        power: 1500,
        required: true,
        icon: AirVent,
      },
    ],
  },
];

export default function Level1() {
  const { socket } = useSocket();

  const [devices, setDevices] = useState(() => {
    return stripsDefinition.map((strip) => ({
      ...strip,
      enabled: true,
      sockets: strip.devices.map(() => false),
    }));
  });

  const [notifications, setNotifications] = useState([]);
  const [blackout, setBlackout] = useState(false);
  const [serverDown, setServerDown] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const addNotification = (text, type = "warning") => {
    const id = Date.now() + Math.random();

    setNotifications((prev) => [
      {
        id,
        text,
        type,
      },
      ...prev.slice(0, 5),
    ]);

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
  };

  const totalPower = useMemo(() => {
    let total = 0;

    devices.forEach((strip) => {
      if (!strip.enabled) return;

      strip.devices.forEach((device, idx) => {
        if (strip.sockets[idx]) {
          total += device.power;
        }
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

  const isSuccess =
    requiredCompleted &&
    totalPower <= POWER_LIMIT &&
    !blackout &&
    !serverDown;

  useEffect(() => {
    if (totalPower > POWER_LIMIT && !blackout) {
      setBlackout(true);
      setCountdown(5);

      addNotification(
        "⚠️ PRZECIĄŻENIE! Wywaliło bezpieczniki w showroomie.",
        "danger"
      );

      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);

            resetAll();
            setBlackout(false);

            addNotification(
              "Zasilanie wróciło. System wystartował od nowa.",
              "success"
            );

            return 0;
          }

          return c - 1;
        });
      }, 1000);
    }
  }, [totalPower]);

  const shutdownServerRoom = () => {
    setServerDown(true);
    setCountdown(10);

    addNotification(
      "❌ WYŁĄCZONO GŁÓWNY SERWER. Wszystkie systemy offline.",
      "danger"
    );

    resetAll();

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);

          setServerDown(false);

          addNotification(
            "Serwerownia wróciła online. Można uruchamiać showroom.",
            "success"
          );

          return 0;
        }

        return c - 1;
      });
    }, 1000);
  };

  const toggleSocket = (stripId, socketIndex) => {
    if (blackout || serverDown) return;

    setDevices((prev) =>
      prev.map((strip) => {
        if (strip.id !== stripId) return strip;

        const updated = [...strip.sockets];

        updated[socketIndex] = !updated[socketIndex];

        const device = strip.devices[socketIndex];

        if (
          device.server &&
          strip.id === 9 &&
          updated[socketIndex] === false
        ) {
          setTimeout(() => {
            shutdownServerRoom();
          }, 300);
        }

        if (
          device.annoying &&
          updated[socketIndex] === false
        ) {
          setTimeout(() => {
            const currentStillOff =
              devices.find((s) => s.id === stripId)?.sockets[
                socketIndex
              ] === false;

            if (currentStillOff) {
              addNotification(
                `📞 Pracownik zgłasza problem: "${device.name} nie działa..."`,
                "warning"
              );
            }
          }, 5000);
        }

        return {
          ...strip,
          sockets: updated,
        };
      })
    );
  };

  const toggleStrip = (stripId) => {
    if (blackout || serverDown) return;

    setDevices((prev) =>
      prev.map((strip) => {
        if (strip.id !== stripId) return strip;

        const nextState = !strip.enabled;

        if (!nextState && strip.critical) {
          shutdownServerRoom();
        }

        return {
          ...strip,
          enabled: nextState,
        };
      })
    );
  };

  return (
    <div className="pb-32">
      <div className={styles.topbar}>
        <div className="flex items-center gap-3">
          <Zap className="text-cyan-400" />

          <div>
            <div className="text-sm text-slate-400">
              Pobór mocy showroomu
            </div>

            <div className="text-2xl font-bold">
              {totalPower}W / {POWER_LIMIT}W
            </div>
          </div>
        </div>

        <div className="w-[300px] bg-slate-800 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              totalPower > POWER_LIMIT * 0.9
                ? "bg-red-500"
                : "bg-cyan-500"
            }`}
            style={{
              width: `${Math.min(
                (totalPower / POWER_LIMIT) * 100,
                100
              )}%`,
            }}
          />
        </div>
      </div>

      {(blackout || serverDown) && (
        <div className={styles.overlay}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <AlertTriangle
              size={90}
              className="mx-auto mb-6 text-red-500"
            />

            <h2 className="text-5xl font-black mb-4">
              {serverDown
                ? "SERWER OFFLINE"
                : "BLACKOUT SHOWROOMU"}
            </h2>

            <p className="text-xl text-slate-300">
              Restart systemu za {countdown}s
            </p>
          </motion.div>
        </div>
      )}

      <div className="mb-8 mt-24">
        <h2 className="text-3xl font-black mb-3">
          Level 1 — Zarządzanie Energią Showroomu
        </h2>

        <p className="text-slate-400 max-w-4xl">
          Uruchom wszystkie KLUCZOWE systemy showroomu,
          ale nie przekrocz limitu mocy. Wyłączaj zbędne
          urządzenia typu lampki, odkurzacze i dekoracje.
        </p>
      </div>

      {isSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={styles.successBox}
        >
          <CheckCircle2 size={60} className="text-green-400" />

          <div>
            <h2 className="text-3xl font-black mb-2">
              Showroom działa stabilnie
            </h2>

            <p className="text-slate-300">
              Wszystkie wymagane systemy są aktywne.
            </p>
          </div>

          <button
            onClick={() => socket.emit("adminNextLevel")}
            className={styles.nextButton}
          >
            NASTĘPNY POZIOM
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {devices.map((strip) => (
          <motion.div
            key={strip.id}
            layout
            className={`${styles.stripCard} ${
              !strip.enabled ? styles.stripDisabled : ""
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold">
                  {strip.title}
                </h3>

                <p className="text-slate-400 text-sm">
                  4-portowa listwa zasilająca IoT
                </p>
              </div>

              <button
                onClick={() => toggleStrip(strip.id)}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 ${
                  strip.enabled
                    ? "bg-emerald-600"
                    : "bg-red-600"
                }`}
              >
                {strip.enabled ? (
                  <>
                    <Power size={18} />
                    LISTWA ON
                  </>
                ) : (
                  <>
                    <PowerOff size={18} />
                    LISTWA OFF
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strip.devices.map((device, idx) => {
                const Icon = device.icon;
                const active =
                  strip.enabled && strip.sockets[idx];

                return (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    className={`${styles.deviceCard} ${
                      active ? styles.deviceOn : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <div
                          className={`p-3 rounded-xl ${
                            active
                              ? "bg-cyan-500/20"
                              : "bg-slate-800"
                          }`}
                        >
                          <Icon size={24} />
                        </div>

                        <div>
                          <div className="font-bold">
                            {device.name}
                          </div>

                          <div className="text-sm text-slate-400">
                            {device.power}W
                          </div>

                          {device.required ? (
                            <div className="text-xs text-emerald-400 mt-1">
                              Wymagane
                            </div>
                          ) : (
                            <div className="text-xs text-orange-400 mt-1">
                              Opcjonalne
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          toggleSocket(strip.id, idx)
                        }
                        className={`w-14 h-8 rounded-full transition-all relative ${
                          active
                            ? "bg-cyan-500"
                            : "bg-slate-700"
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${
                            active ? "left-7" : "left-1"
                          }`}
                        />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

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
            {n.type === "danger" ? (
              <XCircle />
            ) : n.type === "success" ? (
              <CheckCircle2 />
            ) : (
              <AlertTriangle />
            )}

            <span>{n.text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
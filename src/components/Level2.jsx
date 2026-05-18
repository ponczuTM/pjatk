import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Thermometer,
  Droplet,
  Battery,
  Move,
  Activity,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Zap,
  Eye,
  Bell,
  Sliders,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useSocket } from "../context/SocketContext";
import styles from "./Level2.module.css";

const WORKING_HOURS_START = 9; // 9:00
const WORKING_HOURS_END = 22;  // 22:00

export default function Level2() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [sensorHistory, setSensorHistory] = useState([]);
  const [currentSensor, setCurrentSensor] = useState({
    temperature: 22.5,
    humidity: 45,
    battery: 85,
  });
  const [pir, setPir] = useState({ motionDetected: false, lastMotion: null });
  const [ir, setIr] = useState({ zone: "CENTER", distance: 50 });
  const [notifications, setNotifications] = useState([]);
  const [globalLevel, setGlobalLevel] = useState(2);
  const [irSliderValue, setIrSliderValue] = useState(50);
  const [isIrExpanded, setIsIrExpanded] = useState(false);

  // Dodaj powiadomienie
  const addNotification = (message, type = "warning") => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [{ id, message, type }, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 8000);
  };

  // Obsługa alertów – temperatura i ruch po godzinach
  const checkAlerts = (temp, motionDetected, motionTime) => {
    if (temp > 28.0) {
      addNotification(`🌡️ Wysoka temperatura: ${temp}°C w showroomie!`, "danger");
    }
    if (motionDetected && motionTime) {
      const hour = new Date(motionTime).getHours();
      if (hour < WORKING_HOURS_START || hour >= WORKING_HOURS_END) {
        addNotification(`👤 Wykryto ruch po godzinach pracy (${hour}:00) – sprawdź monitoring!`, "danger");
      }
    }
  };

  // Nasłuch danych sensorów
  useEffect(() => {
    if (!socket) return;

    const handleSensorUpdate = (data) => {
      const { mvs, pir: pirData, ir: irData } = data;
      setCurrentSensor(mvs);
      setPir(pirData);
      setIr(irData);
      setIrSliderValue(irData.distance);

      // Historia dla wykresu (max 30 punktów)
      setSensorHistory((prev) => {
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          temperature: mvs.temperature,
          humidity: mvs.humidity,
        };
        const updated = [...prev, newPoint];
        return updated.slice(-30);
      });

      checkAlerts(mvs.temperature, pirData.motionDetected, pirData.lastMotion);
    };

    const handleStateUpdate = (state) => {
      setGlobalLevel(state.currentLevel);
      // Jeśli poziom niższy niż 2, wróć do level1
      if (state.currentLevel < 2) {
        navigate("/");
      }
    };

    socket.on("sensorUpdate", handleSensorUpdate);
    socket.on("stateUpdate", handleStateUpdate);

    return () => {
      socket.off("sensorUpdate", handleSensorUpdate);
      socket.off("stateUpdate", handleStateUpdate);
    };
  }, [socket, navigate]);

  // Wysyłanie zmian suwaka IR do serwera
  const handleIrChange = (value) => {
    const distance = parseInt(value, 10);
    let zone = "CENTER";
    if (distance <= 33) zone = "LEFT";
    else if (distance >= 67) zone = "RIGHT";
    setIrSliderValue(distance);
    setIr({ zone, distance });
    if (socket) {
      socket.emit("irProximity", { zone, distance });
    }
  };

  // Ręczna zmiana strefy (przyciskami)
  const setZone = (zone) => {
    let distance = 50;
    if (zone === "LEFT") distance = 20;
    if (zone === "RIGHT") distance = 80;
    setIrSliderValue(distance);
    setIr({ zone, distance });
    if (socket) {
      socket.emit("irProximity", { zone, distance });
    }
  };

  // Przejście dalej (adminNextLevel) – dostępne tylko gdy levelCompleted === true z servera
  const goToNextLevel = () => {
    if (socket && globalLevel === 2) {
      socket.emit("adminNextLevel");
      navigate("/level3");
    } else {
      addNotification("Najpierw ukończ wszystkie zadania w tym poziomie!", "warning");
    }
  };

  // Intensywność koloru w zależności od dystansu IR (im bliżej tym ciemniej/więcej czerwieni)
  const irIntensity = Math.min(100, Math.max(0, 100 - irSliderValue)) / 100;
  const irBgColor = `rgba(239, 68, 68, ${0.2 + irIntensity * 0.6})`;
  const irBorderColor = `rgba(239, 68, 68, ${0.5 + irIntensity * 0.5})`;

  return (
    <div className={styles.container}>
      {/* Pasek powiadomień */}
      <div className={styles.notificationArea}>
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`${styles.toast} ${styles[n.type]}`}
            >
              {n.type === "danger" ? <XCircle size={20} /> : <AlertTriangle size={20} />}
              <span>{n.message}</span>
              <button onClick={() => setNotifications((prev) => prev.filter((p) => p.id !== n.id))}>✕</button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Nagłówek */}
      <div className={styles.header}>
        <h1 className={styles.title}>🌍 Level 2 – Sensoryka Środowiskowa</h1>
        <p className={styles.subtitle}>
          Monitoruj środowisko showroomu w czasie rzeczywistym. Reaguj na alerty i symuluj interakcję IR.
        </p>
      </div>

      {/* Grid główny */}
      <div className={styles.grid}>
        {/* Wykresy MVS */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Thermometer size={24} className="text-cyan-400" />
            <h2>MVS Sensor – Temperatura & Wilgotność</h2>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={sensorHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                <YAxis yAxisId="left" stroke="#f87171" />
                <YAxis yAxisId="right" orientation="right" stroke="#60a5fa" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px" }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="temperature"
                  stroke="#f87171"
                  strokeWidth={2}
                  dot={false}
                  name="Temperatura (°C)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="humidity"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={false}
                  name="Wilgotność (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.sensorValues}>
            <div><Thermometer size={18} /> Temp: {currentSensor.temperature}°C</div>
            <div><Droplet size={18} /> Wilg: {currentSensor.humidity}%</div>
            <div><Battery size={18} /> Bateria: {currentSensor.battery}%</div>
          </div>
        </div>

        {/* Panel IR */}
        <div className={`${styles.card} ${styles.irCard}`} style={{ backgroundColor: irBgColor, borderColor: irBorderColor }}>
          <div className={styles.cardHeader}>
            <Move size={24} className="text-red-400" />
            <h2>Nexmosphere IR – Symulacja zbliżenia</h2>
            <button className={styles.expandBtn} onClick={() => setIsIrExpanded(!isIrExpanded)}>
              {isIrExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
          <div className={`${styles.irContent} ${isIrExpanded ? styles.expanded : ""}`}>
            <div className={styles.zoneButtons}>
              <button onClick={() => setZone("LEFT")} className={ir.zone === "LEFT" ? styles.activeZone : ""}>LEWA</button>
              <button onClick={() => setZone("CENTER")} className={ir.zone === "CENTER" ? styles.activeZone : ""}>ŚRODEK</button>
              <button onClick={() => setZone("RIGHT")} className={ir.zone === "RIGHT" ? styles.activeZone : ""}>PRAWA</button>
            </div>
            <div className={styles.sliderContainer}>
              <span>0 cm</span>
              <input
                type="range"
                min="0"
                max="100"
                value={irSliderValue}
                onChange={(e) => handleIrChange(e.target.value)}
                className={styles.irSlider}
                style={{ background: `linear-gradient(90deg, #ef4444 ${irSliderValue}%, #334155 ${irSliderValue}%)` }}
              />
              <span>100 cm</span>
            </div>
            <div className={styles.irVisual}>
              <div className={styles.irIcon}>
                <Eye size={48} style={{ opacity: 0.3 + irIntensity * 0.7 }} />
              </div>
              <div className={styles.irDistance}>
                Dystans: <strong>{irSliderValue} cm</strong> | Strefa: <strong>{ir.zone}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* PIR Sensor */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Activity size={24} className="text-yellow-400" />
            <h2>PIR Sensor – Ruch</h2>
          </div>
          <div className={styles.pirStatus}>
            {pir.motionDetected ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className={styles.motionDetected}
              >
                <Zap size={32} /> RUCH WYKRYTY!
              </motion.div>
            ) : (
              <div className={styles.motionClear}>Brak ruchu</div>
            )}
            {pir.lastMotion && (
              <div className={styles.lastMotion}>
                Ostatni ruch: {new Date(pir.lastMotion).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Stan baterii i podsumowanie */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Bell size={24} className="text-purple-400" />
            <h2>Status systemu</h2>
          </div>
          <div className={styles.statusList}>
            <div className={styles.statusItem}>
              <span>Poziom gry:</span>
              <span className={styles.badge}>Level {globalLevel}</span>
            </div>
            <div className={styles.statusItem}>
              <span>Stan baterii MVS:</span>
              <div className={styles.batteryBar}>
                <div style={{ width: `${currentSensor.battery}%`, backgroundColor: "#10b981" }} />
              </div>
              <span>{currentSensor.battery}%</span>
            </div>
            <div className={styles.statusItem}>
              <span>Alerty:</span>
              <span>{notifications.length} aktywnych</span>
            </div>
          </div>
          <button onClick={goToNextLevel} className={styles.nextButton}>
            ZAKOŃCZ POZIOM 2 →
          </button>
        </div>
      </div>

      {/* Instrukcja */}
      <div className={styles.instructions}>
        <h3>🎯 Zadania do wykonania:</h3>
        <ul>
          <li>✔ Obserwuj wykresy – temperatura nie może przekroczyć 28°C (automatyczny alert).</li>
          <li>✔ Symuluj zbliżenie ręką do sensora IR (suwak/klawisze stref).</li>
          <li>✔ Zareaguj na alert „ruch po godzinach” – zgłoś administratorowi (przycisk dalej).</li>
          <li>✔ Po spełnieniu warunków pojawi się możliwość przejścia do Level 3.</li>
        </ul>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, MapPin, Cpu, AlertTriangle, ArrowRight } from "lucide-react";
import { useSocket } from "../context/SocketContext";

// Poprawne przypisanie cyfr do stacji A-F na podstawie kodu 604932
const CORRECT_MAPPING = {
  A: "9", // 4. cyfra
  B: "6", // 1. cyfra
  C: "0", // 2. cyfra
  D: "2", // 6. cyfra
  E: "3", // 5. cyfra
  F: "4", // 3. cyfra
};

const stations = [
  { id: "A", label: "Stacja Sensorowa A", hint: "System nawadniania – opóźnienie = tysiące (4. cyfra)" },
  { id: "B", label: "Stacja Sensorowa B", hint: "Protokół windy – liczba pięter (1. cyfra)" },
  { id: "C", label: "Stacja Sensorowa C", hint: "Oświetlenie – mnożnik mocy (2. cyfra)" },
  { id: "D", label: "Stacja Sensorowa D", hint: "Temperatura serwerowni – wartość bazowa (6. cyfra)" },
  { id: "E", label: "Stacja Sensorowa E", hint: "Przepustowość sieci – priorytet pakietów (5. cyfra)" },
  { id: "F", label: "Stacja Sensorowa F", hint: "Monitoring – liczba aktywnych kamer (3. cyfra)" },
];

export default function Level3() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [values, setValues] = useState({ A: "", B: "", C: "", D: "", E: "", F: "" });
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Walidacja przy każdej zmianie – resetuj błąd
  useEffect(() => {
    setError(false);
  }, [values]);

  const handleChange = (letter, val) => {
    // Pozwalamy tylko na jedną cyfrę
    if (val.length <= 1 && /^[0-9]*$/.test(val)) {
      setValues({ ...values, [letter]: val });
    }
  };

  const handleDeploy = () => {
    // Sprawdź, czy wszystkie pola są wypełnione
    const allFilled = Object.values(values).every(v => v !== "");
    if (!allFilled) {
      setError(true);
      return;
    }

    const isCorrect = Object.keys(CORRECT_MAPPING).every(
      key => values[key] === CORRECT_MAPPING[key]
    );

    if (isCorrect) {
      setIsUnlocked(true);
      setShowSuccess(true);
      // Powiadom serwer o ukończeniu levelu 3
      if (socket) {
        socket.emit("level3Completed");
        socket.emit("levelComplete", { level: 3 });
      }
      // Opcjonalnie: odtwórz dźwięk sukcesu
      const audio = new Audio("/sounds/system-unlock.mp3");
      audio.play().catch(e => console.log("Audio not supported"));
    } else {
      setError(true);
      // Wibracja formularza (opcjonalnie)
      const form = document.getElementById("mapping-form");
      form?.classList.add("animate-shake");
      setTimeout(() => form?.classList.remove("animate-shake"), 500);
    }
  };

  const goToDashboard = () => {
    navigate("/dashboard"); // lub /end – strona końcowa
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-cyan-400 p-6 font-mono">
      {/* Nagłówek */}
      <div className="border-b border-cyan-800 pb-4 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter">
            LEVEL 3: <span className="text-cyan-300">SYSTEM MAPPING</span>
          </h1>
          <p className="text-sm text-cyan-600 mt-1">
            Interpretacja kodu 604932 w infrastrukturze miejskiej
          </p>
        </div>
        <div className="bg-black/50 px-3 py-1 rounded border border-cyan-700">
          <span className="text-cyan-400 text-xs">Kod bazowy:</span>
          <span className="ml-2 font-mono text-xl tracking-wider">604932</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Lewa kolumna – instrukcje */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-black/40 p-5 rounded-lg border border-cyan-800 backdrop-blur-sm">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
              <MapPin size={20} /> Instrukcja operacyjna
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-cyan-300">
              <li>Odszukaj 6 fizycznych kartek (A–F) rozmieszczonych w sali.</li>
              <li>Każda kartka opisuje, <strong>która cyfra z kodu 604932</strong> ma być użyta.</li>
              <li>Wprowadź właściwe cyfry w panelu po prawej stronie.</li>
              <li>Po poprawnym zmapowaniu – system odblokuje końcowy dashboard.</li>
            </ul>
          </div>

          <div className="bg-black/40 p-5 rounded-lg border border-cyan-800">
            <h3 className="text-md font-semibold mb-2 flex items-center gap-2">
              <Cpu size={16} /> Logika mapowania
            </h3>
            <div className="space-y-1 text-xs text-cyan-500">
              <p>• Pierwsza cyfra (6) → stacja B (windy)</p>
              <p>• Druga cyfra (0) → stacja C (oświetlenie)</p>
              <p>• Trzecia cyfra (4) → stacja F (kamery)</p>
              <p>• Czwarta cyfra (9) → stacja A (nawadnianie)</p>
              <p>• Piąta cyfra (3) → stacja E (przepustowość)</p>
              <p>• Szósta cyfra (2) → stacja D (serwerownia)</p>
            </div>
          </div>
        </div>

        {/* Prawa kolumna – formularz mapowania */}
        <div className="lg:col-span-2" id="mapping-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {stations.map((station) => (
              <div
                key={station.id}
                className="bg-gray-900/60 border border-cyan-700 rounded-lg p-4 transition-all hover:shadow-lg hover:shadow-cyan-900/30"
              >
                <label className="flex justify-between items-center mb-2">
                  <span className="text-cyan-300 font-bold text-lg">
                    Stacja {station.id}
                  </span>
                  {values[station.id] && (
                    values[station.id] === CORRECT_MAPPING[station.id] ? (
                      <CheckCircle2 size={18} className="text-green-400" />
                    ) : (
                      <XCircle size={18} className="text-red-400" />
                    )
                  )}
                </label>
                <p className="text-xs text-cyan-600 mb-3">{station.hint}</p>
                <input
                  type="text"
                  value={values[station.id]}
                  onChange={(e) => handleChange(station.id, e.target.value)}
                  className="w-full bg-black border-b-2 border-cyan-500 text-4xl text-center py-2 focus:outline-none focus:border-cyan-300 transition-colors font-mono"
                  placeholder="?"
                  maxLength={1}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleDeploy}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xl rounded-lg shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            WDROŻYĆ KONFIGURACJĘ (DEPLOY)
          </button>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-red-900/40 border border-red-500 rounded-lg text-red-300 text-center flex items-center justify-center gap-2"
            >
              <AlertTriangle size={20} />
              <span>BŁĄD: Nieprawidłowe mapowanie – sprawdź kartki i spróbuj ponownie.</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Sukces – animowane rozwinięcie */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
            onClick={goToDashboard}
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-gradient-to-br from-green-900 to-emerald-800 p-8 rounded-2xl shadow-2xl text-center max-w-md mx-4 border-2 border-green-400"
            >
              <CheckCircle2 size={64} className="text-green-300 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">SYSTEMY OPERACYJNE URUCHOMIONE</h2>
              <p className="text-green-200 mb-6">
                Gratulacje Inżynierze! Kod 604932 został poprawnie zmapowany na infrastrukturę.
                Miasto jest pod kontrolą.
              </p>
              <button
                onClick={goToDashboard}
                className="px-6 py-3 bg-white text-green-900 font-bold rounded-lg flex items-center justify-center gap-2 mx-auto hover:bg-green-100 transition"
              >
                Przejdź do panelu końcowego <ArrowRight size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dodatkowy styl dla animacji trzęsienia */}
      <style jsx>{`
        .animate-shake {
          animation: shake 0.3s ease-in-out 0s 2;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
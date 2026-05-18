import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Network,
  RefreshCw,
  Lock,
  ArrowRight,
} from "lucide-react";

import { useSocket } from "../context/SocketContext";
import styles from "./Level2.module.css";

// --------------------- PYTANIA I ODPOWIEDZI ---------------------
const QUESTIONS = [
  {
    id: "protocol",
    title: "Wybór protokołu telemetrii",
    description:
      "Mamy słabe połączenie Wi-Fi i limitowany transfer. Który protokół wybierzesz do przesyłania telemetrii z gniazdek NETIO?",
    options: [
      { value: "http", label: "HTTP API", correct: false },
      { value: "mqtt", label: "MQTT", correct: true },
    ],
    explanation:
      "MQTT jest lekki, działa na małym paśmie i doskonale sprawdza się w środowiskach o ograniczonej przepustowości. HTTP generuje większy narzut.",
  },
  {
    id: "logic",
    title: "Logika akcji — sekwencja ON/OFF",
    description:
      "Klient podszedł do czujnika Nexmosphere na 20 cm. System ma zapalić mocne światło (Gniazdko 1) i włączyć ekran (Gniazdko 2). Ustaw odpowiednią sekwencję stanów.",
    options: [
      { value: "both_on", label: "Gniazdko 1: ON, Gniazdko 2: ON", correct: true },
      { value: "both_off", label: "Gniazdko 1: OFF, Gniazdko 2: OFF", correct: false },
      { value: "on_off", label: "Gniazdko 1: ON, Gniazdko 2: OFF", correct: false },
      { value: "off_on", label: "Gniazdko 1: OFF, Gniazdko 2: ON", correct: false },
    ],
    explanation:
      "Zgodnie z wymaganiami: zapalenie światła (GN1) i włączenie ekranu (GN2) – oba gniazda muszą być aktywne (ON).",
  },
  {
    id: "energy",
    title: "Analiza energii",
    description:
      "Dostałeś odczyt z NETIO: Voltage: 230V, Current: 0A. Czy gniazdo jest sprawne, a urządzenie końcowe wyłączone?",
    options: [
      { value: "broken", label: "Gniazdo uszkodzone (brak napięcia)", correct: false },
      { value: "device_off", label: "Gniazdo sprawne, urządzenie wyłączone", correct: true },
      { value: "overload", label: "Przeciążenie – bezpiecznik zadziałał", correct: false },
    ],
    explanation:
      "Napięcie jest prawidłowe (230V), ale prąd = 0A oznacza, że nic nie pobiera energii – gniazdo sprawne, odbiornik wyłączony.",
  },
];

export default function Level2() {
  const navigate = useNavigate();
  const { socket, state } = useSocket();
  const containerRef = useRef(null);

  const [answers, setAnswers] = useState({
    protocol: null,
    logic: null,
    energy: null,
  });
  const [lockedQuestions, setLockedQuestions] = useState(new Set());
  const [validationResults, setValidationResults] = useState({});
  const [allCorrect, setAllCorrect] = useState(false);
  const [systemStarted, setSystemStarted] = useState(false);
  const [accessCode, setAccessCode] = useState(null);
  const [error, setError] = useState(null);

  // Walidacja wszystkich odpowiedzi
  const checkAllCorrect = (currentAnswers) => {
    const results = {};
    let allOk = true;

    QUESTIONS.forEach((q) => {
      const answer = currentAnswers[q.id];
      const correct =
        answer !== null &&
        q.options.find((opt) => opt.value === answer)?.correct === true;
      results[q.id] = correct;
      if (!correct) allOk = false;
    });

    setValidationResults(results);
    setAllCorrect(allOk);
    return allOk;
  };

  useEffect(() => {
    checkAllCorrect(answers);
    setError(null);
    setAccessCode(null);
    setSystemStarted(false);
  }, [answers]);

  // ── Nasłuchuj na stateUpdate z serwera – jeśli level zmieniony, nawiguj ──
  useEffect(() => {
    if (!socket) return;

    const handleStateUpdate = (newState) => {
      if (newState?.currentLevel >= 3) {
        navigate("/level3");
      }
    };

    socket.on("stateUpdate", handleStateUpdate);
    return () => socket.off("stateUpdate", handleStateUpdate);
  }, [socket, navigate]);

  const handleAnswer = (questionId, value) => {
    if (lockedQuestions.has(questionId)) return;

    const question = QUESTIONS.find((q) => q.id === questionId);
    const isCorrect =
      question.options.find((opt) => opt.value === value)?.correct === true;

    setAnswers((prev) => ({ ...prev, [questionId]: value }));

    if (!isCorrect) {
      setLockedQuestions((prev) => new Set([...prev, questionId]));
    }

    if (socket) {
      socket.emit("level2Answer", { questionId, answer: value });
    }
  };

  const handleStartSystem = () => {
    if (!allCorrect) {
      setError("Konfiguracja zawiera błędy. Popraw odpowiedzi przed uruchomieniem.");
      return;
    }

    if (socket) {
      socket.emit("level2Configure", {
        protocol: answers.protocol,
        logic: answers.logic,
        energy: answers.energy,
      });
    }

    setSystemStarted(true);
    const generatedCode = 604932;
    setAccessCode(generatedCode);

    if (socket) {
      socket.emit("level2Completed", { accessCode: generatedCode });
    }
  };

  const resetAnswers = () => {
    setAnswers({ protocol: null, logic: null, energy: null });
    setLockedQuestions(new Set());
    setError(null);
    setAccessCode(null);
    setSystemStarted(false);

    // ── Scroll do góry ──
    window.scrollTo({ top: 0, behavior: "smooth" });
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToNextLevel = () => {
    if (!accessCode) return;

    if (socket) {
      // Powiedz serwerowi że level2 ukończony i przejdź dalej
      socket.emit("levelComplete", { level: 2 });
      socket.emit("adminNextLevel");

      // Fallback: jeśli serwer nie odpowie w ciągu 1.5s, nawiguj bezpośrednio
      setTimeout(() => {
        navigate("/level3");
      }, 1500);
    } else {
      // Brak socketu — nawiguj od razu
      navigate("/level3");
    }
  };

  const renderQuestion = (question) => {
    const currentAnswer = answers[question.id];
    const isCorrect = validationResults[question.id];
    const showResult = currentAnswer !== null;
    const isLocked = lockedQuestions.has(question.id);

    return (
      <div
        key={question.id}
        className={`${styles.questionCard} ${isLocked ? styles.questionLocked : ""}`}
      >
        <div className={styles.questionHeader}>
          <h3 className={styles.questionTitle}>{question.title}</h3>
          {showResult && (
            <div
              className={`${styles.resultBadge} ${
                isCorrect ? styles.resultCorrect : styles.resultWrong
              }`}
            >
              {isCorrect ? (
                <>
                  <CheckCircle2 size={18} /> Poprawnie
                </>
              ) : (
                <>
                  <XCircle size={18} /> Błędnie
                </>
              )}
            </div>
          )}
        </div>
        <p className={styles.questionDescription}>{question.description}</p>

        {isLocked && (
          <div className={styles.lockedNotice}>
            <Lock size={14} />
            <span>Odpowiedź zablokowana — użyj przycisku "Resetuj odpowiedzi", aby spróbować ponownie.</span>
          </div>
        )}

        <div className={styles.optionsGroup}>
          {question.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleAnswer(question.id, opt.value)}
              disabled={isLocked}
              className={`${styles.optionButton} ${
                currentAnswer === opt.value ? styles.optionSelected : ""
              } ${
                opt.correct && currentAnswer === opt.value
                  ? styles.optionCorrect
                  : !opt.correct && currentAnswer === opt.value
                  ? styles.optionWrong
                  : ""
              } ${isLocked && currentAnswer !== opt.value ? styles.optionDisabled : ""}`}
            >
              <span className={styles.optionLabel}>{opt.label}</span>
              {currentAnswer === opt.value && (
                <span className={styles.optionCheck}>
                  {opt.correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                </span>
              )}
            </button>
          ))}
        </div>

        {showResult && !isCorrect && (
          <div className={styles.explanationBox}>
            <AlertTriangle size={16} />
            <span>{question.explanation}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Pasek statusu */}
      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <Network className={styles.statusIcon} />
          <div>
            <div className={styles.statusTitle}>Konfiguracja inteligentnej witryny</div>
            <div className={styles.statusSubtitle}>NETIO + Nexmosphere + Gateway</div>
          </div>
        </div>
        <div className={styles.statusProgress}>
          <div
            className={styles.progressFill}
            style={{
              width: `${
                (Object.values(answers).filter((v) => v !== null).length / 3) * 100
              }%`,
            }}
          />
        </div>
      </div>

      {/* Główna treść */}
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>⚙️ Panel Konfiguracyjny Inżyniera</h1>
          <p className={styles.subtitle}>
            Skonfiguruj protokoły, logikę akcji i analizę energii dla autonomicznej witryny.
          </p>
        </div>

        <div className={styles.questionsGrid}>{QUESTIONS.map(renderQuestion)}</div>

        <div className={styles.controlPanel}>
          <div className={styles.controlActions}>
            <button onClick={resetAnswers} className={styles.resetButton}>
              <RefreshCw size={18} /> Resetuj odpowiedzi
            </button>
            <button
              onClick={handleStartSystem}
              disabled={!allCorrect || systemStarted}
              className={`${styles.startButton} ${
                allCorrect && !systemStarted ? styles.startActive : ""
              }`}
            >
              <Zap size={18} />
              {systemStarted ? "System uruchomiony" : "Uruchom system witryny"}
            </button>
          </div>
          {error && (
            <div className={styles.errorMessage}>
              <XCircle size={20} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <AnimatePresence>
          {systemStarted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={styles.startupAnimation}
            >
              <div className={styles.ledStrip}>
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className={styles.led}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
              <div className={styles.accessCodeBox}>
                <Lock size={24} className={styles.accessIcon} />
                <div>
                  <div className={styles.accessLabel}>KOD DOSTĘPU DO LEVEL 3</div>
                  <div className={styles.accessCode}>{accessCode}</div>
                  <div className={styles.accessHint}>
                    Zapisz kod – będzie potrzebny do diagnostyki w Level 3.
                  </div>
                </div>
              </div>
              <button onClick={goToNextLevel} className={styles.nextLevelButton}>
                Przejdź do Level 3 <ArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
import React, { useEffect, useMemo, useState } from "react";

const API_URL = "http://172.19.240.69:7777";

export default function Questions() {
  const [blocked, setBlocked] = useState(false);
  const [nick, setNick] = useState("");
  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [questionIds, setQuestionIds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [startTimestamp, setStartTimestamp] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const made = localStorage.getItem("made");
    if (made === "true") {
      setBlocked(true);
    }
  }, []);

  useEffect(() => {
    let interval = null;

    if (started && !finished && startTimestamp) {
      interval = setInterval(() => {
        const seconds = Math.floor((Date.now() - startTimestamp) / 1000);
        setElapsedSeconds(seconds);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [started, finished, startTimestamp]);

  useEffect(() => {
    async function fetchQuestion() {
      if (!started || !questionIds.length || currentIndex > questionIds.length - 1) return;

      try {
        setLoading(true);
        setError("");

        const id = questionIds[currentIndex];
        const response = await fetch(`${API_URL}/api/questions/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Nie udało się pobrać pytania.");
        }

        setCurrentQuestion(data);
        setSelectedAnswer("");
      } catch (err) {
        setError(err.message || "Wystąpił błąd.");
      } finally {
        setLoading(false);
      }
    }

    fetchQuestion();
  }, [started, questionIds, currentIndex]);

  const formattedTime = useMemo(() => {
    const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
    const seconds = String(elapsedSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [elapsedSeconds]);

  const handleStart = async () => {
    if (!nick.trim()) {
      setError("Podaj imię i nazwisko albo pseudonim.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/quiz/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nick: nick.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Nie udało się rozpocząć quizu.");
      }

      setSessionId(data.sessionId);
      setQuestionIds(data.questionIds);
      setStarted(true);
      setStartTimestamp(Date.now());
      setElapsedSeconds(0);
    } catch (err) {
      setError(err.message || "Wystąpił błąd.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!selectedAnswer) {
      setError("Wybierz jedną odpowiedź.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const questionId = questionIds[currentIndex];

      const saveAnswerResponse = await fetch(`${API_URL}/api/quiz/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          questionId,
          selectedAnswer,
        }),
      });

      const saveAnswerData = await saveAnswerResponse.json();

      if (!saveAnswerResponse.ok) {
        throw new Error(saveAnswerData.message || "Nie udało się zapisać odpowiedzi.");
      }

      const isLastQuestion = currentIndex === questionIds.length - 1;

      if (isLastQuestion) {
        const finalTime = Math.floor((Date.now() - startTimestamp) / 1000);

        const finishResponse = await fetch(`${API_URL}/api/quiz/finish`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            time: finalTime,
          }),
        });

        const finishData = await finishResponse.json();

        if (!finishResponse.ok) {
          throw new Error(finishData.message || "Nie udało się zakończyć quizu.");
        }

        localStorage.setItem("made", "true");
        setResult(finishData);
        setElapsedSeconds(finalTime);
        setFinished(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    } catch (err) {
      setError(err.message || "Wystąpił błąd.");
    } finally {
      setLoading(false);
    }
  };

  if (blocked) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h2 style={styles.title}>Quiz został już wypełniony</h2>
          <p style={styles.text}>
            Na tym urządzeniu ten quiz został już rozwiązany. Ponowne podejście nie jest możliwe.
          </p>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h2 style={styles.title}>Rozpocznij quiz</h2>

          <input
            type="text"
            placeholder="Wpisz imię i nazwisko lub pseudonim"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            style={styles.input}
          />

          <button onClick={handleStart} style={styles.button} disabled={loading}>
            {loading ? "Uruchamianie..." : "Rozpocznij"}
          </button>

          {error && <p style={styles.error}>{error}</p>}
        </div>
      </div>
    );
  }

  if (finished && result) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h2 style={styles.title}>Twój wynik</h2>
          <p style={styles.resultText}>Użytkownik: {result.nick}</p>
          <p style={styles.resultText}>Wynik: {result.score}/{result.total}</p>
          <p style={styles.resultText}>Czas: {formattedTime}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.topBar}>
        <span>Czas: {formattedTime}</span>
        <span>
          Pytanie {currentIndex + 1}/{questionIds.length}
        </span>
      </div>

      <div style={styles.card}>
        {loading || !currentQuestion ? (
          <p style={styles.text}>Ładowanie pytania...</p>
        ) : (
          <>
            <h2 style={styles.title}>{currentQuestion.question}</h2>

            <div style={styles.answers}>
              {[
                { key: "a", text: currentQuestion.answer_a },
                { key: "b", text: currentQuestion.answer_b },
                { key: "c", text: currentQuestion.answer_c },
                { key: "d", text: currentQuestion.answer_d },
              ].map((answer) => (
                <label key={answer.key} style={styles.answerLabel}>
                  <input
                    type="radio"
                    name="quiz-answer"
                    value={answer.key}
                    checked={selectedAnswer === answer.key}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                  />
                  <span style={{ marginLeft: 8 }}>
                    {answer.key.toUpperCase()}. {answer.text}
                  </span>
                </label>
              ))}
            </div>

            <button onClick={handleNext} style={styles.button} disabled={loading}>
              {currentIndex === questionIds.length - 1 ? "Zakończ" : "Dalej"}
            </button>

            {error && <p style={styles.error}>{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #0f1f46 0%, #081225 35%, #050b16 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    flexDirection: "column",
    color: "#f5f7ff",
  },

  topBar: {
    width: "100%",
    maxWidth: "760px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    fontSize: "18px",
    fontWeight: "700",
    color: "#ffffff",
    background: "rgba(10, 18, 36, 0.82)",
    border: "1px solid rgba(72, 149, 255, 0.35)",
    borderRadius: "14px",
    padding: "14px 18px",
    boxShadow: "0 0 18px rgba(41, 121, 255, 0.16), inset 0 0 12px rgba(75, 156, 255, 0.08)",
    backdropFilter: "blur(10px)",
  },

  card: {
    width: "100%",
    maxWidth: "760px",
    background: "linear-gradient(180deg, rgba(12, 20, 40, 0.96) 0%, rgba(7, 13, 28, 0.98) 100%)",
    borderRadius: "18px",
    padding: "32px",
    border: "1px solid rgba(72, 149, 255, 0.28)",
    boxShadow:
      "0 0 30px rgba(25, 118, 210, 0.18), 0 0 80px rgba(0, 102, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
    backdropFilter: "blur(14px)",
  },

  title: {
    fontSize: "28px",
    marginBottom: "20px",
    color: "#ffffff",
    lineHeight: "1.4",
    textShadow: "0 0 14px rgba(77, 166, 255, 0.22)",
  },

  text: {
    fontSize: "18px",
    color: "#ffffff",
    lineHeight: "1.6",
  },

  input: {
    width: "100%",
    padding: "14px 16px",
    fontSize: "16px",
    borderRadius: "12px",
    border: "1px solid rgba(86, 160, 255, 0.35)",
    marginBottom: "16px",
    outline: "none",
    background: "rgba(8, 16, 32, 0.95)",
    color: "#ffffff",
    boxShadow: "inset 0 0 12px rgba(52, 131, 250, 0.08)",
  },

  button: {
    background: "linear-gradient(135deg, #1e90ff 0%, #00b7ff 100%)",
    color: "#ffffff",
    border: "1px solid rgba(120, 196, 255, 0.45)",
    borderRadius: "12px",
    padding: "14px 22px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 0 18px rgba(0, 153, 255, 0.35), 0 0 36px rgba(0, 102, 255, 0.18)",
    transition: "all 0.2s ease",
  },

  answers: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginBottom: "24px",
  },

  answerLabel: {
    display: "flex",
    alignItems: "center",
    padding: "14px 16px",
    border: "1px solid rgba(90, 160, 255, 0.28)",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "17px",
    color: "#ffffff",
    background: "rgba(9, 17, 32, 0.92)",
    boxShadow: "inset 0 0 10px rgba(44, 125, 255, 0.06)",
    transition: "all 0.2s ease",
  },

  error: {
    marginTop: "14px",
    color: "#ff6b8a",
    fontWeight: "700",
    textShadow: "0 0 10px rgba(255, 80, 120, 0.2)",
  },

  resultText: {
    fontSize: "20px",
    marginBottom: "10px",
    color: "#ffffff",
    lineHeight: "1.6",
  },
};
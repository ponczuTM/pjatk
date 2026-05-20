const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 7777;

app.use(cors());
app.use(express.json());

const QUESTIONS_FILE = path.join(__dirname, "questions.json");
const SCORES_FILE = path.join(__dirname, "scores.json");

const sessions = new Map();

function ensureScoresFile() {
  if (!fs.existsSync(SCORES_FILE)) {
    fs.writeFileSync(SCORES_FILE, "[]", "utf8");
  }
}

function readQuestions() {
  const raw = fs.readFileSync(QUESTIONS_FILE, "utf8");
  return JSON.parse(raw);
}

function readScores() {
  ensureScoresFile();
  const raw = fs.readFileSync(SCORES_FILE, "utf8");
  return JSON.parse(raw);
}

function saveScores(scores) {
  fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2), "utf8");
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sanitizeQuestion(questionObj, index) {
  return {
    id: index + 1,
    question: questionObj.question,
    answer_a: questionObj.answer_a,
    answer_b: questionObj.answer_b,
    answer_c: questionObj.answer_c,
    answer_d: questionObj.answer_d,
  };
}

app.get("/", (req, res) => {
  res.json({ message: `Quiz backend działa na porcie ${PORT}` });
});

app.post("/api/quiz/start", (req, res) => {
  try {
    const { nick } = req.body;

    if (!nick || !nick.trim()) {
      return res.status(400).json({ message: "Nick jest wymagany." });
    }

    const questions = readQuestions();

    if (questions.length < 10) {
      return res.status(500).json({ message: "Za mało pytań w questions.json." });
    }

    const allIds = questions.map((_, index) => index + 1);
    const random10 = shuffleArray(allIds).slice(0, 10);

    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    sessions.set(sessionId, {
      nick: nick.trim(),
      questionIds: random10,
      answers: [],
      startedAt: Date.now(),
      finished: false,
    });

    res.json({
      sessionId,
      nick: nick.trim(),
      questionIds: random10,
      total: 10,
    });
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas startu quizu.", error: error.message });
  }
});

app.get("/api/questions/:id", (req, res) => {
  try {
    const questionId = Number(req.params.id);
    const questions = readQuestions();

    if (!Number.isInteger(questionId) || questionId < 1 || questionId > questions.length) {
      return res.status(404).json({ message: "Nie znaleziono pytania o takim ID." });
    }

    const question = questions[questionId - 1];
    res.json(sanitizeQuestion(question, questionId - 1));
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas pobierania pytania.", error: error.message });
  }
});

app.post("/api/quiz/answer", (req, res) => {
  try {
    const { sessionId, questionId, selectedAnswer } = req.body;

    if (!sessionId || !questionId || !selectedAnswer) {
      return res.status(400).json({ message: "Brak wymaganych danych." });
    }

    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Nie znaleziono sesji quizu." });
    }

    if (session.finished) {
      return res.status(400).json({ message: "Quiz już został zakończony." });
    }

    if (!session.questionIds.includes(Number(questionId))) {
      return res.status(400).json({ message: "To pytanie nie należy do tej sesji." });
    }

    const alreadyAnswered = session.answers.find(
      (item) => item.questionId === Number(questionId)
    );

    if (alreadyAnswered) {
      return res.status(400).json({ message: "Na to pytanie już odpowiedziano." });
    }

    session.answers.push({
      questionId: Number(questionId),
      selectedAnswer: String(selectedAnswer).toLowerCase(),
    });

    sessions.set(sessionId, session);

    res.json({ message: "Odpowiedź zapisana." });
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas zapisu odpowiedzi.", error: error.message });
  }
});

app.post("/api/quiz/finish", (req, res) => {
  try {
    const { sessionId, time } = req.body;

    if (!sessionId || typeof time !== "number") {
      return res.status(400).json({ message: "Brak sessionId lub time." });
    }

    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Nie znaleziono sesji quizu." });
    }

    if (session.finished) {
      return res.status(400).json({ message: "Quiz został już zakończony." });
    }

    const questions = readQuestions();

    let score = 0;

    session.answers.forEach((userAnswer) => {
      const question = questions[userAnswer.questionId - 1];
      if (!question) return;

      if (
        String(userAnswer.selectedAnswer).toLowerCase() ===
        String(question.correct_answer).toLowerCase()
      ) {
        score += 1;
      }
    });

    const scores = readScores();
    scores.push({
      nick: session.nick,
      score,
      time,
    });

    saveScores(scores);

    session.finished = true;
    sessions.set(sessionId, session);

    res.json({
      message: "Quiz zakończony.",
      nick: session.nick,
      score,
      total: session.questionIds.length,
      time,
    });
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas kończenia quizu.", error: error.message });
  }
});

app.get("/api/scores", (req, res) => {
  try {
    const scores = readScores();
    res.json(scores);
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas pobierania wyników.", error: error.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  ensureScoresFile();
  console.log(`Quiz backend działa na http://0.0.0.0:${PORT}`);
});
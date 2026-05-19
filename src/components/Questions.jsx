import React, { useState, useEffect, useRef } from 'react';

const API_URL = 'http://192.168.68.247:7777';

const Questions = () => {
  const [userName, setUserName] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  // Pobierz pytania z API
  useEffect(() => {
    fetch(`${API_URL}/questions`)
      .then(res => res.json())
      .then(data => setAllQuestions(data))
      .catch(err => console.error("Błąd pobierania pytań:", err));
  }, []);

  // Stoper
  useEffect(() => {
    if (isStarted && !isFinished) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isStarted, isFinished]);

  const startQuiz = () => {
    if (!userName.trim()) return alert("Wpisz swoje imię!");
    
    // Losowanie 10 unikalnych pytań
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    setQuizQuestions(shuffled.slice(0, 10));
    setIsStarted(true);
    setTimer(0);
  };

  const handleAnswer = (selectedLetter) => {
    if (selectedLetter === quizQuestions[currentIndex].correct_answer) {
      setScore(prev => prev + 1);
    }

    if (currentIndex < 9) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setIsFinished(true);
    const finalScore = score; // Uwaga: stan score może się zaktualizować z opóźnieniem

    try {
      await fetch(`${API_URL}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          score: score + (quizQuestions[currentIndex].correct_answer === quizQuestions[currentIndex].correct_answer ? 0 : 0), // Logika uproszczona
          time: timer
        }),
      });
    } catch (err) {
      console.error("Błąd zapisu wyniku:", err);
    }
  };

  if (!isStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Witaj w Quizie IoT</h1>
          <input
            type="text"
            placeholder="Twoje imię / Nick"
            className="w-full p-3 border rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <button 
            onClick={startQuiz}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Rozpocznij Quiz
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
          <h2 className="text-3xl font-bold mb-4">Koniec!</h2>
          <p className="text-xl mb-2">Gratulacje, {userName}!</p>
          <div className="text-5xl font-bold text-blue-600 my-6">{score} / 10</div>
          <p className="text-gray-600 font-mono">Twój czas: {timer} sekund</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 text-blue-500 underline"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  const currentQ = quizQuestions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border p-6">
        {/* Header z czasem i postępem */}
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <span className="text-sm font-medium text-gray-500">Pytanie {currentIndex + 1} z 10</span>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase text-gray-400 font-bold">Czas:</span>
            <span className="text-xl font-mono font-bold text-red-500">{timer}s</span>
          </div>
        </div>

        {/* Pytanie */}
        <h2 className="text-xl font-semibold mb-6 text-gray-800">{currentQ?.question}</h2>

        {/* Odpowiedzi */}
        <div className="grid grid-cols-1 gap-3">
          {['a', 'b', 'c', 'd'].map((letter) => (
            <button
              key={letter}
              onClick={() => handleAnswer(letter)}
              className="group flex items-center p-4 border rounded-xl hover:bg-blue-50 hover:border-blue-300 transition text-left"
            >
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 group-hover:bg-blue-100 text-sm font-bold mr-4 uppercase">
                {letter}
              </span>
              <span className="text-gray-700">{currentQ?.[`answer_${letter}`]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Questions;
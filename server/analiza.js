const fs = require('fs');

/**
 * Sortuje wyniki:
 * 1. Według punktów (score) - malejąco
 * 2. Przy remisie: według czasu (time) - rosnąco
 */
function analizujWyniki() {
  try {
    // Odczyt pliku scores.json
    const rawData = fs.readFileSync('scores.json', 'utf8');
    const scores = JSON.parse(rawData);

    // Logika sortowania
    scores.sort((a, b) => {
      if (b.score !== a.score) {
        // Sortowanie malejące po wyniku
        return b.score - a.score;
      }
      // Jeśli wyniki równe, sortowanie rosnące po czasie
      return a.time - b.time;
    });

    console.log("=== Ranking Wyników ===");
    scores.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.nick} - Punkty: ${entry.score}, Czas: ${entry.time}s`);
    });

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error("Błąd: Nie znaleziono pliku scores.json");
    } else {
      console.error("Wystąpił błąd podczas analizy:", error.message);
    }
  }
}

analizujWyniki();
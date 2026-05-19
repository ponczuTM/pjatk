const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = 7777;

app.use(cors());
app.use(express.json());

// Ładowanie pytań z pliku questions.json
const questionsData = JSON.parse(fs.readFileSync('./questions.json', 'utf8'));

// Endpoint do pobierania wszystkich pytań (frontend zajmie się losowaniem 10)
app.get('/questions', (req, res) => {
    // Wysyłamy pytania bez poprawnej odpowiedzi dla bezpieczeństwa, 
    // ale w tym prostym przykładzie wyślemy całość
    res.json(questionsData);
});

// Endpoint do zapisywania wyników
app.post('/results', (req, res) => {
    const { name, score, time } = req.body;
    const resultEntry = {
        name,
        score,
        time,
        date: new Date().toISOString()
    };

    // Zapis do pliku results.json
    fs.appendFileSync('results.json', JSON.stringify(resultEntry) + '\n');
    
    console.log(`Wynik zapisany: ${name} - ${score}/10 w czasie ${time}s`);
    res.status(201).json({ message: 'Wynik zapisany pomyślnie!' });
});

app.listen(PORT, () => {
    console.log(`Serwer quizu działa na http://192.168.68.247:${PORT}`);
});
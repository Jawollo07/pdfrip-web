const express = require('express');
const multer = require('multer');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Upload-Verzeichnis sicherstellen
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/submit', upload.single('pdf'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'Keine Datei hochgeladen.' });
    }
    
    const filePath = req.file.path;
    const type = req.body.type; // "w", "r" oder "d"
    const wordlistPath = req.body.wordlistPath || 'wordlists/rockyou.txt';
    
    let args = ['--file', filePath];
    
    if (type === 'w') {
        args.push('wordlist', wordlistPath);
    } else if (type === 'r') {
        const range1 = req.body.range1;
        const range2 = req.body.range2;
        if (!range1 || !range2) {
            cleanup(filePath);
            return res.status(400).json({ success: false, error: 'Beide Range-Werte sind erforderlich.' });
        }
        args.push('range', range1, range2);
    } else if (type === 'd') {
        const date1 = req.body.date1;
        const date2 = req.body.date2;
        if (!date1 || !date2) {
            cleanup(filePath);
            return res.status(400).json({ success: false, error: 'Beide Datums-Werte sind erforderlich.' });
        }
        args.push('date', date1, date2);
    } else {
        cleanup(filePath);
        return res.status(400).json({ success: false, error: 'Ungültiger Typ. Erlaubt: w, r, d' });
    }
    
    // execFile ist sicherer als exec (kein Shell-Parsing)
    const process = execFile('./pdfrip', args, { timeout: 5 * 60 * 1000 }, (error, stdout, stderr) => {
        cleanup(filePath);
        
        if (error) {
            return res.json({
                success: false,
                error: stderr || error.message || 'Unbekannter Fehler',
                code: error.code
            });
        }
        
        res.json({ success: true, output: stdout });
    });
});

function cleanup(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (err) {
        console.error('Cleanup fehlgeschlagen:', err.message);
    }
}

app.listen(port, () => {
    console.log(`Server läuft unter http://localhost:${port}`);
});

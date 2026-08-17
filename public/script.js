const form = document.getElementById('Form');
const typeSelect = document.getElementById('type');
const submitBtn = document.getElementById('submitBtn');
const output = document.getElementById('output');
const resultContainer = document.getElementById('resultContainer');

// Abschnitte je nach Modus ein-/ausblenden
function updateSections() {
    document.querySelectorAll('.mode-section').forEach(el => el.classList.add('hidden'));
    const selected = typeSelect.value;
    const section = document.getElementById(`section-${selected}`);
    if (section) section.classList.remove('hidden');
}

typeSelect.addEventListener('change', updateSections);
updateSections(); // Initial

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verarbeitung läuft...';
    resultContainer.classList.remove('hidden');
    output.textContent = 'Bitte warten...';
    output.className = '';
    
    try {
        const response = await fetch('/submit', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            output.textContent = result.output || '(keine Ausgabe)';
            output.className = 'success';
        } else {
            output.textContent = 'Fehler: ' + (result.error || 'Unbekannter Fehler');
            output.className = 'error';
        }
    } catch (err) {
        output.textContent = 'Netzwerkfehler: ' + err.message;
        output.className = 'error';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Starten';
    }
});
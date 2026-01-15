import { subjects } from './subjects.js';

// DOM Elements
const subjectSearch = document.getElementById('subjectSearch');
const searchResults = document.getElementById('searchResults');
const subjectList = document.getElementById('subjectList');
const calculateBtn = document.getElementById('calculateBtn');
const totalCreditsEl = document.getElementById('totalCredits');
const cgpaValueEl = document.getElementById('cgpaValue');

// State
let addedSubjects = [];

// Grade Mapping
const gradePoints = {
    'O': 10,
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C': 5,
    'D': 4,
    'E': 0,
    'F': 0
};

// Search Logic
subjectSearch.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    if (query.length < 2) {
        searchResults.classList.add('hidden');
        return;
    }

    const filtered = subjects.filter(sub =>
        (sub.code && sub.code.toLowerCase().includes(query)) ||
        (sub.name && sub.name.toLowerCase().includes(query))
    );

    renderSearchResults(filtered);
});

function renderSearchResults(results) {
    searchResults.innerHTML = '';
    if (results.length === 0) {
        searchResults.classList.add('hidden');
        return;
    }

    results.forEach(sub => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `
            <div>
                <span class="code">${sub.code}</span>
                <span class="name">${sub.name}</span>
            </div>
            <div class="meta">${sub.credit} Credits</div>
        `;
        div.addEventListener('click', () => addSubject(sub));
        searchResults.appendChild(div);
    });

    searchResults.classList.remove('hidden');
}

// Add Subject
function addSubject(sub) {
    // Prevent duplicates
    if (addedSubjects.find(s => s.code === sub.code && s.code !== "ELECTIVE")) {
        alert("Subject already added!");
        subjectSearch.value = '';
        searchResults.classList.add('hidden');
        return;
    }

    const id = Date.now();
    const subjectObj = { ...sub, id, scoreType: 'marks', scoreValue: '' };
    addedSubjects.push(subjectObj);

    renderSubjectList();

    // Reset search
    subjectSearch.value = '';
    searchResults.classList.add('hidden');
}

// Remove Subject
function removeSubject(id) {
    addedSubjects = addedSubjects.filter(s => s.id !== id);
    renderSubjectList();
}

// Render List
function renderSubjectList() {
    subjectList.innerHTML = '';

    if (addedSubjects.length === 0) {
        subjectList.innerHTML = `
            <div class="empty-state">
                <p>No subjects added yet. Search to begin.</p>
            </div>`;
        return;
    }

    addedSubjects.forEach(sub => {
        const div = document.createElement('div');
        div.className = 'subject-item';
        div.innerHTML = `
            <div class="subject-info">
                <div>${sub.code}</div>
                <div>${sub.name}</div>
            </div>
            <div class="credits">
                ${sub.credit}
            </div>
            <div class="input-group">
                <select class="grade-select" data-id="${sub.id}" id="type-${sub.id}">
                    <option value="grade" ${sub.scoreType === 'grade' ? 'selected' : ''}>Grade</option>
                    <option value="marks" ${sub.scoreType === 'marks' ? 'selected' : ''}>Marks</option>
                </select>
                
                ${sub.scoreType === 'grade' ? `
                <select class="grade-select value-input" data-id="${sub.id}">
                    <option value="O">O</option>
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="B+">B+</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E/F</option>
                </select>` : `
                <input type="number" class="mark-input value-input" data-id="${sub.id}" placeholder="0-100" min="0" max="100">
                `}
            </div>
            <button class="remove-btn" data-id="${sub.id}">&times;</button>
        `;
        subjectList.appendChild(div);

        // Restore value if possible/needed (but simple re-render resets to O/empty)
        // Ideally we bind value from state.
        const inputEl = div.querySelector('.value-input');
        if (inputEl) {
            inputEl.value = sub.scoreValue || (sub.scoreType === 'grade' ? 'O' : '');
            inputEl.addEventListener('change', (e) => updateSubjectScore(sub.id, e.target.value));
        }

        div.querySelector(`#type-${sub.id}`).addEventListener('change', (e) => {
            updateSubjectScoreType(sub.id, e.target.value);
        });

        div.querySelector('.remove-btn').addEventListener('click', () => removeSubject(sub.id));
    });
}

function updateSubjectScoreType(id, type) {
    const sub = addedSubjects.find(s => s.id === id);
    if (sub) {
        sub.scoreType = type;
        sub.scoreValue = type === 'grade' ? 'O' : ''; // Reset value on type switch
        renderSubjectList();
    }
}

function updateSubjectScore(id, value) {
    const sub = addedSubjects.find(s => s.id === id);
    if (sub) sub.scoreValue = value;
}

// Calculate
calculateBtn.addEventListener('click', () => {
    let totalCredits = 0;
    let totalPoints = 0;

    for (const sub of addedSubjects) {
        const credit = parseFloat(sub.credit);
        let gp = 0;

        if (sub.scoreType === 'grade') {
            gp = gradePoints[sub.scoreValue] || 0;
        } else {
            // Marks to GP
            const m = parseFloat(sub.scoreValue);
            if (isNaN(m)) continue; // Skip invalid

            if (m >= 90) gp = 10;
            else if (m >= 80) gp = 9;
            else if (m >= 70) gp = 8;
            else if (m >= 60) gp = 7;
            else if (m >= 50) gp = 6;
            else if (m >= 40) gp = 5; // C
            else if (m >= 35) gp = 4; // D (Assuming 35-40 is D based on common schemes, prompt says Marginal Pass)
            else gp = 0;
        }

        totalCredits += credit;
        totalPoints += (credit * gp);
    }

    if (totalCredits === 0) {
        totalCreditsEl.textContent = "0";
        cgpaValueEl.textContent = "0.00";
        return;
    }

    const cgpa = totalPoints / totalCredits;

    // Animate results
    totalCreditsEl.textContent = totalCredits;
    cgpaValueEl.textContent = cgpa.toFixed(2);
});

// Hide search on outside click
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) {
        searchResults.classList.add('hidden');
    }
});

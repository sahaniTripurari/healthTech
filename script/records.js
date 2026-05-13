// Disease data
const diseases = [
    { id: 'diabetes', name: 'Diabetes', vitals: ['bloodSugar'] },
    { id: 'hypertension', name: 'Hypertension', vitals: ['bloodPressure'] },
    { id: 'heart', name: 'Heart Disease', vitals: ['heartRate'] },
    { id: 'obesity', name: 'Obesity', vitals: ['weight'] },
    { id: 'sleep', name: 'Sleep Disorder', vitals: ['sleepHours'] },
    { id: 'asthma', name: 'Asthma', vitals: ['peakFlow'] },
    { id: 'thyroid', name: 'Thyroid', vitals: ['tsh'] },
    { id: 'chickenpox', name: 'Chickenpox', vitals: ['temperature'] },
{ id: 'measles', name: 'Measles', vitals: ['temperature'] },
{ id: 'mumps', name: 'Mumps', vitals: ['temperature'] },
{ id: 'ear_infection', name: 'Ear Infection', vitals: ['temperature', 'painLevel'] },
{ id: 'pneumonia_child', name: 'Pediatric Pneumonia', vitals: ['temperature', 'oxygenLevel'] },
{ id: 'bronchiolitis', name: 'Bronchiolitis', vitals: ['oxygenLevel', 'respiratoryRate'] },
{ id: 'malnutrition', name: 'Malnutrition', vitals: ['weight', 'bmi'] },
{ id: 'vitamin_d_def', name: 'Vitamin D Deficiency', vitals: ['bmi'] },
{ id: 'anemia_child', name: 'Anemia', vitals: ['hemoglobin'] },
{ id: 'epilepsy_child', name: 'Epilepsy', vitals: ['seizureCount'] },
{ id: 'bph', name: 'Prostate Enlargement (BPH)', vitals: ['painLevel'] },
{ id: 'prostate_cancer', name: 'Prostate Cancer', vitals: ['painLevel'] },
{ id: 'low_testosterone', name: 'Low Testosterone', vitals: ['weight'] },
{ id: 'kidney_stones', name: 'Kidney Stones', vitals: ['painLevel'] },
{ id: 'liver_cirrhosis', name: 'Liver Cirrhosis', vitals: ['bilirubin'] },
{ id: 'heart_attack', name: 'Heart Attack', vitals: ['heartRate', 'bloodPressure'] },
{ id: 'copd_male', name: 'COPD', vitals: ['oxygenLevel'] },
{ id: 'gout_male', name: 'Gout', vitals: ['uricAcid'] },
{ id: 'pcos', name: 'PCOS', vitals: ['weight', 'bmi'] },
{ id: 'endometriosis', name: 'Endometriosis', vitals: ['painLevel'] },
{ id: 'breast_cancer', name: 'Breast Cancer', vitals: ['temperature'] },
{ id: 'pregnancy_diabetes', name: 'Pregnancy Diabetes', vitals: ['bloodSugar'] },
{ id: 'preeclampsia', name: 'Preeclampsia', vitals: ['bloodPressure'] },
{ id: 'postpartum_depression', name: 'Postpartum Depression', vitals: ['moodScore'] },
{ id: 'osteoporosis_women', name: 'Osteoporosis', vitals: ['bmi'] },
{ id: 'alzheimers', name: 'Alzheimer’s Disease', vitals: ['moodScore'] },
{ id: 'parkinsons', name: 'Parkinson’s Disease', vitals: ['painLevel'] },
{ id: 'heart_failure', name: 'Heart Failure', vitals: ['heartRate', 'oxygenLevel'] },
{ id: 'ckd', name: 'Chronic Kidney Disease', vitals: ['creatinine'] },
{ id: 'atrial_fibrillation', name: 'Atrial Fibrillation', vitals: ['heartRate'] },
{ id: 'vitamin_b12', name: 'Vitamin B12 Deficiency', vitals: ['hemoglobin'] }
];

let selectedDiseases = [];
let profileData = {};

// DOM Elements
const diseaseTagsEl = document.getElementById('diseaseTags');
const vitalsSectionEl = document.getElementById('vitalsSection');
const vitalFieldsEl = document.getElementById('vitalFields');
const diseaseSearchEl = document.getElementById('diseaseSearch');
const modalDiseaseSearchEl = document.getElementById('modalDiseaseSearch');
const diseaseListEl = document.getElementById('diseaseList');
const diseaseModalEl = document.getElementById('diseaseModal');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {

    const token = localStorage.getItem("token");

    if (!token) {
        showToast("Please login first", "error");
        return;
    }

    await loadProfile();   // 🔥 important

    initCharts();
    renderDiseaseList();

    if (diseaseSearchEl) {
        diseaseSearchEl.addEventListener('input', handleDiseaseSearch);
    }

    const saveProfileBtn = document.getElementById('recordSaveProfileBtn');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', savePatientProfile);
    }
});

async function savePatientProfile() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const payload = {
        fullName: document.getElementById("fullName").value.trim(),
        age: document.getElementById("age").value,
        gender: document.getElementById("gender").value,
        bloodGroup: document.getElementById("bloodGroup").value,
        height: document.getElementById("height").value
    };

    try {
        const res = await fetch("/api/user/profile", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
            showToast("Profile updated successfully");
        } else {
            showToast(data.message || "Update failed", "error");
        }
    } catch (err) {
        showToast("Server error", "error");
    }
}

async function loadProfile() {
    const token = localStorage.getItem("token");

    if (!token) {
        showToast("Please login first", "error");
        return;
    }

    try {
        const res = await fetch("/api/auth/me", {
            headers: {
                Authorization: "Bearer " + token
            }
        });

        if (!res.ok) {
            showToast("Session expired. Please login again.", "error");
            return;
        }

        const user = await res.json();

        // 🔥 AUTO FILL USER ID
        document.getElementById("userId").value = user._id;
        document.getElementById("userId").readOnly = true;

        // Optional prefill
        document.getElementById("fullName").value = user.fullName || "";
        document.getElementById("age").value = user.age || "";
        document.getElementById("gender").value = user.gender || "Male";

        profileData.userId = user._id;

    } catch (err) {
        showToast("Failed to load user", "error");
    }
}


function renderDiseaseList(filter = '') {
    diseaseListEl.innerHTML = '';

    const filtered = diseases.filter(d =>
        !selectedDiseases.some(s => s.id === d.id) &&
        d.name.toLowerCase().includes(filter)
    );

    filtered.forEach(disease => {
        const div = document.createElement('div');
        div.className = 'disease-item';
        div.textContent = disease.name;
        div.onclick = () => addDisease(disease);
        diseaseListEl.appendChild(div);
    });
}

function addDisease(disease) {
    selectedDiseases.push(disease);
    renderDiseaseTags();
    updateVitalFields();
    renderDiseaseList(diseaseSearchEl.value.toLowerCase());
    showToast(`${disease.name} added`);
}

function removeDisease(diseaseId) {
    selectedDiseases = selectedDiseases.filter(d => d.id !== diseaseId);
    renderDiseaseTags();
    updateVitalFields();
    renderDiseaseList(diseaseSearchEl.value.toLowerCase());
    showToast('Condition removed');
}

function renderDiseaseTags() {
    diseaseTagsEl.innerHTML = '';

    selectedDiseases.forEach(disease => {
        const tag = document.createElement('div');
        tag.className = 'disease-tag';
        tag.innerHTML = `
            ${disease.name}
            <button class="remove" onclick="removeDisease('${disease.id}')">×</button>
        `;
        diseaseTagsEl.appendChild(tag);
    });
}
function handleDiseaseSearch() {
    const query = diseaseSearchEl.value.toLowerCase();
    renderDiseaseList(query);
}


// Dynamic Vitals
function updateVitalFields() {
    vitalFieldsEl.innerHTML = '';
    const uniqueVitals = [...new Set(selectedDiseases.flatMap(d => d.vitals))];
    
    if (uniqueVitals.length > 0) {
        vitalsSectionEl.style.display = 'block';
        uniqueVitals.forEach(vital => {
            const field = document.createElement('div');
            field.className = 'input-group';
            field.innerHTML = `
                <label>${getVitalLabel(vital)}</label>
                <input type="number" id="${vital}" placeholder="Enter ${getVitalLabel(vital)}">
            `;
            vitalFieldsEl.appendChild(field);
        });
    } else {
        vitalsSectionEl.style.display = 'none';
    }
}

function getVitalLabel(vital) {
    const labels = {
        bloodSugar: 'Blood Sugar (mg/dL)',
        bloodPressure: 'Blood Pressure (mmHg)',
        heartRate: 'Heart Rate (bpm)',
        weight: 'Weight (kg)',
        sleepHours: 'Sleep Hours',
        temperature: 'Body Temperature (°C)',
        painLevel: 'Pain Level (1-10)',
        oxygenLevel: 'Oxygen Level (%)',
        respiratoryRate: 'Respiratory Rate',
        bmi: 'BMI',
        hemoglobin: 'Hemoglobin (g/dL)',
        seizureCount: 'Seizure Count',
        bilirubin: 'Bilirubin Level',
        uricAcid: 'Uric Acid Level',
        moodScore: 'Mood Level (1-10)',
        creatinine: 'Creatinine Level',
        peakFlow: 'Peak Flow (L/min)',
    };
    return labels[vital] || vital;
}

// AI Analysis
async function analyzeHealth() {
    const loaderEl = document.getElementById('aiLoader');
    const aiResultEl = document.getElementById('aiResult');
    
    loaderEl.classList.remove('hidden');
    aiResultEl.classList.add('hidden');
    
    // Collect data
    const healthData = {
        profile: profileData,
        diseases: selectedDiseases.map(d => d.name),
        vitals: {},
        lifestyle: {
            sleep: document.getElementById('sleep')?.value || 0,
            water: document.getElementById('water')?.value || 0,
            steps: document.getElementById('steps')?.value || 0,
            exercise: document.getElementById('exercise')?.value || 0,
            weight: document.getElementById('weight')?.value || 0
        }
    };
    
    // Get vital values
    selectedDiseases.flatMap(d => d.vitals).forEach(vital => {
        const el = document.getElementById(vital);
        if (el) healthData.vitals[vital] = el.value;
    });

    try {
        // Simulate AI call (replace with real backend call)
        const response = await mockAIResponse(healthData);
        
        document.getElementById('riskBadge').textContent = response.risk;
        document.getElementById('riskBadge').className = `risk-badge ${response.risk.toLowerCase()}`;
        document.getElementById('aiSummary').textContent = response.summary;
        document.getElementById('aiRecommendations').innerHTML = `<strong>Recommendations:</strong> ${response.recommendations}`;
        
        aiResultEl.classList.remove('hidden');
        showToast('AI Analysis complete!');
    } catch (error) {
        showToast('Analysis failed. Please try again.', 'error');
    } finally {
        loaderEl.classList.add('hidden');
    }
}

async function mockAIResponse(data) {
    // Simulate Gemini AI response
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                risk: 'Moderate',
                summary: 'Stable vitals with good lifestyle habits. Blood sugar slightly elevated.',
                recommendations: 'Maintain hydration, increase exercise to 45min daily, monitor sugar levels',
                score: calculateHealthScore(data)
            });
        }, 2000);
    });
}

// Health Score Calculation
function calculateHealthScore(data) {
    let score = 100;
    
    // Deduct for abnormal vitals
    if (data.vitals.bloodSugar > 140) score -= 15;
    if (data.vitals.bloodPressure > 140) score -= 20;
    if (data.vitals.heartRate > 100 || data.vitals.heartRate < 60) score -= 10;
    
    // Lifestyle deductions
    if (data.lifestyle.sleep < 6) score -= 15;
    if (data.lifestyle.water < 2) score -= 10;
    if (data.lifestyle.steps < 5000) score -= 10;
    
    return Math.max(0, score);
}


    // Collect vitals
    async function saveDailyRecord() {
    const record = {
        userId: profileData.userId,
        vitals: {},
        lifestyle: {}
    };
    selectedDiseases.flatMap(d => d.vitals).forEach(vital => {
        const el = document.getElementById(vital);
        if (el) record.vitals[vital] = parseFloat(el.value);
    });
    
    record.healthScore = calculateHealthScore(record);
    
    try {
        // Simulate backend save
        await saveToBackend(record);
        showToast('Daily record saved successfully!');
    } catch (error) {
        showToast('Failed to save record', 'error');
    }
    }

async function saveToBackend(record) {
    // Replace with real API call
    console.log('Saving to backend:', record);
    return new Promise(resolve => setTimeout(resolve, 1000));
}

// Toast Notifications
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// Charts (Dashboard)
function initCharts() {
    // Simple canvas charts for demo
    ['sugarChart', 'bpChart', 'weightChart', 'sleepChart'].forEach((id, index) => {
        const canvas = document.getElementById(id);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            drawLineChart(ctx, canvas, index);
        }
    });
}

function drawLineChart(ctx, canvas, type) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Mock data
    const data = Array(30).fill(0).map(() => Math.random() * 100 + 50);
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 212, 255, 0.1)');
    
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - data[0]);
    
    data.forEach((value, i) => {
        ctx.lineTo((i / 29) * canvas.width, canvas.height - (value / 150) * canvas.height);
    });
    
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    ctx.fillStyle = gradient;
    ctx.fill();
}
// Lifestyle Progress Sync
document.querySelectorAll('.metric-card input[type="range"]').forEach(input => {
    const ring = input.parentElement.querySelector('.progress-ring');
    const span = ring.querySelector('span');
    const max = parseFloat(input.max);

    function updateRing() {
        const value = parseFloat(input.value);
        span.textContent = value;

        const percentage = (value / max) * 360;
        ring.style.setProperty('--progress', percentage);

        ring.style.background = `conic-gradient(
            var(--teal-accent) ${percentage}deg,
            rgba(255,255,255,0.1) ${percentage}deg 360deg
        )`;
    }

    input.addEventListener('input', updateRing);
    updateRing();
});

async function saveDiseases() {
    const token = localStorage.getItem("token");

    if (!token) {
        showToast("Please login first", "error");
        return;
    }

    const payload = {
        diseases: selectedDiseases.map(d => d.id)
    };

    try {
        const res = await fetch("/api/records/save-diseases", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.message || "Failed to save diseases", "error");
            return;
        }

        showToast("Diseases saved successfully");
    } catch (error) {
        showToast("Server error", "error");
    }
}
async function saveVitals() {
    const token = localStorage.getItem("token");

    if (!token) {
        showToast("Please login first", "error");
        return;
    }

    const vitalsPayload = {};

    // 🔥 Collect ONLY visible dynamic vitals
    selectedDiseases.flatMap(d => d.vitals).forEach(vital => {
        const el = document.getElementById(vital);
        if (el && el.value !== "") {
            vitalsPayload[vital] = el.value;
        }
    });

    try {
        const res = await fetch("/api/records/save-vitals", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify({ vitals: vitalsPayload })
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.message || "Failed to save vitals", "error");
            return;
        }

        showToast("Vitals saved successfully");

    } catch (error) {
        showToast("Server error", "error");
    }
}
async function saveLifestyle() {
    const token = localStorage.getItem("token");

    if (!token) {
        showToast("Please login first", "error");
        return;
    }

    const payload = {
        sleep: document.getElementById('sleep').value,
        water: document.getElementById('water').value,
        steps: document.getElementById('steps').value,
        exercise: document.getElementById('exercise').value
    };

    try {
        const res = await fetch("/api/records/save-lifestyle", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.message || "Failed to save lifestyle", "error");
            return;
        }

        showToast("Lifestyle saved successfully");
    } catch (error) {
        showToast("Server error", "error");
    }
}

function fakeLifestyleSave(data) {
    return new Promise(resolve => setTimeout(resolve, 1000));
}
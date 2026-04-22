// Firebase Config (Same as script.js)
const firebaseConfig = {
    apiKey: "AIzaSyB5D2kkpY3Rv-xqRO_we5JeE3oyVuFuL8k",
    authDomain: "smile-dental-ziro-2025.firebaseapp.com",
    projectId: "smile-dental-ziro-2025",
    storageBucket: "smile-dental-ziro-2025.firebasestorage.app",
    messagingSenderId: "629665408700",
    appId: "1:629665408700:web:904409243c6f6f560292b9"
};

// Initialize Firebase
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
// const auth = firebase.auth(); // Auth no longer needed
const db = firebase.firestore();

// DOM Elements
const loginSection = document.getElementById('loginSection');
const loginForm = document.getElementById('loginForm');
const adminPasswordInput = document.getElementById('adminPassword');
const loginError = document.getElementById('loginError');
const dashboardSection = document.getElementById('dashboardSection');
// const phoneForm = document.getElementById('phoneForm');
// const otpForm = document.getElementById('otpForm');
// ... removed auth elements

// Appointments Elements
const appointmentsView = document.getElementById('appointmentsView');
const tableBody = document.getElementById('appointmentsTableBody');
const loadingSpinner = document.getElementById('loadingSpinner');
const noDataMessage = document.getElementById('noDataMessage');
const filterDateInput = document.getElementById('filterDate');
const clearFilterBtn = document.getElementById('clearFilter');
const sortByDateBtn = document.getElementById('sortByDate');
const sortByNameBtn = document.getElementById('sortByName');

// Patient Management Elements
const patientsView = document.getElementById('patientsView');
const tabAppointments = document.getElementById('tabAppointments');
const tabPatients = document.getElementById('tabPatients');
const patientSearchInput = document.getElementById('patientSearchInput');
const searchPatientBtn = document.getElementById('searchPatientBtn');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const registerPatientForm = document.getElementById('registerPatientForm');
const newPatientForm = document.getElementById('newPatientForm');
const cancelRegisterBtn = document.getElementById('cancelRegisterBtn');
const patientDetailsSection = document.getElementById('patientDetailsSection');
const patientNotFound = document.getElementById('patientNotFound');
const addReportForm = document.getElementById('addReportForm');
const reportsTimeline = document.getElementById('reportsTimeline');

// State
let allAppointments = [];
let currentSort = 'date'; // 'date' or 'name'
// let confirmationResult = null; // Auth state removed
let currentPatientId = null; // Track selected patient

// --- AUTHENTICATION ---

// Check Session on Load
if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
    showDashboard();
}

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = adminPasswordInput.value;

    if (password === 'admin123') {
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        showDashboard();
    } else {
        loginError.style.display = 'block';
    }
});

function showDashboard() {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    fetchAppointments();
}

// --- TAB NAVIGATION ---

tabAppointments.addEventListener('click', () => {
    switchTab('appointments');
});

tabPatients.addEventListener('click', () => {
    switchTab('patients');
});

function switchTab(tabName) {
    if (tabName === 'appointments') {
        appointmentsView.style.display = 'block';
        patientsView.style.display = 'none';
        tabAppointments.classList.add('active');
        tabAppointments.style.color = 'var(--primary)';
        tabAppointments.style.borderBottom = '2px solid var(--primary)';

        tabPatients.classList.remove('active');
        tabPatients.style.color = 'var(--text-medium)';
        tabPatients.style.borderBottom = '2px solid transparent';
    } else {
        appointmentsView.style.display = 'none';
        patientsView.style.display = 'block';
        tabPatients.classList.add('active');
        tabPatients.style.color = 'var(--primary)';
        tabPatients.style.borderBottom = '2px solid var(--primary)';

        tabAppointments.classList.remove('active');
        tabAppointments.style.color = 'var(--text-medium)';
        tabAppointments.style.borderBottom = '2px solid transparent';

        // Fetch patients when tab is opened
        fetchPatients();
    }
}

// --- APPOINTMENTS LOGIC ---

async function fetchAppointments() {
    loadingSpinner.style.display = 'block';
    tableBody.innerHTML = '';
    noDataMessage.style.display = 'none';

    try {
        const snapshot = await db.collection('appointments').orderBy('timestamp', 'desc').get();

        allAppointments = [];
        snapshot.forEach(doc => {
            allAppointments.push({ id: doc.id, ...doc.data() });
        });

        renderTable(allAppointments);
    } catch (error) {
        console.error("Error fetching data:", error);
        alert("Error loading appointments. Check console.");
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

function renderTable(data) {
    tableBody.innerHTML = '';

    if (data.length === 0) {
        noDataMessage.style.display = 'block';
        return;
    }

    noDataMessage.style.display = 'none';

    data.forEach(appt => {
        const row = document.createElement('tr');

        let bookedAt = '-';
        if (appt.timestamp) {
            bookedAt = new Date(appt.timestamp.seconds * 1000).toLocaleString();
        }

        row.innerHTML = `
            <td><span class="token-badge">#${appt.token || '?'}</span></td>
            <td><strong>${appt.date}</strong></td>
            <td>${appt.name}</td>
            <td>${appt.age}</td>
            <td><a href="tel:${appt.phone}" style="color: var(--primary); text-decoration: none;">${appt.phone}</a></td>
            <td>${appt.message || '-'}</td>
            <td style="font-size: 0.85rem; color: #6b7280;">${bookedAt}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Sorting & Filtering
function parseDate(dateStr) {
    if (!dateStr) return new Date(0);
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}`);
}

function applySortAndFilter() {
    let filtered = [...allAppointments];

    const selectedDate = filterDateInput.value;
    if (selectedDate) {
        const [y, m, d] = selectedDate.split('-');
        const formattedFilterDate = `${d}/${m}/${y}`;
        filtered = filtered.filter(appt => appt.date === formattedFilterDate);
    }

    filtered.sort((a, b) => {
        if (currentSort === 'date') {
            return parseDate(a.date) - parseDate(b.date);
        } else if (currentSort === 'name') {
            return a.name.localeCompare(b.name);
        }
    });

    renderTable(filtered);
}

sortByDateBtn.addEventListener('click', () => {
    currentSort = 'date';
    applySortAndFilter();
    updateSortUI(sortByDateBtn, sortByNameBtn);
});

sortByNameBtn.addEventListener('click', () => {
    currentSort = 'name';
    applySortAndFilter();
    updateSortUI(sortByNameBtn, sortByDateBtn);
});

function updateSortUI(activeBtn, inactiveBtn) {
    activeBtn.classList.add('btn-primary');
    activeBtn.style.background = '';
    activeBtn.style.color = '';

    inactiveBtn.classList.remove('btn-primary');
    inactiveBtn.style.background = 'white';
    inactiveBtn.style.color = 'var(--primary)';
}

flatpickr(filterDateInput, {
    dateFormat: "Y-m-d",
    onChange: function (selectedDates, dateStr) {
        applySortAndFilter();
    }
});

clearFilterBtn.addEventListener('click', () => {
    filterDateInput._flatpickr.clear();
    applySortAndFilter();
});


// --- PATIENT MANAGEMENT LOGIC ---

// Elements
const patientListSection = document.getElementById('patientListSection');
const patientsTableBody = document.getElementById('patientsTableBody');
const patientsLoading = document.getElementById('patientsLoading');
const showAllPatientsBtn = document.getElementById('showAllPatientsBtn');
const backToPatientsList = document.getElementById('backToPatientsList');

// Edit Modal Elements
const editPatientModal = document.getElementById('editPatientModal');
const editPatientForm = document.getElementById('editPatientForm');
const closeEditModalBtn = document.getElementById('closeEditModalBtn');
const editPatientBtn = document.getElementById('editPatientBtn');
const deletePatientBtn = document.getElementById('deletePatientBtn');

// 1. Generate Patient ID
function generatePatientId() {
    const randomNum = Math.floor(100000 + Math.random() * 900000); // 6 digit random
    return `SDC-${randomNum}`;
}

// 2. Toggle Views
showRegisterBtn.addEventListener('click', () => {
    registerPatientForm.style.display = 'block';
    patientDetailsSection.style.display = 'none';
    patientListSection.style.display = 'none'; // Hide list
    patientNotFound.style.display = 'none';
});

cancelRegisterBtn.addEventListener('click', () => {
    registerPatientForm.style.display = 'none';
    patientListSection.style.display = 'block'; // Show list again
});

showAllPatientsBtn.addEventListener('click', () => {
    patientSearchInput.value = '';
    fetchPatients();
});

backToPatientsList.addEventListener('click', () => {
    patientDetailsSection.style.display = 'none';
    patientListSection.style.display = 'block';
    fetchPatients(); // Refresh list
});

// 3. Register New Patient
newPatientForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('newPatientName').value;
    const phone = document.getElementById('newPatientPhone').value;
    const age = document.getElementById('newPatientAge').value;
    const gender = document.getElementById('newPatientGender').value;
    const patientId = generatePatientId();

    const newPatient = {
        patientId: patientId,
        name: name,
        phone: phone,
        age: age,
        gender: gender,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        reports: [] // Initialize empty reports array
    };

    try {
        // Use patientId as document ID for easy lookup
        await db.collection('patients').doc(patientId).set(newPatient);

        alert(`Patient Registered Successfully!\nID: ${patientId}`);
        newPatientForm.reset();
        registerPatientForm.style.display = 'none';

        // Auto-load the new patient
        loadPatient(newPatient);

    } catch (error) {
        console.error("Error registering patient:", error);
        alert("Failed to register patient. " + error.message);
    }
});

// 4. Fetch & Render All Patients
async function fetchPatients() {
    patientListSection.style.display = 'block';
    patientDetailsSection.style.display = 'none';
    registerPatientForm.style.display = 'none';
    patientNotFound.style.display = 'none';

    patientsLoading.style.display = 'block';
    patientsTableBody.innerHTML = '';

    try {
        const snapshot = await db.collection('patients').orderBy('createdAt', 'desc').get();

        if (snapshot.empty) {
            patientsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">No patients found.</td></tr>';
            return;
        }

        snapshot.forEach(doc => {
            const p = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-size: 0.9rem;">${p.patientId}</span></td>
                <td><strong>${p.name}</strong></td>
                <td>${p.phone}</td>
                <td>${p.age}</td>
                <td>${p.gender || '-'}</td>
                <td style="display: flex; gap: 8px;">
                    <button class="btn" onclick="viewPatient('${p.patientId}')" style="padding: 6px 12px; font-size: 0.85rem; background: var(--primary); color: white; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-eye"></i> View
                    </button>
                    <button class="btn" onclick="openEditModal('${p.patientId}')" style="padding: 6px 12px; font-size: 0.85rem; background: #f3f4f6; color: var(--text-dark); display: flex; align-items: center; gap: 6px; border: 1px solid #ddd;">
                        <i class="fa-solid fa-pen"></i> Edit
                    </button>
                </td>
            `;
            patientsTableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error fetching patients:", error);
        patientsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: red;">Error loading patients.</td></tr>';
    } finally {
        patientsLoading.style.display = 'none';
    }
}

// Make viewPatient global so onclick works
window.viewPatient = async function (id) {
    try {
        const doc = await db.collection('patients').doc(id).get();
        if (doc.exists) {
            loadPatient(doc.data());
        } else {
            alert("Patient not found!");
        }
    } catch (error) {
        console.error("Error viewing patient:", error);
    }
};

// 5. Search Patient
patientSearchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        searchPatientBtn.click();
    }
});

searchPatientBtn.addEventListener('click', async () => {
    const query = patientSearchInput.value.trim();
    if (!query) return;

    // Reset views
    patientListSection.style.display = 'none';
    patientDetailsSection.style.display = 'none';
    patientNotFound.style.display = 'none';
    registerPatientForm.style.display = 'none';
    patientsLoading.style.display = 'block';

    try {
        let foundPatients = [];

        // 1. Check if query is ID (starts with SDC-)
        if (query.toUpperCase().startsWith('SDC-')) {
            const doc = await db.collection('patients').doc(query.toUpperCase()).get();
            if (doc.exists) {
                foundPatients.push(doc.data());
            }
        }
        // 2. Check if query is Phone Number (numeric)
        else if (/^\d+$/.test(query)) {
            const snapshot = await db.collection('patients').where('phone', '==', query).get();
            snapshot.forEach(doc => foundPatients.push(doc.data()));
        }
        // 3. Assume Name Search (Case-Insensitive Client-Side)
        else {
            // Fetch all patients (Optimization: In a real large app, use Algolia or ElasticSearch)
            const snapshot = await db.collection('patients').get();
            const lowerQuery = query.toLowerCase();

            snapshot.forEach(doc => {
                const p = doc.data();
                if (p.name && p.name.toLowerCase().includes(lowerQuery)) {
                    foundPatients.push(p);
                }
            });
        }

        patientsLoading.style.display = 'none';

        if (foundPatients.length === 0) {
            patientNotFound.style.display = 'block';
        } else if (foundPatients.length === 1) {
            // If only one match, show details directly
            loadPatient(foundPatients[0]);
        } else {
            // If multiple matches, show them in the list
            renderPatientList(foundPatients);
        }

    } catch (error) {
        console.error("Error searching patient:", error);
        alert("Error searching patient.");
        patientsLoading.style.display = 'none';
    }
});

function renderPatientList(patients) {
    patientListSection.style.display = 'block';
    patientsTableBody.innerHTML = '';

    patients.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-size: 0.9rem;">${p.patientId}</span></td>
            <td><strong>${p.name}</strong></td>
            <td>${p.phone}</td>
            <td>${p.age}</td>
            <td>${p.gender || '-'}</td>
            <td style="display: flex; gap: 8px;">
                <button class="btn" onclick="viewPatient('${p.patientId}')" style="padding: 6px 12px; font-size: 0.85rem; background: var(--primary); color: white; display: flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-eye"></i> View
                </button>
                <button class="btn" onclick="openEditModal('${p.patientId}')" style="padding: 6px 12px; font-size: 0.85rem; background: #f3f4f6; color: var(--text-dark); display: flex; align-items: center; gap: 6px; border: 1px solid #ddd;">
                    <i class="fa-solid fa-pen"></i> Edit
                </button>
            </td>
        `;
        patientsTableBody.appendChild(row);
    });
}

// 6. Load & Render Patient Data (Detail View)
function loadPatient(patient) {
    currentPatientId = patient.patientId;
    patientListSection.style.display = 'none'; // Hide list

    // Fill Info
    document.getElementById('pName').textContent = patient.name;
    document.getElementById('pId').textContent = patient.patientId;
    document.getElementById('pPhone').textContent = patient.phone;
    document.getElementById('pAge').textContent = patient.age;
    document.getElementById('pGender').textContent = patient.gender;

    // Render Reports
    renderReports(patient.reports || []);

    patientDetailsSection.style.display = 'block';
    patientNotFound.style.display = 'none';
}

function renderReports(reports) {
    reportsTimeline.innerHTML = '';

    if (reports.length === 0) {
        reportsTimeline.innerHTML = '<p style="color: #666; font-style: italic;">No medical history recorded yet.</p>';
        return;
    }

    // Sort reports by date (newest first)
    const reversedReports = [...reports].reverse();

    reversedReports.forEach(report => {
        const card = document.createElement('div');
        card.style.cssText = 'background: #f9fafb; padding: 1rem; border-radius: 0.5rem; border-left: 4px solid var(--primary);';

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <strong style="color: var(--primary);">${report.diagnosis}</strong>
                <span style="font-size: 0.85rem; color: #666;">${report.date}</span>
            </div>
            <div style="margin-bottom: 0.5rem;">
                <strong style="font-size: 0.9rem;">Prescription:</strong>
                <p style="font-size: 0.95rem; white-space: pre-wrap;">${report.prescription}</p>
            </div>
            ${report.notes ? `
            <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed #ddd;">
                <strong style="font-size: 0.9rem;">Notes:</strong>
                <p style="font-size: 0.9rem; color: #555;">${report.notes}</p>
            </div>` : ''}
        `;
        reportsTimeline.appendChild(card);
    });
}

// 7. Add New Report
addReportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentPatientId) return;

    const diagnosis = document.getElementById('reportDiagnosis').value;
    const prescription = document.getElementById('reportPrescription').value;
    const notes = document.getElementById('reportNotes').value;

    const newReport = {
        date: new Date().toLocaleDateString('en-IN'), // dd/mm/yyyy format
        timestamp: Date.now(),
        diagnosis: diagnosis,
        prescription: prescription,
        notes: notes
    };

    try {
        await db.collection('patients').doc(currentPatientId).update({
            reports: firebase.firestore.FieldValue.arrayUnion(newReport)
        });

        alert("Report Added Successfully!");
        addReportForm.reset();

        // Reload patient data to show new report
        const doc = await db.collection('patients').doc(currentPatientId).get();
        loadPatient(doc.data());

    } catch (error) {
        console.error("Error adding report:", error);
        alert("Failed to add report.");
    }
});

// Make openEditModal global
window.openEditModal = async function (id) {
    currentPatientId = id;
    try {
        const doc = await db.collection('patients').doc(id).get();
        if (doc.exists) {
            const p = doc.data();
            document.getElementById('editPatientId').value = p.patientId;
            document.getElementById('editPatientName').value = p.name;
            document.getElementById('editPatientPhone').value = p.phone;
            document.getElementById('editPatientAge').value = p.age;
            document.getElementById('editPatientGender').value = p.gender;

            editPatientModal.style.display = 'flex';
        }
    } catch (error) {
        console.error("Error opening edit modal:", error);
    }
};

// 8. Edit Patient Logic
editPatientBtn.addEventListener('click', () => {
    // Populate modal with current data (from Detail View)
    document.getElementById('editPatientId').value = currentPatientId;
    document.getElementById('editPatientName').value = document.getElementById('pName').textContent;
    document.getElementById('editPatientPhone').value = document.getElementById('pPhone').textContent;
    document.getElementById('editPatientAge').value = document.getElementById('pAge').textContent;
    document.getElementById('editPatientGender').value = document.getElementById('pGender').textContent;

    editPatientModal.style.display = 'flex';
});

closeEditModalBtn.addEventListener('click', () => {
    editPatientModal.style.display = 'none';
});

// Close modal on outside click
editPatientModal.addEventListener('click', (e) => {
    if (e.target === editPatientModal) {
        editPatientModal.style.display = 'none';
    }
});

editPatientForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editPatientId').value;
    const updatedData = {
        name: document.getElementById('editPatientName').value,
        phone: document.getElementById('editPatientPhone').value,
        age: document.getElementById('editPatientAge').value,
        gender: document.getElementById('editPatientGender').value
    };

    try {
        await db.collection('patients').doc(id).update(updatedData);

        alert("Patient Details Updated!");
        editPatientModal.style.display = 'none';

        // Reload patient view
        const doc = await db.collection('patients').doc(id).get();
        loadPatient(doc.data());

    } catch (error) {
        console.error("Error updating patient:", error);
        alert("Failed to update patient.");
    }
});

// 9. Delete Patient Logic
deletePatientBtn.addEventListener('click', async () => {
    if (!currentPatientId) return;

    if (confirm("Are you sure you want to delete this patient? This action cannot be undone.")) {
        try {
            await db.collection('patients').doc(currentPatientId).delete();
            alert("Patient Deleted Successfully.");

            // Go back to list
            patientDetailsSection.style.display = 'none';
            patientListSection.style.display = 'block';
            fetchPatients();

        } catch (error) {
            console.error("Error deleting patient:", error);
            alert("Failed to delete patient.");
        }
    }
});

// 10. Download PDF Report
const downloadReportBtn = document.getElementById('downloadReportBtn');

downloadReportBtn.addEventListener('click', async () => {
    if (!currentPatientId) return;

    try {
        const doc = await db.collection('patients').doc(currentPatientId).get();
        if (doc.exists) {
            generatePatientPDF(doc.data());
        }
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Failed to generate PDF report.");
    }
});

function generatePatientPDF(patient) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Clinic Header
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185); // Primary Color
    doc.text("Smile Dental Clinic", 105, 20, null, null, "center");

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Best Dentist in Ziro, Lower Subansiri", 105, 28, null, null, "center");
    doc.text("Phone: +91 8794942745", 105, 34, null, null, "center");

    doc.setDrawColor(200);
    doc.line(10, 38, 200, 38); // Horizontal Line

    // Patient Details
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Patient Medical Report", 14, 50);

    doc.setFontSize(11);
    doc.setTextColor(50);

    const leftX = 14;
    const rightX = 110;
    let startY = 60;

    doc.text(`Patient Name: ${patient.name}`, leftX, startY);
    doc.text(`Patient ID: ${patient.patientId}`, rightX, startY);

    startY += 8;
    doc.text(`Age: ${patient.age} Years`, leftX, startY);
    doc.text(`Gender: ${patient.gender || '-'}`, rightX, startY);

    startY += 8;
    doc.text(`Phone: ${patient.phone}`, leftX, startY);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, rightX, startY);

    // Medical History Table
    const reports = patient.reports || [];

    if (reports.length > 0) {
        const tableData = reports.map(r => [
            r.date,
            r.diagnosis,
            r.prescription,
            r.notes || '-'
        ]);

        doc.autoTable({
            startY: startY + 15,
            head: [['Date', 'Diagnosis', 'Prescription', 'Notes']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 10, cellPadding: 4 },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 40 },
                2: { cellWidth: 60 },
                3: { cellWidth: 'auto' }
            }
        });
    } else {
        doc.text("No medical history recorded.", 14, startY + 20);
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text('Smile Dental Clinic - Confidential Medical Record', 105, 285, null, null, 'center');
    }

    // Save PDF
    doc.save(`${patient.name.replace(/\s+/g, '_')}_Report.pdf`);
}


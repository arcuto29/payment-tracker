// ============ DATA ============
let students = JSON.parse(localStorage.getItem('mentor_students') || '[]');
let payments = JSON.parse(localStorage.getItem('mentor_payments') || '[]');
let editingStudentId = null;

function save() {
    localStorage.setItem('mentor_students', JSON.stringify(students));
    localStorage.setItem('mentor_payments', JSON.stringify(payments));
}


// ============ STUDENTS ============
function openStudentModal(studentId) {
    editingStudentId = studentId || null;
    const modal = document.getElementById('studentModal');
    const title = document.getElementById('studentModalTitle');

    if (editingStudentId) {
        const s = students.find(st => st.id === editingStudentId);
        title.textContent = 'Edit Student';
        document.getElementById('studentName').value = s.name;
        document.getElementById('studentRate').value = s.rate;
        document.getElementById('studentSchedule').value = s.schedule;
        document.getElementById('studentStart').value = s.startDate;
        document.getElementById('studentNotes').value = s.notes || '';
    } else {
        title.textContent = 'Add Student';
        document.getElementById('studentName').value = '';
        document.getElementById('studentRate').value = '50';
        document.getElementById('studentSchedule').value = 'monthly';
        document.getElementById('studentStart').valueAsDate = new Date();
        document.getElementById('studentNotes').value = '';
    }

    modal.classList.add('active');
}

function closeStudentModal() {
    document.getElementById('studentModal').classList.remove('active');
    editingStudentId = null;
}


function saveStudent() {
    const name = document.getElementById('studentName').value.trim();
    const rate = parseFloat(document.getElementById('studentRate').value);
    const schedule = document.getElementById('studentSchedule').value;
    const startDate = document.getElementById('studentStart').value;
    const notes = document.getElementById('studentNotes').value.trim();

    if (!name) { alert('Please enter a student name.'); return; }
    if (!rate || rate <= 0) { alert('Please enter a valid amount.'); return; }
    if (!startDate) { alert('Please select a start date.'); return; }

    if (editingStudentId) {
        const s = students.find(st => st.id === editingStudentId);
        s.name = name;
        s.rate = rate;
        s.schedule = schedule;
        s.startDate = startDate;
        s.notes = notes;
    } else {
        students.push({ id: Date.now(), name, rate, schedule, startDate, notes });
    }

    save();
    closeStudentModal();
    renderAll();
}

function deleteStudent(id) {
    if (confirm('Delete this student and all their payments?')) {
        students = students.filter(s => s.id !== id);
        payments = payments.filter(p => p.studentId !== id);
        save();
        renderAll();
    }
}


function getScheduleLabel(schedule) {
    const labels = { weekly: 'Weekly', biweekly: 'Bi-Weekly', monthly: 'Monthly', custom: 'Custom' };
    return labels[schedule] || schedule;
}

function getStudentTotalPaid(studentId) {
    return payments.filter(p => p.studentId === studentId && p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
}

function renderStudents() {
    const container = document.getElementById('studentCards');
    if (students.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No students yet. Add your first student above!</p></div>';
        return;
    }
    container.innerHTML = students.map(s => {
        const totalPaid = getStudentTotalPaid(s.id);
        const pendingPayments = payments.filter(p => p.studentId === s.id && p.status === 'pending');
        const pendingTotal = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
        return `
            <div class="student-card">
                <div class="name">${escapeHtml(s.name)}</div>
                <div class="rate">$${s.rate} / ${getScheduleLabel(s.schedule)}</div>
                <div class="details">
                    <span>Paid: $${totalPaid.toLocaleString()}</span>
                    ${pendingTotal > 0 ? `<span>Pending: $${pendingTotal}</span>` : ''}
                </div>
                ${s.notes ? `<div class="details"><span>${escapeHtml(s.notes)}</span></div>` : ''}
                <div class="actions">
                    <button class="btn-small green" onclick="openPaymentModal(${s.id})">+ Payment</button>
                    <button class="btn-small" style="background:rgba(96,165,250,0.2);color:#60a5fa;" onclick="openStudentModal(${s.id})">Edit</button>
                    <button class="btn-small red" onclick="deleteStudent(${s.id})">Remove</button>
                </div>
            </div>`;
    }).join('');
}


// ============ PAYMENTS ============
function openPaymentModal(studentId) {
    const modal = document.getElementById('paymentModal');
    const studentSelect = document.getElementById('paymentStudent');
    studentSelect.innerHTML = students.map(s =>
        `<option value="${s.id}" ${s.id === studentId ? 'selected' : ''}>${escapeHtml(s.name)}</option>`
    ).join('');
    const student = students.find(s => s.id === studentId);
    if (student) document.getElementById('paymentAmount').value = student.rate;
    document.getElementById('paymentDate').valueAsDate = new Date();
    document.getElementById('paymentStatus').value = 'paid';
    document.getElementById('paymentNote').value = '';
    modal.classList.add('active');
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
}

function savePayment() {
    const studentId = parseInt(document.getElementById('paymentStudent').value);
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const date = document.getElementById('paymentDate').value;
    const status = document.getElementById('paymentStatus').value;
    const note = document.getElementById('paymentNote').value.trim();
    if (!amount || amount <= 0) { alert('Please enter a valid amount.'); return; }
    if (!date) { alert('Please select a date.'); return; }
    payments.unshift({ id: Date.now(), studentId, amount, date, status, note });
    save();
    closePaymentModal();
    renderAll();
}

function deletePayment(id) {
    if (confirm('Delete this payment record?')) {
        payments = payments.filter(p => p.id !== id);
        save();
        renderAll();
    }
}

function togglePaymentStatus(id) {
    const payment = payments.find(p => p.id === id);
    if (payment) {
        payment.status = payment.status === 'paid' ? 'pending' : 'paid';
        save();
        renderAll();
    }
}


function renderPayments() {
    const list = document.getElementById('paymentList');
    const filterStudent = document.getElementById('filterStudent').value;
    const filterStatus = document.getElementById('filterStatus').value;
    let filtered = [...payments];
    if (filterStudent !== 'all') filtered = filtered.filter(p => p.studentId === parseInt(filterStudent));
    if (filterStatus !== 'all') filtered = filtered.filter(p => p.status === filterStatus);
    if (filtered.length === 0) {
        list.innerHTML = '<li class="empty-state"><p>No payments match the current filters.</p></li>';
        return;
    }
    list.innerHTML = filtered.map(p => {
        const student = students.find(s => s.id === p.studentId);
        const studentName = student ? student.name : 'Unknown';
        const dateFormatted = new Date(p.date + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
        });
        return `
            <li class="payment-item">
                <div class="left">
                    <span class="student-name">${escapeHtml(studentName)}</span>
                    <span class="amount">$${p.amount}</span>
                    <span class="date">${dateFormatted}</span>
                    ${p.note ? `<span class="note">${escapeHtml(p.note)}</span>` : ''}
                </div>
                <div class="right">
                    <span class="status-badge ${p.status}" onclick="togglePaymentStatus(${p.id})" title="Click to toggle">${p.status}</span>
                    <button class="btn-delete" onclick="deletePayment(${p.id})" title="Delete">&times;</button>
                </div>
            </li>`;
    }).join('');
}


// ============ STATS ============
function renderStats() {
    const totalReceived = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
    document.getElementById('totalReceived').textContent = `$${totalReceived.toLocaleString()}`;
    document.getElementById('totalPending').textContent = `$${totalPending.toLocaleString()}`;
    document.getElementById('studentCount').textContent = students.length;
}

function updateFilterDropdown() {
    const select = document.getElementById('filterStudent');
    const current = select.value;
    select.innerHTML = '<option value="all">All Students</option>' +
        students.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
    if (students.find(s => String(s.id) === current)) select.value = current;
}

// ============ EXPORT / IMPORT ============
function exportData() {
    const data = { exportDate: new Date().toISOString(), students, payments };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mentorship-payments-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (!data.students || !data.payments) {
                    alert('Invalid backup file.');
                    return;
                }
                if (confirm('This will replace all current data. Are you sure?')) {
                    students = data.students;
                    payments = data.payments;
                    save();
                    renderAll();
                    alert('Data restored successfully!');
                }
            } catch (err) {
                alert('Error reading file. Make sure it is a valid backup JSON.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}


// ============ HELPERS ============
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ RENDER ALL ============
function renderAll() {
    renderStats();
    renderStudents();
    updateFilterDropdown();
    renderPayments();
}

// Initial render
renderAll();

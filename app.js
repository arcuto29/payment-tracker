let payments = JSON.parse(localStorage.getItem('payments') || '[]');

document.getElementById('date').valueAsDate = new Date();

function save() {
    localStorage.setItem('payments', JSON.stringify(payments));
}

function addPayment() {
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value;
    if (!amount || amount <= 0) return;
    if (!date) return;
    payments.unshift({ id: Date.now(), amount, date });
    save();
    render();
    document.getElementById('amount').value = '50';
    document.getElementById('date').valueAsDate = new Date();
}

function remove(id) {
    payments = payments.filter(p => p.id !== id);
    save();
    render();
}

function editPayment(id) {
    const p = payments.find(x => x.id === id);
    if (!p) return;
    const row = document.querySelector(`[data-id="${id}"]`);
    row.innerHTML = `
        <div class="edit-row">
            <span class="dollar">$</span>
            <input type="number" class="edit-input" id="edit-amount-${id}" value="${p.amount}">
            <input type="date" class="edit-input" id="edit-date-${id}" value="${p.date}">
            <button class="save-btn" onclick="saveEdit(${id})">Save</button>
            <button class="cancel-btn" onclick="render()">X</button>
        </div>
    `;
}

function saveEdit(id) {
    const amount = parseFloat(document.getElementById(`edit-amount-${id}`).value);
    const date = document.getElementById(`edit-date-${id}`).value;
    if (!amount || amount <= 0 || !date) return;
    const p = payments.find(x => x.id === id);
    p.amount = amount;
    p.date = date;
    save();
    render();
}

function render() {
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    document.getElementById('total').textContent = `$${total}`;

    const el = document.getElementById('history');
    if (payments.length === 0) {
        el.innerHTML = '<p class="empty">No payments yet</p>';
        return;
    }
    el.innerHTML = payments.map(p => {
        const d = new Date(p.date + 'T00:00:00').toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
        return `<div class="entry" data-id="${p.id}">
            <div class="left" onclick="editPayment(${p.id})">
                <span class="amount">$${p.amount}</span>
                <span class="date">${d}</span>
            </div>
            <button class="delete-btn" onclick="remove(${p.id})">&times;</button>
        </div>`;
    }).join('');
}

function exportData() {
    const blob = new Blob([JSON.stringify(payments, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'payments-backup.json';
    a.click();
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (Array.isArray(data)) payments = data;
                else if (data.payments) payments = data.payments;
                save();
                render();
            } catch (err) { alert('Bad file'); }
        };
        reader.readAsText(e.target.files[0]);
    };
    input.click();
}

function clearAll() {
    if (confirm('Delete all payment records?')) {
        payments = [];
        save();
        render();
    }
}

render();

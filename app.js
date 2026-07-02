let payments = JSON.parse(localStorage.getItem('payments') || '[]');

function save() {
    localStorage.setItem('payments', JSON.stringify(payments));
}

function quickPay() {
    payments.unshift({
        id: Date.now(),
        amount: 50,
        date: new Date().toISOString().slice(0, 10)
    });
    save();
    render();
}

function remove(id) {
    payments = payments.filter(p => p.id !== id);
    save();
    render();
}

function render() {
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    document.getElementById('total').textContent = `$${total}`;

    const el = document.getElementById('history');
    if (payments.length === 0) {
        el.innerHTML = '<p class="empty">No payments yet. Hit the button above when you get paid!</p>';
        return;
    }
    el.innerHTML = payments.map(p => {
        const d = new Date(p.date + 'T00:00:00').toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
        return `<div class="entry">
            <div class="left">
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
                if (Array.isArray(data)) {
                    payments = data;
                } else if (data.payments) {
                    payments = data.payments;
                }
                save();
                render();
            } catch (err) {
                alert('Bad file');
            }
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

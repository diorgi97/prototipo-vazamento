// frontend JS: envia formulário, lista inspeções e desenha gráfico com Chart.js
async function postFormData(url, formData) {
  const res = await fetch(url, { method: 'POST', body: formData });
  return res.json();
}

async function loadInspections() {
  const res = await fetch('/api/inspections');
  const rows = await res.json();
  const container = document.getElementById('inspectionsList');
  container.innerHTML = '';
  rows.forEach(r => {
    const div = document.createElement('div');
    div.className = 'inspection';
    const imgHtml = r.photo_path ? `<img src="${r.photo_path}" alt="foto">` : '';
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `
      <strong>${r.department}</strong> — <small class="gray">${new Date(r.timestamp).toLocaleString()}</small><br/>
      ${r.section ? r.section + ' | ' : ''}${r.location ? r.location + ' | ' : ''}${r.machine_id ? 'Máquina: ' + r.machine_id : ''}<br/>
      Leitura: ${r.sensor_value ?? '-'} ${r.estimated_loss ? '| perda:' + r.estimated_loss : ''}<br/>
      <em>${r.note ?? ''}</em>
    `;
    const left = document.createElement('div');
    left.innerHTML = imgHtml;
    const actions = document.createElement('div');
    actions.style.textAlign = 'right';
    actions.innerHTML = `
      <div>${r.resolved ? '<strong style="color:green">Resolvido</strong>' : '<strong style="color:crimson">Pendente</strong>'}</div>
    `;
    if (!r.resolved) {
      const btn = document.createElement('button');
      btn.innerText = 'Marcar resolvido';
      btn.onclick = async () => {
        await fetch('/api/inspections/' + r.id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolved: true })
        });
        await reloadAll();
      };
      actions.appendChild(btn);
    }
    div.appendChild(left);
    div.appendChild(meta);
    div.appendChild(actions);
    container.appendChild(div);
  });
}

let chartInstance = null;
async function loadDashboard() {
  const res = await fetch('/api/dashboard');
  const data = await res.json();
  const labels = data.map(d => d.department || '(Sem departamento)');
  const totals = data.map(d => Number(d.total));
  const resolved = data.map(d => Number(d.resolved_count || 0));
  const ctx = document.getElementById('chart').getContext('2d');
  const chartData = {
    labels,
    datasets: [
      { label: 'Total', backgroundColor: 'rgba(75,192,192,0.6)', data: totals },
      { label: 'Resolvidos', backgroundColor: 'rgba(153,102,255,0.6)', data: resolved }
    ]
  };
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: { responsive: true, maintainAspectRatio: false }
  });

  const stats = document.getElementById('stats');
  const totalAll = totals.reduce((a,b)=>a+b,0);
  const resolvedAll = resolved.reduce((a,b)=>a+b,0);
  stats.innerHTML = `<p>Total de vazamentos: <strong>${totalAll}</strong> — Resolvidos: <strong>${resolvedAll}</strong></p>`;
}

async function reloadAll() {
  await loadInspections();
  await loadDashboard();
}

document.getElementById('formInspection').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const res = await postFormData('/api/inspections', fd);
  if (res.ok) {
    alert('Inspeção salva');
    form.reset();
    await reloadAll();
  } else {
    alert('Erro ao salvar: ' + (res.error || 'unknown'));
  }
});

document.getElementById('refreshBtn').addEventListener('click', reloadAll);

// inicializa
reloadAll().catch(err => console.error(err));

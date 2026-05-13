// ============================================================
//  HealthAI — Dashboard — Weekly Bar / Monthly Line + Export
// ============================================================

const VITAL_META = {
  bloodSugar:      { label:'Blood Sugar',      unit:'mg/dL',  min:70,   max:140,  icon:'🩸', color:'#f87171' },
  bloodPressure:   { label:'Blood Pressure',   unit:'mmHg',   min:60,   max:120,  icon:'💓', color:'#fb923c' },
  heartRate:       { label:'Heart Rate',        unit:'bpm',    min:60,   max:100,  icon:'❤️', color:'#ef4444' },
  weight:          { label:'Weight',            unit:'kg',     min:40,   max:100,  icon:'⚖️', color:'#a78bfa' },
  sleepHours:      { label:'Sleep Hours',       unit:'hrs',    min:6,    max:9,    icon:'😴', color:'#818cf8' },
  temperature:     { label:'Body Temp',         unit:'°C',     min:36,   max:37.5, icon:'🌡️', color:'#fbbf24' },
  painLevel:       { label:'Pain Level',        unit:'/10',    min:0,    max:3,    icon:'😣', color:'#f43f5e' },
  oxygenLevel:     { label:'Oxygen Level',      unit:'%',      min:95,   max:100,  icon:'💨', color:'#38bdf8' },
  respiratoryRate: { label:'Respiratory Rate',  unit:'/min',   min:12,   max:20,   icon:'🫁', color:'#34d399' },
  bmi:             { label:'BMI',               unit:'',       min:18.5, max:24.9, icon:'📏', color:'#a3e635' },
  hemoglobin:      { label:'Hemoglobin',        unit:'g/dL',   min:12,   max:17,   icon:'🔬', color:'#e879f9' },
  seizureCount:    { label:'Seizure Count',     unit:'/day',   min:0,    max:0,    icon:'⚡', color:'#fbbf24' },
  bilirubin:       { label:'Bilirubin',         unit:'mg/dL',  min:0,    max:1.2,  icon:'🫀', color:'#fb923c' },
  uricAcid:        { label:'Uric Acid',         unit:'mg/dL',  min:2.4,  max:6,    icon:'🧪', color:'#4ade80' },
  moodScore:       { label:'Mood Score',        unit:'/10',    min:6,    max:10,   icon:'🧠', color:'#c084fc' },
  creatinine:      { label:'Creatinine',        unit:'mg/dL',  min:0.6,  max:1.2,  icon:'🫘', color:'#fb7185' },
  peakFlow:        { label:'Peak Flow',         unit:'L/min',  min:400,  max:700,  icon:'💨', color:'#38bdf8' },
  tsh:             { label:'TSH Level',         unit:'mIU/L',  min:0.4,  max:4,    icon:'🦋', color:'#f472b6' },
};

function vitalStatus(key, value) {
  const m = VITAL_META[key];
  if (!m) return { label:'Unknown', color:'#94a3b8' };
  const v = parseFloat(value);
  if (isNaN(v)) return { label:'No Data', color:'#94a3b8' };
  if (v < m.min) return { label:'Low ▼',    color:'#f59e0b' };
  if (v > m.max) return { label:'High ▲',   color:'#ef4444' };
  return { label:'Normal ✓', color:'#10b981' };
}

// ─────────────────────────────────────────────────────────
class HealthDashboard {
  constructor() {
    this.currentMonth   = new Date().getMonth();
    this.currentYear    = new Date().getFullYear();
    this.dashboardData  = null;
    this.activeUserId   = null;
    this.loggedInUserId = null;
    this.monitoredUsers = [];
    this.vitalPeriod    = '7d';
    this.lsPeriod       = '7d';
    this.init();
  }

  async init() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res  = await fetch('/api/auth/me', { headers:{ Authorization:'Bearer '+token } });
      if (!res.ok) return;
      const user = await res.json();
      this.activeUserId   = user._id;
      this.loggedInUserId = user._id;
      await this.loadDashboard(user._id);
      this.bindEvents();
      this.bindExportButtons();
    } catch(e) { console.error('Dashboard init:', e); }
  }

  async loadDashboard(userId) {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/dashboard/${userId}`, { headers:{ Authorization:'Bearer '+token } });
      if (!res.ok) return;
      this.dashboardData = await res.json();
      this.activeUserId  = userId;
      this.renderProfile();
      this.renderCalendar();
      this.renderVitalCharts(this.vitalPeriod);
      this.renderLifestyleSection(this.lsPeriod);
      this.renderSummary();
      this.renderUsersTable();
    } catch(e) { console.error('loadDashboard:', e); }
  }

  bindEvents() {
    document.getElementById('prevMonth')?.addEventListener('click', () => this.changeMonth(-1));
    document.getElementById('nextMonth')?.addEventListener('click', () => this.changeMonth(1));
    const inp = document.getElementById('searchInput');
    if (inp) {
      let t;
      inp.addEventListener('input', e => {
        clearTimeout(t);
        t = setTimeout(() => this.searchUser(e.target.value.trim()), 450);
      });
    }
  }

  // ── EXPORT BUTTONS ──────────────────────────────────────
  bindExportButtons() {
    // Export Data (CSV)
    document.getElementById('exportDataBtn')?.addEventListener('click', () => this.exportCSV());
    // Download PDF
    document.getElementById('downloadPdfBtn')?.addEventListener('click', () => this.downloadPDF());
    // Print
    document.getElementById('printBtn')?.addEventListener('click', () => window.print());
  }

  exportCSV() {
    const records = this.dashboardData?.records || [];
    if (!records.length) { alert('No records to export.'); return; }

    const profile = this.dashboardData?.profile;
    let csv = 'Date,Disease,Sleep(hrs),Water(L),Steps,Exercise(min)';

    // Add vital columns from first record
    const vitalKeys = Object.keys(records[0]?.vitals || {});
    vitalKeys.forEach(k => { csv += ',' + (VITAL_META[k]?.label || k) + '(' + (VITAL_META[k]?.unit||'') + ')'; });
    csv += '\n';

    records.forEach(r => {
      const ls = r.lifestyle || {};
      let row = [
        r.date || '',
        (r.diseases||[]).join(' | '),
        ls.sleep    || 0,
        ls.water    || 0,
        ls.steps    || 0,
        ls.exercise || 0,
      ];
      vitalKeys.forEach(k => row.push(r.vitals?.[k] || ''));
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `health_data_${profile?.fullName||'user'}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  downloadPDF() {
    // Use browser print-to-PDF with print styles
    const profile = this.dashboardData?.profile;
    const records = this.dashboardData?.records || [];
    const total   = this.dashboardData?.totalRecords || 0;

    // Build a clean HTML report in a new window
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Health Report - ${profile?.fullName||'Patient'}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', sans-serif; padding:32px; color:#1a1a2e; background:#fff; }
  h1  { font-size:24px; color:#0ea5e9; margin-bottom:4px; }
  .sub{ color:#64748b; font-size:13px; margin-bottom:24px; }
  .section { margin-bottom:24px; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden; }
  .section-title { background:#f8fafc; padding:10px 16px; font-size:14px; font-weight:700; color:#334155; border-bottom:1px solid #e2e8f0; }
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:0; }
  .info-item { padding:10px 16px; border-bottom:1px solid #f1f5f9; font-size:13px; }
  .info-label { color:#94a3b8; font-size:11px; text-transform:uppercase; margin-bottom:2px; }
  .info-val   { color:#1e293b; font-weight:600; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th { background:#f8fafc; padding:8px 12px; text-align:left; color:#475569; font-size:11px; text-transform:uppercase; border-bottom:2px solid #e2e8f0; }
  td { padding:8px 12px; border-bottom:1px solid #f1f5f9; color:#334155; }
  tr:nth-child(even) td { background:#fafafa; }
  .badge { display:inline-block; padding:2px 8px; border-radius:12px; font-size:10px; font-weight:700; }
  .badge-green  { background:#dcfce7; color:#16a34a; }
  .badge-red    { background:#fee2e2; color:#dc2626; }
  .badge-yellow { background:#fef9c3; color:#ca8a04; }
  .footer { margin-top:32px; text-align:center; color:#94a3b8; font-size:11px; border-top:1px solid #e2e8f0; padding-top:16px; }
  @media print { body { padding:16px; } }
</style>
</head>
<body>
  <h1>🏥 HealthAI — Health Report</h1>
  <p class="sub">Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Total Records: ${total}</p>

  <!-- Patient Info -->
  <div class="section">
    <div class="section-title">👤 Patient Profile</div>
    <div class="info-grid">
      <div class="info-item"><div class="info-label">Full Name</div><div class="info-val">${profile?.fullName||'—'}</div></div>
      <div class="info-item"><div class="info-label">User ID</div><div class="info-val" style="font-size:11px;">${profile?._id||'—'}</div></div>
      <div class="info-item"><div class="info-label">Age</div><div class="info-val">${profile?.age||'—'}</div></div>
      <div class="info-item"><div class="info-label">Gender</div><div class="info-val">${profile?.gender||'—'}</div></div>
      <div class="info-item"><div class="info-label">Blood Group</div><div class="info-val">${profile?.bloodGroup||'—'}</div></div>
      <div class="info-item"><div class="info-label">Height</div><div class="info-val">${profile?.height ? profile.height+' cm' : '—'}</div></div>
    </div>
  </div>

  <!-- Records Table -->
  <div class="section">
    <div class="section-title">📋 Daily Records (Last 30)</div>
    <table>
      <thead>
        <tr>
          <th>Date</th><th>Diseases</th><th>Sleep</th><th>Water</th><th>Steps</th><th>Exercise</th>
          ${Object.keys(records[0]?.vitals||{}).map(k=>'<th>'+(VITAL_META[k]?.label||k)+'</th>').join('')}
        </tr>
      </thead>
      <tbody>
        ${records.slice(-30).reverse().map(r => {
          const ls = r.lifestyle || {};
          const vkeys = Object.keys(r.vitals||{});
          return `<tr>
            <td>${r.date||''}</td>
            <td>${(r.diseases||[]).join(', ')||'—'}</td>
            <td>${ls.sleep||0} hrs</td>
            <td>${ls.water||0} L</td>
            <td>${(ls.steps||0).toLocaleString()}</td>
            <td>${ls.exercise||0} min</td>
            ${vkeys.map(k => {
              const val = parseFloat(r.vitals?.[k]||0);
              const st  = vitalStatus(k, val);
              const bcl = st.label==='Normal ✓'?'badge-green':(st.label.includes('High')?'badge-red':'badge-yellow');
              return `<td>${val} <span class="badge ${bcl}">${st.label}</span></td>`;
            }).join('')}
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">HealthAI — AI Patient Monitoring System &nbsp;|&nbsp; Confidential Medical Report</div>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 600);
  }

  // ── PROFILE ─────────────────────────────────────────────
  renderProfile() {
    const d = this.dashboardData, profile = d?.profile;
    if (!profile) return;
    const imgEl = document.getElementById('profileImage');
    if (imgEl) {
      imgEl.src = profile.profileImage
        ? profile.profileImage
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName||'U')}&background=0ea5e9&color=fff&size=120`;
      imgEl.style.cssText = 'border-radius:50%;object-fit:cover;width:120px;height:120px;border:3px solid #0ea5e9;';
    }
    this.setText('dashboardProfileName',   profile.fullName  ||'—');
    this.setText('profileAge',    profile.age       ? '🎂 Age: '+profile.age : '');
    this.setText('profileGender', profile.gender    ? '⚧ '+profile.gender : '');
    this.setText('profileBlood',  profile.bloodGroup? '🩸 '+profile.bloodGroup : '');
    this.setText('profileHeight', profile.height    ? '📏 '+profile.height+' cm' : '');
    const latest   = d.records?.[d.records.length-1];
    const diseases = latest?.diseases||[];
    this.setText('profileDisease', diseases.length ? '🩺 '+diseases.join(' • ') : 'No diseases on record');
    const badge = document.getElementById('statusBadge');
    if (badge) {
      badge.textContent   = d.totalRecords>0 ? '● Active Patient' : '○ No Records Yet';
      badge.style.cssText = d.totalRecords>0 ? 'color:#10b981;font-size:13px;font-weight:600;':'color:#64748b;font-size:13px;';
    }
  }

  // ── CALENDAR ────────────────────────────────────────────
  renderCalendar() {
    const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
    this.setText('calendarTitle', `${MONTHS[this.currentMonth]} ${this.currentYear}`);
    const grid = document.getElementById('calender');
    if (!grid) return;
    grid.innerHTML = '';
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
      const h=document.createElement('div'); h.className='cal-day-hdr'; h.textContent=d; grid.appendChild(h);
    });
    const today    = new Date().toISOString().split('T')[0];
    const recorded = this.dashboardData?.calendarDates||[];
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysTotal= new Date(this.currentYear, this.currentMonth+1, 0).getDate();
    for (let i=0;i<firstDay;i++){const b=document.createElement('div');b.className='cal-cell empty';grid.appendChild(b);}
    for (let day=1;day<=daysTotal;day++){
      const ds=`${this.currentYear}-${String(this.currentMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const has=recorded.includes(ds), isTd=ds===today;
      const cell=document.createElement('div');
      cell.className='cal-cell'+(isTd?' cal-today':'')+(has?' cal-has-record':'');
      cell.dataset.date=ds; cell.title=has?'✅ Record saved':'';
      cell.innerHTML=`<span>${day}</span>${has?'<div class="rec-dot"></div>':''}`;
      grid.appendChild(cell);
    }
  }
  changeMonth(d){
    this.currentMonth+=d;
    if(this.currentMonth>11){this.currentMonth=0;this.currentYear++;}
    if(this.currentMonth<0){this.currentMonth=11;this.currentYear--;}
    this.renderCalendar();
  }

  // ── FILTER HELPER ────────────────────────────────────────
  filterByPeriod(allData, period) {
    if (!allData||!allData.length) return [];
    if (period==='all') return allData;
    const cutoff=new Date();
    cutoff.setDate(cutoff.getDate()-(period==='7d'?7:30));
    return allData.filter(d=>d.date && new Date(d.date)>=cutoff);
  }

  filterBar(activePeriod, fnName) {
    return `<div class="chart-filter-bar">
      <span class="filter-label">📅</span>
      <button class="filter-btn${activePeriod==='7d' ?' active':''}" onclick="window.dashboard.${fnName}('7d')">Weekly</button>
      <button class="filter-btn${activePeriod==='30d'?' active':''}" onclick="window.dashboard.${fnName}('30d')">Monthly</button>
      <button class="filter-btn${activePeriod==='all'?' active':''}" onclick="window.dashboard.${fnName}('all')">All Time</button>
    </div>`;
  }

  // ── VITAL CHARTS ────────────────────────────────────────
  renderVitalCharts(period) {
    this.vitalPeriod = period||'7d';
    const container = document.getElementById('vitalChartsContainer');
    if (!container) return;
    container.innerHTML = '';

    const trends = this.dashboardData?.vitalTrends||{};
    if (!Object.keys(trends).length) {
      container.innerHTML=`<div class="no-data-block"><div style="font-size:2.5rem;">📋</div><p>No vital data yet.</p><small>Record page → Add diseases → Track vitals daily.</small></div>`;
      return;
    }

    container.insertAdjacentHTML('beforeend', this.filterBar(this.vitalPeriod, 'renderVitalCharts'));
    const grid=document.createElement('div'); grid.className='vital-charts-grid'; container.appendChild(grid);

    const isWeekly = this.vitalPeriod === '7d';

    Object.entries(trends).forEach(([key, allArr]) => {
      if (!allArr||!allArr.length) return;
      const arr    = this.filterByPeriod(allArr, this.vitalPeriod);
      if (!arr.length) return;
      const meta   = VITAL_META[key]||{ label:key, unit:'', icon:'📊', color:'#00d4ff', min:0, max:100 };
      const latest = parseFloat(arr[arr.length-1]?.value);
      const prev   = parseFloat(arr.length>1 ? arr[arr.length-2]?.value : NaN);
      const status = vitalStatus(key, latest);

      let deltaHTML = '';
      if (!isNaN(latest) && !isNaN(prev)) {
        const diff=(latest-prev).toFixed(1);
        const col=parseFloat(diff)>0?'#f87171':'#34d399';
        deltaHTML=`<span style="color:${col};font-size:12px;font-weight:700;">${parseFloat(diff)>0?'▲':'▼'} ${Math.abs(diff)} ${meta.unit}</span>`;
      }

      const card=document.createElement('div'); card.className='vital-chart-card';
      card.innerHTML=`
        <div class="vc-header">
          <span class="vc-icon">${meta.icon}</span>
          <div class="vc-meta">
            <div class="vc-name">${meta.label} <span style="font-size:10px;color:#64748b;">(${isWeekly?'Weekly — Bar':'Monthly — Line'})</span></div>
            <div class="vc-latest">
              <strong style="color:#e2e8f0;font-size:15px;">${isNaN(latest)?'—':latest+' '+meta.unit}</strong>
              ${deltaHTML}
              <span class="vc-badge" style="background:${status.color}22;color:${status.color};border:1px solid ${status.color}44;">${status.label}</span>
            </div>
          </div>
        </div>
        <div class="vc-canvas-wrap">
          <canvas id="vc_${key}" class="vc-canvas"></canvas>
          <div class="chart-tooltip" id="tip_vc_${key}"></div>
        </div>
        <div class="vc-range">Normal: ${meta.min}–${meta.max} ${meta.unit} | ${arr.length} records</div>`;
      grid.appendChild(card);
      requestAnimationFrame(() => {
        if (isWeekly) this.drawBarChart(`vc_${key}`, arr, meta);
        else          this.drawLineChart(`vc_${key}`, arr, meta);
      });
    });
  }

  // ── LIFESTYLE ────────────────────────────────────────────
  renderLifestyleSection(period) {
    this.lsPeriod = period||'7d';
    const container = document.getElementById('lifestyleChartsContainer');
    if (!container) return;
    container.innerHTML = '';

    const records = this.dashboardData?.records||[];
    if (!records.length) {
      container.innerHTML=`<div class="no-data-block"><div style="font-size:2.5rem;">🌿</div><p>No lifestyle data yet.</p><small>Save daily lifestyle on the Record page.</small></div>`;
      return;
    }

    const METRICS=[
      {key:'sleep',    label:'Sleep',    unit:'hrs',   max:12,    goal:8,     color:'#a78bfa', icon:'😴'},
      {key:'water',    label:'Water',    unit:'L',     max:5,     goal:3,     color:'#38bdf8', icon:'💧'},
      {key:'steps',    label:'Steps',    unit:'steps', max:20000, goal:10000, color:'#fb923c', icon:'👟'},
      {key:'exercise', label:'Exercise', unit:'min',   max:120,   goal:30,    color:'#4ade80', icon:'🏃'},
    ];

    const latest = records[records.length-1]?.lifestyle||{};
    const prevRec= records[records.length-2]?.lifestyle||{};

    // Summary cards (latest day)
    const todayWrap=document.createElement('div'); todayWrap.className='ls-today-grid';
    METRICS.forEach(m => {
      const val=parseFloat(latest[m.key]||0), prev=parseFloat(prevRec[m.key]||0);
      const pct=Math.min((val/m.goal)*100,100);
      const disp=m.key==='steps'?val.toLocaleString()+' steps':val+' '+m.unit;
      const diff=(val-prev).toFixed(1);
      const isUp=parseFloat(diff)>0;
      const col=isUp?'#34d399':(parseFloat(diff)<0?'#f87171':'#94a3b8');
      const arr=isUp?'▲':(parseFloat(diff)<0?'▼':'—');
      todayWrap.innerHTML+=`
        <div class="ls-summary-card" style="border-top:3px solid ${m.color};">
          <div class="ls-sum-top"><span class="ls-sum-icon">${m.icon}</span>
            <span style="color:${col};font-size:12px;font-weight:700;">${arr} ${Math.abs(diff)}</span></div>
          <div class="ls-sum-label">${m.label}</div>
          <div class="ls-sum-val" style="color:${m.color};">${disp}</div>
          <div class="ls-bar-bg"><div class="ls-bar-fill" style="width:${pct}%;background:${m.color};"></div></div>
          <div class="ls-pct">${Math.round(pct)}% of daily goal</div>
        </div>`;
    });
    container.appendChild(todayWrap);

    container.insertAdjacentHTML('beforeend', this.filterBar(this.lsPeriod, 'renderLifestyleSection'));

    const isWeekly = this.lsPeriod === '7d';
    const trendGrid=document.createElement('div'); trendGrid.className='ls-trend-grid';

    METRICS.forEach(m => {
      const allArr=records.map(r=>({date:r.date, value:parseFloat(r.lifestyle?.[m.key]||0)}));
      const arr=this.filterByPeriod(allArr, this.lsPeriod);
      const latestV=arr.length?parseFloat(arr[arr.length-1]?.value||0):0;
      const prevV  =arr.length>1?parseFloat(arr[arr.length-2]?.value||0):0;
      const diff=(latestV-prevV).toFixed(1);
      const isUp=parseFloat(diff)>0;

      const card=document.createElement('div'); card.className='vital-chart-card';
      card.innerHTML=`
        <div class="vc-header">
          <span class="vc-icon">${m.icon}</span>
          <div class="vc-meta">
            <div class="vc-name">${m.label} <span style="font-size:10px;color:#64748b;">(${isWeekly?'Weekly — Bar':'Monthly — Line'})</span></div>
            <div class="vc-latest">
              <strong style="color:#e2e8f0;">${m.key==='steps'?latestV.toLocaleString():latestV+' '+m.unit}</strong>
              <span style="color:${isUp?'#34d399':'#f87171'};font-size:12px;font-weight:700;">${isUp?'▲':'▼'} ${Math.abs(diff)}</span>
              <span style="color:#64748b;font-size:11px;">vs prev day</span>
            </div>
          </div>
        </div>
        <div class="vc-canvas-wrap">
          <canvas id="ls_${m.key}" class="vc-canvas"></canvas>
          <div class="chart-tooltip" id="tip_ls_${m.key}"></div>
        </div>
        <div class="vc-range">Goal: ${m.key==='steps'?m.goal.toLocaleString():m.goal+' '+m.unit} | ${arr.length} records</div>`;
      trendGrid.appendChild(card);

      const meta={min:0, max:m.max, color:m.color, label:m.label, unit:m.unit, goal:m.goal};
      requestAnimationFrame(() => {
        if (isWeekly) this.drawBarChart(`ls_${m.key}`, arr, meta);
        else          this.drawLineChart(`ls_${m.key}`, arr, meta);
      });
    });
    container.appendChild(trendGrid);
  }

  // ════════════════════════════════════════════════════════
  // BAR CHART (Weekly) — with delta arrows per bar
  // ════════════════════════════════════════════════════════
  drawBarChart(canvasId, dataArr, meta) {
    const canvas = document.getElementById(canvasId);
    const tipEl  = document.getElementById('tip_'+canvasId);
    if (!canvas||!dataArr||!dataArr.length) return;

    canvas.width  = canvas.offsetWidth||380;
    canvas.height = 200;
    const ctx=canvas.getContext('2d');
    const W=canvas.width, H=canvas.height;
    const pad={t:24, r:16, b:48, l:46};
    const cW=W-pad.l-pad.r, cH=H-pad.t-pad.b;
    const color=meta.color||'#00d4ff';

    const vals=dataArr.map(d=>parseFloat(d.value)||0);
    const maxV=Math.max(...vals, meta.max||0)*1.15||10;
    const minV=0;
    const range=maxV-minV||1;

    const toY=v=>pad.t+cH-((v-minV)/range)*cH;
    const barW=Math.max(8, Math.min(40, (cW/dataArr.length)*0.6));
    const gap  =(cW-barW*dataArr.length)/(dataArr.length+1);
    const barX =i=>pad.l+gap*(i+1)+barW*i;

    const draw=(hoverIdx=-1)=>{
      ctx.clearRect(0,0,W,H);

      // Grid lines
      ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=1;
      [0,0.25,0.5,0.75,1].forEach(f=>{
        const y=pad.t+cH*(1-f);
        ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(pad.l+cW,y); ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='9px sans-serif'; ctx.textAlign='right';
        ctx.fillText(Math.round(minV+range*f), pad.l-5, y+3);
      });

      // Goal line
      if (meta.goal!=null && meta.goal>0) {
        const gy=toY(meta.goal);
        ctx.strokeStyle='rgba(251,191,36,0.5)'; ctx.setLineDash([5,5]); ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(pad.l,gy); ctx.lineTo(pad.l+cW,gy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle='rgba(251,191,36,0.8)'; ctx.font='9px sans-serif'; ctx.textAlign='left';
        ctx.fillText('Goal', pad.l+4, gy-3);
      }

      // Bars
      dataArr.forEach((d,i)=>{
        const v=vals[i];
        const x=barX(i), y=toY(v), barH=cH-(y-pad.t);
        const isH=(i===hoverIdx);

        // Bar gradient
        const grad=ctx.createLinearGradient(0,y,0,pad.t+cH);
        grad.addColorStop(0, isH ? '#ffffff' : color);
        grad.addColorStop(1, color+'33');
        ctx.fillStyle=grad;
        const r2=4;
        ctx.beginPath();
        ctx.moveTo(x+r2,y); ctx.lineTo(x+barW-r2,y);
        ctx.quadraticCurveTo(x+barW,y, x+barW,y+r2);
        ctx.lineTo(x+barW,pad.t+cH); ctx.lineTo(x,pad.t+cH); ctx.lineTo(x,y+r2);
        ctx.quadraticCurveTo(x,y, x+r2,y);
        ctx.closePath(); ctx.fill();

        // Hover highlight border
        if (isH) {
          ctx.strokeStyle=color; ctx.lineWidth=1.5;
          ctx.stroke();
        }

        // Value on top of bar
        ctx.fillStyle=isH?'#ffffff':'rgba(255,255,255,0.8)';
        ctx.font=`${isH?'bold ':''} 9px sans-serif`; ctx.textAlign='center';
        ctx.fillText(v, x+barW/2, y-5);

        // Delta arrow vs previous bar
        if (i>0) {
          const prev=vals[i-1];
          const delta=(v-prev).toFixed(1);
          const isUp=parseFloat(delta)>0;
          ctx.fillStyle=isUp?'#f87171':'#34d399';
          ctx.font='8px sans-serif'; ctx.textAlign='center';
          ctx.fillText((isUp?'▲':'▼')+Math.abs(delta), x+barW/2, y-16);
        }

        // X-axis date label
        ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font='8px sans-serif'; ctx.textAlign='center';
        const label=d.date ? d.date.slice(5) : '';
        ctx.fillText(label, x+barW/2, H-6);
        // Day name
        if (d.date) {
          const day=['Su','Mo','Tu','We','Th','Fr','Sa'][new Date(d.date).getDay()];
          ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='7px sans-serif';
          ctx.fillText(day, x+barW/2, H-16);
        }
      });
    };

    draw();

    // Hover
    canvas.onmousemove=(e)=>{
      const rect=canvas.getBoundingClientRect();
      const scaleX=canvas.width/rect.width;
      const mx=(e.clientX-rect.left)*scaleX;
      let closest=0, minDist=Infinity;
      dataArr.forEach((_,i)=>{
        const cx2=barX(i)+barW/2;
        const dist=Math.abs(cx2-mx);
        if(dist<minDist){minDist=dist;closest=i;}
      });
      draw(closest);
      if (tipEl) {
        const d=dataArr[closest], val=parseFloat(d.value);
        const prev=closest>0?parseFloat(dataArr[closest-1].value):null;
        const delta=prev!==null?(val-prev).toFixed(1):null;
        const isUp=delta!==null&&parseFloat(delta)>0;
        const vkey=canvasId.startsWith('vc_')?canvasId.replace('vc_',''):'';
        const st=vitalStatus(vkey,val);
        tipEl.style.display='block';
        tipEl.innerHTML=`
          <div style="font-size:10px;color:#94a3b8;margin-bottom:2px;">${d.date||''}</div>
          <div style="font-size:15px;font-weight:700;color:${color};">${val} <span style="font-size:10px;">${meta.unit}</span></div>
          ${delta!==null?`<div style="font-size:11px;color:${isUp?'#f87171':'#34d399'};">${isUp?'▲ +':'▼ '}${delta} from prev</div>`:''}
          ${st.label!=='Unknown'?`<div style="font-size:10px;color:${st.color};">${st.label}</div>`:''}`;
        const px=barX(closest)/scaleX+barW/2/scaleX;
        const py=toY(val)/(canvas.height/rect.height);
        tipEl.style.left=(px+(px>rect.width*0.7?-110:12))+'px';
        tipEl.style.top=Math.max(0,py-30)+'px';
      }
    };
    canvas.onmouseleave=()=>{ draw(-1); if(tipEl) tipEl.style.display='none'; };
  }

  // ════════════════════════════════════════════════════════
  // LINE CHART (Monthly) — smooth bezier with hover
  // ════════════════════════════════════════════════════════
  drawLineChart(canvasId, dataArr, meta) {
    const canvas=document.getElementById(canvasId);
    const tipEl =document.getElementById('tip_'+canvasId);
    if (!canvas||!dataArr||!dataArr.length) return;

    canvas.width =canvas.offsetWidth||380;
    canvas.height=200;
    const ctx=canvas.getContext('2d');
    const W=canvas.width, H=canvas.height;
    const pad={t:18, r:18, b:40, l:46};
    const cW=W-pad.l-pad.r, cH=H-pad.t-pad.b;
    const color=meta.color||'#00d4ff';

    const vals=dataArr.map(d=>parseFloat(d.value)||0);
    const minV=Math.min(...vals, meta.min??Infinity)*0.9;
    const maxV=Math.max(...vals, meta.max??-Infinity)*1.1||10;
    const range=maxV-minV||1;

    const toX=i=>pad.l+(i/Math.max(dataArr.length-1,1))*cW;
    const toY=v=>pad.t+cH-((v-minV)/range)*cH;

    const draw=(hoverIdx=-1)=>{
      ctx.clearRect(0,0,W,H);

      // Grid
      ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=1;
      for(let gi=0;gi<=4;gi++){
        const y=pad.t+(cH/4)*gi;
        ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(pad.l+cW,y);ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,0.35)'; ctx.font='9px sans-serif'; ctx.textAlign='right';
        ctx.fillText(Math.round(minV+(range/4)*(4-gi)), pad.l-5, y+4);
      }

      // Normal band
      if (meta.min!=null&&meta.max!=null&&meta.min!==meta.max){
        const bTop=Math.max(toY(meta.max),pad.t), bBot=Math.min(toY(meta.min),pad.t+cH);
        ctx.fillStyle='rgba(16,185,129,0.07)'; ctx.fillRect(pad.l,bTop,cW,bBot-bTop);
        ctx.strokeStyle='rgba(16,185,129,0.3)'; ctx.setLineDash([3,4]); ctx.lineWidth=1;
        [meta.min,meta.max].forEach(v=>{
          const y=toY(v);
          if(y>pad.t&&y<pad.t+cH){ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(pad.l+cW,y);ctx.stroke();}
        });
        ctx.setLineDash([]);
      }

      // Goal line
      if (meta.goal!=null){
        const gy=toY(meta.goal);
        ctx.strokeStyle='rgba(251,191,36,0.45)'; ctx.setLineDash([5,5]); ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(pad.l,gy);ctx.lineTo(pad.l+cW,gy);ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle='rgba(251,191,36,0.75)'; ctx.font='9px sans-serif'; ctx.textAlign='left';
        ctx.fillText('Goal',pad.l+4,gy-3);
      }

      // X labels (date + day name)
      ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.textAlign='center'; ctx.font='8px sans-serif';
      const xStep=Math.max(1,Math.floor(dataArr.length/8));
      dataArr.forEach((d,i)=>{
        if(i%xStep===0||i===dataArr.length-1){
          const lbl=d.date?d.date.slice(5):'';
          ctx.fillText(lbl, toX(i), H-6);
          if(d.date){
            const dayN=['Su','Mo','Tu','We','Th','Fr','Sa'][new Date(d.date).getDay()];
            ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='7px sans-serif';
            ctx.fillText(dayN, toX(i), H-17);
            ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font='8px sans-serif';
          }
        }
      });

      // Bezier path builder
      const buildPath=()=>{
        ctx.beginPath(); ctx.moveTo(toX(0),toY(vals[0]));
        for(let ci=0;ci<vals.length-1;ci++){
          const cpX=(toX(ci)+toX(ci+1))/2;
          ctx.bezierCurveTo(cpX,toY(vals[ci]),cpX,toY(vals[ci+1]),toX(ci+1),toY(vals[ci+1]));
        }
      };

      // Gradient fill
      const grad=ctx.createLinearGradient(0,pad.t,0,pad.t+cH);
      grad.addColorStop(0,color+'55'); grad.addColorStop(0.7,color+'15'); grad.addColorStop(1,color+'00');
      buildPath();
      ctx.lineTo(toX(vals.length-1),pad.t+cH); ctx.lineTo(toX(0),pad.t+cH); ctx.closePath();
      ctx.fillStyle=grad; ctx.fill();

      // Line
      buildPath();
      ctx.strokeStyle=color; ctx.lineWidth=2.5; ctx.lineJoin='round'; ctx.lineCap='round'; ctx.stroke();

      // Hover crosshair
      if (hoverIdx>=0){
        ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1; ctx.setLineDash([3,3]);
        ctx.beginPath();ctx.moveTo(toX(hoverIdx),pad.t);ctx.lineTo(toX(hoverIdx),pad.t+cH);ctx.stroke();
        ctx.setLineDash([]);
      }

      // Dots
      vals.forEach((v,i)=>{
        const isH=i===hoverIdx;
        if (dataArr.length<=20||isH){
          ctx.beginPath(); ctx.arc(toX(i),toY(v),isH?6:3,0,Math.PI*2);
          ctx.fillStyle=isH?'#fff':color; ctx.fill();
          ctx.strokeStyle=isH?color:'rgba(0,0,0,0.4)'; ctx.lineWidth=isH?2:1; ctx.stroke();
        }
      });

      // Delta label on hover
      if (hoverIdx>0){
        const delta=(vals[hoverIdx]-vals[hoverIdx-1]).toFixed(1);
        const isUp=parseFloat(delta)>0;
        ctx.fillStyle=isUp?'#f87171':'#34d399'; ctx.font='bold 10px sans-serif'; ctx.textAlign='center';
        ctx.fillText((isUp?'▲ +':'▼ ')+delta+' '+meta.unit, toX(hoverIdx), toY(vals[hoverIdx])-14);
      }
    };

    draw();

    // Hover
    canvas.onmousemove=(e)=>{
      const rect=canvas.getBoundingClientRect();
      const scaleX=canvas.width/rect.width;
      const mx=(e.clientX-rect.left)*scaleX;
      let closest=0,minDist=Infinity;
      vals.forEach((_,i)=>{ const dist=Math.abs(toX(i)-mx); if(dist<minDist){minDist=dist;closest=i;} });
      draw(closest);
      if(tipEl){
        const d=dataArr[closest],val=parseFloat(d.value);
        const prev=closest>0?parseFloat(dataArr[closest-1].value):null;
        const delta=prev!==null?(val-prev).toFixed(1):null;
        const isUp=delta!==null&&parseFloat(delta)>0;
        const vkey=canvasId.startsWith('vc_')?canvasId.replace('vc_',''):'';
        const st=vitalStatus(vkey,val);
        tipEl.style.display='block';
        tipEl.innerHTML=`
          <div style="font-size:10px;color:#94a3b8;margin-bottom:2px;">${d.date||''} (${d.date?['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(d.date).getDay()]:''})</div>
          <div style="font-size:15px;font-weight:700;color:${color};">${val} <span style="font-size:10px;">${meta.unit}</span></div>
          ${delta!==null?`<div style="font-size:11px;color:${isUp?'#f87171':'#34d399'};">${isUp?'▲ +':'▼ '}${delta} from prev</div>`:''}
          ${st.label!=='Unknown'?`<div style="font-size:10px;color:${st.color};">${st.label}</div>`:''}`;
        const px=toX(closest)/scaleX;
        const py=toY(val)/(canvas.height/rect.height);
        tipEl.style.left=(px+(px>rect.width*0.7?-115:12))+'px';
        tipEl.style.top=Math.max(0,py-30)+'px';
      }
    };
    canvas.onmouseleave=()=>{ draw(-1); if(tipEl) tipEl.style.display='none'; };
  }

  // ── SUMMARY ─────────────────────────────────────────────
  renderSummary() {
    const d=this.dashboardData, total=d?.totalRecords||0;
    let alerts=0;
    Object.entries(d?.vitalTrends||{}).forEach(([k,arr])=>{
      if(!arr||!arr.length) return;
      const s=vitalStatus(k,arr[arr.length-1]?.value);
      if(s.label!=='Normal ✓'&&s.label!=='No Data') alerts++;
    });
    const score=total===0?0:Math.max(10,Math.min(99,55+total*3-alerts*6));
    this.animateNumber('healthScore', Math.round(score));
    this.animateNumber('totalRecords',total);
    this.animateNumber('alert',       alerts);
    this.animateNumber('usersCount',  this.monitoredUsers.length+1);
  }

  animateNumber(id,target){
    const el=document.getElementById(id); if(!el) return;
    let curr=0; const step=Math.max(1,Math.ceil(target/40));
    const t=setInterval(()=>{ curr=Math.min(curr+step,target); el.textContent=curr; if(curr>=target)clearInterval(t);},30);
  }

  // ── USERS TABLE ─────────────────────────────────────────
  renderUsersTable() {
    const tbody=document.getElementById('usersTableBody'); if(!tbody) return;
    if(!this.monitoredUsers.length){
      tbody.innerHTML=`<tr><td colspan="5" style="text-align:center;color:#475569;padding:1.5rem 0;">Search a User ID above to add users.</td></tr>`;
      return;
    }
    tbody.innerHTML=this.monitoredUsers.map((u,i)=>`
      <tr>
        <td><img src="${u.profileImage||`https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName||'U')}&background=0ea5e9&color=fff&size=40`}"
             style="width:38px;height:38px;border-radius:50%;object-fit:cover;border:2px solid #0ea5e9;" alt=""></td>
        <td style="color:#e2e8f0;">${u.fullName||'—'}</td>
        <td>${u.age||'—'}</td>
        <td>${u.gender||'—'}</td>
        <td>
          <button class="btn btn-primary" style="padding:5px 12px;font-size:12px;" onclick="window.dashboard.viewUser('${u._id}')">View</button>
          <button style="padding:5px 10px;font-size:12px;margin-left:4px;background:rgba(239,68,68,0.15);color:#f87171;border:none;border-radius:6px;cursor:pointer;" onclick="window.dashboard.removeUser(${i})">✕</button>
        </td>
      </tr>`).join('');
  }

  async viewUser(userId){
    await this.loadDashboard(userId);
    document.getElementById('dashboard')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  removeUser(idx){ this.monitoredUsers.splice(idx,1); this.renderUsersTable(); this.renderSummary(); }

  // ── SEARCH ──────────────────────────────────────────────
  async searchUser(query){
    const resultEl=document.getElementById('userResult'); if(!resultEl) return;
    query=query.replace(/\s+/g,'').trim();
    if(!query||query.length<3){ resultEl.innerHTML=''; return; }
    resultEl.innerHTML=`<p style="color:#64748b;padding:.5rem;font-size:13px;">🔍 Searching…</p>`;
    const token=localStorage.getItem('token');
    try{
      const res=await fetch(`/api/user/search?userId=${encodeURIComponent(query)}`,{headers:{Authorization:'Bearer '+token}});
      const data=await res.json();
      if(!res.ok){
        resultEl.innerHTML=`<div style="padding:.75rem;background:rgba(239,68,68,0.08);border-radius:10px;border:1px solid rgba(239,68,68,0.2);"><p style="color:#f87171;font-size:13px;margin:0;">❌ ${data.message||'User not found'}</p><small style="color:#64748b;">Try: User ID (24 chars), name, or email</small></div>`;
        return;
      }
      const user=data;
      const already=this.monitoredUsers.some(u=>u._id===user._id);
      const isMe=user._id===this.loggedInUserId;
      resultEl.innerHTML=`
        <div class="search-result-card">
          <img src="${user.profileImage||`https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName||'U')}&background=0ea5e9&color=fff&size=50`}"
               style="width:50px;height:50px;border-radius:50%;object-fit:cover;border:2px solid #0ea5e9;" alt="">
          <div style="flex:1;min-width:0;">
            <strong style="color:#e2e8f0;font-size:14px;">${user.fullName||'—'}</strong><br>
            <small style="color:#64748b;word-break:break-all;">ID: ${user._id}</small><br>
            <small style="color:#94a3b8;">${user.age?'🎂 Age '+user.age+'  ':''} ${user.gender||''} ${user.bloodGroup||''}</small>
          </div>
          ${already||isMe
            ?`<span style="color:#64748b;font-size:12px;padding:6px 10px;background:rgba(255,255,255,0.05);border-radius:8px;">${isMe?'👤 You':'✅ Added'}</span>`
            :`<button class="btn btn-primary" style="padding:8px 16px;white-space:nowrap;font-size:13px;" onclick='window.dashboard.addUserFromSearch(${JSON.stringify(user).replace(/'/g,"&#39;")})'>+ Add</button>`}
        </div>`;
    }catch(e){ console.error('Search error:',e); resultEl.innerHTML=`<p style="color:#ef4444;padding:.6rem;font-size:13px;">⚠️ Search failed.</p>`; }
  }

  addUserFromSearch(user){
    if(this.monitoredUsers.some(u=>u._id===user._id)) return;
    this.monitoredUsers.push(user); this.renderUsersTable(); this.renderSummary();
    const inp=document.getElementById('searchInput'), res=document.getElementById('userResult');
    if(inp) inp.value=''; if(res) res.innerHTML='';
    this.showToast(user.fullName+' added ✓');
  }

  setText(id,text){ const e=document.getElementById(id); if(e) e.textContent=text; }
  showToast(msg,type){
    type=type||'success';
    const c=document.getElementById('toastContainer'); if(!c) return;
    const t=document.createElement('div'); t.className='toast '+type; t.textContent=msg;
    c.appendChild(t); setTimeout(()=>t.remove(),3500);
  }
}

// ── BOOT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  window.dashboard=new HealthDashboard();
  document.querySelectorAll('.nav-link').forEach(link=>{
    link.addEventListener('click',()=>{
      if((link.getAttribute('data-page')||'')==='dashboard'){
        setTimeout(()=>{
          if(window.dashboard){
            window.dashboard.renderVitalCharts(window.dashboard.vitalPeriod);
            window.dashboard.renderLifestyleSection(window.dashboard.lsPeriod);
          }
        },200);
      }
    });
  });
});

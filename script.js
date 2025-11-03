// Kelly manual/paste calculator (supports multi-outcome per match)
// Author: assistant (educational)
// Usage: paste lines like "Team A - Team B,2.50,3.40,3.10" (home,draw,away odds)
// or upload CSV with columns: match,odds1,odds2,odds3 (header optional)

function calcKellySingle(odds, prob) {
  if (!odds || !isFinite(odds) || odds <= 1) return null;
  const b = odds - 1;
  const p = prob;
  const q = 1 - p;
  const f = (b * p - q) / b;
  return f; // fraction (e.g. 0.12 => 12%)
}

function parseLine(line) {
  // remove extra spaces and normalize commas/tabs
  const cleaned = line.trim().replace(/\t+/g, ',').replace(/;+/g, ',');
  if (!cleaned) return null;
  // split by comma; sometimes there are spaces after comma
  const parts = cleaned.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length < 2) return null; // at least match + one odd required
  const match = parts[0];
  const odds = parts.slice(1).map(s => parseFloat(s.replace(',', '.'))).filter(v => !isNaN(v));
  if (odds.length === 0) return null;
  return { match, odds };
}

function updateSummary(msg) {
  document.getElementById('summary').innerText = msg;
}

function addMatchToTable(matchObj) {
  // matchObj: {match, odds: [o1,o2,...], sport}
  const tbody = document.querySelector('#resultTable tbody');
  const idx = tbody.children.length + 1;
  // compute implied probs and normalized probs per outcome
  const implied = matchObj.odds.map(o => o > 0 ? 1 / o : 0);
  const overround = implied.reduce((s, x) => s + x, 0);
  const norm = implied.map(x => overround > 0 ? x / overround : 0);

  matchObj.odds.forEach((o, i) => {
    const tr = document.createElement('tr');
    const probImp = implied[i];
    const probNorm = norm[i];
    const f = calcKellySingle(o, probNorm);
    const kellyStr = (f !== null && f > 0) ? ( (f*100).toFixed(2) + '%' ) : '베팅X';
    const halfStr = (f !== null && f > 0) ? ( ((f/2)*100).toFixed(2) + '%' ) : '-';
    tr.innerHTML = `
      <td class="idx"></td>
      <td class="match">${matchObj.match}</td>
      <td class="result">R${i+1}</td>
      <td class="odds">${o}</td>
      <td class="imp">${(probImp*100).toFixed(2)}%</td>
      <td class="norm">${(probNorm*100).toFixed(2)}%</td>
      <td class="kelly">${kellyStr}</td>
      <td class="half">${halfStr}</td>
    `;
    tbody.appendChild(tr);
  });

  // update indices
  Array.from(tbody.querySelectorAll('tr')).forEach((tr, i) => {
    tr.querySelector('.idx').textContent = i + 1;
  });

  updateSummary('업데이트 완료: 총 ' + tbody.children.length + ' 항목(결과별)');
}

document.getElementById('parseBtn').addEventListener('click', () => {
  const text = document.getElementById('pasteBox').value;
  if (!text.trim()) { alert('붙여넣기 칸에 텍스트를 넣어주세요.'); return; }
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let count = 0;
  lines.forEach(line => {
    const parsed = parseLine(line);
    if (!parsed) return;
    addMatchToTable(parsed);
    count++;
  });
  updateSummary('파싱 완료: ' + count + ' 경기(결과별 항목으로 추가됨)');
  document.getElementById('pasteBox').value = '';
});

document.getElementById('addRowBtn').addEventListener('click', () => {
  const sample = '팀A vs 팀B,2.50,3.40,3.10';
  const parsed = parseLine(sample);
  addMatchToTable(parsed);
});

document.getElementById('clearBtn').addEventListener('click', () => {
  if (!confirm('전체 항목을 삭제하시겠습니까?')) return;
  document.querySelector('#resultTable tbody').innerHTML = '';
  updateSummary('');
});

// file CSV upload
document.getElementById('fileInput').addEventListener('change', function(e) {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    const text = ev.target.result;
    // try to split lines and parse each
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    // If first line looks like header with '경기' or 'match', skip or use
    let start = 0;
    const header = (lines[0] || '').toLowerCase();
    if (header.indexOf('경기') !== -1 || header.indexOf('match') !== -1 || header.indexOf('home') !== -1) {
      start = 1;
    }
    let cnt = 0;
    for (let i = start; i < lines.length; i++) {
      const parsed = parseLine(lines[i]);
      if (!parsed) continue;
      addMatchToTable(parsed);
      cnt++;
    }
    updateSummary('CSV 업로드 완료: ' + cnt + ' 경기(결과별 항목으로 추가됨)');
  };
  reader.readAsText(f, 'utf-8');
});

// simple tabs (visual only)
Array.from(document.querySelectorAll('.tab')).forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // sport switching is UI-only in this version; user pastes/selects relevant sport data
  });
});

// Paste guide
document.getElementById('pasteGuide').addEventListener('click', () => {
  alert('붙여넣기 예시:\n팀A vs 팀B,2.50,3.40,3.10\n또는 엑셀에서 복사한 표를 붙여넣으세요.\n포맷: match,odds1,odds2,odds3 ...');
});
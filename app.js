
(() => {
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const state = {
    lists: {},            // {listId: {name, items:[], createdAt}}
    active: null,
    showWeights: false
  };

  const LS_KEY = 'packing-buddy-v1';

  function uid() { return Math.random().toString(36).slice(2,9); }

  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) Object.assign(state, JSON.parse(raw));
      if (!state.active) createList('La mia valigia');
      render();
    } catch(e) {
      console.error(e);
      createList('La mia valigia');
    }
  }

  function save() {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }

  function createList(name) {
    const id = uid();
    state.lists[id] = { name, items: [], createdAt: Date.now() };
    state.active = id;
    save(); render();
  }

  function deleteList(id) {
    if (!confirm('Eliminare questa lista?')) return;
    delete state.lists[id];
    const ids = Object.keys(state.lists);
    state.active = ids[0] || null;
    save(); render();
  }

  function setActive(id) {
    state.active = id; save(); render();
  }

  function parseItemInput(text, category) {
    // es. "3x magliette" -> {qty:3, title:"magliette"}
    let qty = 1; let title = text.trim();
    const m = title.match(/^(\d+)x?\s+(.+)$/i);
    if (m) { qty = parseInt(m[1]); title = m[2]; }
    return { title, qty, category: category || '', packed: false, weight: 0 };
  }

  function addItem(text, category) {
    const t = text.trim();
    if (!t) return;
    const item = parseItemInput(t, category);
    const list = state.lists[state.active];
    list.items.push(item);
    save(); render();
  }

  function incItem(idx, delta) {
    const it = state.lists[state.active].items[idx];
    it.qty = Math.max(0, (it.qty||1) + delta);
    save(); render();
  }

  function togglePacked(idx) {
    const it = state.lists[state.active].items[idx];
    it.packed = !it.packed;
    save(); render();
  }

  function removeItem(idx) {
    const list = state.lists[state.active];
    list.items.splice(idx,1);
    save(); render();
  }

  function moveItem(idx, dir) {
    const items = state.lists[state.active].items;
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    [items[idx], items[j]] = [items[j], items[idx]];
    save(); render();
  }

  function setWeight(idx, w) {
    const it = state.lists[state.active].items[idx];
    it.weight = Math.max(0, parseFloat(w)||0);
    save(); render();
  }

  function summarize() {
    const items = state.lists[state.active]?.items || [];
    const total = items.reduce((s,it)=>s+it.qty,0);
    const packed = items.reduce((s,it)=>s+(it.packed?it.qty:0),0);
    const kg = items.reduce((s,it)=>s+(it.weight||0)*(it.qty||1),0);
    $('#summary').innerHTML = `
      <span>Totale: <b>${total}</b></span>
      <span>Piegati: <b>${packed}</b></span>
      ${state.showWeights ? `<span>Peso stimato: <b>${kg.toFixed(2)} kg</b></span>` : ''}
    `;
  }

  function groupByCategory(items) {
    const groups = {};
    for (const it of items) {
      const cat = it.category || 'Altro';
      (groups[cat] ||= []).push(it);
    }
    return groups;
  }

  function renderListsBar() {
    const bar = $('#listsBar');
    bar.innerHTML = '';
    const ids = Object.keys(state.lists).sort((a,b)=>state.lists[a].createdAt - state.lists[b].createdAt);
    for (const id of ids) {
      const pill = document.createElement('button');
      pill.className = 'list-pill' + (id===state.active?' active':'');
      pill.textContent = state.lists[id].name;
      pill.onclick = () => setActive(id);
      pill.oncontextmenu = (e) => { e.preventDefault(); if (confirm('Rinominare lista?')) {
        const nn = prompt('Nuovo nome', state.lists[id].name) || state.lists[id].name;
        state.lists[id].name = nn; save(); render();
      }};
      bar.appendChild(pill);
    }
    if (state.active) {
      const del = document.createElement('button');
      del.className = 'btn danger'; del.textContent = 'Elimina lista';
      del.onclick = () => deleteList(state.active);
      bar.appendChild(del);
    }
  }

  function renderItems() {
    const root = $('#items');
    root.innerHTML = '';
    const list = state.lists[state.active];
    if (!list) return;
    const groups = groupByCategory(list.items);

    Object.entries(groups).forEach(([cat, items]) => {
      const card = document.createElement('div');
      card.className = 'section-card';
      const header = document.createElement('div');
      header.className = 'section-header';
      header.innerHTML = `<div class="section-title">${cat}</div>`;
      card.appendChild(header);

      for (let i=0;i<items.length;i++) {
        const idx = list.items.indexOf(items[i]); // index in master array
        const it = items[i];
        const row = document.createElement('div');
        row.className = 'item';
        row.innerHTML = `
          <input type="checkbox" ${it.packed?'checked':''} />
          <div class="item-title">
            ${it.title}
            ${state.showWeights ? `<div style="font-size:12px;color:#94a3b8">Peso unit.: <input type="number" step="0.1" value="${it.weight||0}" style="width:80px;background:#0b1220;border:1px solid #1f2937;border-radius:8px;color:#e5e7eb;padding:4px" /> kg</div>` : ''}
          </div>
          <div class="qty">
            <button class="btn" data-act="dec">-</button>
            <span>${it.qty||1}x</span>
            <button class="btn" data-act="inc">+</button>
          </div>
          <div class="weight">${state.showWeights ? ((it.weight||0)*(it.qty||1)).toFixed(2)+' kg' : ''}</div>
          <div>
            <button class="kebab" data-act="up">▲</button>
            <button class="kebab" data-act="down">▼</button>
            <button class="kebab" data-act="del">✕</button>
          </div>
        `;
        const [chk, , , , , btns] = row.children;
        chk.onchange = () => togglePacked(idx);
        row.querySelector('button[data-act="dec"]').onclick = () => incItem(idx,-1);
        row.querySelector('button[data-act="inc"]').onclick = () => incItem(idx,1);
        row.querySelector('button[data-act="up"]').onclick = () => moveItem(idx,-1);
        row.querySelector('button[data-act="down"]').onclick = () => moveItem(idx,1);
        row.querySelector('button[data-act="del"]').onclick = () => removeItem(idx);
        if (state.showWeights) {
          row.querySelector('input[type="number"]').onchange = (e) => setWeight(idx, e.target.value);
        }
        card.appendChild(row);
      }

      root.appendChild(card);
    });

    summarize();
  }

  function render() {
    renderListsBar();
    renderItems();
    $('#toggleWeights').checked = state.showWeights;
  }

  function addTemplate(which) {
    const templates = {
      weekend: [
        ['Abbigliamento','2x T-shirt'], ['Abbigliamento','1x pantaloni'], ['Abbigliamento','2x intimo'], ['Abbigliamento','2x calzini'],
        ['Toeletta','Spazzolino'], ['Toeletta','Dentifricio'], ['Elettronica','Caricabatterie']
      ],
      mare: [
        ['Abbigliamento','Costume'], ['Abbigliamento','Telo mare'], ['Toeletta','Solare SPF'], ['Altro','Occhiali da sole'], ['Altro','Cappellino']
      ],
      montagna: [
        ['Abbigliamento','Pile'], ['Abbigliamento','Giacca'], ['Abbigliamento','Scarponcini'], ['Altro','Borraccia']
      ],
      business: [
        ['Abbigliamento','Camicia'], ['Abbigliamento','Giacca'], ['Elettronica','Laptop'], ['Documenti','Biglietti/ID']
      ],
    };
    (templates[which]||[]).forEach(([cat,text]) => addItem(text, cat));
  }

  // share/export
  async function doShare() {
    const list = state.lists[state.active];
    if (!list) return;
    const data = { name: list.name, items: list.items };
    const text = `Lista "${list.name}"\n` + list.items.map(it => `- ${it.qty||1}x ${it.title} ${it.packed?'✓':''}`).join('\n');
    const file = new File([JSON.stringify(data,null,2)], `${list.name.replace(/\s+/g,'_')}.json`, {type:'application/json'});
    if (navigator.share && navigator.canShare && navigator.canShare({files:[file]})) {
      try { await navigator.share({ title: list.name, text, files:[file] }); } catch(e) {}
    } else {
      // fallback: download JSON
      const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)], {type:'application/json'}));
      const a = document.createElement('a');
      a.href = url; a.download = file.name; a.click();
      URL.revokeObjectURL(url);
      alert('Esportata come JSON (file scaricato).');
    }
  }

  // import from file
  async function importJson(file) {
    const txt = await file.text();
    const data = JSON.parse(txt);
    if (!data || !Array.isArray(data.items)) throw new Error('Formato non valido');
    const id = uid();
    state.lists[id] = { name: data.name || 'Import', items: data.items, createdAt: Date.now() };
    state.active = id;
    save(); render();
  }

  // UI bindings
  $('#btnAdd').onclick = () => addItem($('#itemInput').value, $('#categoryInput').value);
  $('#itemInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') $('#btnAdd').click(); });
  $('#btnTemplates').onclick = () => $('#dlgTemplates').showModal();
  $('#closeTemplates').onclick = () => $('#dlgTemplates').close();
  $$('#dlgTemplates button[data-tpl]').forEach(btn => btn.onclick = () => { addTemplate(btn.dataset.tpl); $('#dlgTemplates').close(); });
  $('#btnShare').onclick = () => doShare();
  $('#btnExport').onclick = () => {
    const inp = document.createElement('input'); inp.type='file'; inp.accept='application/json';
    inp.onchange = e => importJson(e.target.files[0]);
    inp.click();
  };

  $('#btnNewList').onclick = () => {
    $('#newListName').value = '';
    $('#dlgNewList').showModal();
  };
  $('#createList').onclick = () => {
    const name = $('#newListName').value.trim() || 'Nuova lista';
    createList(name); $('#dlgNewList').close();
  };
  $('#cancelList').onclick = () => $('#dlgNewList').close();

  $('#toggleWeights').onchange = e => { state.showWeights = e.target.checked; save(); render(); };

  load();
})();

'use strict';
// Dudoo Parties — peças de interface: toast, modal, formulários, confirmação, cópia, download e impressão.
const acoes = {};   // data-acao="nome"  → clique
const muda = {};    // data-muda="nome"  → change
let _tToast = null;

function toast(msg, erro = false) {
  const t = $('#toast'); t.textContent = msg; t.className = erro ? 'erro' : ''; t.hidden = false;
  clearTimeout(_tToast); _tToast = setTimeout(() => { t.hidden = true; }, erro ? 5000 : 2500);
}
function abrirModal(html, { largo = false } = {}) {
  const m = $('#modal'); m.hidden = false;
  m.innerHTML = `<div class="modal-fundo" data-acao="fechar-fundo"><div class="modal${largo ? ' largo' : ''}" role="dialog" aria-modal="true">${html}</div></div>`;
  document.body.classList.add('com-modal');
}
function fecharModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; document.body.classList.remove('com-modal'); }
acoes['fechar'] = () => fecharModal();
acoes['fechar-fundo'] = (el, e) => { if (e.target === el) fecharModal(); };
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) fecharModal(); });

function confirmar(msg, aoConfirmar, txt = 'Excluir') {
  abrirModal(`<h3>${esc(msg)}</h3><div class="rodape-modal"><span></span><span><button class="btn" data-acao="fechar">Cancelar</button> <button class="btn perigo" id="btnConfirma">${esc(txt)}</button></span></div>`);
  $('#btnConfirma').onclick = () => { fecharModal(); aoConfirmar(); };
}
function aviso(titulo, html) {
  abrirModal(`<h3>${esc(titulo)}</h3><div class="texto-modal">${html}</div><div class="rodape-modal"><span></span><button class="btn primario" data-acao="fechar">Ok</button></div>`);
}

// ---------- Formulários ----------
function campoHtml(c, v) {
  const val = v !== undefined ? v : c.valor, id = `f_${c.id}`, ph = esc(c.ph || '');
  const ehNum = c.tipo === 'numero' || c.tipo === 'dinheiro';
  let ctl = '';
  switch (c.tipo) {
    case 'area': ctl = `<textarea id="${id}" rows="${c.linhas || 3}" placeholder="${ph}">${esc(val == null ? '' : val)}</textarea>`; break;
    case 'select': ctl = `<select id="${id}">${(c.opcoes || []).map((o) => { const [ov, ot] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(ov)}"${String(ov) === String(val == null ? '' : val) ? ' selected' : ''}>${esc(ot)}</option>`; }).join('')}</select>`; break;
    case 'check': return `<label class="campo-check ${c.larg || ''}"><input type="checkbox" id="${id}"${val ? ' checked' : ''}><span>${esc(c.rotulo)}</span></label>`;
    case 'chips': ctl = `<div class="chips-sel" id="${id}">${(c.opcoes || []).map((o) => `<label class="chip-sel"><input type="checkbox" value="${esc(o)}"${(val || []).includes(o) ? ' checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div>`; break;
    case 'cor': ctl = `<input type="color" id="${id}" value="${esc(val || '#7C3AED')}">`; break;
    default: {
      const tipo = c.tipo === 'data' ? 'date' : c.tipo === 'hora' ? 'time' : c.tipo === 'tel' ? 'tel' : c.tipo === 'email' ? 'email' : c.tipo === 'senha' ? 'password' : 'text';
      const modo = ehNum ? ' inputmode="decimal"' : '';
      ctl = `<input type="${tipo}" id="${id}"${modo} placeholder="${ph}" value="${esc(ehNum ? fmtInput(val) : val == null ? '' : val)}"${c.sug ? ` list="dl_${c.id}"` : ''} autocomplete="${esc(c.auto || 'off')}">`
        + (c.sug ? `<datalist id="dl_${c.id}">${c.sug.map((s) => `<option value="${esc(s)}">`).join('')}</datalist>` : '');
    }
  }
  return `<label class="campo ${c.larg || ''}"><span>${esc(c.rotulo)}${c.req ? ' *' : ''}</span>${ctl}${c.dica ? `<small>${esc(c.dica)}</small>` : ''}</label>`;
}
function lerCampo(c) {
  const el = $('#f_' + c.id); if (!el) return '';
  if (c.tipo === 'check') return el.checked;
  if (c.tipo === 'chips') return $$('input:checked', el).map((i) => i.value);
  if (c.tipo === 'numero' || c.tipo === 'dinheiro') return el.value.trim() === '' ? '' : num(el.value);
  return el.value.trim();
}
let _formAtual = null;
// formulario({titulo, intro, campos:[{id,rotulo,tipo,opcoes,req,larg,dica,ph,sug,linhas}], valores, salvar(vals), excluir(), salvarTexto, largo})
function formulario(cfg) {
  _formAtual = cfg;
  const vals = cfg.valores || {};
  abrirModal(`<form id="formModal" novalidate><h3>${esc(cfg.titulo)}</h3>${cfg.intro ? `<p class="mudo">${cfg.intro}</p>` : ''}
    <div class="grade-form">${cfg.campos.map((c) => campoHtml(c, vals[c.id])).join('')}</div><p class="erro-form" id="formErro"></p>
    <div class="rodape-modal">${cfg.excluir ? '<button type="button" class="btn perigo" data-acao="form-excluir">Excluir</button>' : '<span></span>'}
    <span><button type="button" class="btn" data-acao="fechar">Cancelar</button> <button class="btn primario">${esc(cfg.salvarTexto || 'Salvar')}</button></span></div></form>`, { largo: cfg.largo });
  $('#formModal').addEventListener('submit', (e) => {
    e.preventDefault();
    const out = {};
    for (const c of cfg.campos) {
      out[c.id] = lerCampo(c);
      const vazio = out[c.id] === '' || out[c.id] == null || (Array.isArray(out[c.id]) && !out[c.id].length);
      if (c.req && vazio) { $('#formErro').textContent = `Preencha: ${c.rotulo}.`; const el = $('#f_' + c.id); if (el) el.focus(); return; }
    }
    if (cfg.salvar(out) !== false) fecharModal();
  });
  if (!matchMedia('(pointer: coarse)').matches) setTimeout(() => { const f = $('#formModal input:not([type=checkbox]):not([type=color]), #formModal textarea'); if (f) f.focus(); }, 30);
}
acoes['form-excluir'] = () => { const c = _formAtual; confirmar('Excluir este item?', () => { c.excluir(); }); };

// ---------- Utilidades de tela ----------
const alterou = () => { gravar(); render(); };
function copiar(texto, msg = 'Copiado!') {
  const ok = () => toast(msg);
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(texto).then(ok, () => copiarAntigo(texto, ok));
  else copiarAntigo(texto, ok);
}
function copiarAntigo(texto, ok) {
  const t = document.createElement('textarea'); t.value = texto; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select();
  try { document.execCommand('copy'); ok(); } catch (e) { toast('Não consegui copiar. Selecione o texto e copie à mão.', true); }
  t.remove();
}
function baixar(nome, texto, mime = 'text/plain;charset=utf-8') {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([texto], { type: mime })); a.download = nome;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
// Lê uma imagem, reduz e devolve dataURL (cabe no armazenamento do aparelho).
function lerImagem(file, max = 900, png = false) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error('Não consegui ler o arquivo.'));
    r.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagem inválida.'));
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(png ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.75));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}
const vazioHtml = (msg, botao = '') => `<div class="vazio"><p>${msg}</p>${botao}</div>`;
const kpi = (rot, val, cls = '') => `<div class="kpi ${cls}"><b>${val}</b><span>${rot}</span></div>`;
const barra = (pct, cls = '') => `<div class="barra ${cls}"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></div>`;
const selo = (txt, cls = '') => `<span class="selo ${cls}">${esc(txt)}</span>`;

// Filtro de busca: esconde linhas sem recarregar a tela (não perde o foco do campo).
document.addEventListener('input', (e) => {
  const el = e.target.closest('[data-filtro]'); if (!el) return;
  const q = normaliza(el.value);
  $$(el.dataset.filtro).forEach((tr) => { tr.hidden = q && !(tr.dataset.texto || '').includes(q); });
});

// ---------- Impressão (o navegador gera o PDF: "Salvar como PDF") ----------
function cabecalhoImpressao(titulo, ev) {
  const c = S.config;
  return `<header class="imp-topo">${c.logo ? `<img src="${c.logo}" alt="">` : ''}<div><b>${esc(c.negocio || 'Dudoo Parties')}</b>${c.responsavel ? `<span>${esc(c.responsavel)}${c.telefone ? ' · ' + esc(c.telefone) : ''}</span>` : ''}</div></header>
  <h1 class="imp-titulo">${esc(titulo)}</h1>${ev ? `<p class="imp-sub">${esc(ev.nome)}${ev.data ? ' · ' + dataBr(ev.data) : ''}${ev.hora ? ' às ' + esc(ev.hora) : ''}${ev.local ? ' · ' + esc(ev.local) : ''}</p>` : ''}`;
}
function imprimir(titulo, corpo, ev) {
  const d = $('#impressao');
  d.innerHTML = `<div class="imp-pagina">${cabecalhoImpressao(titulo, ev)}${corpo}<footer class="imp-rodape">${esc(S.config.rodape || 'Feito com Dudoo Parties')}</footer></div>`;
  document.title = `${titulo}${ev ? ' — ' + ev.nome : ''}`;
  const volta = () => { document.title = 'Dudoo Parties'; window.removeEventListener('afterprint', volta); };
  window.addEventListener('afterprint', volta);
  setTimeout(() => window.print(), 80);
}
const tabelaImp = (cols, linhas) => `<table class="imp-tabela"><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${linhas.map((l) => `<tr>${l.map((c) => `<td>${c == null ? '' : c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

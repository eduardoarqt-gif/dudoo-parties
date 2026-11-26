'use strict';
// Dudoo Parties — nuvem (v0.2.0): conta, sincronização entre aparelhos, links públicos de convite/proposta com resposta automática.
// Contrato do servidor: documentacao/API_NUVEM.md. Sem a nuvem o app funciona igual (dados no aparelho, links serverless).
// Parte 1 = funções PURAS (sem DOM/rede, testadas em testes.html). Parte 2 = rede e sincronização. Parte 3 = telas.

// ======================= PARTE 1 — funções puras =======================

// JSON canônico: chaves em ordem alfabética (a ordem em que o objeto foi montado não importa).
function canonico(v) {
  if (v === null || typeof v !== 'object') { const j = JSON.stringify(v); return j === undefined ? 'null' : j; }
  if (Array.isArray(v)) return '[' + v.map(canonico).join(',') + ']';
  return '{' + Object.keys(v).sort().filter((k) => v[k] !== undefined && typeof v[k] !== 'function').map((k) => JSON.stringify(k) + ':' + canonico(v[k])).join(',') + '}';
}
// Impressão digital = tamanho + dois hashes de 32 bits (FNV-1a e djb2) do JSON canônico. Só é comparada localmente.
function impressao(v) {
  const t = canonico(v); let a = 0x811c9dc5, b = 5381;
  for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); a = Math.imul(a ^ c, 0x01000193) >>> 0; b = (Math.imul(b, 33) + c) >>> 0; }
  return t.length.toString(36) + '-' + a.toString(36) + '-' + b.toString(36);
}

const TIPOS_NUVEM = [['evento', 'eventos'], ['cliente', 'clientes'], ['banco', 'banco'], ['modelo', 'modelos'], ['playlist', 'playlists']];
const chaveDoc = (tipo, id) => tipo + ':' + id;
const partesChave = (k) => { const i = k.indexOf(':'); return [k.slice(0, i), k.slice(i + 1)]; };
// Tudo que sincroniza: cada evento/cliente/fornecedor/modelo/playlist + a configuração (marca e modo). Só `sync` fica de fora.
function entidadesNuvem(d) {
  const m = {};
  TIPOS_NUVEM.forEach(([tipo, campo]) => (d[campo] || []).forEach((x) => { if (x && x.id) m[chaveDoc(tipo, x.id)] = { tipo, id: x.id, dados: x }; }));
  m[chaveDoc('config', 'config')] = { tipo: 'config', id: 'config', dados: d.config };
  return m;
}
function acharEntidade(d, tipo, id) {
  if (tipo === 'config') return d.config;
  const campo = (TIPOS_NUVEM.find((t) => t[0] === tipo) || [])[1];
  return campo ? (d[campo] || []).find((x) => x.id === id) : undefined;
}

// Compara com a última impressão sincronizada e devolve os docs novos/alterados/apagados para enviar.
// Carimba a data da mudança em sync.pend (a data vale do momento em que a mudança foi vista, mesmo se a rede falhar).
function coletarMudancas(d, agora = new Date().toISOString()) {
  const sy = d.sync, ents = entidadesNuvem(d), conhec = new Set(sy.conhecidos), docs = [];
  Object.keys(ents).forEach((k) => {
    const e = ents[k], fp = impressao(e.dados);
    if (sy.fp[k] === fp) { delete sy.pend[k]; return; }   // igual ao que a nuvem já tem
    let p = sy.pend[k];
    if (!p || p.fp !== fp || p.excluido) p = sy.pend[k] = { fp, t: agora };
    docs.push({ id: e.id, tipo: e.tipo, dados: e.dados, atualizado_em: p.t, excluido: false });
  });
  conhec.forEach((k) => {
    if (ents[k]) return;
    let p = sy.pend[k];
    if (!p || !p.excluido) p = sy.pend[k] = { fp: '', t: agora, excluido: true };
    const [tipo, id] = partesChave(k);
    docs.push({ id, tipo, dados: null, atualizado_em: p.t, excluido: true });
  });
  Object.keys(sy.pend).forEach((k) => { if (!ents[k] && !conhec.has(k)) delete sy.pend[k]; });   // criado e apagado antes de sincronizar
  return docs;
}
// Mudança local ainda não enviada? (impressão diferente da última sincronizada, ou apagado e ainda "conhecido")
function sujoLocal(d, tipo, id) {
  const k = chaveDoc(tipo, id), e = acharEntidade(d, tipo, id);
  return e ? impressao(e) !== d.sync.fp[k] : d.sync.conhecidos.includes(k);
}
// Depois de enviar: o que o servidor aceitou passa a ser "o que a nuvem tem". `fps` = impressão de cada doc NO MOMENTO do envio.
function confirmarEnvio(d, docs, fps, aceitos) {
  const sy = d.sync, ok = new Set(aceitos || []);
  docs.forEach((doc) => {
    if (!ok.has(doc.id)) return;
    const k = chaveDoc(doc.tipo, doc.id);
    if (doc.excluido) { delete sy.fp[k]; sy.conhecidos = sy.conhecidos.filter((x) => x !== k); } else { sy.fp[k] = fps[k]; if (!sy.conhecidos.includes(k)) sy.conhecidos.push(k); }
    const p = sy.pend[k]; if (p && (doc.excluido ? p.excluido : p.fp === fps[k])) delete sy.pend[k];
  });
}
// Aplica docs vindos da nuvem: insere/substitui/remove. Mudança local mais nova que o doc recebido vence (será enviada no próximo ciclo).
// opcoes.servidorVence: usado na primeira sincronização (nada local é "mais novo"). Devolve quantos docs mudaram algo de fato.
function aplicarDocs(d, docs, opcoes = {}) {
  const sy = d.sync; let n = 0;
  (docs || []).forEach((doc) => {
    if (!doc || !doc.id || !doc.tipo) return;
    const k = chaveDoc(doc.tipo, doc.id), campo = (TIPOS_NUVEM.find((t) => t[0] === doc.tipo) || [])[1];
    if (!campo && doc.tipo !== 'config') return;
    if (!opcoes.servidorVence && sujoLocal(d, doc.tipo, doc.id)) { const p = sy.pend[k]; if (p && p.t > doc.atualizado_em) return; }
    if (doc.tipo === 'config') {
      if (doc.excluido || !doc.dados) return;
      const novo = Object.assign(dadosVazios().config, JSON.parse(JSON.stringify(doc.dados)));
      if (impressao(novo) !== impressao(d.config)) n++;
      d.config = novo; sy.fp[k] = impressao(novo); if (!sy.conhecidos.includes(k)) sy.conhecidos.push(k); delete sy.pend[k];
      return;
    }
    const arr = d[campo], i = arr.findIndex((x) => x.id === doc.id);
    if (doc.excluido) {
      if (i >= 0) { arr.splice(i, 1); n++; }
      delete sy.fp[k]; sy.conhecidos = sy.conhecidos.filter((x) => x !== k); delete sy.pend[k];
      return;
    }
    const novo = JSON.parse(JSON.stringify(doc.dados || {})); novo.id = doc.id;
    if (doc.tipo === 'evento') completarEvento(novo);
    const fp = impressao(novo);
    if (i < 0) { arr.push(novo); n++; } else if (impressao(arr[i]) !== fp) { arr[i] = novo; n++; }
    sy.fp[k] = fp; if (!sy.conhecidos.includes(k)) sy.conhecidos.push(k); delete sy.pend[k];
  });
  return n;
}
// Respostas que chegaram pela nuvem (convidado respondeu o link / cliente aprovou a proposta). Mesma regra das respostas coladas.
function aplicarRespostasNuvem(d, respostas) {
  const r = { rsvp: 0, aprovacoes: 0, novos: 0, ignoradas: 0 };
  (respostas || []).forEach((x) => {
    const ev = d.eventos.find((e) => e.id === x.evento_id);
    if (!ev) { r.ignoradas++; return; }
    if (x.tipo === 'rsvp' && (x.resposta === 'sim' || x.resposta === 'nao')) {
      const o = aplicarRsvp(ev, { g: x.g, nome: x.nome, resposta: x.resposta, acomp: x.acomp, restricoes: x.restricoes });
      r.rsvp++; if (o.novo) r.novos++;
    } else if (x.tipo === 'aprovacao') { marcarAprovada(ev, x.nome || 'Cliente'); r.aprovacoes++; } else r.ignoradas++;
  });
  return r;
}

// O que cada link público mostra (nada além disso sai do aparelho). Convidados vão à parte e ficam privados no servidor.
function publicoConvite(ev) { const c = dadosConvite(ev, null); return { t: c.t, d: c.d, h: c.h, l: c.l, a: c.a, w: c.w, c: c.c, o: c.o }; }
function convidadosPublicos(ev) { return ev.convidados.map((g) => ({ id: g.id, nome: g.nome, m: Math.max(0, parseInt(g.acomp, 10) || 0) || 3 })); }
function publicoProposta(ev) { const p = dadosProposta(ev); return { n: p.n, r: p.r, w: p.w, c: p.c, e: p.e, d: p.d, h: p.h, l: p.l, it: p.it, dc: p.dc, v: p.v, cd: p.cd, cor: p.cor }; }
const corpoPublicar = (tipo, ev) => (tipo === 'convite' ? { tipo, evento_id: ev.id, publico: publicoConvite(ev), convidados: convidadosPublicos(ev) } : { tipo, evento_id: ev.id, publico: publicoProposta(ev) });

// Endereço digitado → URL base (sem barra final); sem "http" assume https (http só para localhost/rede local).
function normalizarServidor(txt) {
  let s = String(txt || '').trim().replace(/\/+$/, ''); if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = (/^(localhost|127\.|\[::1\]|192\.168\.|10\.)/i.test(s) ? 'http://' : 'https://') + s;
  return s;
}
const linkNuvemConvite = (servidor, codigo, gid) => `${servidor}/#/c/${codigo}/${gid || '-'}`;
const linkNuvemProposta = (servidor, codigo) => `${servidor}/#/p/${codigo}`;
const dataHoraBr = (iso) => { const d = new Date(iso); if (!iso || isNaN(d)) return ''; return `${dataBr(isoDe(d))} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

// ======================= PARTE 2 — rede e sincronização =======================
const nuvem = { status: 'desconectado', erro: '', ocupado: false, repetir: false, timer: null, renderPendente: false, ultimaTentativa: 0 };
const nuvemLogada = () => !!(S.sync && S.sync.token && S.sync.servidor);
const servidorPadrao = () => (/^https?:$/.test(location.protocol) ? location.origin : '');
const rotaPublica = () => ['c', 'p', 'convite', 'proposta'].includes(rotaAtual().tela);
const avisoNuvem = () => (nuvemLogada() ? ' Como você está conectado à nuvem, os outros aparelhos também serão atualizados.' : '');

// Chamada à API. Lança Error com .status (HTTP) ou .offline (sem rede / servidor fora do ar).
async function nuvemApi(metodo, caminho, corpo, { servidor, token, timeout = 25000 } = {}) {
  const base = servidor !== undefined ? servidor : S.sync.servidor, tk = token !== undefined ? token : S.sync.token;
  const ctl = typeof AbortController === 'function' ? new AbortController() : null, t = ctl ? setTimeout(() => ctl.abort(), timeout) : null;
  let resp;
  try {
    resp = await fetch(base + caminho, { method: metodo, headers: Object.assign({ 'Content-Type': 'application/json' }, tk ? { Authorization: 'Bearer ' + tk } : {}), body: corpo === undefined ? undefined : JSON.stringify(corpo), signal: ctl ? ctl.signal : undefined, cache: 'no-store' });
  } catch (e) { const er = new Error('Sem conexão com o servidor.'); er.offline = true; throw er; } finally { if (t) clearTimeout(t); }
  let json = null; try { json = await resp.json(); } catch (e) { /* sem corpo */ }
  if (!resp.ok) { const er = new Error((json && json.erro) || `Erro ${resp.status} do servidor.`); er.status = resp.status; throw er; }
  return json || {};
}

function definirStatus(st, erro = '') { nuvem.status = st; nuvem.erro = erro; atualizarIndicador(); }
const textoStatus = () => ({ desconectado: 'Não conectado', sincronizando: 'Sincronizando…', ok: 'Sincronizado', offline: 'Sem conexão (seus dados estão salvos aqui)', erro: 'Erro ao sincronizar' }[nuvem.status] || '');
function atualizarIndicador() {
  let el = $('#nuvem-ind');
  const esconder = window.__TESTE || rotaPublica() || !(S.config && S.config.modo);
  if (esconder) { if (el) el.hidden = true; return; }
  if (!el) { el = document.createElement('button'); el.id = 'nuvem-ind'; el.type = 'button'; el.dataset.acao = 'nuvem-ind'; document.body.appendChild(el); }
  const ic = { desconectado: '☁️', sincronizando: '🔄', ok: '☁️✓', offline: '☁️⚠', erro: '☁️✗' }[nuvem.status];
  el.hidden = false; el.className = 'st-' + nuvem.status; el.innerHTML = `<span>${ic}</span><small>${esc({ desconectado: 'Offline', sincronizando: 'Sincronizando', ok: 'Sincronizado', offline: 'Sem conexão', erro: 'Erro' }[nuvem.status])}</small>`;
  el.title = textoStatus() + (nuvem.erro ? ' — ' + nuvem.erro : '') + (nuvemLogada() ? '. Toque para sincronizar agora.' : '. Toque para conectar sua conta (Ajustes).');
  const s = $('#nuvemStatusTxt'); if (s) s.innerHTML = htmlStatusNuvem();
}
const htmlStatusNuvem = () => `${esc(textoStatus())}${nuvem.erro ? ' — ' + esc(nuvem.erro) : ''}${S.sync.ultimaSync ? `<br><small class="mudo">Última sincronização: ${esc(dataHoraBr(S.sync.ultimaSync))}</small>` : ''}`;

// Não redesenhar por baixo de um modal aberto ou de um campo de texto em edição.
function uiOcupada() {
  if ($('#modal') && !$('#modal').hidden) return true;
  const a = document.activeElement; if (!a || document.hidden) return false;
  return !!$('#app') && $('#app').contains(a) && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'color', 'file', 'range'].includes(a.type)));
}
function tentarRender() {
  if (!nuvem.renderPendente) return;
  if (uiOcupada()) { setTimeout(tentarRender, 2500); return; }
  nuvem.renderPendente = false; aplicarCor(); render();
}
function agendarSync(ms) { if (window.__TESTE || !nuvemLogada() || rotaPublica()) return; clearTimeout(nuvem.timer); nuvem.timer = setTimeout(() => sincronizar(), ms); }

async function sincronizar({ manual = false } = {}) {
  if (window.__TESTE || !nuvemLogada()) return;
  if (nuvem.ocupado) { nuvem.repetir = true; return; }
  const sy = S.sync; if (sy.cursor === 0 && uiOcupada() && !manual) { agendarSync(3000); return; }
  nuvem.ocupado = true; definirStatus('sincronizando');
  let mudouTela = false, respNovas = 0, respAplicadas = false, adiou = false;
  try {
    // 1ª vez neste aparelho: primeiro só baixa (o que já está na conta vence; o que é só daqui sobe em seguida)
    if (sy.cursor === 0) {
      const r0 = await nuvemApi('POST', '/api/sync', { cursor: 0, docs: [] });
      if (aplicarDocs(S, r0.docs, { servidorVence: true })) mudouTela = true;
      S.sync.cursor = r0.cursor;
    }
    const docs = coletarMudancas(S), fps = {};
    docs.forEach((x) => { const k = chaveDoc(x.tipo, x.id); fps[k] = S.sync.pend[k].fp; });
    const r = await nuvemApi('POST', '/api/sync', { cursor: S.sync.cursor, docs });
    confirmarEnvio(S, docs, fps, r.aceitos);
    coletarMudancas(S);   // carimba o que o usuário editou enquanto a requisição estava no ar
    if (r.docs.length && uiOcupada() && !manual) { adiou = true; }   // não mexe nos dados por baixo de um modal/campo: o cursor não anda, volta no próximo ciclo
    else { if (aplicarDocs(S, r.docs)) mudouTela = true; S.sync.cursor = r.cursor; }
    for (let i = 0; i < 10; i++) {
      const rr = await nuvemApi('GET', '/api/respostas?desde=' + S.sync.cursorRespostas);
      if (!rr.respostas.length) { S.sync.cursorRespostas = Math.max(S.sync.cursorRespostas, rr.cursor); break; }
      const ap = aplicarRespostasNuvem(S, rr.respostas);
      S.sync.cursorRespostas = rr.cursor; respNovas += ap.rsvp + ap.aprovacoes; respAplicadas = true;
      if (rr.respostas.length < 500) break;
    }
    S.sync.ultimaSync = new Date().toISOString();
    await republicarPendentes();
    gravarAgora(); definirStatus('ok');
    if (respNovas) toast(`${plural(respNovas, 'resposta nova', 'respostas novas')}! 🎉`);
    if (mudouTela || respAplicadas) { nuvem.renderPendente = true; tentarRender(); }
    if (adiou) agendarSync(3000); else if (respAplicadas) agendarSync(1500);
  } catch (e) {
    if (e.status === 401) { S.sync.token = ''; S.sync.conta = null; definirStatus('desconectado'); toast('Sua sessão da nuvem expirou. Entre de novo em Ajustes.', true); }
    else definirStatus(e.offline ? 'offline' : 'erro', e.offline ? '' : e.message);
    gravarAgora();   // guarda os carimbos de data das mudanças pendentes
    if (manual) toast(e.offline ? 'Sem conexão com o servidor. Seus dados continuam salvos aqui.' : e.message, true);
  } finally {
    nuvem.ocupado = false; nuvem.ultimaTentativa = Date.now();
    if (nuvem.repetir) { nuvem.repetir = false; agendarSync(600); }
  }
}

// Convites e propostas já publicados: se o conteúdo mudou, atualiza o mesmo código (os links já enviados continuam valendo).
async function republicarPendentes() {
  const pub = S.sync.publicados;
  for (const k of Object.keys(pub)) {
    const [tipo, evid] = partesChave(k), ev = evento(evid);
    if (!ev) { delete pub[k]; continue; }
    const corpo = corpoPublicar(tipo, ev), fp = impressao(corpo);
    if (pub[k].fp === fp) continue;
    try { const r = await nuvemApi('POST', '/api/publicar', corpo); pub[k] = { codigo: r.codigo, fp }; } catch (e) { if (e.status === 401 || e.offline) throw e; /* outro erro: tenta de novo no próximo ciclo */ }
  }
}
// Publica (ou atualiza) o convite/proposta do evento e devolve o código. Lança erro se não conseguir.
async function publicarNuvem(tipo, ev) {
  const corpo = corpoPublicar(tipo, ev), r = await nuvemApi('POST', '/api/publicar', corpo);
  S.sync.publicados[chaveDoc(tipo, ev.id)] = { codigo: r.codigo, fp: impressao(corpo) };
  gravarAgora(); return r.codigo;
}
const codigoPublicado = (tipo, ev) => { const p = nuvemLogada() && S.sync.publicados[chaveDoc(tipo, ev.id)]; return p ? p.codigo : ''; };
// Links que o app usa: da nuvem quando já foi publicado, senão os links sem servidor de sempre.
function linkConviteAuto(ev, g) { const c = codigoPublicado('convite', ev); return c ? linkNuvemConvite(S.sync.servidor, c, g && g.id) : linkConvite(ev, g); }
function linkPropostaAuto(ev) { const c = codigoPublicado('proposta', ev); return c ? linkNuvemProposta(S.sync.servidor, c) : linkProposta(ev); }

async function conectarConta(criar, { servidor, email, senha, nome }) {
  const srv = normalizarServidor(servidor); if (!srv) throw new Error('Informe o endereço do servidor.');
  const r = await nuvemApi('POST', criar ? '/api/conta' : '/api/entrar', criar ? { email, senha, nome } : { email, senha }, { servidor: srv, token: '' });
  const sy = S.sync;
  if (sy.contaId && sy.contaId !== r.conta.id || sy.servidor && sy.servidor !== srv) Object.assign(sy, { cursor: 0, cursorRespostas: 0, fp: {}, conhecidos: [], pend: {}, publicados: {}, ultimaSync: '' });   // outra conta/servidor: recomeça
  Object.assign(sy, { servidor: srv, token: r.token, conta: r.conta, contaId: r.conta.id });
  gravarAgora(); definirStatus('ok'); sincronizar({ manual: true });
}
async function sairDaNuvem() {
  try { await nuvemApi('POST', '/api/sair', {}); } catch (e) { /* sem rede: só esquece o token aqui */ }
  S.sync.token = ''; S.sync.conta = null; clearTimeout(nuvem.timer); gravarAgora(); definirStatus('desconectado');
}

// Integra com o salvamento atual sem mudar quem chama gravar()/substituirDados().
if (!window.__TESTE) {
  const _gravarBase = gravar, _substituirBase = substituirDados;
  gravar = function () { _gravarBase(); agendarSync(4000); };
  substituirDados = function (novo) { _substituirBase(novo); agendarSync(1500); };
  setInterval(() => { if (!document.hidden) sincronizar(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - nuvem.ultimaTentativa > 20000) sincronizar(); });
  window.addEventListener('online', () => sincronizar());
  window.addEventListener('offline', () => { if (nuvemLogada()) definirStatus('offline'); });
  setTimeout(() => { atualizarIndicador(); sincronizar(); }, 700);
}

// ======================= PARTE 3 — telas =======================
function cartaoNuvem() {
  const sy = S.sync;
  if (nuvemLogada()) {
    return `<div class="cartao" id="cartaoNuvem"><h3>☁️ Conta e nuvem</h3>
      <p>Conectado como <b>${esc((sy.conta && sy.conta.nome) || '')}</b> <span class="mudo">(${esc((sy.conta && sy.conta.email) || '')})</span><br><small class="mudo">Servidor: ${esc(sy.servidor)}</small></p>
      <p id="nuvemStatusTxt">${htmlStatusNuvem()}</p>
      <p class="mudo pequeno">Seus eventos, clientes e ajustes ficam iguais em todos os aparelhos onde você entrar com esta conta. As respostas dos convites e a aprovação das propostas chegam sozinhas.</p>
      <div class="botoes-lin"><button class="btn primario" data-acao="nuvem-agora">🔄 Sincronizar agora</button><button class="btn" data-acao="nuvem-sair">Sair da conta</button></div></div>`;
  }
  return `<div class="cartao" id="cartaoNuvem"><h3>☁️ Conta e nuvem</h3>
    <p class="mudo">Opcional. Com uma conta, seus dados ficam iguais no computador e no celular, e as respostas dos convites chegam sozinhas (sem copiar e colar do WhatsApp). Sem conta, tudo continua funcionando só neste aparelho.</p>
    <p id="nuvemStatusTxt">${htmlStatusNuvem()}</p>
    <div class="botoes-lin"><button class="btn primario" data-acao="nuvem-entrar">Entrar</button><button class="btn" data-acao="nuvem-criar">Criar conta</button></div></div>`;
}
function formConta(criar) {
  const campos = [{ id: 'servidor', rotulo: 'Servidor', tipo: 'texto', req: true, larg: 'inteiro', valor: S.sync.servidor || servidorPadrao(), ph: 'https://parties.seudominio.com.br', dica: 'O endereço onde o servidor do Dudoo Parties está rodando.' }];
  if (criar) campos.push({ id: 'nome', rotulo: 'Seu nome', tipo: 'texto', req: true, auto: 'name' });
  campos.push({ id: 'email', rotulo: 'E-mail', tipo: 'email', req: true, auto: 'email' }, { id: 'senha', rotulo: criar ? 'Senha (mínimo 8 caracteres)' : 'Senha', tipo: 'senha', req: true, auto: criar ? 'new-password' : 'current-password' });
  formulario({
    titulo: criar ? 'Criar conta' : 'Entrar na nuvem', campos, salvarTexto: criar ? 'Criar conta' : 'Entrar',
    intro: S.eventos.length ? 'Os dados que já estão neste aparelho serão juntados aos da conta.' : '',
    salvar: (v) => {
      const bt = $('#formModal .primario'); if (bt) bt.disabled = true; $('#formErro').textContent = '';
      conectarConta(criar, v).then(() => { fecharModal(); toast(criar ? 'Conta criada! Sincronizando…' : 'Conectado! Sincronizando…'); render(); }, (e) => {
        const er = $('#formErro'); if (er) er.textContent = e.offline ? 'Não consegui falar com o servidor. Confira o endereço e a internet.' : e.message; if (bt) bt.disabled = false;
      });
      return false;   // o modal só fecha quando der certo
    },
  });
}
acoes['nuvem-entrar'] = () => formConta(false);
acoes['nuvem-criar'] = () => formConta(true);
acoes['nuvem-agora'] = () => sincronizar({ manual: true });
acoes['nuvem-sair'] = () => confirmar('Sair da conta? Seus dados continuam neste aparelho, mas deixam de sincronizar.', async () => { await sairDaNuvem(); render(); toast('Você saiu da conta.'); }, 'Sair');
acoes['nuvem-ind'] = () => { if (nuvemLogada()) sincronizar({ manual: true }); else irPara('#/config'); };

// Publicar convite/proposta pelo botão (a proposta mostra o botão enquanto ainda não tem link da nuvem)
acoes['prop-publicar'] = async () => {
  const ev = evAtual(); if (!ev.proposta.itens.length) { toast('Adicione itens à proposta primeiro.', true); return; }
  try { toast('Publicando…'); await publicarNuvem('proposta', ev); render(); toast('Pronto! O link agora é da nuvem: a aprovação do cliente chega sozinha.'); } catch (e) { toast(e.offline ? 'Sem conexão com o servidor.' : e.message, true); }
};

// ---- páginas públicas pela nuvem: #/c/<codigo>/<gid> e #/p/<codigo> (mesmo servidor que serve o app) ----
const pub = { chave: '', estado: 'carregando', dados: null, msg: '' };
function carregarPublico(tipo, codigo, gid) {
  const chave = `${tipo}/${codigo}/${gid}`; if (pub.chave === chave) return;
  Object.assign(pub, { chave, estado: 'carregando', dados: null, msg: '' });
  const q = tipo === 'convite' && gid && gid !== '-' ? '?g=' + encodeURIComponent(gid) : '';
  nuvemApi('GET', `/api/publico/${encodeURIComponent(codigo)}${q}`, undefined, { servidor: location.origin, token: '' }).then((r) => {
    if (pub.chave !== chave) return;
    if (r.tipo !== tipo) { pub.estado = 'invalido'; } else { pub.estado = 'ok'; pub.dados = r; }
    render();
  }, (e) => { if (pub.chave !== chave) return; pub.estado = e.status === 404 ? 'invalido' : 'erro'; pub.msg = e.message; render(); });
}
function paginaPublicaEstado(titulo) {
  if (pub.estado === 'carregando') return paginaPublica('<div class="pub-emoji">🎉</div><p class="mudo" style="text-align:center">Abrindo…</p>');
  if (pub.estado === 'invalido') return paginaPublica('<h1>Link inválido</h1><p>Esse link não existe mais. Peça um novo a quem enviou.</p>');
  if (pub.estado === 'erro') return paginaPublica(`<h1>Não consegui abrir agora</h1><p>${esc(pub.msg || 'Verifique a internet e tente de novo.')}</p><div class="pub-botoes"><button class="btn primario grande" data-acao="pub-recarregar">Tentar de novo</button></div>`);
  return '';
}
acoes['pub-recarregar'] = () => { pub.chave = ''; render(); };
function tela_conviteNuvem(codigo, gid) {
  carregarPublico('convite', codigo, gid);
  const e = paginaPublicaEstado(); if (e) return e;
  const p = pub.dados.publico || {}, cv = pub.dados.convidado, c = Object.assign({}, p, { n: cv ? cv.nome : '', m: cv ? cv.m : 3 });
  if (pub.estado === 'enviado') return paginaPublica(`<div class="pub-emoji">${pub.resposta === 'sim' ? '🥳' : '💌'}</div><h1 style="text-align:center">Resposta enviada, obrigado!</h1>
    <p style="text-align:center">${pub.resposta === 'sim' ? 'Que bom que você vem! Já avisamos quem convidou.' : 'Que pena que não dá desta vez. Já avisamos quem convidou.'}</p>
    <p class="mudo pequeno" style="text-align:center">${esc(c.t || '')}${c.d ? ' · ' + dataBr(c.d) : ''}</p><div class="pub-botoes"><button class="btn" data-acao="pub-mudar">Mudar minha resposta</button></div>`, c.c);
  return htmlConvite(c, true);
}
acoes['pub-mudar'] = () => { pub.estado = 'ok'; render(); };
acoes['rsvp-nuvem'] = async (el) => {
  const [, codigo, gid] = location.hash.replace(/^#\/?/, '').split('/'), cv = pub.dados && pub.dados.convidado;
  const nome = cv ? cv.nome : ($('#rsvpNome') ? $('#rsvpNome').value.trim() : '');
  if (!nome) { toast('Informe seu nome.', true); return; }
  const resposta = el.dataset.r; el.disabled = true;
  try {
    await nuvemApi('POST', `/api/publico/${encodeURIComponent(codigo)}/resposta`, { g: gid || '-', nome, resposta, acomp: Number($('#rsvpAc').value) || 0, restricoes: $('#rsvpRestr').value.trim() }, { servidor: location.origin, token: '' });
    pub.estado = 'enviado'; pub.resposta = resposta; render();
  } catch (e) { el.disabled = false; toast(e.status === 429 ? 'Muitas respostas por aqui. Tente de novo daqui a pouco.' : e.offline ? 'Sem conexão. Tente de novo.' : e.message, true); }
};
function tela_propostaNuvem(codigo) {
  carregarPublico('proposta', codigo, '');
  const e = paginaPublicaEstado(); if (e) return e;
  const d = pub.dados.publico || {};
  if (pub.estado === 'enviado') return paginaPublica(`<div class="pub-emoji">✅</div><h1 style="text-align:center">Proposta aprovada, obrigado!</h1><p style="text-align:center">Já avisamos ${esc(d.r || d.n || 'o profissional')}. Em breve entram em contato.</p>`, d.cor);
  return htmlPropostaPublica(d, true);
}
acoes['aprovar-nuvem'] = async (el) => {
  const codigo = location.hash.replace(/^#\/?/, '').split('/')[1], nome = ($('#aprNome').value || '').trim() || 'Cliente'; el.disabled = true;
  try { await nuvemApi('POST', `/api/publico/${encodeURIComponent(codigo)}/aprovacao`, { nome }, { servidor: location.origin, token: '' }); pub.estado = 'enviado'; render(); }
  catch (e) { el.disabled = false; toast(e.status === 429 ? 'Muitas tentativas. Tente de novo daqui a pouco.' : e.offline ? 'Sem conexão. Tente de novo.' : e.message, true); }
};

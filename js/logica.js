'use strict';
// Dudoo Parties — regras de negócio puras (contagem de convidados, quantidades, orçamento, parcelas, RSVP, lembretes).

// Conta pessoas. `base`: 'previstos' (todos menos quem disse que não vai) ou 'confirmados' (só quem disse sim).
function contarConvidados(ev, base = 'previstos') {
  const r = { convites: ev.convidados.length, adultos: 0, criancas: 0, bebes: 0, comem: 0, total: 0, veg: 0, restricoes: {},
    sim: 0, nao: 0, pendente: 0, pSim: 0, pNao: 0, pPend: 0 };
  for (const g of ev.convidados) {
    const rsvp = g.rsvp || 'pendente', ac = Math.max(0, parseInt(g.acomp, 10) || 0), pessoas = 1 + ac;
    r[rsvp] = (r[rsvp] || 0) + 1;
    r[rsvp === 'sim' ? 'pSim' : rsvp === 'nao' ? 'pNao' : 'pPend'] += pessoas;
    if (base === 'confirmados' ? rsvp !== 'sim' : rsvp === 'nao') continue;
    const faixa = g.faixa || 'adulto';
    if (faixa === 'adulto') r.adultos += pessoas;
    else { r.adultos += ac; r[faixa === 'crianca' ? 'criancas' : 'bebes'] += 1; }
    for (const x of g.restricoes || []) {
      r.restricoes[x] = (r.restricoes[x] || 0) + 1;
      if (x === 'Vegetariano' || x === 'Vegano') r.veg++;
    }
  }
  r.comem = r.adultos + r.criancas; r.total = r.comem + r.bebes;
  return r;
}
const lugaresDe = (g) => 1 + Math.max(0, parseInt(g.acomp, 10) || 0);

function arredondarQtd(x, un) { return un === 'un' ? Math.ceil(x - 1e-9) : Math.ceil(x * 10 - 1e-9) / 10; }
function calcularQuantitativo(ev, base = ev.base, margem = ev.margem) {
  const c = contarConvidados(ev, base), h = ev.duracaoH || 4;
  return ev.qtd.regras.map((r) => {
    const alvo = r.aplica === 'adultos' ? c.adultos : r.aplica === 'criancas' ? c.criancas : r.aplica === 'vegetarianos' ? c.veg : c.comem;
    const bruto = alvo * num(r.qtd) * (r.base === 'hora' ? h : 1);
    const total = arredondarQtd(bruto * (1 + num(margem) / 100), r.un);
    const emb = num(r.emb) > 0 ? Math.ceil(total / num(r.emb) - 1e-9) : 0;
    return { ...r, alvo, bruto, total, embalagens: emb, custo: (emb || total) * num(r.preco) };
  });
}

// Orçamento por categoria: previsto × contratado (fornecedores + compras) × pago × a pagar.
function resumoFinanceiro(ev) {
  const mapa = new Map();
  const cat = (nome) => { const k = nome || 'Outros'; if (!mapa.has(k)) mapa.set(k, { categoria: k, previsto: 0, contratado: 0, pago: 0 }); return mapa.get(k); };
  ev.orcamento.forEach((o) => { cat(o.categoria).previsto += num(o.previsto); });
  ev.fornecedores.forEach((f) => {
    const c = cat(f.categoria), pg = f.pagamentos || [];
    c.contratado += num(f.valor) || pg.reduce((s, p) => s + num(p.valor), 0);
    pg.forEach((p) => { if (p.pago) c.pago += num(p.valor); });
  });
  ev.compras.forEach((i) => { const v = num(i.qtd) * num(i.preco), c = cat(i.categoria); c.contratado += v; if (i.comprado) c.pago += v; });
  const linhas = [...mapa.values()].map((c) => ({ ...c, aPagar: Math.max(0, c.contratado - c.pago), saldo: c.previsto - c.contratado }));
  const tot = linhas.reduce((t, c) => ({ previsto: t.previsto + c.previsto, contratado: t.contratado + c.contratado, pago: t.pago + c.pago, aPagar: t.aPagar + c.aPagar }), { previsto: 0, contratado: 0, pago: 0, aPagar: 0 });
  tot.orcamentoTotal = num(ev.orcamentoTotal);
  tot.saldo = (tot.orcamentoTotal || tot.previsto) - tot.contratado;
  return { linhas, tot };
}

function parcelar(total, n, primeiraIso, desc = 'Parcela', passoMeses = 1) {
  n = Math.max(1, parseInt(n, 10) || 1);
  const cent = Math.round(num(total) * 100), base = Math.floor(cent / n), resto = cent - base * n;
  return Array.from({ length: n }, (_, i) => ({
    id: uid(), descricao: n > 1 ? `${desc} ${i + 1}/${n}` : desc, valor: (base + (i === n - 1 ? resto : 0)) / 100,
    venc: primeiraIso ? somaMeses(primeiraIso, i * passoMeses) : '', pago: false,
  }));
}

// Lembretes de todos os eventos: pagamentos a fazer, parcelas a receber e tarefas, dentro de `dias` (ou atrasados).
function lembretes(estado, hoje = hojeIso(), dias = 7) {
  const limite = somaDias(hoje, dias), out = [];
  const add = (ev, tipo, texto, data, valor) => { if (data && data <= limite) out.push({ tipo, evId: ev.id, evNome: ev.nome, texto, data, valor, atraso: data < hoje }); };
  for (const ev of estado.eventos) {
    if (ev.status === 'cancelado' || ev.status === 'concluido') continue;
    ev.fornecedores.forEach((f) => (f.pagamentos || []).forEach((p) => { if (!p.pago) add(ev, 'pagar', `Pagar ${f.nome}: ${p.descricao || 'parcela'}`, p.venc, num(p.valor)); }));
    ((ev.contrato && ev.contrato.parcelas) || []).forEach((p) => { if (!p.pago) add(ev, 'receber', `Receber${ev.clienteId ? ' de ' + nomeClienteDe(estado, ev.clienteId) : ''}: ${p.descricao || 'parcela'}`, p.venc, num(p.valor)); });
    ev.checklist.forEach((c) => { if (!c.feito) add(ev, 'tarefa', c.texto + (c.resp ? ` (${c.resp})` : ''), c.prazo, 0); });
  }
  return out.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
}
const nomeClienteDe = (estado, id) => ((estado.clientes || []).find((c) => c.id === id) || {}).nome || '';

// Colar lista de convidados: "Nome", "Nome; telefone", "Maria +2", "João (criança)", "Ana; 11 99999-0000; 2; Família".
function lerListaConvidados(texto) {
  const out = [];
  for (let linha of String(texto || '').split(/\r?\n/)) {
    linha = linha.replace(/^\s*(\d+[.)\-]|[-•*])\s*/, '').trim();
    if (!linha) continue;
    const partes = (/[;\t]/.test(linha) ? linha.split(/[;\t]/) : linha.split(',')).map((p) => p.trim());
    let nome = partes[0], acomp = 0, faixa = 'adulto', tel = '', grupo = '';
    const m = nome.match(/\+\s*(\d+)\s*$/); if (m) { acomp = parseInt(m[1], 10); nome = nome.replace(/\+\s*\d+\s*$/, '').trim(); }
    if (/\((crian[çc]a|kid|infantil)\)/i.test(nome)) { faixa = 'crianca'; nome = nome.replace(/\([^)]*\)/, '').trim(); }
    else if (/\((beb[êe])\)/i.test(nome)) { faixa = 'bebe'; nome = nome.replace(/\([^)]*\)/, '').trim(); }
    for (const p of partes.slice(1)) {
      const d = soDigitos(p);
      if (/^\d{1,2}$/.test(p)) acomp = parseInt(p, 10);
      else if (d.length >= 8 && /^[\d\s()+\-]+$/.test(p)) tel = p;
      else if (p) grupo = p;
    }
    if (nome) out.push({ nome, telefone: tel, acomp, faixa, grupo });
  }
  return out;
}

// ----- Convite (RSVP) e aprovação de proposta: tudo vai dentro do link e volta por WhatsApp -----
function dadosConvite(ev, g) {
  const traje = (String(ev.obs || '').match(/(?:traje|dress ?code)\s*:?\s*([^.\n]+)/i) || [])[1];   // só o traje vai no link; observações internas não
  return { t: ev.nome, d: ev.data, h: ev.hora, l: ev.local, a: ev.anfitriao || S.config.responsavel || '', w: S.config.telefone || '', i: ev.id, g: g ? g.id : '-', n: g ? g.nome : '',
    m: g ? Math.max(0, parseInt(g.acomp, 10) || 0) : 3, c: S.config.cor || '#7C3AED', o: traje ? 'Traje: ' + traje.trim() : '' };
}
const linkConvite = (ev, g) => `${baseUrl()}#/convite/${codificar(dadosConvite(ev, g))}`;
function mensagemConvite(ev, g, link = linkConvite(ev, g)) {
  const quando = [ev.data ? `${diaSemana(ev.data)}, ${dataBr(ev.data)}` : '', ev.hora ? `às ${ev.hora}` : ''].filter(Boolean).join(' ');
  return `Oi${g ? ', ' + g.nome.split(' ')[0] : ''}! 🎉 Você é nosso convidado para ${ev.nome}${quando ? ' — ' + quando : ''}${ev.local ? ', ' + ev.local : ''}.\nConfirme sua presença por aqui: ${link}`;
}
function mensagemResposta(c, resposta, acomp, restr, nomeDigitado) {
  const nome = nomeDigitado || c.n || 'Convidado';
  const txt = resposta === 'sim' ? `Confirmo presença${acomp ? ` com +${acomp} acompanhante${acomp > 1 ? 's' : ''}` : ''}${restr ? `. Restrição alimentar: ${restr}` : ''}.` : 'Infelizmente não poderei ir.';
  return `Olá! Aqui é ${nome}. ${txt} (${c.t})\n[parties:rsvp:${c.i}:${c.g}:${resposta}:${acomp || 0}:${String(restr || '').replace(/[\]:\n]/g, ' ')}:${nome.replace(/[\]:\n]/g, ' ')}]`;
}
// Marca a resposta de um convidado no evento (usado pelas respostas coladas e pelas que chegam da nuvem).
// Acha por id (g), senão por nome; se não existe, cria o convidado. Devolve {convidado, novo}.
function aplicarRsvp(ev, { g, nome, resposta, acomp, restricoes }) {
  const nm = String(nome || '').trim();
  let c = (g && g !== '-' ? ev.convidados.find((x) => x.id === g) : null) || (nm ? ev.convidados.find((x) => normaliza(x.nome) === normaliza(nm)) : null), novo = false;
  if (!c) { c = { id: uid(), nome: nm || 'Convidado', grupo: '', faixa: 'adulto', acomp: 0, telefone: '', restricoes: [], rsvp: 'pendente', mesaId: '', obs: '' }; ev.convidados.push(c); novo = true; }
  c.rsvp = resposta; if (resposta === 'sim') c.acomp = parseInt(acomp, 10) || 0;
  const r = String(restricoes || '').trim();
  if (r && resposta === 'sim') {
    const nota = 'Restrição informada: ' + r;
    if (!String(c.obs || '').includes(nota)) c.obs = (c.obs ? c.obs + ' | ' : '') + nota;
    const k = RESTRICOES.find((x) => normaliza(r).includes(normaliza(x).split(' ')[0])); if (k && !c.restricoes.includes(k)) c.restricoes.push(k);
  }
  return { convidado: c, novo };
}
// Lê respostas coladas (várias mensagens) e aplica no evento. Devolve {ok, novos, ignorados}.
function aplicarRespostas(ev, texto) {
  const re = /\[parties:rsvp:([^:\]]*):([^:\]]*):(sim|nao):(\d+):([^:\]]*):([^\]]*)\]/g;
  let m, ok = 0, novos = 0, ign = 0;
  while ((m = re.exec(texto || ''))) {
    if (m[1] !== ev.id) { ign++; continue; }
    const r = aplicarRsvp(ev, { g: m[2], nome: m[6], resposta: m[3], acomp: m[4], restricoes: m[5] });
    if (r.novo) novos++;
    ok++;
  }
  return { ok, novos, ignorados: ign };
}

function totalProposta(p) {
  const bruto = (p.itens || []).reduce((s, i) => s + num(i.qtd) * num(i.valor), 0);
  return { bruto, desconto: num(p.desconto), total: Math.max(0, bruto - num(p.desconto)) };
}
function dadosProposta(ev) {
  const cfg = S.config, t = totalProposta(ev.proposta);
  return { n: cfg.negocio, r: cfg.responsavel, w: cfg.telefone, c: nomeCliente(ev.clienteId) || ev.anfitriao, e: ev.nome, d: ev.data, h: ev.hora, l: ev.local, i: ev.id,
    it: ev.proposta.itens.map((i) => [i.descricao, num(i.qtd), num(i.valor)]), dc: t.desconto, v: ev.proposta.validade, cd: ev.proposta.condicoes, cor: cfg.cor };
}
const linkProposta = (ev) => `${baseUrl()}#/proposta/${codificar(dadosProposta(ev))}`;
function marcarAprovada(ev, quem) { ev.proposta.status = 'aprovada'; ev.proposta.aprovadoEm = hojeIso(); ev.proposta.aprovadoPor = String(quem || '').trim(); return ev.proposta.aprovadoPor; }
function aplicarAprovacao(ev, texto) {
  const m = /\[parties:aprovacao:([^:\]]*):([^\]]*)\]/.exec(texto || '');
  if (!m || m[1] !== ev.id) return null;
  return marcarAprovada(ev, m[2]);
}

// Playlist
const linkBuscaSpotify = (f) => `https://open.spotify.com/search/${encodeURIComponent([f.titulo, f.artista].filter(Boolean).join(' '))}`;
function textoPlaylist(pl) {
  const bloco = (tit, tipo) => {
    const fx = (pl.faixas || []).filter((f) => f.tipo === tipo);
    return fx.length ? `${tit}\n${fx.map((f, i) => `${i + 1}. ${f.titulo}${f.artista ? ' — ' + f.artista : ''}${f.momento ? ` (${f.momento})` : ''}`).join('\n')}\n` : '';
  };
  return `${pl.nome}${pl.link ? '\n' + pl.link : ''}\n\n${bloco('PODE TOCAR', 'tocar')}\n${bloco('NÃO TOCAR', 'nao')}`.trim();
}
function lerFaixas(texto) {
  return String(texto || '').split(/\r?\n/).map((l) => l.replace(/^\s*(\d+[.)\-]|[-•*])\s*/, '').trim()).filter(Boolean).map((l) => {
    const [titulo, artista] = l.split(/\s+[—–-]\s+|\s*;\s*/); return { titulo: (titulo || '').trim(), artista: (artista || '').trim() };
  }).filter((f) => f.titulo);
}

// Mesas: distribui automaticamente (agrupa por grupo; respeita lugares).
function distribuirMesas(ev) {
  const livres = ev.mesas.map((m) => ({ m, resta: num(m.lugares) }));
  ev.convidados.forEach((g) => { g.mesaId = ''; });
  const lista = ev.convidados.filter((g) => g.rsvp !== 'nao').sort((a, b) => normaliza(a.grupo).localeCompare(normaliza(b.grupo)) || normaliza(a.nome).localeCompare(normaliza(b.nome)));
  let sobrou = 0;
  for (const g of lista) {
    const precisa = lugaresDe(g), alvo = livres.find((l) => l.resta >= precisa);
    if (alvo) { g.mesaId = alvo.m.id; alvo.resta -= precisa; } else sobrou++;
  }
  return sobrou;
}
function ocupacaoMesa(ev, mesaId) { return ev.convidados.filter((g) => g.mesaId === mesaId && g.rsvp !== 'nao').reduce((s, g) => s + lugaresDe(g), 0); }

// Muda a data/hora do evento e leva junto os prazos do checklist e os horários do cronograma.
// `pagamentos`: também desloca os vencimentos (ao duplicar para outra data; adiar uma festa não muda o que já foi contratado).
function reagendar(ev, novaData, novaHora, pagamentos = false) {
  const delta = ev.data && novaData ? diasEntre(ev.data, novaData) : 0;
  ev.checklist.forEach((c) => { if (novaData && c.dias != null) c.prazo = somaDias(novaData, -c.dias); else if (c.prazo && delta) c.prazo = somaDias(c.prazo, delta); });
  if (pagamentos && delta) {
    ev.fornecedores.forEach((f) => (f.pagamentos || []).forEach((p) => { if (p.venc) p.venc = somaDias(p.venc, delta); }));
    (ev.contrato.parcelas || []).forEach((p) => { if (p.venc) p.venc = somaDias(p.venc, delta); });
  }
  const min = (h) => { const [a, b] = String(h).split(':').map(Number); return a * 60 + (b || 0); };
  if (novaHora && ev.hora && novaHora !== ev.hora) { const d = min(novaHora) - min(ev.hora); ev.cronograma.forEach((c) => { if (c.hora) c.hora = somaMin(c.hora, d); }); }
  if (novaData !== undefined) ev.data = novaData;
  if (novaHora) ev.hora = novaHora;
}

function progressoChecklist(ev) { const t = ev.checklist.length, f = ev.checklist.filter((c) => c.feito).length; return { total: t, feitas: f, pct: t ? Math.round((f / t) * 100) : 0 }; }

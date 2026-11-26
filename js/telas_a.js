'use strict';
// Dudoo Parties — telas gerais: início, eventos, hub do evento + resumo, clientes, banco de fornecedores, modelos e ajustes.
const ABAS = {};
const ui = { filtroEv: 'proximos', rsvp: 'todos', checkPessoa: '', checkVer: 'todas', comprasVer: 'todas', playlistAberta: '' };
const iconeTipo = (id) => tipoDe(id).ic;
const rotaAtual = () => { const p = location.hash.replace(/^#\/?/, '').split('/'); return { tela: p[0] || 'inicio', a: p[1] || '', b: p[2] || '', resto: p.slice(1).join('/') }; };
const evAtual = () => evento(rotaAtual().a);
const irPara = (h) => { if (location.hash === h) render(); else location.hash = h; };

// ---------- Boas-vindas ----------
function tela_boasVindas() {
  return `<div class="boas"><div class="boas-card">
    <div class="boas-logo">🎉</div><h1>Dudoo Parties</h1><p class="mudo">Planeje festas sem perder nada: convidados, comida, mesas, fornecedores, orçamento e playlist num lugar só.</p>
    <h3>Como você vai usar?</h3>
    <div class="escolha"><button class="opcao" data-acao="modo" data-modo="pessoal"><b>🎈 Vou organizar a minha festa</b><span>Aniversário, jantar, casamento… com tudo que preciso, sem complicação.</span></button>
    <button class="opcao" data-acao="modo" data-modo="profissional"><b>💼 Sou profissional de eventos</b><span>Cerimonial, decoração, assessoria: clientes, propostas, contratos, equipe e vários eventos.</span></button></div>
    <p class="mudo pequeno">Você pode trocar isso depois em Ajustes. Seus dados ficam neste aparelho (e, se você quiser, na sua conta da nuvem).</p>
    <button class="btn" data-acao="carregar-demo">👀 Só quero ver um exemplo pronto</button> <button class="btn" data-acao="nuvem-entrar">☁️ Já tenho conta</button></div></div>`;
}
acoes['modo'] = (el) => { S.config.modo = el.dataset.modo; gravar(); irPara('#/inicio'); };

// ---------- Início ----------
function tela_inicio() {
  const hoje = hojeIso(), c = S.config;
  const ativos = S.eventos.filter((e) => e.status !== 'cancelado' && e.status !== 'concluido');
  const prox = S.eventos.filter((e) => e.data && e.data >= hoje && e.status !== 'cancelado').sort((a, b) => (a.data < b.data ? -1 : 1))[0];
  const lem = lembretes(S, hoje, 7);
  const aPagar = ativos.reduce((s, e) => s + resumoFinanceiro(e).tot.aPagar, 0);
  const aReceber = ativos.reduce((s, e) => s + (e.contrato.parcelas || []).filter((p) => !p.pago).reduce((t, p) => t + num(p.valor), 0), 0);
  const conf = ativos.reduce((s, e) => s + contarConvidados(e).pSim, 0);
  let heroi = vazioHtml('Nenhum evento marcado ainda.', '<button class="btn primario" data-acao="evento-novo">+ Novo evento</button>');
  if (prox) {
    const k = contarConvidados(prox), p = progressoChecklist(prox);
    heroi = `<a class="heroi" href="#/evento/${prox.id}/resumo"><div class="heroi-ic">${iconeTipo(prox.tipo)}</div><div class="heroi-txt"><small>Próximo evento</small><h2>${esc(prox.nome)}</h2>
      <p>${dataBr(prox.data)} (${diaSemana(prox.data)})${prox.hora ? ' às ' + esc(prox.hora) : ''}${prox.local ? ' · ' + esc(prox.local) : ''}</p>
      <div class="heroi-meta">${selo(contagem(prox.data), 'forte')}${selo(`${k.pSim} confirmados de ${k.pSim + k.pPend + k.pNao}`)}${selo(`Checklist ${p.pct}%`)}</div></div></a>`;
  }
  return `<div class="topo-pagina"><div><h1>Olá${c.responsavel ? ', ' + esc(c.responsavel.split(' ')[0]) : ''}! 👋</h1><p class="mudo">${ativos.length ? plural(ativos.length, 'evento em andamento', 'eventos em andamento') : 'Vamos planejar a próxima festa?'}</p></div>
    <button class="btn primario" data-acao="evento-novo">+ Novo evento</button></div>
    ${heroi}
    <div class="kpis">${kpi('Pessoas confirmadas', conf)}${kpi('A pagar (fornecedores)', brl(aPagar))}${ehPro() ? kpi('A receber (clientes)', brl(aReceber)) : ''}${kpi('Eventos ativos', ativos.length)}</div>
    <div class="cartao"><h3>Próximos 7 dias e atrasados</h3>${lem.length ? `<ul class="lista-lem">${lem.slice(0, 12).map((l) => `<li class="${l.atraso ? 'atraso' : ''}"><a href="#/evento/${l.evId}/${l.tipo === 'tarefa' ? 'checklist' : l.tipo === 'pagar' ? 'fornecedores' : 'contrato'}">
      <span class="lem-ic">${l.tipo === 'pagar' ? '💸' : l.tipo === 'receber' ? '💰' : '✅'}</span><span class="lem-t"><b>${esc(l.texto)}</b><small>${esc(l.evNome)}</small></span>
      <span class="lem-d">${l.valor ? brl(l.valor) + '<br>' : ''}${l.atraso ? 'atrasado · ' : ''}${dataBr(l.data)}</span></a></li>`).join('')}</ul>` : '<p class="mudo">Nada urgente por aqui. 🎈</p>'}</div>
    ${S.eventos.length < 2 && !S.demo ? '<div class="cartao dica"><b>Quer ver o app cheio?</b> Carregue um exemplo para explorar todas as telas. <button class="btn" data-acao="carregar-demo">Carregar exemplo</button></div>' : ''}`;
}

// ---------- Eventos ----------
function cartaoEvento(e) {
  const k = contarConvidados(e), p = progressoChecklist(e);
  return `<a class="cartao evento-cartao" href="#/evento/${e.id}/resumo"><div class="ec-ic">${iconeTipo(e.tipo)}</div><div class="ec-corpo"><h3>${esc(e.nome)}</h3>
    <p class="mudo">${e.data ? dataBr(e.data) + ' · ' + contagem(e.data) : 'Sem data'}${e.clienteId ? ' · ' + esc(nomeCliente(e.clienteId)) : ''}</p>
    <div class="ec-meta">${selo(`${k.pSim}/${k.pSim + k.pPend + k.pNao} confirmados`)}${selo(`Checklist ${p.pct}%`)}${e.status !== 'planejando' ? selo(STATUS_EVENTO.find((s) => s[0] === e.status)[1], e.status) : ''}</div>${barra(p.pct)}</div></a>`;
}
function tela_eventos() {
  const hoje = hojeIso(), f = ui.filtroEv;
  let lista = S.eventos.slice().sort((a, b) => ((a.data || '9999') < (b.data || '9999') ? -1 : 1));
  if (f === 'proximos') lista = lista.filter((e) => !e.data || e.data >= hoje).filter((e) => e.status !== 'cancelado');
  else if (f === 'passados') lista = lista.filter((e) => e.data && e.data < hoje).reverse();
  return `<div class="topo-pagina"><div><h1>Eventos</h1><p class="mudo">${plural(S.eventos.length, 'evento', 'eventos')} no total</p></div><button class="btn primario" data-acao="evento-novo">+ Novo evento</button></div>
    <div class="filtros">${[['proximos', 'Próximos'], ['passados', 'Passados'], ['todos', 'Todos']].map(([v, t]) => `<button class="chip ${f === v ? 'ativo' : ''}" data-acao="filtro-ev" data-v="${v}">${t}</button>`).join('')}</div>
    ${lista.length ? `<div class="grade-cartoes">${lista.map(cartaoEvento).join('')}</div>` : vazioHtml('Nenhum evento aqui.', '<button class="btn primario" data-acao="evento-novo">+ Criar o primeiro</button>')}`;
}
acoes['filtro-ev'] = (el) => { ui.filtroEv = el.dataset.v; render(); };

function camposEvento(novo) {
  const clientes = [['', '— sem cliente —'], ...S.clientes.map((c) => [c.id, c.nome])];
  const campos = [
    { id: 'nome', rotulo: 'Nome da festa', tipo: 'texto', req: true, ph: 'Ex.: Aniversário de 30 anos da Ana', larg: 'inteiro' },
    { id: 'tipo', rotulo: 'Tipo de festa', tipo: 'select', opcoes: TIPOS.map((t) => [t.id, `${t.ic} ${t.nome}`]) },
    { id: 'data', rotulo: 'Data', tipo: 'data' }, { id: 'hora', rotulo: 'Hora de início', tipo: 'hora' },
    { id: 'duracaoH', rotulo: 'Duração (horas)', tipo: 'numero', dica: 'Usada para calcular bebidas.' },
    { id: 'local', rotulo: 'Local', tipo: 'texto', larg: 'inteiro' },
    { id: 'anfitriao', rotulo: ehPro() ? 'Quem está festejando (ex.: noivos, aniversariante)' : 'Anfitrião(ã)', tipo: 'texto', larg: 'inteiro' },
    { id: 'orcamentoTotal', rotulo: 'Orçamento total (R$)', tipo: 'dinheiro', dica: novo ? 'Se informar, o orçamento já vem distribuído por categoria.' : '' },
  ];
  if (ehPro()) { campos.splice(7, 0, { id: 'clienteId', rotulo: 'Cliente', tipo: 'select', opcoes: clientes }); if (novo) campos.splice(8, 0, { id: 'clienteNovo', rotulo: 'ou cadastrar novo cliente', tipo: 'texto', ph: 'Nome do cliente' }); }
  return campos;
}
acoes['evento-novo'] = () => {
  const modelos = [['padrao', '✨ Modelo pronto do tipo escolhido'], ...S.modelos.map((m) => [m.id, `📋 ${m.nome} (meu modelo)`]), ['nenhum', '⬜ Começar vazio']];
  formulario({
    titulo: 'Novo evento', largo: true, valores: { tipo: 'aniversario', duracaoH: 4 },
    campos: [...camposEvento(true), { id: 'modelo', rotulo: 'Começar com', tipo: 'select', opcoes: modelos, larg: 'inteiro', dica: 'O modelo traz checklist com prazos, cronograma, roteiro, orçamento e quantidades.' }],
    salvarTexto: 'Criar evento',
    salvar: (v) => {
      if (v.clienteNovo) { const c = { id: uid(), nome: v.clienteNovo, telefone: '', email: '', obs: '' }; S.clientes.push(c); v.clienteId = c.id; }
      const ev = novoEvento(v); S.eventos.push(ev); gravar(); irPara(`#/evento/${ev.id}/resumo`);
    },
  });
};
acoes['evento-editar'] = () => {
  const ev = evAtual();
  formulario({
    titulo: 'Dados do evento', largo: true, valores: ev,
    campos: [...camposEvento(false), { id: 'status', rotulo: 'Situação', tipo: 'select', opcoes: STATUS_EVENTO }, { id: 'obs', rotulo: 'Observações (ex.: traje, tema)', tipo: 'area', larg: 'inteiro' }],
    salvar: (v) => {
      delete v.clienteNovo;
      const mudouDia = v.data !== ev.data || v.hora !== ev.hora;
      if (mudouDia) reagendar(ev, v.data, v.hora);   // prazos do checklist e horários do cronograma acompanham
      delete v.data; delete v.hora;
      Object.assign(ev, v, { duracaoH: v.duracaoH || 4 }); alterou();
      if (mudouDia) toast('Data alterada: prazos do checklist e horários do cronograma foram ajustados.');
    },
  });
};
// Cópia com ids novos (e mesas ligadas aos convidados certos); zera o que é "andamento".
function clonarEvento(ev) {
  const copia = JSON.parse(JSON.stringify(ev)), mapa = {};
  (function ids(o) { if (Array.isArray(o)) o.forEach(ids); else if (o && typeof o === 'object') { if (typeof o.id === 'string') { const n = uid(); mapa[o.id] = n; o.id = n; } Object.values(o).forEach(ids); } })(copia);
  copia.convidados.forEach((g) => { if (g.mesaId) g.mesaId = mapa[g.mesaId] || ''; });
  copia.checklist.forEach((c) => { c.feito = false; }); copia.compras.forEach((c) => { c.comprado = false; });
  copia.fornecedores.forEach((f) => (f.pagamentos || []).forEach((p) => { p.pago = false; delete p.dataPago; }));
  (copia.contrato.parcelas || []).forEach((p) => { p.pago = false; });
  copia.convidados.forEach((g) => { g.rsvp = 'pendente'; });
  copia.proposta.status = 'rascunho'; delete copia.proposta.aprovadoEm; delete copia.proposta.aprovadoPor;
  copia.status = 'planejando'; copia.nome = ev.nome + ' (cópia)'; copia.criadoEm = hojeIso();
  return copia;
}
acoes['evento-duplicar'] = () => {
  const ev = evAtual();
  formulario({
    titulo: 'Duplicar evento', intro: 'Cria uma cópia com convidados, fornecedores, listas e modelos. Respostas, tarefas e pagamentos voltam a “pendente”, e os prazos acompanham a nova data.',
    valores: { nome: ev.nome + ' (cópia)', data: '', hora: ev.hora }, campos: [{ id: 'nome', rotulo: 'Nome da cópia', tipo: 'texto', req: true, larg: 'inteiro' }, { id: 'data', rotulo: 'Nova data', tipo: 'data' }, { id: 'hora', rotulo: 'Hora de início', tipo: 'hora' }],
    salvarTexto: 'Duplicar',
    salvar: (v) => {
      const c = clonarEvento(ev); c.nome = v.nome; reagendar(c, v.data, v.hora, true);
      if (!v.data) { c.data = ''; c.checklist.forEach((t) => { t.prazo = ''; }); }
      S.eventos.push(c); gravar(); toast('Evento duplicado!'); irPara(`#/evento/${c.id}/resumo`);
    },
  });
};
acoes['evento-excluir'] = () => confirmar(`Excluir "${evAtual().nome}" e tudo dentro dele? Não tem volta (faça um backup antes, se quiser).`, () => { S.eventos = S.eventos.filter((e) => e.id !== evAtual().id); gravar(); irPara('#/eventos'); });
acoes['evento-modelo'] = () => formulario({
  titulo: 'Salvar como meu modelo', intro: 'Guarda checklist, cronograma, roteiro, orçamento (em %), quantidades e compras para usar em outras festas.', campos: [{ id: 'nome', rotulo: 'Nome do modelo', tipo: 'texto', req: true, larg: 'inteiro' }],
  salvar: (v) => { S.modelos.push(modeloDeEvento(evAtual(), v.nome)); alterou(); toast('Modelo salvo!'); },
});

// ---------- Hub do evento ----------
function listaAbas(ev) {
  const k = contarConvidados(ev), p = progressoChecklist(ev);
  const a = [['resumo', 'Resumo'], ['convidados', `Convidados (${k.convites})`], ['mesas', 'Mesas'], ['quantidades', 'Quantidades'], ['compras', `Compras (${ev.compras.length})`], ['checklist', `Checklist (${p.feitas}/${p.total})`],
    ['cronograma', 'Cronograma'], ['roteiro', 'Roteiro'], ['fornecedores', `Fornecedores (${ev.fornecedores.length})`], ['orcamento', 'Orçamento'], ['playlist', 'Playlist'], ['moodboard', 'Moodboard'],
    ['equipe', ehPro() ? 'Equipe' : 'Ajudantes']];
  if (ehPro()) a.push(['proposta', 'Proposta'], ['contrato', 'Contrato']);
  a.push(['imprimir', 'Imprimir']);
  return a;
}
function tela_evento() {
  const r = rotaAtual(), ev = evento(r.a);
  if (!ev) return vazioHtml('Esse evento não existe mais.', '<a class="btn primario" href="#/eventos">Ver eventos</a>');
  const aba = ABAS[r.b] ? r.b : 'resumo';
  return `<div class="evento-topo"><a class="voltar" href="#/eventos">← Eventos</a>
    <div class="et-linha"><div class="et-ic">${iconeTipo(ev.tipo)}</div><div><h1>${esc(ev.nome)}</h1>
    <p class="mudo">${ev.data ? `${dataBr(ev.data)} (${diaSemana(ev.data)})` : 'Sem data'}${ev.hora ? ' às ' + esc(ev.hora) : ''}${ev.local ? ' · ' + esc(ev.local) : ''}${ev.clienteId ? ' · ' + esc(nomeCliente(ev.clienteId)) : ''}</p></div>
    ${ev.data ? `<div class="et-selo">${selo(contagem(ev.data), 'forte')}</div>` : ''}</div></div>
    <nav class="abas" id="abas">${listaAbas(ev).map(([id, t]) => `<a class="aba ${id === aba ? 'ativa' : ''}" href="#/evento/${ev.id}/${id}" data-aba="${id}">${esc(t)}</a>`).join('')}</nav>
    <section class="aba-corpo">${ABAS[aba](ev)}</section>`;
}

ABAS.resumo = (ev) => {
  const k = contarConvidados(ev), p = progressoChecklist(ev), f = resumoFinanceiro(ev), lem = lembretes({ eventos: [ev], clientes: S.clientes }, hojeIso(), 14);
  const sem = ev.convidados.filter((g) => g.rsvp !== 'nao' && !g.mesaId).length;
  const prox = ev.checklist.filter((c) => !c.feito).sort((a, b) => ((a.prazo || '9') < (b.prazo || '9') ? -1 : 1)).slice(0, 5);
  return `<div class="kpis">${kpi('Pessoas confirmadas', k.pSim)}${kpi('Aguardando resposta', k.pPend)}${kpi('Não vão', k.pNao)}${kpi('Crianças', k.criancas)}</div>
  <div class="grade-2">
    <div class="cartao"><h3>Checklist</h3>${barra(p.pct)}<p class="mudo">${p.feitas} de ${p.total} tarefas feitas (${p.pct}%)</p>
      ${prox.length ? `<ul class="lista-simples">${prox.map((c) => `<li>${esc(c.texto)}${c.prazo ? `<small class="${c.prazo < hojeIso() ? 'atrasado' : ''}"> até ${dataBr(c.prazo)}</small>` : ''}</li>`).join('')}</ul>` : '<p>Tudo pronto! 🎉</p>'}
      <a class="btn" href="#/evento/${ev.id}/checklist">Abrir checklist</a></div>
    <div class="cartao"><h3>Dinheiro</h3><table class="tab-min"><tr><td>Orçamento total</td><td>${brl(f.tot.orcamentoTotal || f.tot.previsto)}</td></tr><tr><td>Contratado + compras</td><td>${brl(f.tot.contratado)}</td></tr>
      <tr><td>Já pago</td><td>${brl(f.tot.pago)}</td></tr><tr><td><b>A pagar</b></td><td><b>${brl(f.tot.aPagar)}</b></td></tr><tr><td>Saldo do orçamento</td><td class="${f.tot.saldo < 0 ? 'neg' : 'pos'}">${brl(f.tot.saldo)}</td></tr></table>
      <a class="btn" href="#/evento/${ev.id}/orcamento">Ver orçamento</a></div>
  </div>
  <div class="grade-2">
    <div class="cartao"><h3>Atenção</h3><ul class="lista-simples">
      ${k.pPend ? `<li>${plural(k.pPend, 'pessoa ainda não respondeu', 'pessoas ainda não responderam')} ao convite</li>` : ''}
      ${sem && ev.mesas.length ? `<li>${plural(sem, 'convidado sem mesa', 'convidados sem mesa')}</li>` : ''}
      ${!ev.fornecedores.length ? '<li>Nenhum fornecedor cadastrado</li>' : ''}${!ev.data ? '<li>Defina a data da festa</li>' : ''}
      ${lem.filter((l) => l.tipo !== 'tarefa').slice(0, 4).map((l) => `<li class="${l.atraso ? 'atrasado' : ''}">${esc(l.texto)} — ${dataBr(l.data)}${l.valor ? ' · ' + brl(l.valor) : ''}</li>`).join('')}
      ${!k.pPend && (!sem || !ev.mesas.length) && ev.fornecedores.length && ev.data ? '<li>Sem pendências importantes. 👏</li>' : ''}</ul></div>
    <div class="cartao"><h3>Ações do evento</h3><div class="botoes-col">
      <button class="btn" data-acao="evento-editar">✏️ Editar dados</button><button class="btn" data-acao="evento-duplicar">📄 Duplicar (reaproveitar)</button>
      <button class="btn" data-acao="evento-modelo">📋 Salvar como meu modelo</button><button class="btn perigo" data-acao="evento-excluir">🗑 Excluir evento</button></div></div>
  </div>${ev.obs ? `<div class="cartao"><h3>Observações</h3><p>${esc(ev.obs).replace(/\n/g, '<br>')}</p></div>` : ''}`;
};

// ---------- Clientes ----------
function tela_clientes() {
  return `<div class="topo-pagina"><div><h1>Clientes</h1><p class="mudo">${plural(S.clientes.length, 'cliente', 'clientes')}</p></div><button class="btn primario" data-acao="cliente-novo">+ Novo cliente</button></div>
  ${S.clientes.length ? `<input class="busca" placeholder="🔎 Buscar cliente" data-filtro=".linha-cli"><div class="grade-cartoes">${S.clientes.slice().sort((a, b) => a.nome.localeCompare(b.nome)).map((c) => {
    const evs = S.eventos.filter((e) => e.clienteId === c.id);
    return `<div class="cartao linha-cli" data-texto="${esc(normaliza(c.nome))}"><h3>${esc(c.nome)}</h3><p class="mudo">${esc(c.telefone || 'sem telefone')}${c.email ? ' · ' + esc(c.email) : ''}</p>
      ${evs.map((e) => `<a class="selo" href="#/evento/${e.id}/resumo">${iconeTipo(e.tipo)} ${esc(e.nome)}</a>`).join(' ') || '<p class="mudo">Nenhum evento ainda.</p>'}
      <div class="botoes-lin"><button class="btn" data-acao="cliente-editar" data-id="${c.id}">Editar</button>${c.telefone ? `<a class="btn" target="_blank" rel="noopener" href="${linkWa(c.telefone, `Oi, ${c.nome.split(' ')[0]}!`)}">WhatsApp</a>` : ''}</div></div>`;
  }).join('')}</div>` : vazioHtml('Cadastre seus clientes para ligar cada festa a quem contratou.', '<button class="btn primario" data-acao="cliente-novo">+ Novo cliente</button>')}`;
}
function formCliente(c) {
  formulario({
    titulo: c ? 'Editar cliente' : 'Novo cliente', valores: c || {},
    campos: [{ id: 'nome', rotulo: 'Nome', tipo: 'texto', req: true, larg: 'inteiro' }, { id: 'telefone', rotulo: 'WhatsApp / telefone', tipo: 'tel' }, { id: 'email', rotulo: 'E-mail', tipo: 'email' }, { id: 'obs', rotulo: 'Observações', tipo: 'area', larg: 'inteiro' }],
    excluir: c ? () => { S.clientes = S.clientes.filter((x) => x.id !== c.id); S.eventos.forEach((e) => { if (e.clienteId === c.id) e.clienteId = ''; }); fecharModal(); alterou(); } : null,
    salvar: (v) => { if (c) Object.assign(c, v); else S.clientes.push({ id: uid(), ...v }); alterou(); },
  });
}
acoes['cliente-novo'] = () => formCliente(null);
acoes['cliente-editar'] = (el) => formCliente(S.clientes.find((c) => c.id === el.dataset.id));

// ---------- Banco de fornecedores ----------
function tela_banco() {
  return `<div class="topo-pagina"><div><h1>Banco de fornecedores</h1><p class="mudo">Sua agenda de fornecedores, com preços de referência para orçar mais rápido.</p></div><button class="btn primario" data-acao="banco-novo">+ Novo fornecedor</button></div>
  ${S.banco.length ? `<input class="busca" placeholder="🔎 Buscar por nome ou categoria" data-filtro=".linha-banco"><div class="tabela-rolar"><table class="tabela"><thead><tr><th>Fornecedor</th><th>Categoria</th><th>Contato</th><th>Preço de referência</th><th></th></tr></thead><tbody>
    ${S.banco.slice().sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nome.localeCompare(b.nome)).map((b) => `<tr class="linha-banco" data-texto="${esc(normaliza(b.nome + ' ' + b.categoria))}"><td><b>${esc(b.nome)}</b>${b.obs ? `<br><small class="mudo">${esc(b.obs)}</small>` : ''}</td><td>${esc(b.categoria)}</td>
    <td>${esc(b.contato || '')}${b.telefone ? `<br><a target="_blank" rel="noopener" href="${linkWa(b.telefone, 'Olá! Gostaria de um orçamento.')}">${esc(b.telefone)}</a>` : ''}</td><td>${b.preco ? brl(b.preco) + (b.unidade ? ' / ' + esc(b.unidade) : '') : '—'}</td>
    <td class="acoes-lin"><button class="btn mini" data-acao="banco-editar" data-id="${b.id}">Editar</button></td></tr>`).join('')}</tbody></table></div>` : vazioHtml('Guarde aqui os fornecedores que você já usa (buffet, decoração, DJ…).', '<button class="btn primario" data-acao="banco-novo">+ Novo fornecedor</button>')}`;
}
function formBanco(b, aoSalvar) {
  formulario({
    titulo: b ? 'Editar fornecedor' : 'Novo fornecedor no banco', valores: b || { categoria: CATEGORIAS[0] }, largo: true,
    campos: [{ id: 'nome', rotulo: 'Nome', tipo: 'texto', req: true, larg: 'inteiro' }, { id: 'categoria', rotulo: 'Categoria', tipo: 'select', opcoes: CATEGORIAS }, { id: 'contato', rotulo: 'Pessoa de contato', tipo: 'texto' },
      { id: 'telefone', rotulo: 'WhatsApp / telefone', tipo: 'tel' }, { id: 'preco', rotulo: 'Preço de referência (R$)', tipo: 'dinheiro' }, { id: 'unidade', rotulo: 'por (pessoa, festa, hora…)', tipo: 'texto', ph: 'pessoa' }, { id: 'obs', rotulo: 'Observações', tipo: 'area', larg: 'inteiro' }],
    excluir: b ? () => { S.banco = S.banco.filter((x) => x.id !== b.id); fecharModal(); alterou(); } : null,
    salvar: (v) => { if (b) Object.assign(b, v); else S.banco.push({ id: uid(), ...v }); if (aoSalvar) aoSalvar(); else alterou(); },
  });
}
acoes['banco-novo'] = () => formBanco(null);
acoes['banco-editar'] = (el) => formBanco(S.banco.find((b) => b.id === el.dataset.id));

// ---------- Modelos ----------
function tela_modelos() {
  return `<div class="topo-pagina"><div><h1>Modelos e biblioteca</h1><p class="mudo">Reaproveite o que já deu certo.</p></div></div>
  <div class="cartao"><h3>Modelos prontos</h3><p class="mudo">Ao criar um evento você escolhe o tipo e o app já traz checklist com prazos, cronograma, roteiro, orçamento e quantidades.</p>
    <div class="chips-lin">${TIPOS.map((t) => `<span class="selo">${t.ic} ${esc(t.nome)}</span>`).join('')}</div></div>
  <div class="cartao"><h3>Meus modelos</h3>${S.modelos.length ? `<ul class="lista-simples">${S.modelos.map((m) => `<li><b>${esc(m.nome)}</b> <small class="mudo">${iconeTipo(m.tipo)} ${m.checklist.length} tarefas · ${m.cronograma.length} no cronograma · criado em ${dataBr(m.criadoEm)}</small>
      <button class="btn mini perigo" data-acao="modelo-excluir" data-id="${m.id}">Excluir</button></li>`).join('')}</ul>` : '<p class="mudo">Dentro de qualquer evento, use “Salvar como meu modelo”.</p>'}</div>
  <div class="cartao"><h3>Playlists salvas</h3>${S.playlists.length ? `<ul class="lista-simples">${S.playlists.map((p) => `<li><b>${esc(p.nome)}</b> <small class="mudo">${p.faixas.length} músicas${p.link ? ' · tem link' : ''}</small>
      <button class="btn mini perigo" data-acao="playlist-biblioteca-excluir" data-id="${p.id}">Excluir</button></li>`).join('')}</ul>` : '<p class="mudo">Na aba Playlist de um evento, use “Salvar na biblioteca”.</p>'}</div>`;
}
acoes['modelo-excluir'] = (el) => confirmar('Excluir este modelo?', () => { S.modelos = S.modelos.filter((m) => m.id !== el.dataset.id); alterou(); });
acoes['playlist-biblioteca-excluir'] = (el) => confirmar('Excluir esta playlist da biblioteca?', () => { S.playlists = S.playlists.filter((m) => m.id !== el.dataset.id); alterou(); });

// ---------- Ajustes ----------
function tela_config() {
  const c = S.config;
  return `<div class="topo-pagina"><div><h1>Ajustes</h1></div></div>
  <div class="cartao"><h3>Como você usa o app</h3><div class="escolha">
    <button class="opcao ${c.modo === 'pessoal' ? 'ativa' : ''}" data-acao="modo-troca" data-modo="pessoal"><b>🎈 Minha festa</b><span>Sem clientes, propostas ou contratos.</span></button>
    <button class="opcao ${c.modo === 'profissional' ? 'ativa' : ''}" data-acao="modo-troca" data-modo="profissional"><b>💼 Profissional</b><span>Clientes, banco de fornecedores, proposta com aprovação, contrato e equipe.</span></button></div></div>
  <div class="cartao"><h3>Sua marca</h3><p class="mudo">Aparece nas impressões, propostas e convites.</p>
    <div class="grade-form"><label class="campo"><span>Nome do negócio / seu nome</span><input id="cfgNegocio" value="${esc(c.negocio)}" data-muda="cfg" data-k="negocio"></label>
    <label class="campo"><span>Responsável</span><input id="cfgResp" value="${esc(c.responsavel)}" data-muda="cfg" data-k="responsavel"></label>
    <label class="campo"><span>WhatsApp (recebe as respostas dos convites)</span><input type="tel" value="${esc(c.telefone)}" data-muda="cfg" data-k="telefone" placeholder="(11) 99999-0000"></label>
    <label class="campo"><span>Cor do app</span><input type="color" value="${esc(c.cor)}" data-muda="cfg" data-k="cor"></label>
    <label class="campo inteiro"><span>Rodapé das impressões</span><input value="${esc(c.rodape)}" data-muda="cfg" data-k="rodape" placeholder="Ex.: Ateliê Festa Bonita · @festabonita · (11) 99999-0000"></label></div>
    <div class="botoes-lin">${c.logo ? `<img class="logo-previa" src="${c.logo}" alt="logo">` : ''}<label class="btn">📷 ${c.logo ? 'Trocar logo' : 'Enviar logo'}<input type="file" accept="image/*" hidden data-muda="logo"></label>${c.logo ? '<button class="btn" data-acao="logo-remover">Remover logo</button>' : ''}</div></div>
  ${cartaoNuvem()}
  <div class="cartao"><h3>Seus dados</h3><p class="mudo">Tudo fica salvo neste aparelho (${usoArmazenamentoKB()} KB usados)${nuvemLogada() ? ' e sincronizado com a sua conta' : ''}. Faça backup de vez em quando e use o arquivo para levar os dados a outro aparelho.</p>
    <div class="botoes-lin"><button class="btn primario" data-acao="backup-baixar">⬇️ Baixar backup</button><label class="btn">⬆️ Restaurar backup<input type="file" accept=".json,application/json" hidden data-muda="backup"></label>
    <button class="btn" data-acao="carregar-demo">👀 Carregar exemplo</button><button class="btn perigo" data-acao="apagar-tudo">Apagar tudo</button></div></div>
  <div class="cartao"><h3>Instalar no celular</h3><p>Abra este endereço no navegador do celular e use <b>Compartilhar → Adicionar à Tela de Início</b> (iPhone) ou <b>Instalar app</b> (Android). Ele passa a abrir como um aplicativo, até sem internet.</p>
    <p class="mudo">Dudoo Parties v${VERSAO}</p></div>`;
}
acoes['modo-troca'] = (el) => { S.config.modo = el.dataset.modo; alterou(); };
muda['cfg'] = (el) => { S.config[el.dataset.k] = el.value.trim(); gravar(); if (el.dataset.k === 'cor') aplicarCor(); };
muda['logo'] = async (el) => { const f = el.files[0]; if (!f) return; try { S.config.logo = await lerImagem(f, 300, true); alterou(); } catch (e) { toast(e.message, true); } };
acoes['logo-remover'] = () => { S.config.logo = ''; alterou(); };
acoes['backup-baixar'] = () => { baixar(`dudoo-parties-backup-${hojeIso()}.json`, exportarJson(), 'application/json'); toast('Backup baixado.'); };
muda['backup'] = (el) => {
  const f = el.files[0]; if (!f) return; const r = new FileReader();
  r.onload = () => { try { const d = JSON.parse(r.result); if (!d || !Array.isArray(d.eventos)) throw new Error('x'); confirmar('Substituir TODOS os dados atuais por este backup?' + avisoNuvem(), () => { substituirDados(d); aplicarCor(); irPara('#/inicio'); toast('Backup restaurado.'); }, 'Restaurar'); } catch (e) { toast('Esse arquivo não parece um backup do Parties.', true); } };
  r.readAsText(f);
};
acoes['apagar-tudo'] = () => confirmar('Apagar TODOS os dados (eventos, clientes, modelos)? Baixe um backup antes!' + avisoNuvem(), () => { substituirDados(dadosVazios()); irPara('#/inicio'); }, 'Apagar tudo');

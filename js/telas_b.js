'use strict';
// Dudoo Parties — abas do evento (parte 1): convidados, mesas, quantidades, compras, checklist, cronograma e roteiro.
const FAIXAS = [['adulto', 'Adulto'], ['crianca', 'Criança'], ['bebe', 'Bebê (não come)']];
const RSVPS = [['pendente', 'Aguardando'], ['sim', 'Vai'], ['nao', 'Não vai']];
const nomeMesa = (ev, id) => (ev.mesas.find((m) => m.id === id) || {}).nome || '';
const porNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR');

// =============== CONVIDADOS ===============
ABAS.convidados = (ev) => {
  const k = contarConvidados(ev), f = ui.rsvp;
  const lista = ev.convidados.filter((g) => f === 'todos' || (g.rsvp || 'pendente') === f).sort(porNome);
  const chips = [['todos', `Todos (${k.convites})`], ['pendente', `Aguardando (${k.pendente})`], ['sim', `Vão (${k.sim})`], ['nao', `Não vão (${k.nao})`]];
  return `<div class="kpis">${kpi('Convites', k.convites)}${kpi('Pessoas previstas', k.total)}${kpi('Confirmadas', k.pSim, 'ok')}${kpi('Aguardando', k.pPend)}${kpi('Crianças', k.criancas)}</div>
  ${Object.keys(k.restricoes).length ? `<p class="mudo">Restrições: ${Object.entries(k.restricoes).map(([r, n]) => `<b>${n}</b> ${esc(r.toLowerCase())}`).join(' · ')}</p>` : ''}
  <div class="barra-ferramentas"><button class="btn primario" data-acao="conv-novo">+ Convidado</button><button class="btn" data-acao="conv-importar">📥 Importar lista</button>
    <button class="btn" data-acao="conv-convites">💬 Enviar convites</button><button class="btn" data-acao="conv-respostas">📨 Colar respostas</button><button class="btn" data-acao="imp-convidados">🖨 Imprimir</button></div>
  <div class="filtros">${chips.map(([v, t]) => `<button class="chip ${f === v ? 'ativo' : ''}" data-acao="filtro-rsvp" data-v="${v}">${t}</button>`).join('')}<input class="busca" placeholder="🔎 Buscar convidado" data-filtro=".linha-conv"></div>
  ${lista.length ? `<div class="tabela-rolar"><table class="tabela"><thead><tr><th>Convidado</th><th>Grupo</th><th>Faixa</th><th>Acomp.</th><th>Restrições</th><th>Resposta</th><th>Mesa</th><th></th></tr></thead><tbody>
  ${lista.map((g) => `<tr class="linha-conv" data-texto="${esc(normaliza(g.nome + ' ' + g.grupo))}"><td><b>${esc(g.nome)}</b>${g.telefone ? `<br><small class="mudo">${esc(g.telefone)}</small>` : ''}</td><td>${esc(g.grupo || '')}</td>
    <td>${esc((FAIXAS.find((x) => x[0] === (g.faixa || 'adulto')) || FAIXAS[0])[1])}</td><td>${g.acomp ? '+' + g.acomp : ''}</td>
    <td>${(g.restricoes || []).map((r) => `<span class="selo aviso">${esc(r)}</span>`).join(' ')}</td>
    <td><select class="rsvp rsvp-${g.rsvp || 'pendente'}" data-muda="rsvp" data-id="${g.id}">${RSVPS.map(([v, t]) => `<option value="${v}"${(g.rsvp || 'pendente') === v ? ' selected' : ''}>${t}</option>`).join('')}</select></td>
    <td>${esc(nomeMesa(ev, g.mesaId))}</td><td class="acoes-lin"><button class="btn mini" data-acao="conv-editar" data-id="${g.id}">Editar</button> <a class="btn mini" target="_blank" rel="noopener" title="Enviar convite pelo WhatsApp" href="${linkWa(g.telefone, mensagemConvite(ev, g, linkConviteAuto(ev, g)))}">💬</a></td></tr>`).join('')}</tbody></table></div>`
    : vazioHtml(ev.convidados.length ? 'Nenhum convidado nesse filtro.' : 'Ainda sem convidados. Adicione um a um ou cole uma lista inteira.', '<button class="btn primario" data-acao="conv-importar">📥 Importar lista</button>')}`;
};
acoes['filtro-rsvp'] = (el) => { ui.rsvp = el.dataset.v; render(); };
muda['rsvp'] = (el) => { const g = evAtual().convidados.find((x) => x.id === el.dataset.id); g.rsvp = el.value; alterou(); };
function formConvidado(g) {
  const ev = evAtual(), grupos = [...new Set(ev.convidados.map((x) => x.grupo).filter(Boolean))];
  formulario({
    titulo: g ? 'Editar convidado' : 'Novo convidado', largo: true, valores: g || { faixa: 'adulto', acomp: 0, rsvp: 'pendente' },
    campos: [{ id: 'nome', rotulo: 'Nome', tipo: 'texto', req: true, larg: 'inteiro' }, { id: 'grupo', rotulo: 'Grupo (família, amigos, trabalho…)', tipo: 'texto', sug: grupos }, { id: 'telefone', rotulo: 'WhatsApp', tipo: 'tel' },
      { id: 'faixa', rotulo: 'Faixa', tipo: 'select', opcoes: FAIXAS }, { id: 'acomp', rotulo: 'Acompanhantes', tipo: 'numero', dica: 'Quantas pessoas vêm junto.' }, { id: 'rsvp', rotulo: 'Resposta', tipo: 'select', opcoes: RSVPS },
      { id: 'restricoes', rotulo: 'Restrições alimentares', tipo: 'chips', opcoes: RESTRICOES, larg: 'inteiro' }, { id: 'obs', rotulo: 'Observações', tipo: 'texto', larg: 'inteiro' }],
    excluir: g ? () => { ev.convidados = ev.convidados.filter((x) => x.id !== g.id); fecharModal(); alterou(); } : null,
    salvar: (v) => { v.acomp = Math.max(0, parseInt(v.acomp, 10) || 0); if (g) Object.assign(g, v); else ev.convidados.push({ id: uid(), mesaId: '', ...v }); alterou(); },
  });
}
acoes['conv-novo'] = () => formConvidado(null);
acoes['conv-editar'] = (el) => formConvidado(evAtual().convidados.find((x) => x.id === el.dataset.id));
acoes['conv-importar'] = () => {
  const ev = evAtual(), outros = S.eventos.filter((e) => e.id !== ev.id && e.convidados.length);
  abrirModal(`<h3>Importar convidados</h3><p class="mudo">Cole uma lista (um por linha). Dá para escrever <b>Maria +2</b> (com 2 acompanhantes), <b>João (criança)</b> ou <b>Ana; (11) 99999-0000; 2; Família</b>.</p>
    <textarea id="impTexto" rows="8" placeholder="Maria Souza +1&#10;João Lima (criança)&#10;Ana Costa; 11 98888-7777; 0; Trabalho"></textarea>
    <div class="botoes-lin"><label class="btn">📄 Abrir arquivo .csv/.txt<input type="file" accept=".csv,.txt,text/plain,text/csv" hidden data-muda="csv-conv"></label>
    <input id="impGrupo" placeholder="Grupo para todos (opcional)" class="campo-solto"></div>
    ${outros.length ? `<hr><h4>Reaproveitar de outro evento</h4><div class="botoes-lin"><select id="impOutro">${outros.map((e) => `<option value="${e.id}">${esc(e.nome)} (${e.convidados.length})</option>`).join('')}</select>
      <label class="campo-check"><input type="checkbox" id="impSoSim"><span>só quem foi (confirmado)</span></label><button class="btn" data-acao="conv-de-evento">Copiar convidados</button></div>` : ''}
    <div class="rodape-modal"><span></span><span><button class="btn" data-acao="fechar">Cancelar</button> <button class="btn primario" data-acao="conv-importar-ok">Importar lista colada</button></span></div>`, { largo: true });
};
muda['csv-conv'] = (el) => { const f = el.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { $('#impTexto').value = r.result; }; r.readAsText(f); };
acoes['conv-importar-ok'] = () => {
  const ev = evAtual(), lista = lerListaConvidados($('#impTexto').value), grupo = $('#impGrupo').value.trim();
  if (!lista.length) { toast('Cole pelo menos um nome.', true); return; }
  const tem = new Set(ev.convidados.map((g) => normaliza(g.nome))); let n = 0, rep = 0;
  lista.forEach((l) => { if (tem.has(normaliza(l.nome))) { rep++; return; } tem.add(normaliza(l.nome)); ev.convidados.push({ id: uid(), nome: l.nome, grupo: l.grupo || grupo, faixa: l.faixa, acomp: l.acomp, telefone: l.telefone, restricoes: [], rsvp: 'pendente', mesaId: '', obs: '' }); n++; });
  fecharModal(); alterou(); toast(`${plural(n, 'convidado importado', 'convidados importados')}${rep ? ` (${rep} já existia${rep > 1 ? 'm' : ''})` : ''}.`);
};
acoes['conv-de-evento'] = () => {
  const ev = evAtual(), o = evento($('#impOutro').value), soSim = $('#impSoSim').checked, tem = new Set(ev.convidados.map((g) => normaliza(g.nome))); let n = 0;
  o.convidados.filter((g) => !soSim || g.rsvp === 'sim').forEach((g) => { if (tem.has(normaliza(g.nome))) return; n++; ev.convidados.push({ ...JSON.parse(JSON.stringify(g)), id: uid(), mesaId: '', rsvp: 'pendente' }); });
  fecharModal(); alterou(); toast(`${plural(n, 'convidado copiado', 'convidados copiados')} de "${o.nome}".`);
};
// nuv: undefined = sem nuvem; {ok:true} = links da nuvem prontos; {ok:false, erro} = nuvem ligada mas não deu para publicar agora
function htmlConvites(ev, nuv) {
  const pend = ev.convidados.filter((g) => (g.rsvp || 'pendente') === 'pendente').sort(porNome), local = location.protocol === 'file:';
  const aviso = nuv && nuv.ok ? '<p class="ok-txt">☁️ Links da nuvem prontos: quando o convidado responder, a resposta aparece sozinha aqui no app (e o convidado é marcado).</p>'
    : nuv ? `<p class="erro-form">Não consegui publicar na nuvem agora (${esc(nuv.erro)}). Os links abaixo funcionam sem a nuvem: a resposta volta pelo WhatsApp e você usa “Colar respostas”.</p>`
    : local ? '<p class="erro-form">Atenção: o app está aberto como arquivo no computador. O link do convite só funciona para os convidados quando o app estiver publicado na internet.</p>' : '';
  const como = nuv && nuv.ok ? 'Cada convidado recebe um link próprio; ele confirma na página e você já vê a resposta aqui.'
    : `Cada convidado recebe um link próprio; ele confirma e a resposta volta para o seu WhatsApp (${esc(S.config.telefone || 'cadastre o seu em Ajustes')}). Depois use “Colar respostas” para marcar tudo de uma vez.`;
  return `<h3>Enviar convites</h3>${aviso}<p class="mudo">${como}</p>
    <div class="botoes-lin"><button class="btn" data-acao="conv-link-geral">🔗 Copiar link geral</button></div>
    ${pend.length ? `<div class="lista-rolar">${pend.map((g) => `<div class="linha-envio"><span><b>${esc(g.nome)}</b><small class="mudo"> ${esc(g.telefone || 'sem telefone')}</small></span>
      <a class="btn mini" target="_blank" rel="noopener" href="${linkWa(g.telefone, mensagemConvite(ev, g, linkConviteAuto(ev, g)))}">💬 WhatsApp</a><button class="btn mini" data-acao="conv-copiar-link" data-id="${g.id}">🔗</button></div>`).join('')}</div>` : '<p>Todo mundo já respondeu! 🎉</p>'}
    <div class="rodape-modal"><span></span><button class="btn primario" data-acao="fechar">Fechar</button></div>`;
}
acoes['conv-convites'] = async () => {
  const ev = evAtual();
  if (!nuvemComLinks()) { abrirModal(htmlConvites(ev), { largo: true }); return; }
  abrirModal('<h3>Enviar convites</h3><p class="mudo">☁️ Preparando os links…</p>', { largo: true });
  let nuv;
  try { await publicarNuvem('convite', ev); nuv = { ok: true }; } catch (e) { nuv = { ok: false, erro: e.offline ? 'sem conexão' : e.message }; }
  if ($('#modal').hidden) return;   // fechou enquanto publicava
  abrirModal(htmlConvites(ev, nuv), { largo: true });
};
acoes['conv-link-geral'] = () => copiar(mensagemConvite(evAtual(), null, linkConviteAuto(evAtual(), null)), 'Mensagem com link geral copiada!');
acoes['conv-copiar-link'] = (el) => { const ev = evAtual(), g = ev.convidados.find((x) => x.id === el.dataset.id); copiar(mensagemConvite(ev, g, linkConviteAuto(ev, g)), 'Mensagem copiada!'); };
acoes['conv-respostas'] = () => {
  abrirModal(`<h3>Colar respostas dos convidados</h3><p class="mudo">Copie as mensagens que chegaram no WhatsApp (pode colar várias de uma vez). O app procura o código no fim de cada mensagem e marca a resposta.</p>
    <textarea id="respTexto" rows="8" placeholder="Cole aqui as mensagens recebidas…"></textarea><div class="rodape-modal"><span></span><span><button class="btn" data-acao="fechar">Cancelar</button> <button class="btn primario" data-acao="conv-respostas-ok">Aplicar respostas</button></span></div>`, { largo: true });
};
acoes['conv-respostas-ok'] = () => {
  const r = aplicarRespostas(evAtual(), $('#respTexto').value);
  if (!r.ok && !r.ignorados) { toast('Não encontrei nenhuma resposta nesse texto.', true); return; }
  fecharModal(); alterou(); toast(`${plural(r.ok, 'resposta aplicada', 'respostas aplicadas')}${r.novos ? ` (${r.novos} convidado${r.novos > 1 ? 's' : ''} novo${r.novos > 1 ? 's' : ''})` : ''}${r.ignorados ? `; ${r.ignorados} de outro evento ignorada${r.ignorados > 1 ? 's' : ''}` : ''}.`);
};

// =============== MESAS ===============
function fichaConv(g) {
  return `<div class="conv-chip ${g.rsvp === 'sim' ? 'ok' : ''}" draggable="true" data-drag="${g.id}" data-acao="conv-mesa" data-id="${g.id}" title="Arraste para uma mesa (ou toque para escolher)">${esc(g.nome)}${g.acomp ? `<small>+${g.acomp}</small>` : ''}</div>`;
}
ABAS.mesas = (ev) => {
  const vivos = ev.convidados.filter((g) => g.rsvp !== 'nao'), sem = vivos.filter((g) => !g.mesaId).sort(porNome);
  const lugares = ev.mesas.reduce((s, m) => s + num(m.lugares), 0), pessoas = vivos.reduce((s, g) => s + lugaresDe(g), 0);
  return `<div class="kpis">${kpi('Mesas', ev.mesas.length)}${kpi('Lugares', lugares)}${kpi('Pessoas (sem os que não vão)', pessoas)}${kpi('Sem mesa', sem.length, sem.length ? 'alerta' : 'ok')}</div>
  <div class="barra-ferramentas"><button class="btn primario" data-acao="mesa-nova">+ Mesa</button><button class="btn" data-acao="mesas-gerar">⚡ Gerar várias mesas</button><button class="btn" data-acao="mesas-auto" title="Agrupa pelo grupo do convidado e respeita os lugares">🪄 Distribuir sozinho</button>
    <button class="btn" data-acao="mesas-limpar">Limpar mesas</button><button class="btn" data-acao="imp-mesas">🖨 Imprimir</button></div>
  ${ev.mesas.length ? `<div class="mesas-layout"><div class="cartao sem-mesa" data-drop=""><h3>Sem mesa (${sem.length})</h3><div class="conv-lista">${sem.map(fichaConv).join('') || '<small class="mudo">Todos sentados! 🎉</small>'}</div></div>
    <div class="mesas-grade">${ev.mesas.map((m) => { const oc = ocupacaoMesa(ev, m.id), cheia = oc > num(m.lugares);
      return `<div class="cartao mesa ${cheia ? 'estourou' : oc === num(m.lugares) ? 'cheia' : ''}" data-drop="${m.id}"><div class="mesa-topo"><b>${esc(m.nome)}</b><span>${oc}/${num(m.lugares)}</span><button class="btn mini" data-acao="mesa-editar" data-id="${m.id}">✏️</button></div>
      <div class="conv-lista">${vivos.filter((g) => g.mesaId === m.id).sort(porNome).map(fichaConv).join('') || '<small class="mudo">Solte convidados aqui</small>'}</div></div>`; }).join('')}</div></div>`
    : vazioHtml('Crie as mesas e arraste os convidados para elas.', '<button class="btn primario" data-acao="mesas-gerar">⚡ Gerar várias mesas</button>')}`;
};
function formMesa(m) {
  const ev = evAtual();
  formulario({
    titulo: m ? 'Editar mesa' : 'Nova mesa', valores: m || { nome: `Mesa ${ev.mesas.length + 1}`, lugares: 8 },
    campos: [{ id: 'nome', rotulo: 'Nome da mesa', tipo: 'texto', req: true }, { id: 'lugares', rotulo: 'Lugares', tipo: 'numero', req: true }],
    excluir: m ? () => { ev.convidados.forEach((g) => { if (g.mesaId === m.id) g.mesaId = ''; }); ev.mesas = ev.mesas.filter((x) => x.id !== m.id); fecharModal(); alterou(); } : null,
    salvar: (v) => { if (m) Object.assign(m, v); else ev.mesas.push({ id: uid(), ...v }); alterou(); },
  });
}
acoes['mesa-nova'] = () => formMesa(null);
acoes['mesa-editar'] = (el) => formMesa(evAtual().mesas.find((m) => m.id === el.dataset.id));
acoes['mesas-gerar'] = () => formulario({
  titulo: 'Gerar várias mesas', valores: { qtd: 10, lugares: 8 }, campos: [{ id: 'qtd', rotulo: 'Quantas mesas', tipo: 'numero', req: true }, { id: 'lugares', rotulo: 'Lugares por mesa', tipo: 'numero', req: true }],
  salvar: (v) => { const ev = evAtual(); for (let i = 0; i < Math.min(60, v.qtd); i++) ev.mesas.push({ id: uid(), nome: `Mesa ${ev.mesas.length + 1}`, lugares: v.lugares }); alterou(); },
});
acoes['mesas-auto'] = () => {
  const ev = evAtual(); if (!ev.mesas.length) { toast('Crie as mesas primeiro.', true); return; }
  const s = distribuirMesas(ev); alterou(); toast(s ? `${plural(s, 'convidado não coube', 'convidados não couberam')} — adicione mesas ou lugares.` : 'Convidados distribuídos!');
};
acoes['mesas-limpar'] = () => confirmar('Tirar todos os convidados das mesas?', () => { evAtual().convidados.forEach((g) => { g.mesaId = ''; }); alterou(); }, 'Limpar');
acoes['conv-mesa'] = (el) => {
  const ev = evAtual(), g = ev.convidados.find((x) => x.id === el.dataset.id);
  formulario({ titulo: `Mesa de ${g.nome}`, valores: { mesa: g.mesaId }, campos: [{ id: 'mesa', rotulo: 'Mesa', tipo: 'select', opcoes: [['', '— sem mesa —'], ...ev.mesas.map((m) => [m.id, `${m.nome} (${ocupacaoMesa(ev, m.id)}/${num(m.lugares)})`])] }], salvar: (v) => { g.mesaId = v.mesa; alterou(); } });
};
// arrastar e soltar
let _arrastando = '';
document.addEventListener('dragstart', (e) => { const d = e.target.closest && e.target.closest('[data-drag]'); if (!d) return; _arrastando = d.dataset.drag; e.dataTransfer.setData('text/plain', _arrastando); e.dataTransfer.effectAllowed = 'move'; d.classList.add('arrastando'); });
document.addEventListener('dragend', (e) => { _arrastando = ''; $$('.arrastando,.sobre').forEach((x) => x.classList.remove('arrastando', 'sobre')); });
document.addEventListener('dragover', (e) => { const z = e.target.closest && e.target.closest('[data-drop]'); if (z && _arrastando) { e.preventDefault(); $$('.sobre').forEach((x) => x !== z && x.classList.remove('sobre')); z.classList.add('sobre'); } });
document.addEventListener('drop', (e) => {
  const z = e.target.closest && e.target.closest('[data-drop]'); if (!z || !_arrastando) return; e.preventDefault();
  const g = evAtual().convidados.find((x) => x.id === _arrastando); if (g) { g.mesaId = z.dataset.drop; alterou(); }
});

// =============== QUANTIDADES ===============
ABAS.quantidades = (ev) => {
  const k = contarConvidados(ev), res = calcularQuantitativo(ev), custo = res.reduce((s, r) => s + r.custo, 0);
  return `<div class="cartao"><h3>Quanto comprar?</h3><p class="mudo">O app multiplica convidados × regras (por pessoa ou por pessoa/hora) e soma uma margem de segurança.</p>
    <div class="grade-form"><label class="campo"><span>Contar</span><select data-muda="qtd-param" data-k="base"><option value="previstos"${ev.base === 'previstos' ? ' selected' : ''}>Todos menos quem não vai</option><option value="confirmados"${ev.base === 'confirmados' ? ' selected' : ''}>Só quem confirmou</option></select></label>
    <label class="campo"><span>Duração (horas)</span><input inputmode="decimal" value="${fmtInput(ev.duracaoH)}" data-muda="qtd-param" data-k="duracaoH"></label>
    <label class="campo"><span>Margem de segurança (%)</span><input inputmode="decimal" value="${fmtInput(ev.margem)}" data-muda="qtd-param" data-k="margem"></label></div>
    <p>${selo(`${k.adultos} adultos`)} ${selo(`${k.criancas} crianças`)} ${selo(`${k.veg} vegetarianos/veganos`)} ${k.bebes ? selo(`${k.bebes} bebês (não contam)`) : ''}</p></div>
  <div class="barra-ferramentas"><button class="btn primario" data-acao="qtd-para-compras">🛒 Enviar para a lista de compras</button><button class="btn" data-acao="regra-nova">+ Regra</button><button class="btn" data-acao="regras-padrao">↺ Voltar às regras do tipo</button><button class="btn" data-acao="imp-quantidades">🖨 Imprimir</button></div>
  <div class="tabela-rolar"><table class="tabela"><thead><tr><th>Item</th><th>Para</th><th>Regra</th><th>Total</th><th>Embalagens</th><th>Custo estimado</th><th></th></tr></thead><tbody>
  ${res.map((r) => `<tr><td><b>${esc(r.item)}</b><br><small class="mudo">${esc(r.cat)}</small></td><td>${r.alvo} ${r.aplica === 'adultos' ? 'adultos' : r.aplica === 'criancas' ? 'crianças' : r.aplica === 'vegetarianos' ? 'veg.' : 'pessoas'}</td>
    <td>${fmtNum(r.qtd, 3)} ${esc(r.un)} ${r.base === 'hora' ? 'por pessoa/hora' : 'por pessoa'}</td><td><b>${fmtNum(r.total, 1)} ${esc(r.un)}</b></td><td>${r.embalagens ? `${r.embalagens} × ${esc(r.embNome || 'emb.')}` : '—'}</td>
    <td>${r.preco ? brl(r.custo) : '—'}</td><td class="acoes-lin"><button class="btn mini" data-acao="regra-editar" data-id="${r.id}">Editar</button></td></tr>`).join('') || '<tr><td colspan="7" class="mudo">Sem regras. Use “Voltar às regras do tipo”.</td></tr>'}</tbody>
  <tfoot><tr><td colspan="5"><b>Custo estimado total</b></td><td colspan="2"><b>${brl(custo)}</b></td></tr></tfoot></table></div>`;
};
muda['qtd-param'] = (el) => { const ev = evAtual(), k = el.dataset.k; ev[k] = k === 'base' ? el.value : num(el.value); if (k === 'duracaoH' && !ev.duracaoH) ev.duracaoH = 4; alterou(); };
function formRegra(r) {
  const ev = evAtual();
  formulario({
    titulo: r ? 'Editar regra' : 'Nova regra de quantidade', largo: true, valores: r || { cat: 'Buffet / comida', un: 'un', base: 'pessoa', aplica: 'todos', qtd: 1 },
    campos: [{ id: 'item', rotulo: 'Item', tipo: 'texto', req: true, larg: 'inteiro' }, { id: 'cat', rotulo: 'Categoria', tipo: 'select', opcoes: CATEGORIAS }, { id: 'un', rotulo: 'Unidade', tipo: 'select', opcoes: ['un', 'kg', 'L', 'g'] },
      { id: 'qtd', rotulo: 'Quantidade', tipo: 'numero', req: true, dica: 'Por pessoa (ou por pessoa por hora).' }, { id: 'base', rotulo: 'Calcular', tipo: 'select', opcoes: [['pessoa', 'por pessoa'], ['hora', 'por pessoa por hora']] },
      { id: 'aplica', rotulo: 'Vale para', tipo: 'select', opcoes: REG_APLICA }, { id: 'emb', rotulo: 'Tamanho da embalagem (opcional)', tipo: 'numero', dica: 'Ex.: 2 para garrafa de 2 L.' }, { id: 'embNome', rotulo: 'Nome da embalagem', tipo: 'texto', ph: 'garrafa 2 L' },
      { id: 'preco', rotulo: 'Preço (por embalagem ou por unidade)', tipo: 'dinheiro' }],
    excluir: r ? () => { ev.qtd.regras = ev.qtd.regras.filter((x) => x.id !== r.id); fecharModal(); alterou(); } : null,
    salvar: (v) => { if (r) Object.assign(r, v); else ev.qtd.regras.push({ id: uid(), ...v }); alterou(); },
  });
}
acoes['regra-nova'] = () => formRegra(null);
acoes['regra-editar'] = (el) => formRegra(evAtual().qtd.regras.find((r) => r.id === el.dataset.id));
acoes['regras-padrao'] = () => confirmar('Trocar as regras atuais pelas regras padrão do tipo de festa?', () => { const ev = evAtual(); ev.qtd.regras = regrasPadrao(ev.tipo); alterou(); }, 'Trocar');
acoes['qtd-para-compras'] = () => {
  const ev = evAtual(), res = calcularQuantitativo(ev).filter((r) => r.total > 0); let novos = 0, atual = 0;
  res.forEach((r) => {
    const dados = { item: r.item, qtd: r.embalagens || r.total, un: r.embalagens ? r.embNome || 'emb.' : r.un, preco: num(r.preco), categoria: r.cat, origem: r.id };
    const ja = ev.compras.find((c) => c.origem === r.id);
    if (ja) { Object.assign(ja, dados); atual++; } else { ev.compras.push({ id: uid(), comprado: false, ...dados }); novos++; }
  });
  alterou(); toast(`Compras: ${novos} item(ns) novo(s), ${atual} atualizado(s).`);
};

// =============== COMPRAS ===============
ABAS.compras = (ev) => {
  const ver = ui.comprasVer, tot = ev.compras.reduce((s, i) => s + num(i.qtd) * num(i.preco), 0), feito = ev.compras.filter((i) => i.comprado).reduce((s, i) => s + num(i.qtd) * num(i.preco), 0);
  const lista = ev.compras.filter((i) => ver === 'todas' || !i.comprado), grupos = {};
  lista.forEach((i) => { (grupos[i.categoria || 'Outros'] = grupos[i.categoria || 'Outros'] || []).push(i); });
  return `<div class="kpis">${kpi('Itens', ev.compras.length)}${kpi('Estimado', brl(tot))}${kpi('Já comprado', brl(feito), 'ok')}${kpi('Falta comprar', brl(tot - feito))}</div>
  <div class="barra-ferramentas"><button class="btn primario" data-acao="compra-nova">+ Item</button><button class="btn" data-acao="compra-colar">📋 Colar lista</button><button class="btn" data-acao="imp-compras">🖨 Imprimir</button>
    <button class="chip ${ver === 'faltam' ? 'ativo' : ''}" data-acao="compras-ver" data-v="${ver === 'faltam' ? 'todas' : 'faltam'}">Só o que falta</button></div>
  ${Object.keys(grupos).sort().map((c) => `<div class="cartao"><h3>${esc(c)}</h3><ul class="lista-check">${grupos[c].map((i) => `<li class="${i.comprado ? 'feito' : ''}"><label><input type="checkbox" data-muda="compra-check" data-id="${i.id}"${i.comprado ? ' checked' : ''}>
    <span class="item-txt">${esc(i.item)}</span></label><span class="item-qtd">${fmtNum(i.qtd, 2)} ${esc(i.un || '')}</span><span class="item-val">${i.preco ? brl(num(i.qtd) * num(i.preco)) : ''}</span><button class="btn mini" data-acao="compra-editar" data-id="${i.id}">✏️</button></li>`).join('')}</ul></div>`).join('')
    || vazioHtml(ev.compras.length ? 'Tudo comprado! 🛍️' : 'Sem itens. Adicione à mão, cole uma lista ou envie da aba Quantidades.', '<button class="btn primario" data-acao="compra-nova">+ Item</button>')}`;
};
acoes['compras-ver'] = (el) => { ui.comprasVer = el.dataset.v; render(); };
muda['compra-check'] = (el) => { const i = evAtual().compras.find((x) => x.id === el.dataset.id); i.comprado = el.checked; alterou(); };
function formCompra(i) {
  const ev = evAtual();
  formulario({
    titulo: i ? 'Editar item' : 'Novo item de compra', valores: i || { categoria: 'Outros', qtd: 1, un: 'un' },
    campos: [{ id: 'item', rotulo: 'Item', tipo: 'texto', req: true, larg: 'inteiro' }, { id: 'categoria', rotulo: 'Categoria', tipo: 'select', opcoes: CATEGORIAS }, { id: 'qtd', rotulo: 'Quantidade', tipo: 'numero', req: true },
      { id: 'un', rotulo: 'Unidade', tipo: 'texto', sug: ['un', 'kg', 'L', 'pacote', 'caixa', 'garrafa'] }, { id: 'preco', rotulo: 'Preço unitário (R$)', tipo: 'dinheiro' }],
    excluir: i ? () => { ev.compras = ev.compras.filter((x) => x.id !== i.id); fecharModal(); alterou(); } : null,
    salvar: (v) => { if (i) Object.assign(i, v); else ev.compras.push({ id: uid(), comprado: false, ...v }); alterou(); },
  });
}
acoes['compra-nova'] = () => formCompra(null);
acoes['compra-editar'] = (el) => formCompra(evAtual().compras.find((x) => x.id === el.dataset.id));
acoes['compra-colar'] = () => formulario({
  titulo: 'Colar lista de compras', intro: 'Um item por linha. Pode escrever “2 kg de tomate” ou só “guardanapos”.', campos: [{ id: 'texto', rotulo: 'Itens', tipo: 'area', linhas: 8, larg: 'inteiro' }, { id: 'categoria', rotulo: 'Categoria', tipo: 'select', opcoes: CATEGORIAS, valor: 'Outros' }],
  salvar: (v) => {
    const ev = evAtual(); let n = 0;
    v.texto.split(/\r?\n/).map((l) => l.replace(/^\s*(\d+[.)\-]|[-•*])\s*/, '').trim()).filter(Boolean).forEach((l) => {
      const m = l.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|l|un|pacotes?|caixas?|garrafas?)?\s*(?:de\s+)?(.+)$/i);
      ev.compras.push({ id: uid(), item: m ? m[3] : l, qtd: m ? num(m[1]) : 1, un: m ? (m[2] || 'un').toLowerCase() : 'un', preco: 0, categoria: v.categoria, comprado: false }); n++;
    });
    alterou(); toast(`${plural(n, 'item adicionado', 'itens adicionados')}.`);
  },
});

// =============== CHECKLIST ===============
const pessoasChecklist = (ev) => [...new Set([...ev.equipe.map((e) => e.nome), ...ev.checklist.map((c) => c.resp).filter(Boolean)])].sort();
ABAS.checklist = (ev) => {
  const p = progressoChecklist(ev), hoje = hojeIso(), pessoas = pessoasChecklist(ev);
  let lista = ev.checklist.slice();
  if (ui.checkPessoa) lista = lista.filter((c) => c.resp === ui.checkPessoa);
  if (ui.checkVer === 'pendentes') lista = lista.filter((c) => !c.feito);
  const grupos = []; lista.forEach((c) => { let g = grupos.find((x) => x.nome === (c.grupo || 'Geral')); if (!g) { g = { nome: c.grupo || 'Geral', itens: [], ord: 0 }; grupos.push(g); } g.itens.push(c); });
  grupos.forEach((g) => { g.ord = Math.min(...g.itens.map((c) => c.prazo || '9999')); }); grupos.sort((a, b) => (a.ord < b.ord ? -1 : a.ord > b.ord ? 1 : 0));
  return `<div class="cartao"><div class="linha-prog"><b>${p.feitas} de ${p.total} tarefas</b><span>${p.pct}%</span></div>${barra(p.pct, 'grossa')}</div>
  <div class="barra-ferramentas"><button class="btn primario" data-acao="check-novo">+ Tarefa</button><button class="btn" data-acao="imp-checklist">🖨 Imprimir</button>
    <select data-muda="check-pessoa"><option value="">Todas as pessoas</option>${pessoas.map((n) => `<option${ui.checkPessoa === n ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>
    <button class="chip ${ui.checkVer === 'pendentes' ? 'ativo' : ''}" data-acao="check-ver">Só pendentes</button></div>
  ${grupos.map((g) => `<div class="cartao"><h3>${esc(g.nome)} <small class="mudo">${g.itens.filter((c) => c.feito).length}/${g.itens.length}</small></h3><ul class="lista-check">${g.itens.sort((a, b) => ((a.prazo || '9') < (b.prazo || '9') ? -1 : 1)).map((c) => `<li class="${c.feito ? 'feito' : ''}">
    <label><input type="checkbox" data-muda="check-feito" data-id="${c.id}"${c.feito ? ' checked' : ''}><span class="item-txt">${esc(c.texto)}</span></label>${c.resp ? `<span class="selo">${esc(c.resp)}</span>` : ''}
    ${c.prazo ? `<span class="item-prazo ${!c.feito && c.prazo < hoje ? 'atrasado' : ''}">${dataBr(c.prazo)}</span>` : ''}<button class="btn mini" data-acao="check-editar" data-id="${c.id}">✏️</button></li>`).join('')}</ul></div>`).join('')
    || vazioHtml('Nenhuma tarefa aqui.', '<button class="btn primario" data-acao="check-novo">+ Tarefa</button>')}`;
};
muda['check-pessoa'] = (el) => { ui.checkPessoa = el.value; render(); };
acoes['check-ver'] = () => { ui.checkVer = ui.checkVer === 'pendentes' ? 'todas' : 'pendentes'; render(); };
muda['check-feito'] = (el) => { const c = evAtual().checklist.find((x) => x.id === el.dataset.id); c.feito = el.checked; alterou(); };
function formCheck(c) {
  const ev = evAtual(), grupos = [...new Set(ev.checklist.map((x) => x.grupo).filter(Boolean))];
  formulario({
    titulo: c ? 'Editar tarefa' : 'Nova tarefa', valores: c || { grupo: 'Geral' },
    campos: [{ id: 'texto', rotulo: 'Tarefa', tipo: 'texto', req: true, larg: 'inteiro' }, { id: 'grupo', rotulo: 'Grupo', tipo: 'texto', sug: grupos }, { id: 'resp', rotulo: 'Responsável', tipo: 'texto', sug: pessoasChecklist(ev) }, { id: 'prazo', rotulo: 'Prazo', tipo: 'data' }],
    excluir: c ? () => { ev.checklist = ev.checklist.filter((x) => x.id !== c.id); fecharModal(); alterou(); } : null,
    salvar: (v) => { if (c) { if (v.prazo !== c.prazo) delete c.dias; Object.assign(c, v); } else ev.checklist.push({ id: uid(), feito: false, ...v }); alterou(); },
  });
}
acoes['check-novo'] = () => formCheck(null);
acoes['check-editar'] = (el) => formCheck(evAtual().checklist.find((x) => x.id === el.dataset.id));

// =============== CRONOGRAMA ===============
ABAS.cronograma = (ev) => {
  const lista = ev.cronograma.slice().sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
  return `<div class="barra-ferramentas"><button class="btn primario" data-acao="crono-novo">+ Horário</button><button class="btn" data-acao="crono-padrao">↺ Gerar do modelo</button><button class="btn" data-acao="imp-cronograma">🖨 Imprimir</button></div>
  ${lista.length ? `<div class="linha-tempo">${lista.map((c) => `<div class="lt-item lt-${c.tipo || 'festa'}"><div class="lt-hora">${esc(c.hora || '--:--')}</div><div class="lt-corpo"><b>${esc(c.texto)}</b>
    <small>${esc((TIPOS_CRONO.find((t) => t[0] === c.tipo) || ['', ''])[1])}${c.resp ? ' · ' + esc(c.resp) : ''}${c.obs ? ' · ' + esc(c.obs) : ''}</small></div><button class="btn mini" data-acao="crono-editar" data-id="${c.id}">✏️</button></div>`).join('')}</div>`
    : vazioHtml('Monte o dia da festa hora a hora: montagem, chegada dos fornecedores, parabéns…', '<button class="btn primario" data-acao="crono-padrao">Gerar do modelo</button>')}`;
};
function formCrono(c) {
  const ev = evAtual();
  formulario({
    titulo: c ? 'Editar horário' : 'Novo horário', valores: c || { tipo: 'festa', hora: ev.hora || '' },
    campos: [{ id: 'hora', rotulo: 'Hora', tipo: 'hora', req: true }, { id: 'tipo', rotulo: 'Tipo', tipo: 'select', opcoes: TIPOS_CRONO }, { id: 'texto', rotulo: 'O que acontece', tipo: 'texto', req: true, larg: 'inteiro' },
      { id: 'resp', rotulo: 'Responsável / fornecedor', tipo: 'texto', sug: [...ev.fornecedores.map((f) => f.nome), ...ev.equipe.map((e) => e.nome)] }, { id: 'obs', rotulo: 'Observação', tipo: 'texto' }],
    excluir: c ? () => { ev.cronograma = ev.cronograma.filter((x) => x.id !== c.id); fecharModal(); alterou(); } : null,
    salvar: (v) => { if (c) Object.assign(c, v); else ev.cronograma.push({ id: uid(), ...v }); alterou(); },
  });
}
acoes['crono-novo'] = () => formCrono(null);
acoes['crono-editar'] = (el) => formCrono(evAtual().cronograma.find((x) => x.id === el.dataset.id));
acoes['crono-padrao'] = () => confirmar('Gerar o cronograma padrão a partir da hora de início? Os horários atuais serão substituídos.', () => { const ev = evAtual(); if (!ev.hora) toast('Dica: defina a hora de início do evento para o cronograma sair certo.'); aplicarCronogramaPadrao(ev); alterou(); }, 'Gerar');

// =============== ROTEIRO DO CERIMONIAL ===============
ABAS.roteiro = (ev) => `<div class="barra-ferramentas"><button class="btn primario" data-acao="roteiro-novo">+ Momento</button><button class="btn" data-acao="imp-roteiro">🖨 Imprimir</button></div>
  <p class="mudo">A ordem do que acontece na festa: entradas, discursos, brindes, músicas. Use as setas para reorganizar.</p>
  ${ev.roteiro.length ? `<ol class="roteiro">${ev.roteiro.map((r, i) => `<li><div class="rot-num">${i + 1}</div><div class="rot-corpo"><b>${esc(r.texto)}</b><small>${esc(r.tipo)}${r.hora ? ' · ' + esc(r.hora) : ''}${r.resp ? ' · ' + esc(r.resp) : ''}${r.musica ? ' · 🎵 ' + esc(r.musica) : ''}${r.obs ? ' · ' + esc(r.obs) : ''}</small></div>
    <div class="rot-botoes"><button class="btn mini" data-acao="roteiro-sobe" data-id="${r.id}"${i === 0 ? ' disabled' : ''}>▲</button><button class="btn mini" data-acao="roteiro-desce" data-id="${r.id}"${i === ev.roteiro.length - 1 ? ' disabled' : ''}>▼</button><button class="btn mini" data-acao="roteiro-editar" data-id="${r.id}">✏️</button></div></li>`).join('')}</ol>`
    : vazioHtml('Sem roteiro ainda.', '<button class="btn primario" data-acao="roteiro-novo">+ Momento</button>')}`;
function formRoteiro(r) {
  const ev = evAtual();
  formulario({
    titulo: r ? 'Editar momento' : 'Novo momento do roteiro', valores: r || { tipo: 'Entrada' },
    campos: [{ id: 'tipo', rotulo: 'Tipo', tipo: 'select', opcoes: TIPOS_ROTEIRO }, { id: 'hora', rotulo: 'Hora (opcional)', tipo: 'hora' }, { id: 'texto', rotulo: 'O que acontece', tipo: 'texto', req: true, larg: 'inteiro' },
      { id: 'resp', rotulo: 'Quem conduz / fala', tipo: 'texto' }, { id: 'musica', rotulo: 'Música', tipo: 'texto' }, { id: 'obs', rotulo: 'Observações', tipo: 'texto', larg: 'inteiro' }],
    excluir: r ? () => { ev.roteiro = ev.roteiro.filter((x) => x.id !== r.id); fecharModal(); alterou(); } : null,
    salvar: (v) => { if (r) Object.assign(r, v); else ev.roteiro.push({ id: uid(), ...v }); alterou(); },
  });
}
acoes['roteiro-novo'] = () => formRoteiro(null);
acoes['roteiro-editar'] = (el) => formRoteiro(evAtual().roteiro.find((x) => x.id === el.dataset.id));
function moverRoteiro(id, d) { const l = evAtual().roteiro, i = l.findIndex((x) => x.id === id), j = i + d; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; alterou(); }
acoes['roteiro-sobe'] = (el) => moverRoteiro(el.dataset.id, -1);
acoes['roteiro-desce'] = (el) => moverRoteiro(el.dataset.id, 1);

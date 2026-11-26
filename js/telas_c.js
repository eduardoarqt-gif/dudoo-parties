'use strict';
// Dudoo Parties — abas do evento (parte 2): fornecedores, orçamento, playlist, moodboard, equipe, proposta, contrato e impressão.

// =============== FORNECEDORES ===============
const somaPag = (f, pago) => (f.pagamentos || []).filter((p) => (pago === undefined ? true : !!p.pago === pago)).reduce((s, p) => s + num(p.valor), 0);
const valorForn = (f) => num(f.valor) || somaPag(f);
ABAS.fornecedores = (ev) => {
  const tot = ev.fornecedores.reduce((s, f) => s + valorForn(f), 0), pago = ev.fornecedores.reduce((s, f) => s + somaPag(f, true), 0);
  return `<div class="kpis">${kpi('Fornecedores', ev.fornecedores.length)}${kpi('Contratado', brl(tot))}${kpi('Já pago', brl(pago), 'ok')}${kpi('A pagar', brl(Math.max(0, tot - pago)), tot - pago > 0 ? 'alerta' : '')}</div>
  <div class="barra-ferramentas"><button class="btn primario" data-acao="forn-novo">+ Fornecedor</button>${ehPro() && S.banco.length ? '<button class="btn" data-acao="forn-banco">🧾 Do meu banco</button>' : ''}<button class="btn" data-acao="imp-fornecedores">🖨 Imprimir</button></div>
  ${ev.fornecedores.length ? ev.fornecedores.map((f) => { const v = valorForn(f), pg = somaPag(f, true), pend = (f.pagamentos || []).filter((p) => !p.pago).length;
    return `<div class="cartao forn"><div class="forn-topo"><div><h3>${esc(f.nome)}</h3><p class="mudo">${esc(f.categoria || 'Outros')}${f.contato ? ' · ' + esc(f.contato) : ''}${f.telefone ? ` · <a target="_blank" rel="noopener" href="${linkWa(f.telefone, `Olá! Sobre a festa ${ev.nome}${ev.data ? ' (' + dataBr(ev.data) + ')' : ''}.`)}">${esc(f.telefone)}</a>` : ''}</p></div>
      <div class="forn-valores"><b>${brl(v)}</b><small>${v ? `pago ${brl(pg)} · falta ${brl(Math.max(0, v - pg))}` : 'sem valor'}</small></div></div>${v ? barra((pg / v) * 100) : ''}
      ${f.obs ? `<p class="mudo">${esc(f.obs)}</p>` : ''}
      ${(f.pagamentos || []).length ? `<ul class="lista-check">${f.pagamentos.slice().sort((a, b) => (a.venc || '9') < (b.venc || '9') ? -1 : 1).map((p) => `<li class="${p.pago ? 'feito' : ''}"><label><input type="checkbox" data-muda="pag-check" data-f="${f.id}" data-id="${p.id}"${p.pago ? ' checked' : ''}><span class="item-txt">${esc(p.descricao || 'Parcela')}</span></label>
        <span class="item-prazo ${!p.pago && p.venc && p.venc < hojeIso() ? 'atrasado' : ''}">${p.venc ? dataBr(p.venc) : ''}</span><span class="item-val">${brl(p.valor)}</span><button class="btn mini" data-acao="pag-editar" data-f="${f.id}" data-id="${p.id}">✏️</button></li>`).join('')}</ul>` : ''}
      <div class="botoes-lin"><button class="btn mini" data-acao="pag-novo" data-f="${f.id}">+ Pagamento</button><button class="btn mini" data-acao="pag-parcelar" data-f="${f.id}">Parcelar</button><button class="btn mini" data-acao="forn-editar" data-id="${f.id}">Editar</button>
      ${pend ? '' : ''}<button class="btn mini" data-acao="forn-ao-banco" data-id="${f.id}" title="Guardar no banco de fornecedores">⭐ Salvar no banco</button></div></div>`; }).join('')
    : vazioHtml('Cadastre quem vai trabalhar na festa: buffet, decoração, DJ, fotógrafo…', '<button class="btn primario" data-acao="forn-novo">+ Fornecedor</button>')}`;
};
const fornecedor = (id) => evAtual().fornecedores.find((f) => f.id === id);
function formForn(f, pre) {
  const ev = evAtual();
  formulario({
    titulo: f ? 'Editar fornecedor' : 'Novo fornecedor', largo: true, valores: f || pre || { categoria: CATEGORIAS[1] },
    campos: [{ id: 'nome', rotulo: 'Nome', tipo: 'texto', req: true, larg: 'inteiro' }, { id: 'categoria', rotulo: 'Categoria', tipo: 'select', opcoes: CATEGORIAS }, { id: 'valor', rotulo: 'Valor do contrato (R$)', tipo: 'dinheiro', dica: 'Se deixar em branco, vale a soma dos pagamentos.' },
      { id: 'contato', rotulo: 'Pessoa de contato', tipo: 'texto' }, { id: 'telefone', rotulo: 'WhatsApp', tipo: 'tel' }, { id: 'obs', rotulo: 'Observações / o que está incluso', tipo: 'area', larg: 'inteiro' }],
    excluir: f ? () => { ev.fornecedores = ev.fornecedores.filter((x) => x.id !== f.id); fecharModal(); alterou(); } : null,
    salvar: (v) => { if (f) Object.assign(f, v); else ev.fornecedores.push({ id: uid(), pagamentos: [], ...v }); alterou(); },
  });
}
acoes['forn-novo'] = () => formForn(null);
acoes['forn-editar'] = (el) => formForn(fornecedor(el.dataset.id));
acoes['forn-banco'] = () => {
  abrirModal(`<h3>Escolher do banco de fornecedores</h3><div class="lista-rolar">${S.banco.map((b) => `<div class="linha-envio"><span><b>${esc(b.nome)}</b><small class="mudo"> ${esc(b.categoria)}${b.preco ? ' · ' + brl(b.preco) + (b.unidade ? '/' + esc(b.unidade) : '') : ''}</small></span><button class="btn mini primario" data-acao="forn-banco-usar" data-id="${b.id}">Usar</button></div>`).join('')}</div>
    <div class="rodape-modal"><span></span><button class="btn" data-acao="fechar">Fechar</button></div>`);
};
acoes['forn-banco-usar'] = (el) => { const b = S.banco.find((x) => x.id === el.dataset.id); fecharModal(); formForn(null, { nome: b.nome, categoria: b.categoria, contato: b.contato, telefone: b.telefone, valor: b.preco || '', obs: b.obs }); };
acoes['forn-ao-banco'] = (el) => {
  const f = fornecedor(el.dataset.id);
  if (S.banco.some((b) => normaliza(b.nome) === normaliza(f.nome))) { toast('Já está no banco.'); return; }
  S.banco.push({ id: uid(), nome: f.nome, categoria: f.categoria, contato: f.contato, telefone: f.telefone, preco: num(f.valor), unidade: 'festa', obs: f.obs || '' }); alterou(); toast('Fornecedor guardado no banco.');
};
muda['pag-check'] = (el) => { const p = fornecedor(el.dataset.f).pagamentos.find((x) => x.id === el.dataset.id); p.pago = el.checked; p.dataPago = el.checked ? hojeIso() : ''; alterou(); };
function formPag(f, p) {
  formulario({
    titulo: p ? 'Editar pagamento' : `Novo pagamento — ${f.nome}`, valores: p || { descricao: 'Sinal' },
    campos: [{ id: 'descricao', rotulo: 'Descrição', tipo: 'texto', sug: ['Sinal', 'Entrada', 'Parcela', 'Saldo final'], req: true }, { id: 'valor', rotulo: 'Valor (R$)', tipo: 'dinheiro', req: true }, { id: 'venc', rotulo: 'Vencimento', tipo: 'data' }, { id: 'pago', rotulo: 'Já foi pago', tipo: 'check' }],
    excluir: p ? () => { f.pagamentos = f.pagamentos.filter((x) => x.id !== p.id); fecharModal(); alterou(); } : null,
    salvar: (v) => { if (p) Object.assign(p, v); else (f.pagamentos = f.pagamentos || []).push({ id: uid(), ...v }); alterou(); },
  });
}
acoes['pag-novo'] = (el) => formPag(fornecedor(el.dataset.f), null);
acoes['pag-editar'] = (el) => { const f = fornecedor(el.dataset.f); formPag(f, f.pagamentos.find((p) => p.id === el.dataset.id)); };
acoes['pag-parcelar'] = (el) => {
  const f = fornecedor(el.dataset.f), ev = evAtual();
  formulario({
    titulo: `Parcelar — ${f.nome}`, intro: 'Cria as parcelas com vencimento mês a mês (a diferença de centavos vai para a última).', valores: { total: valorForn(f), n: 3, primeira: ev.data ? somaMeses(ev.data, -2) : hojeIso() },
    campos: [{ id: 'total', rotulo: 'Valor total (R$)', tipo: 'dinheiro', req: true }, { id: 'n', rotulo: 'Número de parcelas', tipo: 'numero', req: true }, { id: 'primeira', rotulo: 'Vencimento da 1ª', tipo: 'data' }],
    salvar: (v) => { f.pagamentos = (f.pagamentos || []).filter((p) => p.pago); f.pagamentos.push(...parcelar(v.total, v.n, v.primeira, 'Parcela')); if (!num(f.valor)) f.valor = v.total; alterou(); },
  });
};

// =============== ORÇAMENTO ===============
ABAS.orcamento = (ev) => {
  const { linhas, tot } = resumoFinanceiro(ev), base = tot.orcamentoTotal || tot.previsto, max = Math.max(1, ...linhas.map((l) => Math.max(l.previsto, l.contratado)));
  return `<div class="kpis">${kpi('Orçamento total', brl(base))}${kpi('Contratado + compras', brl(tot.contratado))}${kpi('Já pago', brl(tot.pago), 'ok')}${kpi('A pagar', brl(tot.aPagar), tot.aPagar ? 'alerta' : '')}${kpi('Saldo', brl(tot.saldo), tot.saldo < 0 ? 'neg' : 'ok')}</div>
  <div class="barra-ferramentas"><button class="btn primario" data-acao="orc-novo">+ Categoria</button><button class="btn" data-acao="orc-total">💰 Definir orçamento total</button><button class="btn" data-acao="orc-distribuir" title="Reparte o orçamento total pelas categorias do modelo">↺ Distribuir pelo modelo</button><button class="btn" data-acao="imp-orcamento">🖨 Imprimir</button></div>
  <p class="mudo">“Contratado” soma o valor dos fornecedores e dos itens de compra da categoria. “Pago” são os pagamentos marcados e os itens já comprados.</p>
  ${linhas.length ? `<div class="tabela-rolar"><table class="tabela"><thead><tr><th>Categoria</th><th>Previsto</th><th>Contratado</th><th>Pago</th><th>A pagar</th><th>Saldo</th><th></th></tr></thead><tbody>${linhas.map((l) => `<tr><td><b>${esc(l.categoria)}</b><div class="barra-dupla"><i class="prev" style="width:${(l.previsto / max) * 100}%"></i><i class="cont ${l.saldo < 0 ? 'estoura' : ''}" style="width:${(l.contratado / max) * 100}%"></i></div></td>
    <td>${brl(l.previsto)}</td><td>${brl(l.contratado)}</td><td>${brl(l.pago)}</td><td>${brl(l.aPagar)}</td><td class="${l.saldo < 0 ? 'neg' : 'pos'}">${brl(l.saldo)}</td><td class="acoes-lin">${ev.orcamento.some((o) => o.categoria === l.categoria) ? `<button class="btn mini" data-acao="orc-editar" data-cat="${esc(l.categoria)}">Editar</button>` : `<button class="btn mini" data-acao="orc-prever" data-cat="${esc(l.categoria)}">Prever</button>`}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td>Total</td><td>${brl(tot.previsto)}</td><td>${brl(tot.contratado)}</td><td>${brl(tot.pago)}</td><td>${brl(tot.aPagar)}</td><td class="${tot.saldo < 0 ? 'neg' : 'pos'}">${brl(tot.saldo)}</td><td></td></tr></tfoot></table></div>`
    : vazioHtml('Defina o orçamento total e distribua por categoria.', '<button class="btn primario" data-acao="orc-total">Definir orçamento total</button>')}`;
};
acoes['orc-total'] = () => formulario({ titulo: 'Orçamento total da festa', valores: { total: evAtual().orcamentoTotal || '' }, campos: [{ id: 'total', rotulo: 'Valor (R$)', tipo: 'dinheiro', req: true }], salvar: (v) => { evAtual().orcamentoTotal = v.total; alterou(); } });
function formOrc(o, cat) {
  const ev = evAtual();
  formulario({
    titulo: o ? `Previsto — ${o.categoria}` : cat ? `Prever gasto — ${cat}` : 'Nova categoria', valores: o || { categoria: cat || CATEGORIAS[0] },
    campos: [{ id: 'categoria', rotulo: 'Categoria', tipo: 'texto', sug: CATEGORIAS, req: true }, { id: 'previsto', rotulo: 'Valor previsto (R$)', tipo: 'dinheiro', req: true }],
    excluir: o ? () => { ev.orcamento = ev.orcamento.filter((x) => x.id !== o.id); fecharModal(); alterou(); } : null,
    salvar: (v) => { if (o) Object.assign(o, v); else ev.orcamento.push({ id: uid(), ...v }); alterou(); },
  });
}
acoes['orc-novo'] = () => formOrc(null);
acoes['orc-editar'] = (el) => formOrc(evAtual().orcamento.find((o) => o.categoria === el.dataset.cat));
acoes['orc-prever'] = (el) => formOrc(null, el.dataset.cat);
acoes['orc-distribuir'] = () => {
  const ev = evAtual(); if (!num(ev.orcamentoTotal)) { toast('Defina o orçamento total primeiro.', true); return; }
  confirmar('Refazer o previsto de cada categoria a partir do orçamento total?', () => { const pct = ORC_PCT[ev.tipo] || ORC_PCT.padrao; ev.orcamento = Object.keys(pct).map((c) => ({ id: uid(), categoria: c, previsto: Math.round(num(ev.orcamentoTotal) * pct[c]) / 100 })); alterou(); }, 'Distribuir');
};

// =============== PLAYLIST ===============
ABAS.playlist = (ev) => {
  const abertaId = ui.playlistAberta && ev.playlists.some((p) => p.id === ui.playlistAberta) ? ui.playlistAberta : (ev.playlists[0] || {}).id;
  return `<div class="barra-ferramentas"><button class="btn primario" data-acao="pl-nova">+ Playlist</button>${S.playlists.length ? '<button class="btn" data-acao="pl-importar">📚 Da biblioteca</button>' : ''}</div>
  <p class="mudo">Aqui você guarda <b>o que pode tocar</b> e <b>o que não pode</b>, com o link da playlist (Spotify, YouTube…) para passar ao DJ ou à banda.</p>
  ${ev.playlists.length ? `<div class="filtros">${ev.playlists.map((p) => `<button class="chip ${p.id === abertaId ? 'ativo' : ''}" data-acao="pl-abrir" data-id="${p.id}">🎵 ${esc(p.nome)} (${p.faixas.length})</button>`).join('')}</div>${ev.playlists.filter((p) => p.id === abertaId).map(cartaoPlaylist).join('')}`
    : vazioHtml('Crie a playlist da festa — uma para cada momento, se quiser.', '<button class="btn primario" data-acao="pl-nova">+ Playlist</button>')}`;
};
function cartaoPlaylist(p) {
  const bloco = (tipo, tit, cls) => { const fx = p.faixas.filter((f) => f.tipo === tipo); return `<div class="pl-col ${cls}"><h4>${tit} (${fx.length})</h4>${fx.length ? `<ul class="lista-check">${fx.map((f) => `<li><span class="item-txt"><b>${esc(f.titulo)}</b>${f.artista ? ' — ' + esc(f.artista) : ''}${f.momento ? ` <small class="mudo">· ${esc(f.momento)}</small>` : ''}</span>
    <a class="btn mini" target="_blank" rel="noopener" title="Procurar no Spotify" href="${linkBuscaSpotify(f)}">▶</a><button class="btn mini" data-acao="faixa-editar" data-p="${p.id}" data-id="${f.id}">✏️</button></li>`).join('')}</ul>` : '<small class="mudo">Nada por aqui.</small>'}</div>`; };
  return `<div class="cartao"><div class="forn-topo"><div><h3>${esc(p.nome)}</h3>${p.link ? `<p><a target="_blank" rel="noopener" href="${esc(p.link)}">🔗 Abrir a playlist</a></p>` : '<p class="mudo">Sem link ainda.</p>'}</div>
    <div class="botoes-lin"><button class="btn mini" data-acao="pl-editar" data-id="${p.id}">Editar</button></div></div>
    <div class="botoes-lin"><button class="btn mini primario" data-acao="faixa-nova" data-p="${p.id}">+ Música</button><button class="btn mini" data-acao="faixas-colar" data-p="${p.id}">📋 Colar várias</button><button class="btn mini" data-acao="pl-copiar" data-id="${p.id}">Copiar lista</button>
    <button class="btn mini" data-acao="pl-baixar" data-id="${p.id}">⬇️ .txt</button><button class="btn mini" data-acao="pl-biblioteca" data-id="${p.id}">⭐ Salvar na biblioteca</button><button class="btn mini" data-acao="imp-playlist" data-id="${p.id}">🖨</button></div>
    <div class="pl-cols">${bloco('tocar', '✅ Pode tocar', 'ok')}${bloco('nao', '🚫 Não tocar', 'nao')}</div></div>`;
}
const playlistDe = (id) => evAtual().playlists.find((p) => p.id === id);
acoes['pl-abrir'] = (el) => { ui.playlistAberta = el.dataset.id; render(); };
function formPlaylist(p) {
  const ev = evAtual();
  formulario({
    titulo: p ? 'Editar playlist' : 'Nova playlist', valores: p || { nome: 'Playlist da festa' },
    campos: [{ id: 'nome', rotulo: 'Nome', tipo: 'texto', req: true, larg: 'inteiro' }, { id: 'link', rotulo: 'Link da playlist (Spotify, YouTube…)', tipo: 'texto', larg: 'inteiro', ph: 'https://open.spotify.com/playlist/…' }],
    excluir: p ? () => { ev.playlists = ev.playlists.filter((x) => x.id !== p.id); fecharModal(); alterou(); } : null,
    salvar: (v) => { if (p) Object.assign(p, v); else { const n = { id: uid(), faixas: [], ...v }; ev.playlists.push(n); ui.playlistAberta = n.id; } alterou(); },
  });
}
acoes['pl-nova'] = () => formPlaylist(null);
acoes['pl-editar'] = (el) => formPlaylist(playlistDe(el.dataset.id));
function formFaixa(p, f) {
  formulario({
    titulo: f ? 'Editar música' : 'Nova música', valores: f || { tipo: 'tocar' },
    campos: [{ id: 'titulo', rotulo: 'Música', tipo: 'texto', req: true, larg: 'inteiro' }, { id: 'artista', rotulo: 'Artista', tipo: 'texto' }, { id: 'tipo', rotulo: 'Situação', tipo: 'select', opcoes: [['tocar', '✅ Pode tocar'], ['nao', '🚫 Não tocar']] },
      { id: 'momento', rotulo: 'Momento', tipo: 'texto', sug: MOMENTOS_MUSICA }],
    excluir: f ? () => { p.faixas = p.faixas.filter((x) => x.id !== f.id); fecharModal(); alterou(); } : null,
    salvar: (v) => { if (f) Object.assign(f, v); else p.faixas.push({ id: uid(), ...v }); alterou(); },
  });
}
acoes['faixa-nova'] = (el) => formFaixa(playlistDe(el.dataset.p), null);
acoes['faixa-editar'] = (el) => { const p = playlistDe(el.dataset.p); formFaixa(p, p.faixas.find((f) => f.id === el.dataset.id)); };
acoes['faixas-colar'] = (el) => {
  const p = playlistDe(el.dataset.p);
  formulario({
    titulo: 'Colar várias músicas', intro: 'Uma por linha, no formato “Música — Artista”.', campos: [{ id: 'texto', rotulo: 'Lista', tipo: 'area', linhas: 8, larg: 'inteiro' }, { id: 'tipo', rotulo: 'Situação', tipo: 'select', opcoes: [['tocar', '✅ Pode tocar'], ['nao', '🚫 Não tocar']] }, { id: 'momento', rotulo: 'Momento (opcional)', tipo: 'texto', sug: MOMENTOS_MUSICA }],
    salvar: (v) => { const fx = lerFaixas(v.texto); fx.forEach((f) => p.faixas.push({ id: uid(), tipo: v.tipo, momento: v.momento, ...f })); alterou(); toast(`${plural(fx.length, 'música adicionada', 'músicas adicionadas')}.`); },
  });
};
acoes['pl-copiar'] = (el) => copiar(textoPlaylist(playlistDe(el.dataset.id)), 'Lista copiada!');
acoes['pl-baixar'] = (el) => { const p = playlistDe(el.dataset.id); baixar(`playlist-${normaliza(p.nome).replace(/\W+/g, '-')}.txt`, textoPlaylist(p)); };
acoes['pl-biblioteca'] = (el) => { const p = playlistDe(el.dataset.id); S.playlists.push({ ...JSON.parse(JSON.stringify(p)), id: uid() }); alterou(); toast('Salva na biblioteca (aba Modelos).'); };
acoes['pl-importar'] = () => {
  abrirModal(`<h3>Playlists da biblioteca</h3><div class="lista-rolar">${S.playlists.map((p) => `<div class="linha-envio"><span><b>${esc(p.nome)}</b><small class="mudo"> ${p.faixas.length} músicas</small></span><button class="btn mini primario" data-acao="pl-importar-ok" data-id="${p.id}">Usar</button></div>`).join('')}</div>
    <div class="rodape-modal"><span></span><button class="btn" data-acao="fechar">Fechar</button></div>`);
};
acoes['pl-importar-ok'] = (el) => { const p = S.playlists.find((x) => x.id === el.dataset.id), n = JSON.parse(JSON.stringify(p)); n.id = uid(); n.faixas.forEach((f) => { f.id = uid(); }); evAtual().playlists.push(n); ui.playlistAberta = n.id; fecharModal(); alterou(); };

// =============== MOODBOARD ===============
ABAS.moodboard = (ev) => `<div class="barra-ferramentas"><label class="btn primario">📷 Adicionar imagens<input type="file" accept="image/*" multiple hidden data-muda="mood-img"></label><button class="btn" data-acao="mood-ideia">+ Ideia (texto/cor)</button><button class="btn" data-acao="imp-moodboard">🖨 Imprimir</button></div>
  <div class="cartao"><h3>Paleta de cores</h3><div class="paleta">${ev.paleta.map((c, i) => `<button class="cor-bolinha" style="background:${esc(c)}" title="${esc(c)} — clique para remover" data-acao="cor-remover" data-i="${i}"></button>`).join('')}
    <label class="cor-bolinha mais" title="Adicionar cor">+<input type="color" hidden data-muda="cor-add" value="#C2547A"></label></div></div>
  ${ev.moodboard.length ? `<div class="mood-grade">${ev.moodboard.map((m) => `<div class="mood-card" data-acao="mood-editar" data-id="${m.id}">${m.img ? `<img src="${m.img}" alt="${esc(m.titulo || '')}">` : `<div class="mood-cor" style="background:${esc(m.cor || '#eee')}"></div>`}
    ${(m.titulo || m.nota) ? `<div class="mood-leg"><b>${esc(m.titulo || '')}</b>${m.nota ? `<small>${esc(m.nota)}</small>` : ''}</div>` : ''}</div>`).join('')}</div>`
    : vazioHtml('Junte referências de decoração, flores, bolo, mesa… fotos ou ideias em texto e cor.', '')}`;
muda['mood-img'] = async (el) => {
  const ev = evAtual(); let n = 0;
  for (const f of Array.from(el.files)) { try { ev.moodboard.push({ id: uid(), img: await lerImagem(f, 900), titulo: f.name.replace(/\.[^.]+$/, '').slice(0, 40), nota: '', cor: '' }); n++; } catch (e) { toast(e.message, true); } }
  if (n) { alterou(); toast(`${plural(n, 'imagem adicionada', 'imagens adicionadas')}.`); }
};
muda['cor-add'] = (el) => { evAtual().paleta.push(el.value); alterou(); };
acoes['cor-remover'] = (el) => { evAtual().paleta.splice(Number(el.dataset.i), 1); alterou(); };
function formMood(m) {
  const ev = evAtual();
  formulario({
    titulo: m ? 'Editar referência' : 'Nova ideia', valores: m || { cor: '#E8C9D4' },
    campos: [{ id: 'titulo', rotulo: 'Título', tipo: 'texto', larg: 'inteiro' }, { id: 'nota', rotulo: 'Anotação (ex.: onde achar, preço, fornecedor)', tipo: 'area', larg: 'inteiro' }, ...(m && m.img ? [] : [{ id: 'cor', rotulo: 'Cor do cartão', tipo: 'cor' }])],
    excluir: m ? () => { ev.moodboard = ev.moodboard.filter((x) => x.id !== m.id); fecharModal(); alterou(); } : null,
    salvar: (v) => { if (m) Object.assign(m, v); else ev.moodboard.push({ id: uid(), img: '', ...v }); alterou(); },
  });
}
acoes['mood-ideia'] = () => formMood(null);
acoes['mood-editar'] = (el) => formMood(evAtual().moodboard.find((m) => m.id === el.dataset.id));

// =============== EQUIPE / AJUDANTES ===============
ABAS.equipe = (ev) => `<div class="barra-ferramentas"><button class="btn primario" data-acao="eq-novo">+ ${ehPro() ? 'Pessoa da equipe' : 'Ajudante'}</button><button class="btn" data-acao="imp-equipe">🖨 Tarefas por pessoa</button></div>
  <p class="mudo">Quem ajuda na festa. As tarefas do checklist podem ser entregues a cada um — e você manda a lista pelo WhatsApp.</p>
  ${ev.equipe.length ? `<div class="grade-cartoes">${ev.equipe.map((m) => {
    const ts = ev.checklist.filter((c) => c.resp === m.nome), pend = ts.filter((c) => !c.feito);
    return `<div class="cartao"><h3>${esc(m.nome)}</h3><p class="mudo">${esc(m.funcao || '')}${m.telefone ? ' · ' + esc(m.telefone) : ''}</p><p>${selo(`${pend.length} pendente${pend.length === 1 ? '' : 's'}`, pend.length ? 'aviso' : 'ok')} ${selo(`${ts.length - pend.length} feita${ts.length - pend.length === 1 ? '' : 's'}`)}</p>
      ${pend.length ? `<ul class="lista-simples">${pend.slice(0, 5).map((c) => `<li>${esc(c.texto)}${c.prazo ? `<small> até ${dataBr(c.prazo)}</small>` : ''}</li>`).join('')}</ul>` : ''}
      <div class="botoes-lin"><button class="btn mini" data-acao="eq-editar" data-id="${m.id}">Editar</button><a class="btn mini" target="_blank" rel="noopener" href="${linkWa(m.telefone, textoTarefas(ev, m))}">💬 Enviar tarefas</a>
      <button class="btn mini" data-acao="eq-filtrar" data-nome="${esc(m.nome)}">Ver no checklist</button></div></div>`; }).join('')}</div>`
    : vazioHtml('Cadastre as pessoas e depois atribua tarefas a elas no checklist.', '<button class="btn primario" data-acao="eq-novo">+ Adicionar</button>')}`;
function textoTarefas(ev, m) {
  const ts = ev.checklist.filter((c) => c.resp === m.nome && !c.feito);
  return `Oi, ${m.nome.split(' ')[0]}! Suas tarefas para "${ev.nome}"${ev.data ? ' (' + dataBr(ev.data) + ')' : ''}:\n${ts.map((c) => `• ${c.texto}${c.prazo ? ' — até ' + dataBr(c.prazo) : ''}`).join('\n') || '• (nenhuma pendente)'}`;
}
function formEquipe(m) {
  const ev = evAtual();
  formulario({
    titulo: m ? 'Editar pessoa' : 'Nova pessoa', valores: m || {},
    campos: [{ id: 'nome', rotulo: 'Nome', tipo: 'texto', req: true, larg: 'inteiro' }, { id: 'funcao', rotulo: 'Função', tipo: 'texto', sug: FUNCOES_EQUIPE }, { id: 'telefone', rotulo: 'WhatsApp', tipo: 'tel' }],
    excluir: m ? () => { ev.equipe = ev.equipe.filter((x) => x.id !== m.id); fecharModal(); alterou(); } : null,
    salvar: (v) => { if (m) { ev.checklist.forEach((c) => { if (c.resp === m.nome) c.resp = v.nome; }); Object.assign(m, v); } else ev.equipe.push({ id: uid(), ...v }); alterou(); },
  });
}
acoes['eq-novo'] = () => formEquipe(null);
acoes['eq-editar'] = (el) => formEquipe(evAtual().equipe.find((m) => m.id === el.dataset.id));
acoes['eq-filtrar'] = (el) => { ui.checkPessoa = el.dataset.nome; irPara(`#/evento/${evAtual().id}/checklist`); };

// =============== PROPOSTA ===============
function textoProposta(ev) {
  const t = totalProposta(ev.proposta), link = linkPropostaAuto(ev);
  return `Olá${nomeCliente(ev.clienteId) ? ', ' + nomeCliente(ev.clienteId).split(' ')[0] : ''}! Segue a proposta para ${ev.nome}${ev.data ? ' (' + dataBr(ev.data) + ')' : ''} — total ${brl(t.total)}.\nVeja os detalhes e aprove por aqui: ${link}`;
}
ABAS.proposta = (ev) => {
  const p = ev.proposta, t = totalProposta(p), cli = ev.clienteId ? cliente(ev.clienteId) : null;
  const st = { rascunho: ['Rascunho', ''], enviada: ['Enviada ao cliente', 'aviso'], aprovada: ['Aprovada ✔', 'ok'], recusada: ['Recusada', 'perigo'] }[p.status] || ['Rascunho', ''];
  return `<div class="cartao"><div class="forn-topo"><div><h3>Proposta comercial</h3><p class="mudo">Monte os itens, gere o PDF com a sua marca e mande um link para o cliente aprovar.</p></div>${selo(st[0], st[1])}</div>
    ${p.status === 'aprovada' ? `<p class="ok-txt">Aprovada${p.aprovadoPor ? ' por <b>' + esc(p.aprovadoPor) + '</b>' : ''}${p.aprovadoEm ? ' em ' + dataBr(p.aprovadoEm) : ''}.</p>` : ''}
    <div class="barra-ferramentas"><button class="btn primario" data-acao="prop-item-novo">+ Item</button><button class="btn" data-acao="prop-do-orcamento" title="Cria um item por categoria do orçamento">↺ Gerar do orçamento</button><button class="btn" data-acao="prop-config">⚙ Validade e condições</button></div>
    ${p.itens.length ? `<div class="tabela-rolar"><table class="tabela"><thead><tr><th>Item</th><th>Qtd</th><th>Valor</th><th>Subtotal</th><th></th></tr></thead><tbody>${p.itens.map((i) => `<tr><td>${esc(i.descricao)}</td><td>${fmtNum(i.qtd, 2)}</td><td>${brl(i.valor)}</td><td>${brl(num(i.qtd) * num(i.valor))}</td><td class="acoes-lin"><button class="btn mini" data-acao="prop-item-editar" data-id="${i.id}">Editar</button></td></tr>`).join('')}</tbody>
      <tfoot>${t.desconto ? `<tr><td colspan="3">Subtotal</td><td colspan="2">${brl(t.bruto)}</td></tr><tr><td colspan="3">Desconto</td><td colspan="2">− ${brl(t.desconto)}</td></tr>` : ''}<tr><td colspan="3"><b>Total</b></td><td colspan="2"><b>${brl(t.total)}</b></td></tr></tfoot></table></div>` : vazioHtml('Adicione os itens da proposta.', '')}
    <div class="barra-ferramentas"><button class="btn primario" data-acao="prop-ver">👁 Ver / imprimir PDF</button><button class="btn" data-acao="prop-copiar">🔗 Copiar link de aprovação</button>${nuvemLogada() && !codigoPublicado('proposta', ev) ? '<button class="btn" data-acao="prop-publicar" title="Publica a proposta na sua conta: a aprovação do cliente chega sozinha aqui">☁️ Publicar na nuvem</button>' : ''}
      <a class="btn" target="_blank" rel="noopener" data-acao="prop-enviada" href="${linkWa(cli ? cli.telefone : '', textoProposta(ev))}">💬 Enviar por WhatsApp</a>
      <button class="btn" data-acao="prop-resposta">📨 Colar resposta do cliente</button>${p.status !== 'aprovada' ? '<button class="btn" data-acao="prop-aprovar">Marcar como aprovada</button>' : '<button class="btn" data-acao="prop-reabrir">Reabrir</button>'}</div>
    <p class="mudo pequeno">${codigoPublicado('proposta', ev) ? '☁️ Link da nuvem: o cliente abre, vê a proposta e toca em “Aprovar” — a aprovação chega sozinha aqui.' : 'O cliente abre o link, vê a proposta e toca em “Aprovar”: o WhatsApp dele abre com a resposta pronta para você.'}</p></div>`;
};
function formPropItem(i) {
  const ev = evAtual();
  formulario({
    titulo: i ? 'Editar item' : 'Novo item da proposta', valores: i || { qtd: 1 },
    campos: [{ id: 'descricao', rotulo: 'Descrição', tipo: 'texto', req: true, larg: 'inteiro' }, { id: 'qtd', rotulo: 'Quantidade', tipo: 'numero', req: true }, { id: 'valor', rotulo: 'Valor unitário (R$)', tipo: 'dinheiro', req: true }],
    excluir: i ? () => { ev.proposta.itens = ev.proposta.itens.filter((x) => x.id !== i.id); fecharModal(); alterou(); } : null,
    salvar: (v) => { if (i) Object.assign(i, v); else ev.proposta.itens.push({ id: uid(), ...v }); alterou(); },
  });
}
acoes['prop-item-novo'] = () => formPropItem(null);
acoes['prop-item-editar'] = (el) => formPropItem(evAtual().proposta.itens.find((i) => i.id === el.dataset.id));
acoes['prop-do-orcamento'] = () => confirmar('Criar os itens da proposta a partir do orçamento? Os itens atuais serão substituídos.', () => { const ev = evAtual(); ev.proposta.itens = ev.orcamento.filter((o) => num(o.previsto) > 0).map((o) => ({ id: uid(), descricao: o.categoria, qtd: 1, valor: num(o.previsto) })); alterou(); }, 'Gerar');
acoes['prop-config'] = () => {
  const ev = evAtual(), p = ev.proposta;
  formulario({ titulo: 'Validade e condições', valores: p, campos: [{ id: 'validade', rotulo: 'Proposta válida até', tipo: 'data' }, { id: 'desconto', rotulo: 'Desconto (R$)', tipo: 'dinheiro' }, { id: 'condicoes', rotulo: 'Condições', tipo: 'area', linhas: 6, larg: 'inteiro' }], salvar: (v) => { Object.assign(p, v); alterou(); } });
};
function htmlProposta(d) {
  const tot = d.it.reduce((s, i) => s + i[1] * i[2], 0), total = Math.max(0, tot - (d.dc || 0));
  return `<div class="prop-info"><p><b>Cliente:</b> ${esc(d.c || '—')}</p><p><b>Evento:</b> ${esc(d.e)}${d.d ? ` · ${dataBr(d.d)}${d.h ? ' às ' + esc(d.h) : ''}` : ''}${d.l ? ' · ' + esc(d.l) : ''}</p></div>
  ${tabelaImp(['Item', 'Qtd', 'Valor', 'Subtotal'], d.it.map((i) => [esc(i[0]), fmtNum(i[1], 2), brl(i[2]), brl(i[1] * i[2])]))}
  <p class="imp-total">${d.dc ? `Subtotal ${brl(tot)} · Desconto − ${brl(d.dc)}<br>` : ''}<b>Total: ${brl(total)}</b></p>${d.v ? `<p>Proposta válida até <b>${dataBr(d.v)}</b>.</p>` : ''}${d.cd ? `<p class="imp-obs">${esc(d.cd).replace(/\n/g, '<br>')}</p>` : ''}`;
}
acoes['prop-ver'] = () => { const ev = evAtual(); if (!ev.proposta.itens.length) { toast('Adicione itens à proposta primeiro.', true); return; } imprimir('Proposta comercial', htmlProposta(dadosProposta(ev)), ev); };
acoes['prop-copiar'] = () => copiar(textoProposta(evAtual()), 'Mensagem com o link copiada!');
acoes['prop-enviada'] = () => { const p = evAtual().proposta; if (p.status === 'rascunho') { p.status = 'enviada'; gravar(); setTimeout(render, 400); } };
acoes['prop-aprovar'] = () => formulario({ titulo: 'Marcar como aprovada', campos: [{ id: 'quem', rotulo: 'Aprovada por', tipo: 'texto' }], salvar: (v) => { const p = evAtual().proposta; p.status = 'aprovada'; p.aprovadoEm = hojeIso(); p.aprovadoPor = v.quem; alterou(); } });
acoes['prop-reabrir'] = () => { evAtual().proposta.status = 'enviada'; alterou(); };
acoes['prop-resposta'] = () => formulario({
  titulo: 'Colar a resposta do cliente', intro: 'Cole a mensagem que o cliente mandou pelo WhatsApp.', campos: [{ id: 'texto', rotulo: 'Mensagem', tipo: 'area', linhas: 5, larg: 'inteiro' }],
  salvar: (v) => { const q = aplicarAprovacao(evAtual(), v.texto); if (q === null) { toast('Não encontrei uma aprovação desta proposta nesse texto.', true); return false; } alterou(); toast(`Proposta aprovada por ${q}!`); },
});

// =============== CONTRATO E RECEBIMENTOS ===============
function contratoPadrao(ev) {
  const c = S.config, t = totalProposta(ev.proposta).total || num(ev.contrato.total), cli = cliente(ev.clienteId);
  return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS PARA EVENTO

CONTRATADA: ${c.negocio || '[nome do negócio]'}${c.responsavel ? ', representada por ' + c.responsavel : ''}.
CONTRATANTE: ${cli ? cli.nome : ev.anfitriao || '[nome do cliente]'}.

1. OBJETO. Prestação de serviços para o evento "${ev.nome}", a realizar-se em ${ev.data ? dataBr(ev.data) : '[data]'}${ev.hora ? ', às ' + ev.hora : ''}${ev.local ? ', em ' + ev.local : ''}.

2. VALOR E PAGAMENTO. O valor total é de ${brl(t)}, pago conforme o quadro de parcelas anexo. A reserva da data só é garantida após o pagamento do sinal.

3. ALTERAÇÕES. Mudanças de itens, horários ou número de convidados devem ser combinadas por escrito e podem alterar o valor.

4. CANCELAMENTO. Em caso de cancelamento pela CONTRATANTE, o sinal não será devolvido; cancelamentos com menos de 30 dias do evento obrigam ao pagamento de 50% do valor total.

5. RESPONSABILIDADES. A CONTRATADA executa os serviços descritos; a CONTRATANTE fornece acesso ao local e informações necessárias nos prazos combinados.

${ev.local ? ev.local.split(',')[0] : 'Local'}, ${dataBr(hojeIso())}.`;
}
ABAS.contrato = (ev) => {
  const cli = cliente(ev.clienteId), c = ev.contrato, parc = c.parcelas || [], tot = parc.reduce((s, p) => s + num(p.valor), 0), rec = parc.filter((p) => p.pago).reduce((s, p) => s + num(p.valor), 0), prop = totalProposta(ev.proposta).total;
  return `<div class="kpis">${kpi('Total do contrato', brl(num(c.total) || tot || prop))}${kpi('Recebido', brl(rec), 'ok')}${kpi('A receber', brl(tot - rec), tot - rec > 0 ? 'alerta' : '')}</div>
  <div class="cartao"><h3>Recebimentos do cliente</h3>
    <div class="barra-ferramentas"><button class="btn primario" data-acao="rec-parcelar">+ Gerar parcelas</button><button class="btn" data-acao="rec-nova">+ Parcela avulsa</button></div>
    ${parc.length ? `<ul class="lista-check">${parc.slice().sort((a, b) => (a.venc || '9') < (b.venc || '9') ? -1 : 1).map((p) => `<li class="${p.pago ? 'feito' : ''}"><label><input type="checkbox" data-muda="rec-check" data-id="${p.id}"${p.pago ? ' checked' : ''}><span class="item-txt">${esc(p.descricao)}</span></label>
      <span class="item-prazo ${!p.pago && p.venc && p.venc < hojeIso() ? 'atrasado' : ''}">${p.venc ? dataBr(p.venc) : ''}</span><span class="item-val">${brl(p.valor)}</span>
      ${!p.pago && cli && cli.telefone ? `<a class="btn mini" target="_blank" rel="noopener" title="Lembrar o cliente" href="${linkWa(cli.telefone, `Oi, ${cli.nome.split(' ')[0]}! Lembrete: ${p.descricao} de ${ev.nome}, ${brl(p.valor)}${p.venc ? ', vencimento ' + dataBr(p.venc) : ''}.`)}">💬</a>` : ''}
      <button class="btn mini" data-acao="rec-editar" data-id="${p.id}">✏️</button></li>`).join('')}</ul>` : '<p class="mudo">Sem parcelas ainda. Gere a partir do valor da proposta.</p>'}</div>
  <div class="cartao"><h3>Contrato</h3><p class="mudo">Um modelo simples para você ajustar. Confira com seu advogado antes de usar em contratos reais.</p>
    <div class="barra-ferramentas"><button class="btn" data-acao="ctr-gerar">${c.texto ? '↺ Gerar de novo' : 'Gerar contrato padrão'}</button><button class="btn primario" data-acao="ctr-imprimir"${c.texto ? '' : ' disabled'}>🖨 Imprimir com assinaturas</button></div>
    <textarea id="ctrTexto" rows="16" data-muda="ctr-texto" placeholder="Clique em “Gerar contrato padrão” e edite o texto aqui.">${esc(c.texto)}</textarea></div>`;
};
muda['ctr-texto'] = (el) => { evAtual().contrato.texto = el.value; gravar(); };
acoes['ctr-gerar'] = () => { const ev = evAtual(), go = () => { ev.contrato.texto = contratoPadrao(ev); alterou(); }; if (ev.contrato.texto) confirmar('Substituir o texto atual por um novo contrato padrão?', go, 'Substituir'); else go(); };
acoes['ctr-imprimir'] = () => {
  const ev = evAtual(), parc = ev.contrato.parcelas || [];
  imprimir('Contrato', `<div class="imp-contrato">${esc(ev.contrato.texto).replace(/\n/g, '<br>')}</div>${parc.length ? '<h3>Parcelas</h3>' + tabelaImp(['Parcela', 'Vencimento', 'Valor'], parc.map((p) => [esc(p.descricao), dataBr(p.venc), brl(p.valor)])) : ''}
    <div class="imp-assinaturas"><div><hr>${esc(S.config.negocio || 'Contratada')}</div><div><hr>${esc(nomeCliente(ev.clienteId) || ev.anfitriao || 'Contratante')}</div></div>`, ev);
};
muda['rec-check'] = (el) => { const p = evAtual().contrato.parcelas.find((x) => x.id === el.dataset.id); p.pago = el.checked; alterou(); };
acoes['rec-parcelar'] = () => {
  const ev = evAtual();
  formulario({
    titulo: 'Gerar parcelas do cliente', valores: { total: totalProposta(ev.proposta).total || ev.contrato.total || '', n: 4, primeira: hojeIso() },
    campos: [{ id: 'total', rotulo: 'Valor total (R$)', tipo: 'dinheiro', req: true }, { id: 'n', rotulo: 'Número de parcelas', tipo: 'numero', req: true, dica: 'A 1ª pode ser o sinal.' }, { id: 'primeira', rotulo: 'Vencimento da 1ª', tipo: 'data' }],
    salvar: (v) => { ev.contrato.total = v.total; ev.contrato.parcelas = (ev.contrato.parcelas || []).filter((p) => p.pago).concat(parcelar(v.total, v.n, v.primeira, 'Parcela')); alterou(); },
  });
};
function formRec(p) {
  const ev = evAtual();
  formulario({
    titulo: p ? 'Editar parcela' : 'Nova parcela', valores: p || { descricao: 'Sinal' },
    campos: [{ id: 'descricao', rotulo: 'Descrição', tipo: 'texto', req: true }, { id: 'valor', rotulo: 'Valor (R$)', tipo: 'dinheiro', req: true }, { id: 'venc', rotulo: 'Vencimento', tipo: 'data' }, { id: 'pago', rotulo: 'Já recebi', tipo: 'check' }],
    excluir: p ? () => { ev.contrato.parcelas = ev.contrato.parcelas.filter((x) => x.id !== p.id); fecharModal(); alterou(); } : null,
    salvar: (v) => { if (p) Object.assign(p, v); else ev.contrato.parcelas.push({ id: uid(), ...v }); alterou(); },
  });
}
acoes['rec-nova'] = () => formRec(null);
acoes['rec-editar'] = (el) => formRec(evAtual().contrato.parcelas.find((p) => p.id === el.dataset.id));

// =============== IMPRESSÃO ===============
const IMP = {
  convidados(ev) {
    const l = ev.convidados.slice().sort(porNome), k = contarConvidados(ev);
    return `<p class="imp-sub">${k.convites} convites · ${k.total} pessoas previstas · ${k.pSim} confirmadas</p>` + tabelaImp(['#', 'Convidado', 'Grupo', 'Acomp.', 'Restrições', 'Resposta', 'Mesa'],
      l.map((g, i) => [i + 1, esc(g.nome), esc(g.grupo || ''), g.acomp ? '+' + g.acomp : '', esc((g.restricoes || []).join(', ')), esc((RSVPS.find((r) => r[0] === (g.rsvp || 'pendente')) || RSVPS[0])[1]), esc(nomeMesa(ev, g.mesaId))]));
  },
  mesas(ev) {
    return `<div class="imp-mesas">${ev.mesas.map((m) => `<div class="imp-mesa"><h3>${esc(m.nome)} <small>${ocupacaoMesa(ev, m.id)}/${num(m.lugares)} lugares</small></h3><ul>${ev.convidados.filter((g) => g.mesaId === m.id && g.rsvp !== 'nao').sort(porNome).map((g) => `<li>${esc(g.nome)}${g.acomp ? ` +${g.acomp}` : ''}${(g.restricoes || []).length ? ` <em>(${esc(g.restricoes.join(', '))})</em>` : ''}</li>`).join('') || '<li>—</li>'}</ul></div>`).join('')}</div>`
      + (ev.convidados.some((g) => g.rsvp !== 'nao' && !g.mesaId) ? `<h3>Sem mesa</h3><p>${ev.convidados.filter((g) => g.rsvp !== 'nao' && !g.mesaId).map((g) => esc(g.nome)).join(', ')}</p>` : '');
  },
  quantidades(ev) {
    const r = calcularQuantitativo(ev); return tabelaImp(['Item', 'Para', 'Total', 'Embalagens', 'Custo est.'], r.map((x) => [esc(x.item), x.alvo, `${fmtNum(x.total, 1)} ${esc(x.un)}`, x.embalagens ? `${x.embalagens} × ${esc(x.embNome || 'emb.')}` : '', x.preco ? brl(x.custo) : '']))
      + `<p class="imp-total">Custo estimado: <b>${brl(r.reduce((s, x) => s + x.custo, 0))}</b> (margem de ${fmtNum(ev.margem, 1)}%, ${fmtNum(ev.duracaoH, 1)} h de festa)</p>`;
  },
  compras(ev) {
    const g = {}; ev.compras.forEach((i) => { (g[i.categoria || 'Outros'] = g[i.categoria || 'Outros'] || []).push(i); });
    return Object.keys(g).sort().map((c) => `<h3>${esc(c)}</h3>` + tabelaImp(['✔', 'Item', 'Qtd', 'Preço un.', 'Subtotal'], g[c].map((i) => [i.comprado ? '☑' : '☐', esc(i.item), `${fmtNum(i.qtd, 2)} ${esc(i.un || '')}`, i.preco ? brl(i.preco) : '', i.preco ? brl(num(i.qtd) * num(i.preco)) : '']))).join('')
      + `<p class="imp-total">Total estimado: <b>${brl(ev.compras.reduce((s, i) => s + num(i.qtd) * num(i.preco), 0))}</b></p>`;
  },
  checklist(ev) {
    const g = {}; ev.checklist.forEach((c) => { (g[c.grupo || 'Geral'] = g[c.grupo || 'Geral'] || []).push(c); });
    return Object.keys(g).map((n) => `<h3>${esc(n)}</h3>` + tabelaImp(['✔', 'Tarefa', 'Responsável', 'Prazo'], g[n].sort((a, b) => ((a.prazo || '9') < (b.prazo || '9') ? -1 : 1)).map((c) => [c.feito ? '☑' : '☐', esc(c.texto), esc(c.resp || ''), dataBr(c.prazo)]))).join('');
  },
  cronograma(ev) { return tabelaImp(['Hora', 'O que acontece', 'Tipo', 'Responsável', 'Obs.'], ev.cronograma.slice().sort((a, b) => (a.hora || '').localeCompare(b.hora || '')).map((c) => [esc(c.hora), esc(c.texto), esc((TIPOS_CRONO.find((t) => t[0] === c.tipo) || ['', ''])[1]), esc(c.resp || ''), esc(c.obs || '')])); },
  roteiro(ev) { return tabelaImp(['#', 'Momento', 'Tipo', 'Hora', 'Quem', 'Música'], ev.roteiro.map((r, i) => [i + 1, esc(r.texto), esc(r.tipo), esc(r.hora || ''), esc(r.resp || ''), esc(r.musica || '')])); },
  fornecedores(ev) {
    return tabelaImp(['Fornecedor', 'Categoria', 'Contato', 'Valor', 'Pago', 'A pagar'], ev.fornecedores.map((f) => [esc(f.nome), esc(f.categoria || ''), esc([f.contato, f.telefone].filter(Boolean).join(' · ')), brl(valorForn(f)), brl(somaPag(f, true)), brl(Math.max(0, valorForn(f) - somaPag(f, true)))]))
      + ev.fornecedores.filter((f) => (f.pagamentos || []).length).map((f) => `<h3>${esc(f.nome)}</h3>` + tabelaImp(['Pagamento', 'Vencimento', 'Valor', 'Situação'], f.pagamentos.map((p) => [esc(p.descricao), dataBr(p.venc), brl(p.valor), p.pago ? 'Pago' : 'Pendente']))).join('');
  },
  orcamento(ev) { const { linhas, tot } = resumoFinanceiro(ev); return tabelaImp(['Categoria', 'Previsto', 'Contratado', 'Pago', 'A pagar', 'Saldo'], [...linhas.map((l) => [esc(l.categoria), brl(l.previsto), brl(l.contratado), brl(l.pago), brl(l.aPagar), brl(l.saldo)]), ['<b>Total</b>', brl(tot.previsto), brl(tot.contratado), brl(tot.pago), brl(tot.aPagar), brl(tot.saldo)]]); },
  playlist(ev, id) { const ps = id ? ev.playlists.filter((p) => p.id === id) : ev.playlists; return ps.map((p) => `<h3>🎵 ${esc(p.nome)}</h3>${p.link ? `<p>${esc(p.link)}</p>` : ''}<div class="imp-2col"><div><h4>Pode tocar</h4><ol>${p.faixas.filter((f) => f.tipo === 'tocar').map((f) => `<li>${esc(f.titulo)}${f.artista ? ' — ' + esc(f.artista) : ''}${f.momento ? ' <em>(' + esc(f.momento) + ')</em>' : ''}</li>`).join('')}</ol></div><div><h4>Não tocar</h4><ol>${p.faixas.filter((f) => f.tipo === 'nao').map((f) => `<li>${esc(f.titulo)}${f.artista ? ' — ' + esc(f.artista) : ''}</li>`).join('')}</ol></div></div>`).join(''); },
  moodboard(ev) { return (ev.paleta.length ? `<div class="imp-paleta">${ev.paleta.map((c) => `<i style="background:${esc(c)}"></i>`).join('')}</div>` : '') + `<div class="imp-mood">${ev.moodboard.map((m) => `<figure>${m.img ? `<img src="${m.img}" alt="">` : `<div class="imp-cor" style="background:${esc(m.cor || '#eee')}"></div>`}<figcaption><b>${esc(m.titulo || '')}</b> ${esc(m.nota || '')}</figcaption></figure>`).join('')}</div>`; },
  equipe(ev) {
    return ev.equipe.map((m) => `<div class="imp-pessoa"><h3>${esc(m.nome)} <small>${esc(m.funcao || '')}</small></h3>${tabelaImp(['✔', 'Tarefa', 'Prazo'], ev.checklist.filter((c) => c.resp === m.nome).map((c) => [c.feito ? '☑' : '☐', esc(c.texto), dataBr(c.prazo)]))}</div>`).join('') || '<p>Sem equipe cadastrada.</p>';
  },
};
const IMP_TITULOS = { convidados: 'Lista de convidados', mesas: 'Mapa de mesas', quantidades: 'Quantidades de comida e bebida', compras: 'Lista de compras', checklist: 'Checklist', cronograma: 'Cronograma do dia', roteiro: 'Roteiro do cerimonial', fornecedores: 'Fornecedores e pagamentos', orcamento: 'Orçamento', playlist: 'Playlist', moodboard: 'Moodboard', equipe: 'Tarefas por pessoa' };
Object.keys(IMP_TITULOS).forEach((k) => { acoes['imp-' + k] = (el) => imprimir(IMP_TITULOS[k], IMP[k](evAtual(), el && el.dataset ? el.dataset.id : undefined), evAtual()); });
acoes['imp-livro'] = () => {
  const ev = evAtual(), k = contarConvidados(ev);
  imprimir('Livro da festa', `<p class="imp-sub">${k.total} pessoas previstas · ${k.pSim} confirmadas</p>` + ['cronograma', 'roteiro', 'convidados', 'mesas', 'quantidades', 'compras', 'fornecedores', 'orcamento', 'checklist'].map((t) => `<section class="imp-secao"><h2>${IMP_TITULOS[t]}</h2>${IMP[t](ev)}</section>`).join(''), ev);
};
ABAS.imprimir = (ev) => `<p class="mudo">Abre a tela de impressão do navegador — escolha “Salvar como PDF” para gerar o arquivo.</p>
  <div class="grade-cartoes">${Object.keys(IMP_TITULOS).map((k) => `<button class="cartao botao-cartao" data-acao="imp-${k}"><b>🖨 ${IMP_TITULOS[k]}</b></button>`).join('')}
  <button class="cartao botao-cartao destaque" data-acao="imp-livro"><b>📖 Livro da festa</b><small>Tudo numa só impressão: cronograma, convidados, mesas, compras, fornecedores…</small></button></div>`;

// =============== PÁGINAS PÚBLICAS (convite e proposta) ===============
function paginaPublica(corpo, cor) {
  document.documentElement.style.setProperty('--cor', cor || '#7C3AED');
  return `<div class="publica"><div class="publica-card">${corpo}<p class="publica-rodape">Feito com Dudoo Parties</p></div></div>`;
}
function tela_convite(cod) {
  const c = decodificar(cod);
  if (!c) return paginaPublica('<h1>Link inválido</h1><p>Esse convite não pôde ser aberto. Peça um novo link a quem convidou.</p>');
  return htmlConvite(c, false);
}
// Layout do convite (igual nos links sem servidor e nos da nuvem). nuvem=true: o botão envia a resposta direto para o servidor.
function htmlConvite(c, nuvem) {
  const quando = [c.d ? `${diaSemana(c.d)}, ${dataBr(c.d)}` : '', c.h ? `às ${c.h}` : ''].filter(Boolean).join(' ');
  const acao = nuvem ? 'rsvp-nuvem' : 'rsvp';
  return paginaPublica(`<div class="pub-emoji">🎉</div><p class="mudo">${c.n ? `Oi, <b>${esc(c.n)}</b>! ` : ''}Você está convidado(a) para</p><h1>${esc(c.t)}</h1>
    ${quando ? `<p class="pub-info">📅 ${esc(quando)}</p>` : ''}${c.l ? `<p class="pub-info">📍 ${esc(c.l)}</p>` : ''}${c.a ? `<p class="pub-info">💌 Anfitrião(ã): ${esc(c.a)}</p>` : ''}${c.o ? `<p class="pub-info">👗 ${esc(c.o)}</p>` : ''}
    <div id="rsvpForm">${c.n ? '' : '<label class="campo"><span>Seu nome</span><input id="rsvpNome" placeholder="Nome e sobrenome"></label>'}
    <label class="campo"><span>Quantos acompanhantes você leva?</span><select id="rsvpAc">${Array.from({ length: (c.m || 3) + 1 }, (_, i) => `<option value="${i}">${i === 0 ? 'Vou sozinho(a)' : '+' + i}</option>`).join('')}</select></label>
    <label class="campo"><span>Alguma restrição alimentar? (opcional)</span><input id="rsvpRestr" placeholder="Ex.: vegetariano, alergia a amendoim"></label>
    <div class="pub-botoes"><button class="btn primario grande" data-acao="${acao}" data-r="sim">✅ Eu vou!</button><button class="btn grande" data-acao="${acao}" data-r="nao">Não poderei ir</button></div></div>
    <p class="mudo pequeno">${nuvem ? 'Ao tocar, sua resposta é enviada na hora para quem convidou.' : 'Ao tocar, o seu WhatsApp abre com a resposta pronta — é só enviar.'}</p>`, c.c);
}
acoes['rsvp'] = (el) => {
  const c = decodificar(location.hash.split('/')[2] || ''); if (!c) return;
  const nome = c.n || ($('#rsvpNome') ? $('#rsvpNome').value.trim() : '');
  if (!nome) { toast('Informe seu nome.', true); return; }
  const msg = mensagemResposta(c, el.dataset.r, Number($('#rsvpAc').value) || 0, $('#rsvpRestr').value.trim(), nome);
  if (!c.w) { copiar(msg, 'Resposta copiada! Cole e envie para quem convidou.'); return; }
  window.open(linkWa(c.w, msg), '_blank');
};
function tela_propostaPublica(cod) {
  const d = decodificar(cod);
  if (!d) return paginaPublica('<h1>Link inválido</h1><p>Essa proposta não pôde ser aberta. Peça um novo link.</p>');
  return htmlPropostaPublica(d, false);
}
function htmlPropostaPublica(d, nuvem) {
  return paginaPublica(`<p class="mudo">${esc(d.n || 'Proposta')}${d.r ? ' · ' + esc(d.r) : ''}</p><h1>Proposta — ${esc(d.e)}</h1>${htmlProposta(d)}
    <label class="campo"><span>Seu nome (para registrar a aprovação)</span><input id="aprNome" value="${esc(d.c || '')}"></label>
    <div class="pub-botoes"><button class="btn primario grande" data-acao="${nuvem ? 'aprovar-nuvem' : 'aprovar-pub'}">✅ Aprovar proposta</button></div><p class="mudo pequeno">${nuvem ? 'Ao tocar, sua aprovação é enviada na hora.' : 'Ao tocar, o WhatsApp abre com a aprovação pronta para enviar.'}</p>`, d.cor);
}
acoes['aprovar-pub'] = () => {
  const d = decodificar(location.hash.split('/')[2] || ''); if (!d) return; const nome = $('#aprNome').value.trim() || 'Cliente';
  const msg = `Olá! Aprovo a proposta de ${d.e}. — ${nome}\n[parties:aprovacao:${d.i}:${nome.replace(/[\]:\n]/g, ' ')}]`;
  if (!d.w) { copiar(msg, 'Aprovação copiada! Cole e envie para o profissional.'); return; }
  window.open(linkWa(d.w, msg), '_blank');
};

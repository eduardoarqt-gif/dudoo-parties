'use strict';
// Dudoo Parties — roteador, estrutura da página e eventos globais.
function aplicarCor() {
  const cor = S.config.cor || '#7C3AED', r = document.documentElement.style;
  r.setProperty('--cor', cor); r.setProperty('--cor-txt', corTexto(cor));
  const m = $('meta[name=theme-color]'); if (m) m.setAttribute('content', cor);
}

function shell(conteudo, tela) {
  const c = S.config, ativo = tela === 'evento' ? 'eventos' : tela;
  const itens = [['inicio', 'Início', '🏠'], ['eventos', 'Eventos', '🎉']];
  if (ehPro()) itens.push(['clientes', 'Clientes', '👥'], ['banco', 'Fornecedores', '🧾']);
  itens.push(['modelos', 'Modelos', '📋'], ['config', 'Ajustes', '⚙️']);
  const link = ([id, t, ic]) => `<a class="nav-item ${id === ativo ? 'ativo' : ''}" href="#/${id}"><span class="nav-ic">${ic}</span><span>${t}</span></a>`;
  return `<div class="shell"><aside class="menu"><div class="marca">${c.logo ? `<img src="${c.logo}" alt="">` : '<span class="marca-ic">🎉</span>'}<div><b>Dudoo Parties</b>${c.negocio ? `<small>${esc(c.negocio)}</small>` : ''}</div></div>
    <nav>${itens.map(link).join('')}</nav><div class="menu-rodape"><small>v${VERSAO}</small></div></aside>
    <main class="principal">${conteudo}</main><nav class="nav-baixo">${itens.map(link).join('')}</nav></div>`;
}

let _rotaAnterior = '';
function render() {
  const r = rotaAtual(), app = $('#app'), y = window.scrollY, abas = $('#abas'), sx = abas ? abas.scrollLeft : 0;
  let html;
  if (r.tela === 'convite') html = tela_convite(r.a);
  else if (r.tela === 'proposta') html = tela_propostaPublica(r.a);
  else if (r.tela === 'c') html = tela_conviteNuvem(r.a, r.b || '-');
  else if (r.tela === 'p') html = tela_propostaNuvem(r.a);
  else if (!S.config.modo) html = tela_boasVindas();
  else {
    aplicarCor();
    const mapa = { inicio: tela_inicio, eventos: tela_eventos, evento: tela_evento, clientes: tela_clientes, banco: tela_banco, modelos: tela_modelos, config: tela_config };
    html = shell((mapa[r.tela] || tela_inicio)(), mapa[r.tela] ? r.tela : 'inicio');
  }
  app.innerHTML = html;
  const mesma = _rotaAnterior === location.hash; _rotaAnterior = location.hash;
  if (mesma) { window.scrollTo(0, y); const n = $('#abas'); if (n) n.scrollLeft = sx; }
  else { window.scrollTo(0, 0); const at = $('#abas .ativa'); if (at && at.scrollIntoView) at.scrollIntoView({ inline: 'center', block: 'nearest' }); }
  atualizarIndicador();
}

window.addEventListener('hashchange', () => { fecharModal(); render(); });
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-acao]'); if (!el) return;
  const f = acoes[el.dataset.acao]; if (f) f(el, e);
});
document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-muda]'); if (!el) return;
  const f = muda[el.dataset.muda]; if (f) f(el, e);
});

aplicarCor();
render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});

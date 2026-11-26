'use strict';
// Dudoo Parties — dados. Tudo fica no aparelho (localStorage); backup e restauração por arquivo JSON.
// Formato pensado para sincronizar depois (nuvem ou Dudoo Lite): tudo com id, nada de referência por posição.
const CHAVE_DADOS = window.__TESTE ? 'dudoo-parties-teste' : 'dudoo-parties-v1';   // testes.html nunca toca nos dados reais

function dadosVazios() {
  return {
    versao: 1,
    config: { modo: '', negocio: '', responsavel: '', telefone: '', cor: '#7C3AED', logo: '', rodape: '' },
    clientes: [], eventos: [], banco: [], modelos: [], playlists: [], demo: false, sync: syncVazio(),
  };
}
// Estado da nuvem (js/nuvem.js). Mora dentro de S mas NÃO vai no backup exportado.
// pend: carimbos de data das mudanças ainda não enviadas ("tipo:id" → {fp, t}); contaId: conta da qual cursor/fp valem.
function syncVazio() {
  return { tipo: '', repo: '', servidor: '', token: '', conta: null, contaId: 0, cursor: 0, cursorRespostas: 0, fp: {}, conhecidos: [], pend: {}, ultimaSync: '', publicados: {} };
}
function migrar(d) {
  const v = dadosVazios();
  const out = Object.assign(v, d || {});
  out.config = Object.assign(v.config, (d && d.config) || {});
  ['clientes', 'eventos', 'banco', 'modelos', 'playlists'].forEach((k) => { if (!Array.isArray(out[k])) out[k] = []; });
  out.eventos.forEach(completarEvento);
  out.sync = Object.assign(syncVazio(), (d && d.sync) || {});
  ['fp', 'pend', 'publicados'].forEach((k) => { if (!out.sync[k] || typeof out.sync[k] !== 'object' || Array.isArray(out.sync[k])) out.sync[k] = {}; });
  if (!Array.isArray(out.sync.conhecidos)) out.sync.conhecidos = [];
  return out;
}
// Garante que um evento antigo/importado tenha todas as listas (sem quebrar telas).
function completarEvento(ev) {
  const lst = ['convidados', 'mesas', 'compras', 'checklist', 'cronograma', 'roteiro', 'fornecedores', 'orcamento', 'playlists', 'moodboard', 'paleta', 'equipe'];
  lst.forEach((k) => { if (!Array.isArray(ev[k])) ev[k] = []; });
  ev.qtd = ev.qtd || { regras: [] }; if (!Array.isArray(ev.qtd.regras)) ev.qtd.regras = [];
  ev.proposta = Object.assign({ itens: [], desconto: 0, validade: '', condicoes: '', status: 'rascunho' }, ev.proposta || {});
  ev.contrato = Object.assign({ texto: '', total: 0, parcelas: [] }, ev.contrato || {});
  ev.margem = ev.margem == null ? 10 : ev.margem;
  ev.base = ev.base || 'previstos';
  ev.duracaoH = ev.duracaoH || 4;
  ev.status = ev.status || 'planejando';
  return ev;
}

let S = carregar();
function carregar() {
  try { const t = localStorage.getItem(CHAVE_DADOS); if (t) return migrar(JSON.parse(t)); } catch (e) { /* dados corrompidos: começa vazio */ }
  return dadosVazios();
}
let _tGravar = null;
function gravar() { clearTimeout(_tGravar); _tGravar = setTimeout(gravarAgora, 120); }
function gravarAgora() {
  clearTimeout(_tGravar);
  try { localStorage.setItem(CHAVE_DADOS, JSON.stringify(S)); return true; } catch (e) {
    if (typeof toast === 'function') toast('Sem espaço para salvar! Exporte um backup e apague imagens do moodboard.', true);
    return false;
  }
}
window.addEventListener('beforeunload', gravarAgora);
const usoArmazenamentoKB = () => { try { return Math.round((localStorage.getItem(CHAVE_DADOS) || '').length / 1024); } catch (e) { return 0; } };

const evento = (id) => S.eventos.find((e) => e.id === id);
const cliente = (id) => S.clientes.find((c) => c.id === id);
const nomeCliente = (id) => (cliente(id) || {}).nome || '';
const ehPro = () => S.config.modo === 'profissional';

// Restaurar/apagar tudo troca os dados, mas a conexão com a nuvem (token, cursor, impressões) continua valendo:
// assim a nuvem passa a refletir os novos dados (o que sumiu é apagado lá também).
function substituirDados(novo) { const sync = S.sync; S = migrar(novo); S.sync = sync; gravarAgora(); }
// O backup nunca leva o estado da nuvem (token de acesso!).
function exportarJson() { const { sync, ...resto } = S; return JSON.stringify(resto, null, 1); }

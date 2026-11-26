'use strict';
// Dudoo Parties — sincronização entre os MEUS aparelhos pelo GitHub: o arquivo `parties.json` de um repositório PRIVADO faz o papel do
// servidor, com o mesmo protocolo de /api/sync ("última escrita vence", cursor). O `sha` do arquivo evita um aparelho sobrescrever o outro.
// Sem servidor não há link com resposta automática: convite e proposta continuam pelo WhatsApp.
const GH_API = 'https://api.github.com';
const GH_ARQUIVO = 'parties.json';
const ehGitHub = () => !!(S.sync && S.sync.tipo === 'github');
// Repositório sugerido a partir do endereço publicado (usuario.github.io/...): nada pessoal fica escrito no código.
const repoSugerido = (host = location.hostname) => (/\.github\.io$/i.test(host) ? `${host.split('.')[0]}/dudoo-parties-dados` : '');
const normalizarRepo = (t) => String(t || '').trim().replace(/^https?:\/\/github\.com\//i, '').replace(/^\/+|\/+$/g, '').replace(/\.git$/i, '');

function textoParaB64(t) { const b = new TextEncoder().encode(t); let bin = ''; for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(bin); }
const b64ParaTexto = (s) => new TextDecoder().decode(Uint8Array.from(atob(String(s).replace(/\s/g, '')), (c) => c.charCodeAt(0)));
const arquivoVazio = () => ({ versao: 1, seq: 0, docs: {} });

// PURA: aplica no arquivo os docs enviados e monta a mesma resposta que o servidor daria. Altera `arq`.
function ghMesclar(arq, cursor, docs) {
  const aceitos = [], recusados = [];
  (docs || []).forEach((d) => {
    const k = chaveDoc(d.tipo, d.id), atual = arq.docs[k];
    if (!atual || String(d.atualizado_em) > String(atual.atualizado_em)) {
      arq.seq += 1;
      arq.docs[k] = { id: d.id, tipo: d.tipo, dados: d.excluido ? null : d.dados, atualizado_em: d.atualizado_em, excluido: !!d.excluido, seq: arq.seq };
      aceitos.push(d.id);
    } else recusados.push(k);
  });
  const saida = Object.keys(arq.docs).filter((k) => recusados.includes(k) || (arq.docs[k].seq > cursor && !aceitos.includes(arq.docs[k].id)))
    .map((k) => { const { seq, ...doc } = arq.docs[k]; return doc; });
  return { resposta: { cursor: arq.seq, docs: saida, aceitos, recusados: recusados.map((k) => partesChave(k)[1]) }, mudou: aceitos.length > 0 };
}

async function ghFetch(caminho, { token, metodo = 'GET', corpo, cru = false } = {}) {
  try {
    return await fetch(GH_API + caminho, {
      method: metodo, cache: 'no-store', body: corpo ? JSON.stringify(corpo) : undefined,
      headers: Object.assign({ Authorization: 'Bearer ' + token, Accept: cru ? 'application/vnd.github.raw+json' : 'application/vnd.github+json' }, corpo ? { 'Content-Type': 'application/json' } : {}),
    });
  } catch (e) { const er = new Error('Sem conexão com o GitHub.'); er.offline = true; throw er; }
}
function ghErro(r) {
  const msg = r.status === 401 ? 'O token do GitHub foi recusado ou expirou.' : r.status === 403 ? 'O GitHub recusou o acesso (token sem permissão de escrita, ou chamadas demais).'
    : r.status === 404 ? 'Repositório não encontrado: confira o nome e se o token tem acesso a ele.' : `O GitHub respondeu ${r.status}.`;
  const er = new Error(msg); er.status = r.status; return er;
}
async function ghLer(repo, token) {
  const url = `/repos/${repo}/contents/${GH_ARQUIVO}`, r = await ghFetch(url, { token });
  if (r.status === 404) return { arq: arquivoVazio(), sha: '' };
  if (!r.ok) throw ghErro(r);
  const j = await r.json();
  let txt = j.content ? b64ParaTexto(j.content) : '';
  if (!txt && j.size > 0) { const b = await ghFetch(url, { token, cru: true }); if (!b.ok) throw ghErro(b); txt = await b.text(); }   // acima de 1 MB o conteúdo vem à parte
  if (!txt.trim()) return { arq: arquivoVazio(), sha: j.sha };
  let arq = null; try { arq = JSON.parse(txt); } catch (e) { /* ilegível */ }
  if (!arq || typeof arq.docs !== 'object') { const er = new Error('O arquivo parties.json do repositório está ilegível. Nada foi alterado.'); er.status = 500; throw er; }
  return { arq, sha: j.sha };
}
async function ghSync(corpo, { repo, token }) {
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const { arq, sha } = await ghLer(repo, token);
    const { resposta, mudou } = ghMesclar(arq, corpo.cursor || 0, corpo.docs);
    if (!mudou) return resposta;
    const r = await ghFetch(`/repos/${repo}/contents/${GH_ARQUIVO}`, { token, metodo: 'PUT', corpo: Object.assign({ message: 'sync parties', content: textoParaB64(JSON.stringify(arq)) }, sha ? { sha } : {}) });
    if (r.ok) return resposta;
    if (r.status !== 409 && r.status !== 422) throw ghErro(r);   // 409/422 = outro aparelho gravou no meio: relê e mescla de novo
  }
  const er = new Error('Outro aparelho está salvando ao mesmo tempo. Tento de novo em instantes.'); er.status = 409; throw er;
}
// Mesmas rotas que o cliente de nuvem usa, atendidas pelo GitHub.
async function ghApi(metodo, caminho, corpo) {
  if (caminho === '/api/sync') return ghSync(corpo, { repo: S.sync.repo, token: S.sync.token });
  if (caminho.startsWith('/api/respostas')) return { cursor: S.sync.cursorRespostas, respostas: [] };
  if (caminho === '/api/sair') return {};
  throw new Error('Isso precisa da conta do servidor (não funciona na sincronização pelo GitHub).');
}
async function conectarGitHub({ repo, token }) {
  const nome = normalizarRepo(repo), tk = String(token || '').trim();
  if (!/^[\w.-]+\/[\w.-]+$/.test(nome)) throw new Error('Informe o repositório no formato usuario/nome.');
  if (!tk) throw new Error('Cole o token do GitHub.');
  const r = await ghFetch(`/repos/${nome}`, { token: tk }); if (!r.ok) throw ghErro(r);
  const info = await r.json();
  if (!info.private) throw new Error('Esse repositório é PÚBLICO. A lista de convidados tem dados pessoais: use um repositório privado.');
  const sy = S.sync, id = 'github:' + nome;
  if (sy.servidor !== id) Object.assign(sy, { cursor: 0, cursorRespostas: 0, fp: {}, conhecidos: [], pend: {}, ultimaSync: '' });
  Object.assign(sy, { tipo: 'github', servidor: id, repo: nome, token: tk, conta: { nome, email: '' }, contaId: id, publicados: {} });
  gravarAgora(); definirStatus('ok'); sincronizar({ manual: true });
}

// ---------- tela ----------
function formGitHub() {
  formulario({
    titulo: 'Sincronizar meus aparelhos pelo GitHub', salvarTexto: 'Conectar', largo: true,
    intro: 'Seus dados vão para um arquivo no seu repositório <b>privado</b>. No GitHub: <b>Settings → Developer settings → Fine-grained tokens</b>, dê acesso só a esse repositório, com <b>Contents: Read and write</b>. O token fica apenas neste aparelho.',
    campos: [{ id: 'repo', rotulo: 'Repositório privado (usuario/nome)', tipo: 'texto', req: true, larg: 'inteiro', valor: S.sync.repo || repoSugerido(), ph: 'usuario/dudoo-parties-dados' },
      { id: 'token', rotulo: 'Token do GitHub', tipo: 'senha', req: true, larg: 'inteiro', auto: 'off' }],
    salvar: (v) => {
      const bt = $('#formModal .primario'); if (bt) bt.disabled = true; $('#formErro').textContent = '';
      conectarGitHub(v).then(() => { fecharModal(); toast('Conectado! Sincronizando…'); render(); }, (e) => {
        const er = $('#formErro'); if (er) er.textContent = e.offline ? 'Sem conexão com o GitHub.' : e.message; if (bt) bt.disabled = false;
      });
      return false;
    },
  });
}
acoes['gh-conectar'] = () => formGitHub();

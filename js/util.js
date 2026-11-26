'use strict';
// Dudoo Parties — utilitários puros (sem DOM), testáveis em testes.html.
const VERSAO = '0.4.0';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

// Número digitado no padrão brasileiro ("1.234,56", "R$ 50", "0,15") ou ponto simples ("0.15").
function num(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  let s = String(v == null ? '' : v).trim().replace(/[R$\s]/g, '');
  if (!s) return 0;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}
const fmtInput = (n) => (n === '' || n == null ? '' : String(n).replace('.', ','));
const brl = (v) => 'R$ ' + (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNum = (v, d = 2) => (Number(v) || 0).toLocaleString('pt-BR', { maximumFractionDigits: d });
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

// Datas: guardadas em ISO (AAAA-MM-DD), mostradas sempre em DD/MM/AAAA.
const dataBr = (iso) => (/^\d{4}-\d\d-\d\d/.test(iso || '') ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');
const isoDe = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hojeIso = () => isoDe(new Date());
const paraData = (iso) => new Date(iso + 'T00:00:00');
const diasEntre = (a, b) => Math.round((paraData(b) - paraData(a)) / 86400000);
function somaDias(iso, n) { const d = paraData(iso); d.setDate(d.getDate() + n); return isoDe(d); }
function somaMeses(iso, n) {
  const d = paraData(iso), dia = d.getDate();
  d.setDate(1); d.setMonth(d.getMonth() + n);
  d.setDate(Math.min(dia, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return isoDe(d);
}
const DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const diaSemana = (iso) => (iso ? DIAS_SEMANA[paraData(iso).getDay()] : '');
function contagem(iso, hoje = hojeIso()) {
  if (!iso) return '';
  const d = diasEntre(hoje, iso);
  if (d > 1) return `Faltam ${d} dias`;
  if (d === 1) return 'É amanhã!';
  if (d === 0) return 'É hoje!';
  if (d === -1) return 'Foi ontem';
  return `Faz ${-d} dias`;
}
// Hora "HH:MM" ± minutos
function somaMin(hora, min) {
  const [h, m] = (hora || '18:00').split(':').map(Number);
  let t = (h * 60 + (m || 0) + min) % 1440; if (t < 0) t += 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

const normaliza = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const soDigitos = (s) => String(s || '').replace(/\D/g, '');
function foneWa(tel) { let d = soDigitos(tel); if (d && d.length <= 11) d = '55' + d; return d; }
const linkWa = (tel, texto) => `https://wa.me/${foneWa(tel)}?text=${encodeURIComponent(texto)}`;
const iniciais = (nome) => String(nome || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

// Dados dentro do link (convite e proposta funcionam sem servidor): JSON → UTF-8 → base64 url-safe.
function codificar(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = ''; bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodificar(s) {
  try {
    s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
    const bin = atob(s);
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
  } catch (e) { return null; }
}
const baseUrl = () => location.href.split('#')[0];

// Contraste do texto sobre uma cor de fundo
function corTexto(hex) {
  const h = String(hex || '#7C3AED').replace('#', ''); if (h.length !== 6) return '#fff';
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#1f1530' : '#ffffff';
}

'use strict';
// Dudoo Parties — modelos prontos por tipo de festa (checklist, cronograma, roteiro, orçamento e regras de quantidade).

const TIPOS = [
  { id: 'aniversario', nome: 'Aniversário', ic: '🎂', horas: 4 },
  { id: 'infantil', nome: 'Aniversário infantil', ic: '🎈', horas: 4 },
  { id: 'casamento', nome: 'Casamento', ic: '💍', horas: 6 },
  { id: 'debutante', nome: '15 anos / debutante', ic: '👑', horas: 5 },
  { id: 'jantar', nome: 'Jantar', ic: '🍽️', horas: 4 },
  { id: 'cha', nome: 'Chá de bebê / revelação', ic: '🍼', horas: 3 },
  { id: 'formatura', nome: 'Formatura', ic: '🎓', horas: 5 },
  { id: 'churrasco', nome: 'Churrasco / confraternização', ic: '🔥', horas: 5 },
  { id: 'corporativo', nome: 'Evento corporativo', ic: '💼', horas: 4 },
  { id: 'outro', nome: 'Outro', ic: '🎉', horas: 4 },
];
const tipoDe = (id) => TIPOS.find((t) => t.id === id) || TIPOS[TIPOS.length - 1];

const CATEGORIAS = ['Espaço / local', 'Buffet / comida', 'Bebidas', 'Bolo e doces', 'Decoração', 'Fotografia e vídeo', 'Música / DJ / banda',
  'Cerimonial / assessoria', 'Convites e papelaria', 'Lembrancinhas', 'Roupas e beleza', 'Recreação / atrações', 'Equipe / garçons',
  'Descartáveis e utensílios', 'Transporte', 'Outros'];
const STATUS_EVENTO = [['planejando', 'Planejando'], ['confirmado', 'Confirmado'], ['concluido', 'Concluído'], ['cancelado', 'Cancelado']];
const RESTRICOES = ['Vegetariano', 'Vegano', 'Sem glúten', 'Sem lactose', 'Alergia a frutos do mar', 'Alergia a amendoim', 'Diabético', 'Outra'];
const FUNCOES_EQUIPE = ['Cerimonialista', 'Decorador(a)', 'Garçom / garçonete', 'Cozinha / buffet', 'Fotógrafo(a)', 'DJ / música', 'Recepção', 'Montagem', 'Família / amigo ajudando', 'Outra'];
const MOMENTOS_MUSICA = ['Entrada', 'Recepção', 'Jantar', 'Pista / dança', 'Parabéns', 'Momento especial', 'Encerramento'];
const TIPOS_ROTEIRO = ['Entrada', 'Cerimônia', 'Discurso', 'Brinde', 'Música', 'Dança', 'Bolo', 'Fotos', 'Buquê / lembrança', 'Jantar', 'Encerramento', 'Outro'];
const TIPOS_CRONO = [['montagem', 'Montagem'], ['fornecedor', 'Fornecedor'], ['festa', 'Festa']];

const CONDICOES_PADRAO = 'Proposta válida pelo prazo indicado. Reserva da data mediante sinal de 30% do valor total; saldo conforme parcelas combinadas. Alterações de itens ou de número de convidados podem alterar o valor. Cancelamentos seguem o contrato.';

// [dias antes da festa (negativo = depois), grupo, texto]
const CHECK_BASE = [
  [90, 'Planejamento', 'Definir o orçamento total'], [90, 'Planejamento', 'Definir data e local'],
  [75, 'Convidados', 'Fechar a lista preliminar de convidados'],
  [60, 'Fornecedores', 'Pedir orçamentos de comida/buffet'], [60, 'Fornecedores', 'Pedir orçamentos de decoração'],
  [45, 'Fornecedores', 'Fechar contratos e pagar os sinais'],
  [30, 'Convidados', 'Enviar os convites'], [30, 'Decoração', 'Definir tema, paleta de cores e referências'],
  [21, 'Música', 'Montar a playlist (o que tocar e o que não tocar)'],
  [14, 'Convidados', 'Cobrar a confirmação de presença'],
  [10, 'Cardápio', 'Fechar as quantidades de comida e bebida'],
  [7, 'Compras', 'Fazer a lista de compras e comprar o que não é do buffet'], [7, 'Local', 'Montar o mapa de mesas'],
  [3, 'Fornecedores', 'Confirmar o horário de chegada de cada fornecedor'],
  [2, 'Convidados', 'Mandar lembrete com endereço e horário'],
  [1, 'Dia anterior', 'Conferir bolo, doces, bebidas e gelo'], [1, 'Dia anterior', 'Separar lembrancinhas e itens de decoração'],
  [0, 'Dia da festa', 'Receber os fornecedores e conferir a montagem'], [0, 'Dia da festa', 'Fazer o acerto final com os fornecedores'],
  [-1, 'Depois da festa', 'Agradecer convidados e fornecedores'], [-2, 'Depois da festa', 'Conferir saldos e pagamentos pendentes'],
];
const CHECK_EXTRA = {
  casamento: [[150, 'Cerimônia', 'Reservar igreja/cartório e celebrante'], [100, 'Cerimônia', 'Providenciar a documentação do casamento'],
    [60, 'Roupas e beleza', 'Provas de roupa, buquê, cabelo e maquiagem'], [30, 'Cerimônia', 'Definir o roteiro da cerimônia e a ordem de entrada'],
    [30, 'Convidados', 'Definir padrinhos e madrinhas'], [14, 'Cerimônia', 'Ensaio da cerimônia']],
  debutante: [[90, 'Programa', 'Definir a valsa e o ensaio da coreografia'], [45, 'Roupas e beleza', 'Vestido, sapato e maquiagem'], [20, 'Programa', 'Fechar os vídeos e o slide da homenagem']],
  infantil: [[30, 'Convidados', 'Confirmar os responsáveis das crianças'], [21, 'Atrações', 'Contratar recreação/monitores'], [10, 'Lembrancinhas', 'Fechar as lembrancinhas']],
  cha: [[30, 'Programa', 'Definir as brincadeiras e a revelação'], [14, 'Convidados', 'Montar a lista de presentes']],
  formatura: [[60, 'Programa', 'Combinar a homenagem e os discursos'], [30, 'Convidados', 'Definir o número de convites por formando']],
  churrasco: [[7, 'Compras', 'Comprar carnes, carvão e acompanhamentos'], [2, 'Compras', 'Garantir gelo e bebidas geladas']],
  corporativo: [[45, 'Programa', 'Fechar pauta, palestrantes e equipamentos'], [10, 'Convidados', 'Montar o credenciamento'], [3, 'Programa', 'Testar som, projetor e internet']],
  jantar: [[10, 'Cardápio', 'Escolher o menu e harmonizar as bebidas']],
};

// [minutos em relação à hora de início, texto, tipo]
const CRONO_BASE = [
  [-300, 'Chegada da equipe de montagem', 'montagem'], [-240, 'Montagem da decoração e das mesas', 'montagem'],
  [-120, 'Chegada do buffet e das bebidas', 'fornecedor'], [-90, 'Chegada do bolo e dos doces', 'fornecedor'],
  [-60, 'Conferência final e fotos da decoração', 'montagem'], [-30, 'Equipe posicionada e música de ambiente', 'montagem'],
  [0, 'Chegada dos convidados / início', 'festa'], [60, 'Serviço de comida', 'festa'], [150, 'Parabéns e corte do bolo', 'festa'],
  ['fim', 'Encerramento', 'festa'], ['fim+60', 'Desmontagem e entrega do local', 'montagem'],
];
const CRONO_EXTRA = {
  casamento: [[-30, 'Fotos dos noivos e padrinhos', 'festa'], [30, 'Cerimônia', 'festa'], [90, 'Entrada dos noivos na festa', 'festa'], [150, 'Valsa dos noivos', 'festa'], [210, 'Buquê e corte do bolo', 'festa']],
  debutante: [[60, 'Entrada da debutante', 'festa'], [90, 'Valsa', 'festa']],
};
const ROTEIRO_BASE = {
  casamento: [['Entrada', 'Entrada do noivo e dos padrinhos'], ['Entrada', 'Entrada da noiva'], ['Cerimônia', 'Cerimônia e votos'], ['Fotos', 'Fotos com família e padrinhos'],
    ['Brinde', 'Brinde de abertura'], ['Dança', 'Valsa dos noivos'], ['Discurso', 'Discurso dos pais'], ['Jantar', 'Serviço do jantar'], ['Bolo', 'Corte do bolo'], ['Buquê / lembrança', 'Buquê'], ['Dança', 'Pista aberta'], ['Encerramento', 'Despedida']],
  debutante: [['Entrada', 'Entrada da debutante'], ['Música', 'Vídeo de homenagem'], ['Dança', 'Valsa'], ['Brinde', 'Brinde'], ['Bolo', 'Parabéns e bolo'], ['Dança', 'Pista aberta']],
  aniversario: [['Entrada', 'Recepção dos convidados'], ['Jantar', 'Serviço de comida'], ['Bolo', 'Parabéns e bolo'], ['Brinde', 'Brinde'], ['Dança', 'Pista aberta']],
  infantil: [['Entrada', 'Recepção das crianças'], ['Música', 'Recreação'], ['Bolo', 'Parabéns e bolo'], ['Buquê / lembrança', 'Entrega das lembrancinhas']],
  formatura: [['Entrada', 'Entrada dos formandos'], ['Discurso', 'Discurso do orador'], ['Brinde', 'Brinde'], ['Jantar', 'Jantar'], ['Dança', 'Pista aberta']],
  corporativo: [['Entrada', 'Credenciamento'], ['Discurso', 'Abertura'], ['Discurso', 'Palestra principal'], ['Jantar', 'Coffee break / almoço'], ['Encerramento', 'Encerramento e networking']],
};
const ORC_PCT = {
  padrao: { 'Espaço / local': 15, 'Buffet / comida': 30, 'Bebidas': 10, 'Bolo e doces': 8, 'Decoração': 15, 'Fotografia e vídeo': 7, 'Música / DJ / banda': 7, 'Equipe / garçons': 5, 'Outros': 3 },
  casamento: { 'Espaço / local': 15, 'Buffet / comida': 28, 'Bebidas': 8, 'Bolo e doces': 4, 'Decoração': 14, 'Fotografia e vídeo': 8, 'Música / DJ / banda': 6, 'Cerimonial / assessoria': 5, 'Roupas e beleza': 7, 'Convites e papelaria': 2, 'Outros': 3 },
  infantil: { 'Espaço / local': 15, 'Buffet / comida': 25, 'Bebidas': 7, 'Bolo e doces': 12, 'Decoração': 18, 'Recreação / atrações': 12, 'Lembrancinhas': 6, 'Outros': 5 },
};

function regrasPadrao(tipo) {
  const R = (item, cat, un, qtd, base, aplica, emb, embNome, preco) => ({ id: uid(), item, cat, un, qtd, base, aplica: aplica || 'todos', emb: emb || 0, embNome: embNome || '', preco: preco || 0 });
  const D = 'Descartáveis e utensílios';
  const bebidas = [R('Água', 'Bebidas', 'L', 0.15, 'hora', 'todos', 1.5, 'garrafa 1,5 L', 3.5), R('Refrigerante', 'Bebidas', 'L', 0.25, 'hora', 'todos', 2, 'garrafa 2 L', 9),
    R('Suco', 'Bebidas', 'L', 0.1, 'hora', 'todos', 1, 'caixa 1 L', 8), R('Gelo', 'Bebidas', 'kg', 0.4, 'pessoa', 'todos', 5, 'saco 5 kg', 12)];
  const cerveja = (q) => R('Cerveja', 'Bebidas', 'L', q || 0.35, 'hora', 'adultos', 0.6, 'garrafa 600 ml', 9);
  const vinho = (q) => R('Vinho / espumante', 'Bebidas', 'L', q || 0.2, 'hora', 'adultos', 0.75, 'garrafa 750 ml', 60);
  const descart = [R('Copos', D, 'un', 3, 'pessoa', 'todos', 50, 'pacote c/ 50', 12), R('Guardanapos', D, 'un', 6, 'pessoa', 'todos', 50, 'pacote c/ 50', 6), R('Pratos', D, 'un', 2, 'pessoa', 'todos', 10, 'pacote c/ 10', 9)];
  const salgados = (q) => R('Salgados', 'Buffet / comida', 'un', q || 12, 'pessoa', 'todos', 100, 'cento', 90);
  const doces = (q) => R('Docinhos', 'Bolo e doces', 'un', q || 4, 'pessoa', 'todos', 100, 'cento', 110);
  const bolo = R('Bolo', 'Bolo e doces', 'kg', 0.1, 'pessoa', 'todos', 0, '', 90);
  const refeicao = [R('Refeição (prato principal)', 'Buffet / comida', 'kg', 0.4, 'pessoa', 'adultos', 0, '', 45), R('Refeição infantil', 'Buffet / comida', 'kg', 0.25, 'pessoa', 'criancas', 0, '', 45),
    R('Prato vegetariano', 'Buffet / comida', 'un', 1, 'pessoa', 'vegetarianos', 0, '', 35)];
  switch (tipo) {
    case 'infantil': return [salgados(12), doces(5), bolo, R('Pipoca', 'Buffet / comida', 'kg', 0.03, 'pessoa', 'todos', 0, '', 25), ...bebidas, cerveja(0.2), ...descart];
    case 'casamento': return [R('Canapés / entradas', 'Buffet / comida', 'un', 6, 'pessoa', 'adultos', 0, '', 3), ...refeicao, doces(5), R('Bolo', 'Bolo e doces', 'kg', 0.1, 'pessoa', 'todos', 0, '', 120), ...bebidas, cerveja(0.35), vinho(0.25)];
    case 'debutante': case 'formatura': return [salgados(8), ...refeicao, doces(5), bolo, ...bebidas, cerveja(0.25), vinho(0.12)];
    case 'jantar': return [R('Entrada', 'Buffet / comida', 'un', 2, 'pessoa', 'todos', 0, '', 12), ...refeicao, R('Sobremesa', 'Bolo e doces', 'un', 1, 'pessoa', 'todos', 0, '', 14), R('Água', 'Bebidas', 'L', 0.2, 'hora', 'todos', 1.5, 'garrafa 1,5 L', 3.5), vinho(0.25), cerveja(0.2), R('Gelo', 'Bebidas', 'kg', 0.3, 'pessoa', 'todos', 5, 'saco 5 kg', 12)];
    case 'cha': return [salgados(10), doces(5), bolo, ...bebidas.slice(0, 3), ...descart];
    case 'churrasco': return [R('Carne (variada)', 'Buffet / comida', 'kg', 0.4, 'pessoa', 'adultos', 0, '', 55), R('Carne (crianças)', 'Buffet / comida', 'kg', 0.2, 'pessoa', 'criancas', 0, '', 55),
      R('Linguiça', 'Buffet / comida', 'kg', 0.15, 'pessoa', 'todos', 0, '', 28), R('Pão de alho', 'Buffet / comida', 'un', 2, 'pessoa', 'todos', 0, '', 4), R('Acompanhamentos (arroz, farofa, vinagrete)', 'Buffet / comida', 'kg', 0.15, 'pessoa', 'todos', 0, '', 20),
      R('Carvão', 'Outros', 'kg', 0.5, 'pessoa', 'todos', 5, 'saco 5 kg', 22), ...bebidas, cerveja(0.5), ...descart];
    case 'corporativo': return [R('Café', 'Bebidas', 'L', 0.15, 'hora', 'todos', 1, 'garrafa térmica 1 L', 6), R('Água', 'Bebidas', 'L', 0.2, 'hora', 'todos', 1.5, 'garrafa 1,5 L', 3.5), salgados(6), doces(3), ...descart.slice(0, 2)];
    default: return [salgados(12), doces(4), bolo, ...bebidas, cerveja(0.35), ...descart];
  }
}

const REG_APLICA = [['todos', 'Todos (adultos e crianças)'], ['adultos', 'Só adultos'], ['criancas', 'Só crianças'], ['vegetarianos', 'Só vegetarianos/veganos']];

// Constrói um evento já com checklist, cronograma, roteiro, orçamento e regras do tipo.
function novoEvento(d) {
  const t = tipoDe(d.tipo);
  const ev = completarEvento({
    id: uid(), nome: d.nome || 'Nova festa', tipo: t.id, data: d.data || '', hora: d.hora || '', local: d.local || '', clienteId: d.clienteId || '', anfitriao: d.anfitriao || '',
    status: 'planejando', obs: d.obs || '', orcamentoTotal: num(d.orcamentoTotal), duracaoH: num(d.duracaoH) || t.horas, criadoEm: hojeIso(),
  });
  ev.qtd.regras = regrasPadrao(t.id);
  ev.proposta.condicoes = CONDICOES_PADRAO;
  if (d.modelo && d.modelo !== 'nenhum' && d.modelo !== 'padrao') {
    const m = S.modelos.find((x) => x.id === d.modelo);
    if (m) aplicarModeloSalvo(ev, m); else aplicarModeloPadrao(ev);
  } else if (d.modelo !== 'nenhum') aplicarModeloPadrao(ev);
  return ev;
}
function prazoRelativo(ev, dias) { return ev.data && dias != null ? somaDias(ev.data, -dias) : ''; }
function aplicarModeloPadrao(ev) {
  const t = ev.tipo;
  ev.checklist = [...CHECK_BASE, ...(CHECK_EXTRA[t] || [])].sort((a, b) => b[0] - a[0])
    .map(([dias, grupo, texto]) => ({ id: uid(), texto, grupo, resp: '', prazo: prazoRelativo(ev, dias), feito: false, dias }));
  aplicarCronogramaPadrao(ev);
  ev.roteiro = (ROTEIRO_BASE[t] || []).map(([tipo, texto]) => ({ id: uid(), hora: '', tipo, texto, resp: '', musica: '', obs: '' }));
  const pct = ORC_PCT[t] || ORC_PCT.padrao;
  ev.orcamento = Object.keys(pct).map((c) => ({ id: uid(), categoria: c, previsto: Math.round((ev.orcamentoTotal || 0) * pct[c]) / 100 }));
}
function aplicarCronogramaPadrao(ev) {
  const ini = ev.hora || '18:00', fim = (ev.duracaoH || 4) * 60;
  const todos = [...CRONO_BASE, ...(CRONO_EXTRA[ev.tipo] || [])];
  ev.cronograma = todos.map(([m, texto, tipo]) => {
    const min = m === 'fim' ? fim : m === 'fim+60' ? fim + 60 : m;
    return { id: uid(), hora: somaMin(ini, min), texto, tipo, resp: '', obs: '', _m: min };
  }).sort((a, b) => a._m - b._m).map(({ _m, ...r }) => r);
}
// Modelo do usuário: guarda tudo em dias/minutos relativos para valer em outra data.
function modeloDeEvento(ev, nome) {
  const ini = ev.hora || '18:00';
  const minDe = (h) => { const [a, b] = String(h || ini).split(':').map(Number); const [c, d] = ini.split(':').map(Number); return a * 60 + (b || 0) - (c * 60 + (d || 0)); };
  return {
    id: uid(), nome, tipo: ev.tipo, criadoEm: hojeIso(),
    checklist: ev.checklist.map((c) => ({ texto: c.texto, grupo: c.grupo, dias: c.prazo && ev.data ? diasEntre(c.prazo, ev.data) : (c.dias != null ? c.dias : null) })),
    cronograma: ev.cronograma.map((c) => ({ texto: c.texto, tipo: c.tipo, min: minDe(c.hora) })),
    roteiro: ev.roteiro.map((r) => ({ tipo: r.tipo, texto: r.texto, musica: r.musica })),
    orcamento: ev.orcamento.map((o) => ({ categoria: o.categoria, pct: ev.orcamentoTotal ? Math.round((num(o.previsto) / ev.orcamentoTotal) * 1000) / 10 : 0 })),
    regras: ev.qtd.regras.map((r) => ({ ...r, id: undefined })),
    compras: ev.compras.map((c) => ({ item: c.item, un: c.un, qtd: c.qtd, preco: c.preco, categoria: c.categoria })),
  };
}
function aplicarModeloSalvo(ev, m) {
  ev.checklist = (m.checklist || []).map((c) => ({ id: uid(), texto: c.texto, grupo: c.grupo, resp: '', prazo: prazoRelativo(ev, c.dias), feito: false, dias: c.dias }));
  const ini = ev.hora || '18:00';
  ev.cronograma = (m.cronograma || []).map((c) => ({ id: uid(), hora: somaMin(ini, c.min), texto: c.texto, tipo: c.tipo, resp: '', obs: '' }));
  ev.roteiro = (m.roteiro || []).map((r) => ({ id: uid(), hora: '', tipo: r.tipo, texto: r.texto, resp: '', musica: r.musica || '', obs: '' }));
  ev.orcamento = (m.orcamento || []).map((o) => ({ id: uid(), categoria: o.categoria, previsto: Math.round((ev.orcamentoTotal || 0) * (o.pct || 0)) / 100 }));
  if (m.regras && m.regras.length) ev.qtd.regras = m.regras.map((r) => ({ ...r, id: uid() }));
  ev.compras = (m.compras || []).map((c) => ({ id: uid(), item: c.item, un: c.un, qtd: c.qtd, preco: c.preco, categoria: c.categoria, comprado: false }));
}

'use strict';
// Dudoo Parties — exemplo pronto para apresentar o app (dados fictícios).
function criarDemo() {
  let semente = 7; const aleatorio = () => { semente = (semente * 9301 + 49297) % 233280; return semente / 233280; };
  const pick = (l) => l[Math.floor(aleatorio() * l.length)];
  const hoje = hojeIso(), c = S.config;
  if (!c.modo) c.modo = 'profissional';
  if (!c.negocio) { Object.assign(c, { negocio: 'Ateliê Festa Bonita', responsavel: 'Camila Rocha', telefone: '(11) 99999-0000', cor: '#C2547A', rodape: 'Ateliê Festa Bonita · @festabonita · (11) 99999-0000' }); }
  const cli1 = { id: uid(), nome: 'Marina Alves', telefone: '(11) 98888-1111', email: 'marina@exemplo.com', obs: 'Prefere contato por WhatsApp, à noite.' };
  const cli2 = { id: uid(), nome: 'Beatriz Lima', telefone: '(11) 97777-2222', email: '', obs: '' };
  S.clientes.push(cli1, cli2);
  S.banco.push(
    { id: uid(), nome: 'Buffet Sabor & Arte', categoria: 'Buffet / comida', contato: 'Rogério', telefone: '(11) 3333-1000', preco: 135, unidade: 'pessoa', obs: 'Inclui garçons e louça.' },
    { id: uid(), nome: 'Flores do Vale', categoria: 'Decoração', contato: 'Lúcia', telefone: '(11) 95555-3030', preco: 4800, unidade: 'festa', obs: 'Arranjos de mesa e arco.' },
    { id: uid(), nome: 'DJ Rafa Som', categoria: 'Música / DJ / banda', contato: 'Rafael', telefone: '(11) 94444-5050', preco: 2200, unidade: 'festa', obs: '5 horas, som e iluminação.' },
    { id: uid(), nome: 'Studio Luz Fotografia', categoria: 'Fotografia e vídeo', contato: 'Ana', telefone: '(11) 93333-7070', preco: 3500, unidade: 'festa', obs: '' },
    { id: uid(), nome: 'Doce Encanto Confeitaria', categoria: 'Bolo e doces', contato: 'Fernanda', telefone: '(11) 92222-8080', preco: 95, unidade: 'kg', obs: 'Bolo decorado e doces finos.' },
    { id: uid(), nome: 'Espaço Jardim das Palmeiras', categoria: 'Espaço / local', contato: 'Marcos', telefone: '(19) 3232-9000', preco: 9000, unidade: 'festa', obs: 'Capacidade 150 pessoas.' });

  // ---------- Casamento ----------
  const ev = novoEvento({ nome: 'Casamento Marina & Pedro', tipo: 'casamento', data: somaDias(hoje, 45), hora: '17:00', local: 'Espaço Jardim das Palmeiras, Campinas', clienteId: cli1.id, anfitriao: 'Marina e Pedro', orcamentoTotal: 62000, duracaoH: 6 });
  ev.status = 'confirmado'; ev.obs = 'Traje: social. Tema: jardim com flores brancas e eucalipto. Cerimônia no jardim às 17h.';
  const nomes = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabriela', 'Heitor', 'Isabela', 'João', 'Karen', 'Lucas', 'Mariana', 'Nicolas', 'Olívia', 'Paulo', 'Rafaela', 'Sérgio', 'Tatiana', 'Vinícius', 'Wagner', 'Yasmin', 'Zélia', 'Alice', 'Bernardo', 'Clara', 'Daniel', 'Eduarda', 'Felipe', 'Giovana'];
  const sobre = ['Souza', 'Oliveira', 'Santos', 'Pereira', 'Costa', 'Ribeiro', 'Almeida', 'Carvalho', 'Gomes', 'Martins', 'Araújo', 'Barbosa'];
  const grupos = ['Família da noiva', 'Família do noivo', 'Amigos', 'Trabalho', 'Padrinhos'];
  const vistos = new Set();
  for (let i = 0; i < 34; i++) {
    let nome; do { nome = `${pick(nomes)} ${pick(sobre)}`; } while (vistos.has(nome)); vistos.add(nome);
    const rsvp = pick(['sim', 'sim', 'sim', 'pendente', 'pendente', 'nao']), crianca = aleatorio() < 0.12;
    ev.convidados.push({ id: uid(), nome, grupo: pick(grupos), faixa: crianca ? 'crianca' : 'adulto', acomp: crianca ? 1 : pick([0, 0, 1, 1, 2]), telefone: `(11) 9${Math.floor(1000 + aleatorio() * 8999)}-${Math.floor(1000 + aleatorio() * 8999)}`,
      restricoes: aleatorio() < 0.3 ? [pick(['Vegetariano', 'Vegetariano', 'Vegano', 'Sem glúten', 'Sem lactose', 'Alergia a frutos do mar'])] : [], rsvp, mesaId: '', obs: '' });
  }
  for (let i = 1; i <= 8; i++) ev.mesas.push({ id: uid(), nome: `Mesa ${i}`, lugares: 8 });
  distribuirMesas(ev);
  // compras a partir das quantidades
  calcularQuantitativo(ev).filter((r) => r.total > 0).forEach((r, i) => ev.compras.push({ id: uid(), item: r.item, qtd: r.embalagens || r.total, un: r.embalagens ? r.embNome : r.un, preco: num(r.preco), categoria: r.cat, comprado: i % 4 === 0, origem: r.id }));
  // equipe e checklist
  ev.equipe.push({ id: uid(), nome: 'Camila Rocha', funcao: 'Cerimonialista', telefone: '(11) 99999-0000' }, { id: uid(), nome: 'Léo Martins', funcao: 'Montagem', telefone: '(11) 96666-1212' }, { id: uid(), nome: 'Sueli Alves', funcao: 'Família / amigo ajudando', telefone: '(11) 95555-3434' });
  ev.checklist.forEach((t) => {
    t.feito = t.dias > 60 || (t.dias === 60 && !/decoração/i.test(t.texto));
    if (/fornecedor|contrato|orçamento|montagem|mapa|ensaio|roteiro/i.test(t.texto)) t.resp = 'Camila Rocha';
    else if (/convite|convidados|confirmação|lembrete/i.test(t.texto)) t.resp = 'Sueli Alves';
    else if (/decoração|montagem|bolo/i.test(t.texto)) t.resp = 'Léo Martins';
  });
  // fornecedores com pagamentos
  const f = (nome, categoria, valor, tel, pags) => ({ id: uid(), nome, categoria, valor, telefone: tel, contato: '', obs: '', pagamentos: pags.map(([d, v, ddias, pago]) => ({ id: uid(), descricao: d, valor: v, venc: somaDias(hoje, ddias), pago, dataPago: pago ? somaDias(hoje, ddias) : '' })) });
  ev.fornecedores.push(
    f('Espaço Jardim das Palmeiras', 'Espaço / local', 9000, '(19) 3232-9000', [['Sinal 50%', 4500, -40, true], ['Saldo', 4500, 30, false]]),
    f('Buffet Sabor & Arte', 'Buffet / comida', 17550, '(11) 3333-1000', [['Sinal', 5000, -20, true], ['Parcela 2', 6000, 5, false], ['Saldo', 6550, 40, false]]),
    f('Flores do Vale', 'Decoração', 9800, '(11) 95555-3030', [['Sinal', 3000, -10, true], ['Saldo', 6800, 35, false]]),
    f('DJ Rafa Som', 'Música / DJ / banda', 2200, '(11) 94444-5050', [['Sinal', 1000, -5, true], ['Saldo', 1200, 44, false]]),
    f('Studio Luz Fotografia', 'Fotografia e vídeo', 3500, '(11) 93333-7070', [['Sinal', 1750, 2, false], ['Saldo', 1750, 46, false]]));
  ev.orcamento.forEach((o) => { if (o.categoria === 'Fotografia e vídeo') o.previsto = 5000; });
  // playlist
  ev.playlists.push({ id: uid(), nome: 'Playlist do casamento', link: 'https://open.spotify.com/playlist/37i9dQZF1DXdPec7aLTmlC', faixas: [
    { id: uid(), titulo: 'Perfect', artista: 'Ed Sheeran', tipo: 'tocar', momento: 'Entrada da noiva' }, { id: uid(), titulo: 'Thinking Out Loud', artista: 'Ed Sheeran', tipo: 'tocar', momento: 'Valsa' },
    { id: uid(), titulo: 'Evidências', artista: 'Chitãozinho & Xororó', tipo: 'tocar', momento: 'Pista / dança' }, { id: uid(), titulo: 'Dancing Queen', artista: 'ABBA', tipo: 'tocar', momento: 'Pista / dança' },
    { id: uid(), titulo: 'Garota de Ipanema', artista: 'Tom Jobim', tipo: 'tocar', momento: 'Jantar' }, { id: uid(), titulo: 'Esqueça-me se for capaz', artista: 'Fábio Jr.', tipo: 'nao', momento: '' }, { id: uid(), titulo: 'Eu sou terrível', artista: 'Roberto Carlos', tipo: 'nao', momento: '' }] });
  // moodboard
  ev.paleta = ['#F6F1EA', '#A8B5A0', '#D9B8A3', '#6B7F6B', '#C2547A'];
  ev.moodboard.push({ id: uid(), img: '', titulo: 'Arco de flores brancas', nota: 'Entrada da cerimônia — rosas brancas e eucalipto.', cor: '#E7EEE3' }, { id: uid(), img: '', titulo: 'Mesa dos convidados', nota: 'Toalha de linho cru, velas e vasinhos baixos.', cor: '#F1E4D8' },
    { id: uid(), img: '', titulo: 'Bolo naked', nota: 'Flores frescas no topo. Confeitaria Doce Encanto.', cor: '#F6E5EA' }, { id: uid(), img: '', titulo: 'Papelaria', nota: 'Convites com aquarela verde-sálvia.', cor: '#D9E3D6' });
  // proposta aprovada e contrato
  ev.proposta.itens = [{ id: uid(), descricao: 'Assessoria e cerimonial completo', qtd: 1, valor: 6500 }, { id: uid(), descricao: 'Projeto e montagem de decoração', qtd: 1, valor: 9800 }, { id: uid(), descricao: 'Coordenação de fornecedores (6)', qtd: 6, valor: 350 }];
  ev.proposta.validade = somaDias(hoje, -30); ev.proposta.desconto = 500; ev.proposta.status = 'aprovada'; ev.proposta.aprovadoEm = somaDias(hoje, -42); ev.proposta.aprovadoPor = 'Marina Alves';
  ev.contrato.total = 17900; ev.contrato.parcelas = parcelar(17900, 4, somaDias(hoje, -42), 'Parcela'); ev.contrato.parcelas[0].pago = true; ev.contrato.parcelas[1].pago = true;
  ev.contrato.texto = contratoPadrao(ev);

  // ---------- Aniversário infantil ----------
  const ev2 = novoEvento({ nome: 'Aniversário de 7 anos da Helena', tipo: 'infantil', data: somaDias(hoje, 14), hora: '15:00', local: 'Salão de festas Pula-Pula', clienteId: cli2.id, anfitriao: 'Helena', orcamentoTotal: 9000, duracaoH: 4 });
  ev2.obs = 'Tema: Unicórnios. Pais pediram lanchinho sem amendoim.';
  ['Isabela', 'Miguel', 'Laura', 'Davi', 'Sofia', 'Arthur', 'Valentina', 'Heloísa', 'Théo', 'Lívia', 'Gael', 'Manuela'].forEach((n, i) => ev2.convidados.push({ id: uid(), nome: `${n} (turma)`, grupo: 'Colegas', faixa: 'crianca', acomp: 1, telefone: '', restricoes: i === 3 ? ['Alergia a amendoim'] : [], rsvp: i < 7 ? 'sim' : 'pendente', mesaId: '', obs: '' }));
  ev2.convidados.push({ id: uid(), nome: 'Avó Dalva', grupo: 'Família', faixa: 'adulto', acomp: 0, telefone: '', restricoes: ['Diabético'], rsvp: 'sim', mesaId: '', obs: '' }, { id: uid(), nome: 'Tio Marcos', grupo: 'Família', faixa: 'adulto', acomp: 2, telefone: '', restricoes: [], rsvp: 'pendente', mesaId: '', obs: '' });
  ev2.checklist.forEach((t) => { t.feito = t.dias >= 21; });
  ev2.fornecedores.push(f('Pula-Pula Salão de Festas', 'Espaço / local', 3200, '(11) 3030-4040', [['Sinal', 1000, -12, true], ['Saldo', 2200, 12, false]]), f('Recreação Alegria', 'Recreação / atrações', 900, '(11) 98989-0000', [['Total', 900, 13, false]]));

  S.eventos.push(ev, ev2); S.demo = true; gravar();
  return ev;
}
acoes['carregar-demo'] = () => {
  const go = () => { const ev = criarDemo(); aplicarCor(); irPara(`#/evento/${ev.id}/resumo`); toast('Exemplo carregado — explore as abas!'); };
  if (S.eventos.length) confirmar('Adicionar um evento de exemplo aos seus dados atuais?', go, 'Adicionar'); else go();
};

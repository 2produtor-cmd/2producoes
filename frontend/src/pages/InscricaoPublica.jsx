import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, ChevronRight, ChevronLeft, Send, Search, UserCheck } from 'lucide-react';
import OrcamentoTabela from '../components/OrcamentoTabela';

const ETAPAS = ['Dados Pessoais', 'Projeto', 'Financeiro', 'Documentação', 'Finalização'];
const CATEGORIAS = ['Teatro', 'Dança', 'Música', 'Hip Hop', 'Circo', 'Audiovisual', 'Artes Visuais', 'Literatura', 'Cultura Popular', 'Outros'];
const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const vazio = {
  nome_completo: '', nome_artistico: '', cpf: '', rg: '', data_nascimento: '', genero: '',
  telefone: '', whatsapp: '', email: '', cep: '', endereco: '', cidade: '', estado: '',
  nome_projeto: '', categoria: '', area_cultural: '', objeto_projeto: '', objetivo: '', justificativa: '',
  metas_resultados: '', perfil_publico: '', publico_alvo: '', qtd_beneficiados: '', estimativa_publico: '',
  estruturas_acessiveis: '', acessibilidade_comunicacional: '', acessibilidade_deficientes_visuais: '',
  cidade_execucao: '', cobranca_ingresso: false, ficha_tecnica: [],
  plano_divulgacao: '', valor_solicitado: '', orcamento_detalhado: '',
  fontes_recurso: '', links_videos: '', aceite_termos: false
};

const inp = { width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const textarea = { ...inp, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' };

function Campo({ label, children, full, obrigatorio }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 }}>
        {label} {obrigatorio && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export default function InscricaoPublica() {
  const [etapa, setEtapa] = useState(0);
  const [dados, setDados] = useState(vazio);
  const [enviado, setEnviado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [arquivos, setArquivos] = useState([]);
  const [inscricaoId, setInscricaoId] = useState(null);
  const [itensOrcamento, setItensOrcamento] = useState([]);
  const [buscaProponente, setBuscaProponente] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [proponenteSelecionado, setProponenteSelecionado] = useState(null);
  const buscaTimer = useRef(null);

  function set(campo, valor) { setDados(d => ({ ...d, [campo]: valor })); }

  useEffect(() => {
    clearTimeout(buscaTimer.current);
    if (!buscaProponente || buscaProponente.length < 2) { setSugestoes([]); return; }
    buscaTimer.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/pessoas/publica', { params: { busca: buscaProponente } });
        setSugestoes(data.slice(0, 6));
      } catch { setSugestoes([]); }
    }, 300);
  }, [buscaProponente]);

  function selecionarProponente(pessoa) {
    set('nome_completo', pessoa.nome || '');
    set('cpf', pessoa.cpf || '');
    set('telefone', pessoa.telefone || '');
    set('endereco', pessoa.endereco || '');
    set('cep', pessoa.cep || '');
    set('cidade', pessoa.cidade || '');
    set('estado', pessoa.estado || '');
    setProponenteSelecionado(pessoa);
    setBuscaProponente('');
    setSugestoes([]);
  }

  function validarEtapa() {
    if (etapa === 0 && (!dados.nome_completo || !dados.cpf || !dados.email)) {
      toast.error('Preencha os campos obrigatórios'); return false;
    }
    if (etapa === 1 && !dados.nome_projeto) {
      toast.error('Nome do projeto é obrigatório'); return false;
    }
    if (etapa === 4 && !dados.aceite_termos) {
      toast.error('Aceite os termos para continuar'); return false;
    }
    return true;
  }

  async function avancar() {
    if (!validarEtapa()) return;
    if (etapa < 4) { setEtapa(e => e + 1); return; }
    await enviar();
  }

  async function enviar() {
    setLoading(true);
    try {
      const { data } = await api.post('/inscricoes/publica', { ...dados, etapa_atual: 5 });
      setInscricaoId(data.id);
      for (const arq of arquivos) {
        const form = new FormData();
        form.append('arquivo', arq.file);
        form.append('referencia_id', data.id);
        form.append('tipo_referencia', 'inscricao');
        form.append('tipo_documento', arq.tipo);
        await api.post('/anexos/publica', form);
      }
      setEnviado(data);
    } catch (err) {
      toast.error(err.response?.data?.erro || 'Erro ao enviar inscrição');
    } finally {
      setLoading(false);
    }
  }

  function addArquivo(tipo, file) {
    setArquivos(a => [...a.filter(x => x.tipo !== tipo), { tipo, file }]);
  }

  async function baixarComprovante() {
    if (!inscricaoId) return;
    try {
      const res = await api.get(`/documentos/inscricao/${inscricaoId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url);
    } catch { toast.error('Erro ao gerar comprovante'); }
  }

  if (enviado) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 48, maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <CheckCircle size={64} color="#10b981" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>Inscrição Enviada!</h2>
          <p style={{ color: '#888', marginBottom: 24 }}>Sua inscrição foi recebida com sucesso.</p>
          <div style={{ background: '#f0fdf4', border: '2px solid #10b981', borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Número do Protocolo</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#1a1a2e', letterSpacing: 2 }}>{enviado.protocolo}</div>
          </div>
          <p style={{ fontSize: 12, color: '#aaa', marginBottom: 24 }}>Guarde este protocolo para acompanhar sua inscrição.</p>
          <button onClick={baixarComprovante} style={{ width: '100%', padding: 14, background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
            Baixar Comprovante PDF
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: 2 }}>2Produções</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 }}>Formulário de Inscrição de Projetos</div>
        </div>

        {/* Barra de progresso */}
        <div style={{ display: 'flex', marginBottom: 28, gap: 4 }}>
          {ETAPAS.map((e, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: 4, borderRadius: 2, background: i <= etapa ? '#10b981' : 'rgba(255,255,255,0.2)', marginBottom: 6, transition: 'background 0.3s' }} />
              <div style={{ fontSize: 10, color: i <= etapa ? '#10b981' : 'rgba(255,255,255,0.5)', fontWeight: i === etapa ? 700 : 400 }}>{e}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>
            Etapa {etapa + 1}: {ETAPAS[etapa]}
          </h2>

          {etapa === 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              {/* Busca de proponente cadastrado */}
              <div style={{ gridColumn: '1 / -1', padding: '14px 16px', background: '#f0f9ff', border: '2px solid #bae6fd', borderRadius: 10, marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Search size={12} /> Buscar proponente já cadastrado no sistema
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ ...inp, paddingLeft: 36, border: '2px solid #bae6fd' }}
                    placeholder="Digite o nome ou CPF para buscar..."
                    value={buscaProponente}
                    onChange={e => { setBuscaProponente(e.target.value); setProponenteSelecionado(null); }}
                  />
                  <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#93c5fd' }} />
                  {sugestoes.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '2px solid #e5e7eb', borderRadius: 8, zIndex: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', marginTop: 4 }}>
                      {sugestoes.map(p => (
                        <div key={p.id} onClick={() => selecionarProponente(p)}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}
                        >
                          <UserCheck size={15} color="#0369a1" />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2e' }}>{p.nome}</div>
                            <div style={{ fontSize: 11, color: '#888' }}>{p.cpf ? `CPF: ${p.cpf}` : ''}{p.cidade ? ` • ${p.cidade}/${p.estado}` : ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {buscaProponente.length >= 2 && sugestoes.length === 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '2px solid #e5e7eb', borderRadius: 8, zIndex: 200, padding: '10px 14px', fontSize: 12, color: '#aaa', marginTop: 4 }}>
                      Nenhuma pessoa encontrada
                    </div>
                  )}
                </div>
                {proponenteSelecionado
                  ? <div style={{ marginTop: 8, fontSize: 12, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 5 }}><UserCheck size={13} /> Dados preenchidos com <strong>{proponenteSelecionado.nome}</strong> — edite abaixo se precisar</div>
                  : <div style={{ marginTop: 6, fontSize: 11, color: '#93c5fd' }}>Ou preencha os campos manualmente abaixo</div>
                }
              </div>
              <Campo label="Nome Completo" obrigatorio full><input style={inp} value={dados.nome_completo} onChange={e => set('nome_completo', e.target.value)} /></Campo>
              <Campo label="Nome Artístico"><input style={inp} value={dados.nome_artistico} onChange={e => set('nome_artistico', e.target.value)} /></Campo>
              <Campo label="CPF" obrigatorio><input style={inp} value={dados.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" /></Campo>
              <Campo label="RG"><input style={inp} value={dados.rg} onChange={e => set('rg', e.target.value)} /></Campo>
              <Campo label="Data de Nascimento"><input type="date" style={inp} value={dados.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} /></Campo>
              <Campo label="Gênero">
                <select style={inp} value={dados.genero} onChange={e => set('genero', e.target.value)}>
                  <option value="">Selecione...</option>
                  {['Masculino','Feminino','Não-binário','Prefiro não informar'].map(g => <option key={g}>{g}</option>)}
                </select>
              </Campo>
              <Campo label="Telefone"><input style={inp} value={dados.telefone} onChange={e => set('telefone', e.target.value)} /></Campo>
              <Campo label="WhatsApp"><input style={inp} value={dados.whatsapp} onChange={e => set('whatsapp', e.target.value)} /></Campo>
              <Campo label="E-mail" obrigatorio full><input type="email" style={inp} value={dados.email} onChange={e => set('email', e.target.value)} /></Campo>
              <Campo label="CEP"><input style={inp} value={dados.cep} onChange={e => set('cep', e.target.value)} /></Campo>
              <Campo label="Endereço" full><input style={inp} value={dados.endereco} onChange={e => set('endereco', e.target.value)} /></Campo>
              <Campo label="Cidade"><input style={inp} value={dados.cidade} onChange={e => set('cidade', e.target.value)} /></Campo>
              <Campo label="Estado">
                <select style={inp} value={dados.estado} onChange={e => set('estado', e.target.value)}>
                  <option value="">UF</option>
                  {ESTADOS.map(e => <option key={e}>{e}</option>)}
                </select>
              </Campo>
            </div>
          )}

          {etapa === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Campo label="Nome do Projeto" obrigatorio full><input style={inp} value={dados.nome_projeto} onChange={e => set('nome_projeto', e.target.value)} /></Campo>
              <Campo label="Categoria">
                <select style={inp} value={dados.categoria} onChange={e => set('categoria', e.target.value)}>
                  <option value="">Selecione...</option>
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </Campo>
              <Campo label="Área Cultural"><input style={inp} value={dados.area_cultural} onChange={e => set('area_cultural', e.target.value)} /></Campo>
              <Campo label="Público-alvo"><input style={inp} value={dados.publico_alvo} onChange={e => set('publico_alvo', e.target.value)} /></Campo>
              <Campo label="Qtd. Beneficiados"><input type="number" style={inp} value={dados.qtd_beneficiados} onChange={e => set('qtd_beneficiados', e.target.value)} /></Campo>
              <Campo label="Objeto do Projeto" obrigatorio full>
                <textarea style={textarea} maxLength={2000} value={dados.objeto_projeto} onChange={e => set('objeto_projeto', e.target.value)} />
                <div style={{ fontSize: 11, color: '#aaa', textAlign: 'right' }}>{(dados.objeto_projeto || '').length}/2000</div>
              </Campo>
              <Campo label="Objetivo" full><textarea style={textarea} value={dados.objetivo} onChange={e => set('objetivo', e.target.value)} /></Campo>
              <Campo label="Justificativa" full><textarea style={textarea} value={dados.justificativa} onChange={e => set('justificativa', e.target.value)} /></Campo>
              <Campo label="Metas, Resultados e Desdobramentos do Projeto" full>
                <textarea style={textarea} maxLength={2000} value={dados.metas_resultados} onChange={e => set('metas_resultados', e.target.value)} />
                <div style={{ fontSize: 11, color: '#aaa', textAlign: 'right' }}>{(dados.metas_resultados || '').length}/2000</div>
              </Campo>
              <Campo label="Perfil do Público que o Projeto quer Atingir" full>
                <textarea style={textarea} maxLength={1000} value={dados.perfil_publico} onChange={e => set('perfil_publico', e.target.value)} />
                <div style={{ fontSize: 11, color: '#aaa', textAlign: 'right' }}>{(dados.perfil_publico || '').length}/1000</div>
              </Campo>
              <Campo label="Estimativa de Público"><input type="number" style={inp} value={dados.estimativa_publico} onChange={e => set('estimativa_publico', e.target.value)} placeholder="Ex: 500" /></Campo>
              <Campo label="Cidade onde será executado o Projeto"><input style={inp} value={dados.cidade_execucao} onChange={e => set('cidade_execucao', e.target.value)} /></Campo>
              <Campo label="Vai ter cobrança de ingresso?">
                <select style={inp} value={dados.cobranca_ingresso ? 'sim' : 'nao'} onChange={e => set('cobranca_ingresso', e.target.value === 'sim')}>
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </Campo>
              <Campo label="Estruturas Acessíveis – Pessoas com Mobilidade Reduzida" full>
                <textarea style={textarea} maxLength={1000} value={dados.estruturas_acessiveis} onChange={e => set('estruturas_acessiveis', e.target.value)} />
                <div style={{ fontSize: 11, color: '#aaa', textAlign: 'right' }}>{(dados.estruturas_acessiveis || '').length}/1000</div>
              </Campo>
              <Campo label="Acessibilidade Comunicacional prevista no Projeto" full>
                <textarea style={textarea} maxLength={1000} value={dados.acessibilidade_comunicacional} onChange={e => set('acessibilidade_comunicacional', e.target.value)} />
                <div style={{ fontSize: 11, color: '#aaa', textAlign: 'right' }}>{(dados.acessibilidade_comunicacional || '').length}/1000</div>
              </Campo>
              <Campo label="Acessibilidade a Deficientes Visuais prevista no Projeto" full>
                <textarea style={textarea} maxLength={1000} value={dados.acessibilidade_deficientes_visuais} onChange={e => set('acessibilidade_deficientes_visuais', e.target.value)} />
                <div style={{ fontSize: 11, color: '#aaa', textAlign: 'right' }}>{(dados.acessibilidade_deficientes_visuais || '').length}/1000</div>
              </Campo>
              <Campo label="Plano de Divulgação" full><textarea style={textarea} value={dados.plano_divulgacao} onChange={e => set('plano_divulgacao', e.target.value)} /></Campo>

              {/* Ficha Técnica */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 8, textTransform: 'uppercase' }}>Ficha Técnica</label>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#1a1a2e', color: 'white' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Nome do Profissional ou Empresa</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Função</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>CPF ou CNPJ</th>
                      <th style={{ padding: '8px 6px', width: 36 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dados.ficha_tecnica || []).map((ft, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '4px 6px' }}><input style={{ ...inp, padding: '6px 8px' }} value={ft.nome || ''} onChange={e => { const ft2 = [...dados.ficha_tecnica]; ft2[i] = { ...ft2[i], nome: e.target.value }; set('ficha_tecnica', ft2); }} /></td>
                        <td style={{ padding: '4px 6px' }}><input style={{ ...inp, padding: '6px 8px' }} value={ft.funcao || ''} onChange={e => { const ft2 = [...dados.ficha_tecnica]; ft2[i] = { ...ft2[i], funcao: e.target.value }; set('ficha_tecnica', ft2); }} /></td>
                        <td style={{ padding: '4px 6px' }}><input style={{ ...inp, padding: '6px 8px' }} value={ft.cpf_cnpj || ''} onChange={e => { const ft2 = [...dados.ficha_tecnica]; ft2[i] = { ...ft2[i], cpf_cnpj: e.target.value }; set('ficha_tecnica', ft2); }} /></td>
                        <td style={{ padding: '4px 6px' }}><button type="button" onClick={() => set('ficha_tecnica', dados.ficha_tecnica.filter((_, idx) => idx !== i))} style={{ background: '#fee2e2', border: 'none', borderRadius: 5, padding: '4px 7px', cursor: 'pointer', color: '#ef4444', fontSize: 14 }}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" onClick={() => set('ficha_tecnica', [...(dados.ficha_tecnica || []), { nome: '', funcao: '', cpf_cnpj: '' }])} style={{ marginTop: 8, padding: '7px 14px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Adicionar</button>
              </div>
            </div>
          )}

          {etapa === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Campo label="Fontes de Recurso" full>
                  <textarea style={textarea} value={dados.fontes_recurso} onChange={e => set('fontes_recurso', e.target.value)} placeholder="Ex: Edital Municipal, Recursos Próprios, Patrocínio..." />
                </Campo>
              </div>
              <OrcamentoTabela
                itens={itensOrcamento}
                onChange={novos => {
                  setItensOrcamento(novos);
                  const total = novos.reduce((acc, item) => {
                    const v = parseFloat(String(item.valor_total || '0').replace(',', '.')) || 0;
                    return acc + v;
                  }, 0);
                  set('valor_solicitado', total.toFixed(2));
                  set('orcamento_detalhado', JSON.stringify(novos));
                }}
              />
              {itensOrcamento.length > 0 && (
                <div style={{ padding: '10px 16px', background: '#f0fdf4', border: '2px solid #10b981', borderRadius: 8, fontSize: 13, color: '#065f46' }}>
                  Valor total calculado automaticamente: <strong>R$ {Number(dados.valor_solicitado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </div>
              )}
              <Campo label="Planilha Orçamentária" full>
                <div style={{ border: '2px dashed #e5e7eb', borderRadius: 8, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 3 }}>Anexar Planilha Orçamentária (arquivo original)</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>Formatos aceitos: XLS, XLSX, CSV, PDF – máx. 20MB</div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#1a1a2e', color: 'white', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {arquivos.find(a => a.tipo === 'planilha_orcamentaria') ? '✓ Substituir' : '+ Selecionar'}
                    <input type="file" accept=".xls,.xlsx,.csv,.pdf,.ods" style={{ display: 'none' }} onChange={e => e.target.files[0] && addArquivo('planilha_orcamentaria', e.target.files[0])} />
                  </label>
                </div>
                {arquivos.find(a => a.tipo === 'planilha_orcamentaria') && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 12, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ✓ <strong>{arquivos.find(a => a.tipo === 'planilha_orcamentaria').file.name}</strong> adicionada
                  </div>
                )}
              </Campo>
            </div>
          )}

          {etapa === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ color: '#888', fontSize: 13 }}>Faça upload dos documentos necessários (PDF, imagens, vídeos – máx. 20MB cada)</p>
              {[['rg', 'RG / Documento de Identidade'], ['cpf', 'CPF'], ['residencia', 'Comprovante de Residência'], ['portfolio', 'Portfólio'], ['curriculo', 'Currículo'], ['projeto_pdf', 'PDF do Projeto']].map(([tipo, label]) => (
                <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: 8 }}>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#444' }}>{label}</div>
                  <input type="file" onChange={e => e.target.files[0] && addArquivo(tipo, e.target.files[0])} style={{ fontSize: 12 }} />
                  {arquivos.find(a => a.tipo === tipo) && <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>✓ Adicionado</span>}
                </div>
              ))}
              <Campo label="Links de Vídeos (YouTube, Vimeo, etc.)" full>
                <textarea style={textarea} value={dados.links_videos} onChange={e => set('links_videos', e.target.value)} placeholder="Cole os links, um por linha..." />
              </Campo>
            </div>
          )}

          {etapa === 4 && (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>Revisão da Inscrição</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
                {[
                  ['Nome', dados.nome_completo], ['CPF', dados.cpf], ['E-mail', dados.email],
                  ['Telefone', dados.telefone], ['Projeto', dados.nome_projeto], ['Categoria', dados.categoria],
                  ['Valor Solicitado', dados.valor_solicitado ? `R$ ${Number(dados.valor_solicitado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'],
                  ['Arquivos', `${arquivos.length} arquivo(s)`]
                ].map(([l, v]) => (
                  <div key={l} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', marginTop: 2 }}>{v || '—'}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#f0f9ff', border: '2px solid #bae6fd', borderRadius: 10, padding: 20, marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: '#0369a1', lineHeight: 1.6 }}>
                  <strong>Termo de Consentimento (LGPD):</strong> Ao enviar esta inscrição, você autoriza a 2Produções a coletar, armazenar e processar seus dados pessoais para fins de análise e gestão do projeto inscrito, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
                </p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>
                <input type="checkbox" checked={dados.aceite_termos} onChange={e => set('aceite_termos', e.target.checked)} style={{ width: 18, height: 18 }} />
                Li e aceito os termos de uso e a política de privacidade
              </label>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
            <button onClick={() => setEtapa(e => e - 1)} disabled={etapa === 0} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: etapa === 0 ? '#f1f5f9' : '#e5e7eb', border: 'none', borderRadius: 8, cursor: etapa === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14, color: etapa === 0 ? '#aaa' : '#444' }}>
              <ChevronLeft size={16} /> Anterior
            </button>
            <button onClick={avancar} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
              {etapa === 4 ? <><Send size={16} /> {loading ? 'Enviando...' : 'Enviar Inscrição'}</> : <>Próximo <ChevronRight size={16} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

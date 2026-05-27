import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FileText, Download, Pencil, X, Save } from 'lucide-react';
import OrcamentoTabela from '../components/OrcamentoTabela';

const STATUS_COR = { em_analise: '#f59e0b', pendente: '#ef4444', aprovado: '#10b981', reprovado: '#6b7280' };
const CATEGORIAS = ['Teatro', 'Dança', 'Música', 'Hip Hop', 'Circo', 'Audiovisual', 'Artes Visuais', 'Literatura', 'Cultura Popular', 'Outros'];
const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'white' };
const textarea = { ...inp, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' };
const lbl = { display: 'block', fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 };

function Campo({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );
}

export default function Inscricoes() {
  const [inscricoes, setInscricoes] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({});
  const [itensOrcamento, setItensOrcamento] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aba, setAba] = useState('pessoal');

  async function carregar() {
    api.get('/inscricoes', { params: filtroStatus ? { status: filtroStatus } : {} })
      .then(r => setInscricoes(r.data))
      .catch(() => toast.error('Erro ao carregar inscrições'));
  }

  useEffect(() => { carregar(); }, [filtroStatus]);

  function set(c, v) { setForm(f => ({ ...f, [c]: v })); }

  async function abrirEdicao(id) {
    try {
      const { data } = await api.get(`/inscricoes/${id}`);
      setForm({
        ...data,
        data_nascimento: data.data_nascimento?.split('T')[0] || ''
      });
      // Tenta carregar itens do orçamento se estiver salvo como JSON
      try {
        const itens = JSON.parse(data.orcamento_detalhado || '[]');
        setItensOrcamento(Array.isArray(itens) ? itens : []);
      } catch { setItensOrcamento([]); }
      setEditando(id);
      setAba('pessoal');
    } catch { toast.error('Erro ao carregar inscrição'); }
  }

  async function salvar() {
    setLoading(true);
    try {
      await api.put(`/inscricoes/${editando}`, form);
      toast.success('Inscrição atualizada!');
      setEditando(null);
      carregar();
    } catch (err) {
      toast.error(err.response?.data?.erro || 'Erro ao salvar');
    } finally { setLoading(false); }
  }

  async function gerarPDF(id, protocolo, e) {
    e.preventDefault();
    try {
      const res = await api.get(`/documentos/inscricao/${id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `inscricao-${protocolo}.pdf`; a.click();
    } catch { toast.error('Erro ao gerar PDF'); }
  }

  const abas = [
    { key: 'pessoal', label: 'Dados Pessoais' },
    { key: 'projeto', label: 'Projeto' },
    { key: 'financeiro', label: 'Financeiro' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>2Inscrições</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{inscricoes.length} inscrição(ões)</p>
        </div>
        <Link to="/inscricao" target="_blank" style={{ padding: '10px 18px', background: '#10b981', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
          Abrir Formulário Público
        </Link>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', background: 'white' }}>
          <option value="">Todos os status</option>
          {Object.keys(STATUS_COR).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {inscricoes.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#aaa' }}>
            <FileText size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p>Nenhuma inscrição encontrada</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                {['Protocolo', 'Nome', 'Projeto', 'E-mail', 'Status', 'Data', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inscricoes.map(i => (
                <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9', background: editando === i.id ? '#f0f9ff' : 'white' }}>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#888', fontFamily: 'monospace' }}>{i.protocolo}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>{i.nome_completo}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{i.nome_projeto || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{i.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: (STATUS_COR[i.status] || '#888') + '20', color: STATUS_COR[i.status] || '#888' }}>
                      {i.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#888' }}>{new Date(i.criado_em).toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => editando === i.id ? setEditando(null) : abrirEdicao(i.id)} style={{ padding: '6px 10px', background: editando === i.id ? '#fee2e2' : '#eff6ff', border: 'none', borderRadius: 6, color: editando === i.id ? '#ef4444' : '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        {editando === i.id ? <><X size={13} /> Fechar</> : <><Pencil size={13} /> Editar</>}
                      </button>
                      <button onClick={e => gerarPDF(i.id, i.protocolo, e)} style={{ padding: '6px 10px', background: '#10b98115', border: 'none', borderRadius: 6, color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        <Download size={13} /> PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Painel de edição */}
      {editando && (
        <div style={{ marginTop: 20, background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '2px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: 15, color: '#1a1a2e' }}>Editando inscrição</span>
              <span style={{ fontSize: 12, color: '#888', marginLeft: 10, fontFamily: 'monospace' }}>{form.protocolo}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditando(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', gap: 5 }}>
                <X size={14} /> Cancelar
              </button>
              <button onClick={salvar} disabled={loading} style={{ padding: '8px 18px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Save size={14} /> {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>

          {/* Abas */}
          <div style={{ display: 'flex', gap: 2, padding: '8px 16px', borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
            {abas.map(a => (
              <button key={a.key} onClick={() => setAba(a.key)} style={{ padding: '7px 16px', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13, background: aba === a.key ? '#1a1a2e' : 'transparent', color: aba === a.key ? 'white' : '#888' }}>
                {a.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 24 }}>

            {aba === 'pessoal' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Campo label="Nome Completo" full><input style={inp} value={form.nome_completo || ''} onChange={e => set('nome_completo', e.target.value)} /></Campo>
                <Campo label="Nome Artístico"><input style={inp} value={form.nome_artistico || ''} onChange={e => set('nome_artistico', e.target.value)} /></Campo>
                <Campo label="CPF"><input style={inp} value={form.cpf || ''} onChange={e => set('cpf', e.target.value)} /></Campo>
                <Campo label="RG"><input style={inp} value={form.rg || ''} onChange={e => set('rg', e.target.value)} /></Campo>
                <Campo label="Data de Nascimento"><input type="date" style={inp} value={form.data_nascimento || ''} onChange={e => set('data_nascimento', e.target.value)} /></Campo>
                <Campo label="Gênero">
                  <select style={inp} value={form.genero || ''} onChange={e => set('genero', e.target.value)}>
                    <option value="">Selecione...</option>
                    {['Masculino','Feminino','Não-binário','Prefiro não informar'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </Campo>
                <Campo label="Telefone"><input style={inp} value={form.telefone || ''} onChange={e => set('telefone', e.target.value)} /></Campo>
                <Campo label="WhatsApp"><input style={inp} value={form.whatsapp || ''} onChange={e => set('whatsapp', e.target.value)} /></Campo>
                <Campo label="E-mail" full><input type="email" style={inp} value={form.email || ''} onChange={e => set('email', e.target.value)} /></Campo>
                <Campo label="CEP"><input style={inp} value={form.cep || ''} onChange={e => set('cep', e.target.value)} /></Campo>
                <Campo label="Endereço" full><input style={inp} value={form.endereco || ''} onChange={e => set('endereco', e.target.value)} /></Campo>
                <Campo label="Cidade"><input style={inp} value={form.cidade || ''} onChange={e => set('cidade', e.target.value)} /></Campo>
                <Campo label="Estado">
                  <select style={inp} value={form.estado || ''} onChange={e => set('estado', e.target.value)}>
                    <option value="">UF</option>
                    {ESTADOS.map(e => <option key={e}>{e}</option>)}
                  </select>
                </Campo>
              </div>
            )}

            {aba === 'projeto' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Campo label="Nome do Projeto" full><input style={inp} value={form.nome_projeto || ''} onChange={e => set('nome_projeto', e.target.value)} /></Campo>
                <Campo label="Categoria">
                  <select style={inp} value={form.categoria || ''} onChange={e => set('categoria', e.target.value)}>
                    <option value="">Selecione...</option>
                    {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </Campo>
                <Campo label="Área Cultural"><input style={inp} value={form.area_cultural || ''} onChange={e => set('area_cultural', e.target.value)} /></Campo>
                <Campo label="Público-alvo"><input style={inp} value={form.publico_alvo || ''} onChange={e => set('publico_alvo', e.target.value)} /></Campo>
                <Campo label="Qtd. Beneficiados"><input type="number" style={inp} value={form.qtd_beneficiados || ''} onChange={e => set('qtd_beneficiados', e.target.value)} /></Campo>
                <Campo label="Estimativa de Público"><input type="number" style={inp} value={form.estimativa_publico || ''} onChange={e => set('estimativa_publico', e.target.value)} /></Campo>
                <Campo label="Cidade de Execução"><input style={inp} value={form.cidade_execucao || ''} onChange={e => set('cidade_execucao', e.target.value)} /></Campo>
                <Campo label="Cobrança de Ingresso">
                  <select style={inp} value={form.cobranca_ingresso ? 'sim' : 'nao'} onChange={e => set('cobranca_ingresso', e.target.value === 'sim')}>
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </select>
                </Campo>
                <Campo label="Objeto do Projeto" full><textarea style={textarea} maxLength={2000} value={form.objeto_projeto || ''} onChange={e => set('objeto_projeto', e.target.value)} /><div style={{fontSize:11,color:'#aaa',textAlign:'right'}}>{(form.objeto_projeto||'').length}/2000</div></Campo>
                <Campo label="Objetivo" full><textarea style={textarea} value={form.objetivo || ''} onChange={e => set('objetivo', e.target.value)} /></Campo>
                <Campo label="Justificativa" full><textarea style={textarea} value={form.justificativa || ''} onChange={e => set('justificativa', e.target.value)} /></Campo>
                <Campo label="Metas, Resultados e Desdobramentos" full><textarea style={textarea} maxLength={2000} value={form.metas_resultados || ''} onChange={e => set('metas_resultados', e.target.value)} /><div style={{fontSize:11,color:'#aaa',textAlign:'right'}}>{(form.metas_resultados||'').length}/2000</div></Campo>
                <Campo label="Perfil do Público que quer Atingir" full><textarea style={textarea} maxLength={1000} value={form.perfil_publico || ''} onChange={e => set('perfil_publico', e.target.value)} /><div style={{fontSize:11,color:'#aaa',textAlign:'right'}}>{(form.perfil_publico||'').length}/1000</div></Campo>
                <Campo label="Estruturas Acessíveis – Mobilidade Reduzida" full><textarea style={textarea} maxLength={1000} value={form.estruturas_acessiveis || ''} onChange={e => set('estruturas_acessiveis', e.target.value)} /><div style={{fontSize:11,color:'#aaa',textAlign:'right'}}>{(form.estruturas_acessiveis||'').length}/1000</div></Campo>
                <Campo label="Acessibilidade Comunicacional" full><textarea style={textarea} maxLength={1000} value={form.acessibilidade_comunicacional || ''} onChange={e => set('acessibilidade_comunicacional', e.target.value)} /><div style={{fontSize:11,color:'#aaa',textAlign:'right'}}>{(form.acessibilidade_comunicacional||'').length}/1000</div></Campo>
                <Campo label="Acessibilidade a Deficientes Visuais" full><textarea style={textarea} maxLength={1000} value={form.acessibilidade_deficientes_visuais || ''} onChange={e => set('acessibilidade_deficientes_visuais', e.target.value)} /><div style={{fontSize:11,color:'#aaa',textAlign:'right'}}>{(form.acessibilidade_deficientes_visuais||'').length}/1000</div></Campo>
                <Campo label="Plano de Divulgação" full><textarea style={textarea} value={form.plano_divulgacao || ''} onChange={e => set('plano_divulgacao', e.target.value)} /></Campo>
                <Campo label="Links de Vídeos" full><textarea style={textarea} value={form.links_videos || ''} onChange={e => set('links_videos', e.target.value)} placeholder="Um link por linha..." /></Campo>
              </div>
            )}

            {aba === 'financeiro' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Campo label="Fontes de Recurso" full>
                    <textarea style={textarea} value={form.fontes_recurso || ''} onChange={e => set('fontes_recurso', e.target.value)} />
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
                {form.valor_solicitado > 0 && (
                  <div style={{ padding: '10px 16px', background: '#f0fdf4', border: '2px solid #10b981', borderRadius: 8, fontSize: 13, color: '#065f46', fontWeight: 600 }}>
                    Total do Projeto: R$ {Number(form.valor_solicitado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>
            )}

            {aba === 'status' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Campo label="Status">
                  <select style={inp} value={form.status || ''} onChange={e => set('status', e.target.value)}>
                    {Object.keys(STATUS_COR).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </Campo>
                <Campo label="Etapa Atual">
                  <select style={inp} value={form.etapa_atual || 1} onChange={e => set('etapa_atual', Number(e.target.value))}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>Etapa {n}</option>)}
                  </select>
                </Campo>
                <div style={{ gridColumn: '1 / -1', padding: '16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 8, fontWeight: 600 }}>INFORMAÇÕES DO PROTOCOLO</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[['Protocolo', form.protocolo], ['Criado em', form.criado_em ? new Date(form.criado_em).toLocaleString('pt-BR') : '—'], ['Atualizado em', form.atualizado_em ? new Date(form.atualizado_em).toLocaleString('pt-BR') : '—'], ['Aceite de Termos', form.aceite_termos ? 'Sim' : 'Não']].map(([l, v]) => (
                      <div key={l}>
                        <div style={{ fontSize: 10, color: '#aaa', fontWeight: 700, textTransform: 'uppercase' }}>{l}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', marginTop: 2 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Download, X } from 'lucide-react';
import OrcamentoTabela from '../components/OrcamentoTabela';

const STATUS = {
  em_analise:  { label: 'Em Análise',  cor: '#f59e0b' },
  pendente:    { label: 'Pendente',    cor: '#ef4444' },
  aprovado:    { label: 'Aprovado',    cor: '#10b981' },
  reprovado:   { label: 'Reprovado',   cor: '#6b7280' },
  em_execucao: { label: 'Em Execução', cor: '#3b82f6' },
  finalizado:  { label: 'Finalizado',  cor: '#8b5cf6' },
};
const CATEGORIAS = ['Teatro', 'Dança', 'Música', 'Hip Hop', 'Circo', 'Audiovisual', 'Artes Visuais', 'Literatura', 'Cultura Popular', 'Outros'];
const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'white' };
const ta  = { ...inp, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' };

function Campo({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</label>
      {children}
    </div>
  );
}

function Contador({ value, max }) {
  return <div style={{ fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: 2 }}>{(value || '').length}/{max}</div>;
}

const ABAS = [
  { key: 'proponente', label: 'Proponente' },
  { key: 'projeto',    label: 'Projeto' },
  { key: 'acesso',     label: 'Acessibilidade' },
  { key: 'financeiro', label: 'Financeiro' },
  { key: 'ficha',      label: 'Ficha Técnica' },
  { key: 'status',     label: 'Status' },
];

export default function InscricaoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [itensOrcamento, setItensOrcamento] = useState([]);
  const [aba, setAba] = useState('proponente');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/inscricoes/${id}`)
      .then(({ data }) => {
        setForm({ ...data, data_nascimento: data.data_nascimento?.split('T')[0] || '' });
        try {
          const itens = JSON.parse(data.orcamento_detalhado || '[]');
          setItensOrcamento(Array.isArray(itens) ? itens : []);
        } catch { setItensOrcamento([]); }
      })
      .catch(() => { toast.error('Inscrição não encontrada'); navigate('/projetos'); });
  }, [id]);

  function set(c, v) { setForm(f => ({ ...f, [c]: v })); }

  function setFicha(i, campo, valor) {
    const ft = [...(form.ficha_tecnica || [])];
    ft[i] = { ...ft[i], [campo]: valor };
    set('ficha_tecnica', ft);
  }

  async function salvar() {
    setLoading(true);
    try {
      await api.put(`/inscricoes/${id}`, form);
      toast.success('Salvo com sucesso!');
    } catch (err) {
      toast.error(err.response?.data?.erro || 'Erro ao salvar');
    } finally { setLoading(false); }
  }

  async function gerarPDF() {
    try {
      const res = await api.get(`/documentos/inscricao/${id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `inscricao-${form.protocolo}.pdf`; a.click();
    } catch { toast.error('Erro ao gerar PDF'); }
  }

  if (!form) return <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Carregando...</div>;

  const statusInfo = STATUS[form.status] || { label: form.status, cor: '#888' };
  const fichaTecnica = Array.isArray(form.ficha_tecnica) ? form.ficha_tecnica
    : (form.ficha_tecnica ? JSON.parse(form.ficha_tecnica) : []);

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/projetos')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>
              {form.nome_projeto || 'Sem título'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: '#888', fontFamily: 'monospace' }}>{form.protocolo}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: statusInfo.cor + '20', color: statusInfo.cor }}>
                {statusInfo.label}
              </span>
              {form.nome_completo && <span style={{ fontSize: 12, color: '#888' }}>Proponente: <strong>{form.nome_completo}</strong></span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={gerarPDF}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            <Download size={14} /> PDF
          </button>
          <button onClick={salvar} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            <Save size={14} /> {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: 'white', padding: 4, borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', width: 'fit-content' }}>
        {ABAS.map(a => (
          <button key={a.key} onClick={() => setAba(a.key)}
            style={{ padding: '8px 18px', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13, background: aba === a.key ? '#1a1a2e' : 'transparent', color: aba === a.key ? 'white' : '#888', transition: 'all 0.15s' }}>
            {a.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>

        {/* ABA PROPONENTE */}
        {aba === 'proponente' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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

        {/* ABA PROJETO */}
        {aba === 'projeto' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
            <Campo label="Objeto do Projeto (2000 caracteres)" full>
              <textarea style={ta} maxLength={2000} value={form.objeto_projeto || ''} onChange={e => set('objeto_projeto', e.target.value)} />
              <Contador value={form.objeto_projeto} max={2000} />
            </Campo>
            <Campo label="Objetivo" full><textarea style={ta} value={form.objetivo || ''} onChange={e => set('objetivo', e.target.value)} /></Campo>
            <Campo label="Justificativa" full><textarea style={ta} value={form.justificativa || ''} onChange={e => set('justificativa', e.target.value)} /></Campo>
            <Campo label="Metas, Resultados e Desdobramentos (2000 caracteres)" full>
              <textarea style={ta} maxLength={2000} value={form.metas_resultados || ''} onChange={e => set('metas_resultados', e.target.value)} />
              <Contador value={form.metas_resultados} max={2000} />
            </Campo>
            <Campo label="Perfil do Público que o Projeto quer Atingir (1000 caracteres)" full>
              <textarea style={ta} maxLength={1000} value={form.perfil_publico || ''} onChange={e => set('perfil_publico', e.target.value)} />
              <Contador value={form.perfil_publico} max={1000} />
            </Campo>
            <Campo label="Plano de Divulgação" full><textarea style={ta} value={form.plano_divulgacao || ''} onChange={e => set('plano_divulgacao', e.target.value)} /></Campo>
            <Campo label="Links de Vídeos" full>
              <textarea style={ta} value={form.links_videos || ''} onChange={e => set('links_videos', e.target.value)} placeholder="Um link por linha..." />
            </Campo>
          </div>
        )}

        {/* ABA ACESSIBILIDADE */}
        {aba === 'acesso' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <Campo label="Estruturas Acessíveis – Pessoas com Mobilidade Reduzida (1000 caracteres)">
              <textarea style={ta} maxLength={1000} value={form.estruturas_acessiveis || ''} onChange={e => set('estruturas_acessiveis', e.target.value)} />
              <Contador value={form.estruturas_acessiveis} max={1000} />
            </Campo>
            <Campo label="Acessibilidade Comunicacional prevista no Projeto (1000 caracteres)">
              <textarea style={ta} maxLength={1000} value={form.acessibilidade_comunicacional || ''} onChange={e => set('acessibilidade_comunicacional', e.target.value)} />
              <Contador value={form.acessibilidade_comunicacional} max={1000} />
            </Campo>
            <Campo label="Acessibilidade a Deficientes Visuais prevista no Projeto (1000 caracteres)">
              <textarea style={ta} maxLength={1000} value={form.acessibilidade_deficientes_visuais || ''} onChange={e => set('acessibilidade_deficientes_visuais', e.target.value)} />
              <Contador value={form.acessibilidade_deficientes_visuais} max={1000} />
            </Campo>
          </div>
        )}

        {/* ABA FINANCEIRO */}
        {aba === 'financeiro' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Campo label="Fontes de Recurso">
              <textarea style={ta} value={form.fontes_recurso || ''} onChange={e => set('fontes_recurso', e.target.value)} />
            </Campo>
            <OrcamentoTabela
              itens={itensOrcamento}
              onChange={novos => {
                setItensOrcamento(novos);
                const total = novos.reduce((acc, item) => acc + (parseFloat(String(item.valor_total || '0').replace(',', '.')) || 0), 0);
                set('valor_solicitado', total.toFixed(2));
                set('orcamento_detalhado', JSON.stringify(novos));
              }}
            />
            {Number(form.valor_solicitado) > 0 && (
              <div style={{ padding: '10px 16px', background: '#f0fdf4', border: '2px solid #10b981', borderRadius: 8, fontSize: 13, color: '#065f46', fontWeight: 600 }}>
                Valor Total: R$ {Number(form.valor_solicitado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>
        )}

        {/* ABA FICHA TÉCNICA */}
        {aba === 'ficha' && (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 12 }}>
              <thead>
                <tr style={{ background: '#1a1a2e', color: 'white' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Nome do Profissional ou Empresa</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Função</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>CPF ou CNPJ</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {fichaTecnica.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>Nenhum profissional adicionado</td></tr>
                )}
                {fichaTecnica.map((ft, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '6px 8px' }}><input style={inp} value={ft.nome || ''} onChange={e => setFicha(i, 'nome', e.target.value)} /></td>
                    <td style={{ padding: '6px 8px' }}><input style={inp} value={ft.funcao || ''} onChange={e => setFicha(i, 'funcao', e.target.value)} /></td>
                    <td style={{ padding: '6px 8px' }}><input style={inp} value={ft.cpf_cnpj || ''} onChange={e => setFicha(i, 'cpf_cnpj', e.target.value)} /></td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <button onClick={() => set('ficha_tecnica', fichaTecnica.filter((_, idx) => idx !== i))}
                        style={{ background: '#fee2e2', border: 'none', borderRadius: 5, padding: '5px 8px', cursor: 'pointer', color: '#ef4444' }}>
                        <X size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => set('ficha_tecnica', [...fichaTecnica, { nome: '', funcao: '', cpf_cnpj: '' }])}
              style={{ padding: '8px 16px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              + Adicionar Profissional
            </button>
          </div>
        )}

        {/* ABA STATUS */}
        {aba === 'status' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Campo label="Status">
              <select style={inp} value={form.status || ''} onChange={e => set('status', e.target.value)}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Campo>
            <Campo label="Etapa Atual">
              <select style={inp} value={form.etapa_atual || 1} onChange={e => set('etapa_atual', Number(e.target.value))}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>Etapa {n}</option>)}
              </select>
            </Campo>
            <div style={{ gridColumn: '1 / -1', padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Informações do Protocolo</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['Protocolo', form.protocolo],
                  ['Aceite de Termos', form.aceite_termos ? 'Sim' : 'Não'],
                  ['Criado em', form.criado_em ? new Date(form.criado_em).toLocaleString('pt-BR') : '—'],
                  ['Atualizado em', form.atualizado_em ? new Date(form.atualizado_em).toLocaleString('pt-BR') : '—'],
                ].map(([l, v]) => (
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
  );
}

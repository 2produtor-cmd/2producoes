import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Save, ArrowLeft, Plus, Trash2, FileText, Search, UserCheck } from 'lucide-react';

const CATEGORIAS = ['Teatro', 'Dança', 'Música', 'Hip Hop', 'Circo', 'Audiovisual', 'Artes Visuais', 'Literatura', 'Patrimônio Cultural', 'Cultura Popular', 'Outros'];
const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const STATUS = ['em_analise','pendente','aprovado','reprovado','em_execucao','finalizado'];

const vazio = {
  nome: '', nome_artistico: '', categoria: '', segmento_cultural: '', descricao: '', objetivo_geral: '',
  objetivos_especificos: '', publico_alvo: '', faixa_etaria: '', local_realizacao: '', cidade: '', estado: '',
  data_inicio: '', data_final: '', qtd_apresentacoes: '', qtd_participantes: '', site: '', release: '', historico: '',
  valor_total: '', recursos_proprios: '', patrocinio: '', edital: '', caches: '', custos_tecnicos: '',
  alimentacao: '', transporte: '', hospedagem: '', divulgacao: '', material_grafico: '', impostos: '', obs_financeiras: '',
  comentario: '', marca_texto: false,
  status: 'em_analise', equipe: []
};

const membroVazio = { nome: '', funcao: '', cpf: '', telefone: '', email: '', mini_curriculo: '', cache: '', chave_pix: '', banco: '', agencia: '', conta: '' };

function Campo({ label, children, full }) {
  let val = '';
  if (React.isValidElement(children)) val = children.props.value ?? '';
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</label>
        <div style={{ fontSize: 12, color: '#888' }}>{(val || '').length} caracteres</div>
      </div>
      {children}
    </div>
  );
}

const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'white' };
const textarea = { ...inp, minHeight: 160, resize: 'vertical', fontFamily: 'inherit' };
const sel = { ...inp };

export default function ProjetoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dados, setDados] = useState(vazio);
  const [aba, setAba] = useState('geral');
  const [loading, setLoading] = useState(false);
  const [pessoas, setPessoas] = useState([]);
  const [buscaPessoa, setBuscaPessoa] = useState({});
  const [sugestoes, setSugestoes] = useState({});
  const buscaTimer = useRef({});
  const autoSaveTimer = useRef();
  const dirty = useRef(false);

  useEffect(() => {
    if (id) {
      api.get(`/projetos/${id}`).then(r => {
        const p = r.data;
        setDados({ ...vazio, ...p, equipe: p.equipe || [] });
      }).catch(() => toast.error('Erro ao carregar projeto'));
    }
  }, [id]);

  async function buscarPessoas(i, termo) {
    setBuscaPessoa(b => ({ ...b, [i]: termo }));
    clearTimeout(buscaTimer.current[i]);
    if (!termo || termo.length < 2) { setSugestoes(s => ({ ...s, [i]: [] })); return; }
    buscaTimer.current[i] = setTimeout(async () => {
      try {
        const { data } = await api.get('/pessoas', { params: { busca: termo } });
        setSugestoes(s => ({ ...s, [i]: data.slice(0, 6) }));
      } catch {}
    }, 300);
  }

  function selecionarPessoa(i, pessoa) {
    setMembro(i, 'nome', pessoa.nome);
    setMembro(i, 'cpf', pessoa.cpf || '');
    setMembro(i, 'telefone', pessoa.telefone || '');
    setMembro(i, 'mini_curriculo', pessoa.curriculo_resumido || '');
    setBuscaPessoa(b => ({ ...b, [i]: '' }));
    setSugestoes(s => ({ ...s, [i]: [] }));
  }

  function set(campo, valor) {
    dirty.current = true;
    setDados(d => ({ ...d, [campo]: valor }));
  }

  function setMembro(i, campo, valor) {
    setDados(d => {
      const eq = [...d.equipe];
      eq[i] = { ...eq[i], [campo]: valor };
      dirty.current = true;
      return { ...d, equipe: eq };
    });
  }

  function addMembro() { setDados(d => ({ ...d, equipe: [...d.equipe, { ...membroVazio }] })); }
  function remMembro(i) { setDados(d => ({ ...d, equipe: d.equipe.filter((_, idx) => idx !== i) })); }

  async function salvar() {
    if (!dados.nome) return toast.error('Nome do projeto é obrigatório');
    setLoading(true);
    try {
      if (id) {
        await api.put(`/projetos/${id}`, dados);
        toast.success('Projeto atualizado!');
      } else {
        const { data } = await api.post('/projetos', dados);
        toast.success(`Projeto criado! Protocolo: ${data.protocolo}`);
        navigate(`/projetos/${data.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.erro || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  // Auto-save: debounce changes and save silently
  useEffect(() => {
    // only save if there are pending changes
    if (!dirty.current) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      if (!dados.nome) return; // require at least a name
      try {
        if (id) {
          await api.put(`/projetos/${id}`, dados);
        } else {
          const { data } = await api.post('/projetos', dados);
          if (data && data.id) {
            // navigate to new project route so future saves update it
            navigate(`/projetos/${data.id}`);
            setDados(d => ({ ...d, ...data }));
          }
        }
        dirty.current = false;
      } catch (e) {
        console.error('Auto-save failed', e);
      }
    }, 1500);
    return () => clearTimeout(autoSaveTimer.current);
  }, [dados]);

  async function gerarPDF() {
    if (!id) return toast.error('Salve o projeto primeiro');
    try {
      const res = await api.get(`/documentos/projeto/${id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url);
    } catch { toast.error('Erro ao gerar PDF'); }
  }

  const abas = [
    { key: 'geral', label: 'Informações Gerais' },
    { key: 'financeiro', label: 'Financeiro' },
    { key: 'equipe', label: `Equipe (${dados.equipe.length})` },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/projetos')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>{id ? 'Editar Projeto' : 'Novo Projeto'}</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {id && <button onClick={gerarPDF} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}><FileText size={15} /> PDF</button>}
          <button onClick={salvar} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            <Save size={15} /> {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: 'white', padding: 4, borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', width: 'fit-content' }}>
        {abas.map(a => (
          <button key={a.key} onClick={() => setAba(a.key)} style={{ padding: '8px 18px', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13, background: aba === a.key ? '#1a1a2e' : 'transparent', color: aba === a.key ? 'white' : '#888', transition: 'all 0.15s' }}>
            {a.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        {aba === 'geral' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Campo label="Nome do Projeto *" full><input style={inp} value={dados.nome} onChange={e => set('nome', e.target.value)} /></Campo>
            <Campo label="Nome Artístico"><input style={inp} value={dados.nome_artistico} onChange={e => set('nome_artistico', e.target.value)} /></Campo>
            <Campo label="Categoria">
              <select style={sel} value={dados.categoria} onChange={e => set('categoria', e.target.value)}>
                <option value="">Selecione...</option>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </Campo>
            <Campo label="Segmento Cultural"><input style={inp} value={dados.segmento_cultural} onChange={e => set('segmento_cultural', e.target.value)} /></Campo>
            <Campo label="Público-alvo"><input style={inp} value={dados.publico_alvo} onChange={e => set('publico_alvo', e.target.value)} /></Campo>
            <Campo label="Faixa Etária"><input style={inp} value={dados.faixa_etaria} onChange={e => set('faixa_etaria', e.target.value)} /></Campo>
            <Campo label="Local de Realização"><input style={inp} value={dados.local_realizacao} onChange={e => set('local_realizacao', e.target.value)} /></Campo>
            <Campo label="Cidade"><input style={inp} value={dados.cidade} onChange={e => set('cidade', e.target.value)} /></Campo>
            <Campo label="Estado">
              <select style={sel} value={dados.estado} onChange={e => set('estado', e.target.value)}>
                <option value="">UF</option>
                {ESTADOS.map(e => <option key={e}>{e}</option>)}
              </select>
            </Campo>
            <Campo label="Status">
              <select style={sel} value={dados.status} onChange={e => set('status', e.target.value)}>
                {STATUS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </Campo>
            <Campo label="Data de Início"><input type="date" style={inp} value={dados.data_inicio} onChange={e => set('data_inicio', e.target.value)} /></Campo>
            <Campo label="Data Final"><input type="date" style={inp} value={dados.data_final} onChange={e => set('data_final', e.target.value)} /></Campo>
            <Campo label="Qtd. Apresentações"><input type="number" style={inp} value={dados.qtd_apresentacoes} onChange={e => set('qtd_apresentacoes', e.target.value)} /></Campo>
            <Campo label="Qtd. Participantes"><input type="number" style={inp} value={dados.qtd_participantes} onChange={e => set('qtd_participantes', e.target.value)} /></Campo>
            <Campo label="Site"><input style={inp} value={dados.site} onChange={e => set('site', e.target.value)} /></Campo>
            <Campo label="Descrição" full><textarea style={textarea} value={dados.descricao} onChange={e => set('descricao', e.target.value)} /></Campo>
            <Campo label="Objetivo Geral" full><textarea style={textarea} value={dados.objetivo_geral} onChange={e => set('objetivo_geral', e.target.value)} /></Campo>
            <Campo label="Objetivos Específicos" full><textarea style={textarea} value={dados.objetivos_especificos} onChange={e => set('objetivos_especificos', e.target.value)} /></Campo>
            <Campo label="Release" full><textarea style={textarea} value={dados.release} onChange={e => set('release', e.target.value)} /></Campo>
            <Campo label="Histórico do Projeto" full><textarea style={textarea} value={dados.historico} onChange={e => set('historico', e.target.value)} /></Campo>
            <Campo label="Comentário" full>
              <textarea style={textarea} value={dados.comentario} onChange={e => set('comentario', e.target.value)} placeholder="Anotações ou comentários internos" />
            </Campo>
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10 }}>
              <input id="marcaTexto" type="checkbox" checked={dados.marca_texto} onChange={e => set('marca_texto', e.target.checked)} />
              <label htmlFor="marcaTexto" style={{ fontSize: 13, color: '#444' }}>Marca texto</label>
            </div>
          </div>
        )}

        {aba === 'financeiro' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              ['valor_total', 'Valor Total do Projeto'], ['recursos_proprios', 'Recursos Próprios'],
              ['patrocinio', 'Patrocínio'], ['edital', 'Edital'], ['caches', 'Cachês'],
              ['custos_tecnicos', 'Custos Técnicos'], ['alimentacao', 'Alimentação'],
              ['transporte', 'Transporte'], ['hospedagem', 'Hospedagem'],
              ['divulgacao', 'Divulgação'], ['material_grafico', 'Material Gráfico'], ['impostos', 'Impostos']
            ].map(([campo, label]) => (
              <Campo key={campo} label={label}>
                <input type="number" step="0.01" style={inp} value={dados[campo]} onChange={e => set(campo, e.target.value)} placeholder="0,00" />
              </Campo>
            ))}
            <Campo label="Observações Financeiras" full>
              <textarea style={textarea} value={dados.obs_financeiras} onChange={e => set('obs_financeiras', e.target.value)} />
            </Campo>
          </div>
        )}

        {aba === 'equipe' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button onClick={addMembro} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                <Plus size={15} /> Adicionar Membro
              </button>
            </div>
            {dados.equipe.length === 0 && <p style={{ color: '#aaa', textAlign: 'center', padding: 32 }}>Nenhum membro adicionado</p>}
            {dados.equipe.map((m, i) => (
              <div key={i} style={{ border: '2px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontWeight: 700, color: '#1a1a2e' }}>Membro {i + 1}{m.nome ? ` – ${m.nome}` : ''}</span>
                  <button onClick={() => remMembro(i)} style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
                </div>

                {/* Busca de pessoa cadastrada */}
                <div style={{ marginBottom: 16, padding: '12px 14px', background: '#f0f9ff', border: '2px solid #bae6fd', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Search size={12} /> Buscar pessoa cadastrada
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{ ...inp, paddingLeft: 34 }}
                      placeholder="Digite o nome ou CPF para buscar..."
                      value={buscaPessoa[i] || ''}
                      onChange={e => buscarPessoas(i, e.target.value)}
                    />
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                    {sugestoes[i]?.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '2px solid #e5e7eb', borderRadius: 8, zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', marginTop: 4 }}>
                        {sugestoes[i].map(p => (
                          <div
                            key={p.id}
                            onClick={() => selecionarPessoa(i, p)}
                            style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                          >
                            <UserCheck size={15} color="#0369a1" />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2e' }}>{p.nome}</div>
                              <div style={{ fontSize: 11, color: '#888' }}>{p.cpf ? `CPF: ${p.cpf}` : ''}{p.cidade ? ` • ${p.cidade}` : ''}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {buscaPessoa[i]?.length >= 2 && sugestoes[i]?.length === 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '2px solid #e5e7eb', borderRadius: 8, zIndex: 100, padding: '10px 14px', fontSize: 12, color: '#aaa', marginTop: 4 }}>
                        Nenhuma pessoa encontrada
                      </div>
                    )}
                  </div>
                  {m.nome && <div style={{ marginTop: 8, fontSize: 11, color: '#0369a1' }}><UserCheck size={11} style={{ display: 'inline', marginRight: 4 }} />Preenchido com dados de <strong>{m.nome}</strong> — edite os campos abaixo se precisar</div>}
                </div>

                {/* Campos da ficha */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <Campo label="Nome *" full={false}><input style={inp} value={m.nome || ''} onChange={e => setMembro(i, 'nome', e.target.value)} /></Campo>
                  <Campo label="Função *"><input style={{ ...inp, border: '2px solid #0369a1' }} value={m.funcao || ''} onChange={e => setMembro(i, 'funcao', e.target.value)} placeholder="Ex: Diretor, Músico..." /></Campo>
                  <Campo label="CPF"><input style={inp} value={m.cpf || ''} onChange={e => setMembro(i, 'cpf', e.target.value)} /></Campo>
                  <Campo label="Telefone"><input style={inp} value={m.telefone || ''} onChange={e => setMembro(i, 'telefone', e.target.value)} /></Campo>
                  <Campo label="E-mail"><input style={inp} value={m.email || ''} onChange={e => setMembro(i, 'email', e.target.value)} /></Campo>
                  <Campo label="Cachê (R$)"><input type="number" style={inp} value={m.cache || ''} onChange={e => setMembro(i, 'cache', e.target.value)} /></Campo>
                  <Campo label="Chave Pix"><input style={inp} value={m.chave_pix || ''} onChange={e => setMembro(i, 'chave_pix', e.target.value)} /></Campo>
                  <Campo label="Banco"><input style={inp} value={m.banco || ''} onChange={e => setMembro(i, 'banco', e.target.value)} /></Campo>
                  <Campo label="Agência"><input style={inp} value={m.agencia || ''} onChange={e => setMembro(i, 'agencia', e.target.value)} /></Campo>
                  <Campo label="Conta"><input style={inp} value={m.conta || ''} onChange={e => setMembro(i, 'conta', e.target.value)} /></Campo>
                  <Campo label="Mini Currículo" full>
                    <textarea style={textarea} value={m.mini_curriculo || ''} onChange={e => setMembro(i, 'mini_curriculo', e.target.value)} />
                  </Campo>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

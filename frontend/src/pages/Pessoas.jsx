import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Users, X, Save, Trash2, Upload, Download, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const vazio = { nome: '', ceac: '', cpf: '', telefone: '', endereco: '', cep: '', cidade: '', estado: '', curriculo_resumido: '' };

const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'white' };
const lbl = { display: 'block', fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 };

const TIPOS_ANEXO = [
  { tipo: 'portfolio',              label: 'Portfólio',                    aceita: '.pdf,.doc,.docx,.zip,.jpg,.jpeg,.png' },
  { tipo: 'documento',              label: 'Documento (RG/CNH)',            aceita: '.pdf,.jpg,.jpeg,.png' },
  { tipo: 'comprovante_residencia', label: 'Comprovante de Residência',     aceita: '.pdf,.jpg,.jpeg,.png' },
  { tipo: 'outros',                 label: 'Outros Documentos',             aceita: '*' },
];

export default function Pessoas() {
  const [pessoas, setPessoas] = useState([]);
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(vazio);
  const [editando, setEditando] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [uploading, setUploading] = useState('');

  async function carregar() {
    const { data } = await api.get('/pessoas', { params: busca ? { busca } : {} });
    setPessoas(data);
  }

  useEffect(() => { carregar(); }, [busca]);

  function set(c, v) { setForm(f => ({ ...f, [c]: v })); }

  function abrirNovo() { setForm(vazio); setEditando(null); setModal(true); }

  function abrirEditar(p) {
    setForm({ nome: p.nome, ceac: p.ceac || '', cpf: p.cpf || '', telefone: p.telefone || '', endereco: p.endereco || '', cep: p.cep || '', cidade: p.cidade || '', estado: p.estado || '', curriculo_resumido: p.curriculo_resumido || '' });
    setEditando(p.id);
    setModal(true);
  }

  async function salvar(e) {
    e.preventDefault();
    if (!form.nome) return toast.error('Nome é obrigatório');
    try {
      if (editando) {
        await api.put(`/pessoas/${editando}`, form);
        toast.success('Pessoa atualizada!');
        if (detalhe?.id === editando) await abrirDetalhe(editando);
      } else {
        await api.post('/pessoas', form);
        toast.success('Pessoa cadastrada!');
      }
      setModal(false);
      carregar();
    } catch (err) { toast.error(err.response?.data?.erro || 'Erro ao salvar'); }
  }

  async function excluir(id) {
    if (!confirm('Excluir esta pessoa?')) return;
    await api.delete(`/pessoas/${id}`);
    toast.success('Pessoa excluída');
    if (detalhe?.id === id) setDetalhe(null);
    carregar();
  }

  async function abrirDetalhe(id) {
    const { data } = await api.get(`/pessoas/${id}`);
    setDetalhe(data);
  }

  async function uploadAnexo(pessoaId, tipo, file) {
    setUploading(tipo);
    try {
      const form = new FormData();
      form.append('arquivo', file);
      form.append('referencia_id', pessoaId);
      form.append('tipo_referencia', 'pessoa');
      form.append('tipo_documento', tipo);
      await api.post('/anexos', form);
      toast.success('Arquivo enviado!');
      await abrirDetalhe(pessoaId);
    } catch { toast.error('Erro ao enviar arquivo'); }
    finally { setUploading(''); }
  }

  async function excluirAnexo(anexoId) {
    if (!confirm('Excluir este arquivo?')) return;
    await api.delete(`/anexos/${anexoId}`);
    await abrirDetalhe(detalhe.id);
  }

  function tamanho(b) {
    if (!b) return '';
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>2Pessoas</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{pessoas.length} pessoa(s) cadastrada(s)</p>
        </div>
        <button onClick={abrirNovo} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          <Plus size={16} /> Cadastrar Pessoa
        </button>
      </div>

      {/* Busca */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, CPF ou cidade..." style={{ ...inp, paddingLeft: 36, fontSize: 14 }} />
      </div>

      {/* Lista */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {pessoas.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#aaa' }}>
            <Users size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p>Nenhuma pessoa cadastrada</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                {['Nome', 'CEAC', 'CPF', 'Telefone', 'Cidade', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pessoas.map(p => (
                <>
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>{p.nome}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{p.ceac || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{p.cpf || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{p.telefone || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{p.cidade ? `${p.cidade}${p.estado ? `/${p.estado}` : ''}` : '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => detalhe?.id === p.id ? setDetalhe(null) : abrirDetalhe(p.id)} style={btn('#3b82f6')} title="Ver detalhes">
                          {detalhe?.id === p.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        <button onClick={() => abrirEditar(p)} style={btn('#f59e0b')} title="Editar">
                          <FileText size={14} />
                        </button>
                        <button onClick={() => excluir(p.id)} style={btn('#ef4444')} title="Excluir">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Painel de detalhes expandido */}
                  {detalhe?.id === p.id && (
                    <tr key={`det-${p.id}`}>
                      <td colSpan={6} style={{ padding: 0, background: '#f8fafc' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '2px solid #e5e7eb' }}>

                          {/* Dados */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                            {[
                              ['Endereço', detalhe.endereco], ['CEP', detalhe.cep],
                              ['Cidade', detalhe.cidade], ['Estado', detalhe.estado],
                            ].map(([l, v]) => v ? (
                              <div key={l}>
                                <div style={{ fontSize: 10, color: '#aaa', fontWeight: 700, textTransform: 'uppercase' }}>{l}</div>
                                <div style={{ fontSize: 13, color: '#1a1a2e', fontWeight: 500, marginTop: 2 }}>{v}</div>
                              </div>
                            ) : null)}
                            {detalhe.curriculo_resumido && (
                              <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ fontSize: 10, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Currículo Resumido</div>
                                <div style={{ fontSize: 13, color: '#444', lineHeight: 1.6, background: 'white', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb' }}>{detalhe.curriculo_resumido}</div>
                              </div>
                            )}
                          </div>

                          {/* Anexos */}
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>Documentos Anexados</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                            {TIPOS_ANEXO.map(({ tipo, label, aceita }) => {
                              const anexosTipo = detalhe.anexos?.filter(a => a.tipo_documento === tipo) || [];
                              return (
                                <div key={tipo} style={{ border: '2px solid #e5e7eb', borderRadius: 8, padding: '12px 14px', background: 'white' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: anexosTipo.length ? 10 : 0 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#444' }}>{label}</span>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#1a1a2e', color: 'white', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                                      <Upload size={11} /> {uploading === tipo ? 'Enviando...' : 'Anexar'}
                                      <input type="file" accept={aceita} style={{ display: 'none' }} disabled={!!uploading} onChange={e => e.target.files[0] && uploadAnexo(detalhe.id, tipo, e.target.files[0])} />
                                    </label>
                                  </div>
                                  {anexosTipo.map(a => (
                                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: '1px solid #f1f5f9' }}>
                                      <FileText size={13} color="#3b82f6" />
                                      <span style={{ flex: 1, fontSize: 12, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome_original}</span>
                                      <span style={{ fontSize: 10, color: '#aaa' }}>{tamanho(a.tamanho)}</span>
                                      <a href={`http://localhost:3001/api/anexos/download/${a.nome_arquivo}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', display: 'flex' }}><Download size={13} /></a>
                                      <button onClick={() => excluirAnexo(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex' }}><Trash2 size={13} /></button>
                                    </div>
                                  ))}
                                  {anexosTipo.length === 0 && <div style={{ fontSize: 11, color: '#bbb', marginTop: 6 }}>Nenhum arquivo</div>}
                                </div>
                              );
                            })}
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal cadastro/edição */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>{editando ? 'Editar Pessoa' : 'Cadastrar Pessoa'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={20} /></button>
            </div>

            <form onSubmit={salvar}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={lbl}>Nome <span style={{ color: '#ef4444' }}>*</span></label>
                  <input style={inp} value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" />
                </div>

                <div>
                  <label style={lbl}>CEAC</label>
                  <input style={inp} value={form.ceac} onChange={e => set('ceac', e.target.value)} placeholder="Número CEAC" />
                </div>

                <div>
                  <label style={lbl}>CPF</label>
                  <input style={inp} value={form.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" />
                </div>

                <div>
                  <label style={lbl}>Telefone</label>
                  <input style={inp} value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(00) 00000-0000" />
                </div>

                <div>
                  <label style={lbl}>CEP</label>
                  <input style={inp} value={form.cep} onChange={e => set('cep', e.target.value)} placeholder="00000-000" />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={lbl}>Endereço</label>
                  <input style={inp} value={form.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número, bairro" />
                </div>

                <div>
                  <label style={lbl}>Cidade</label>
                  <input style={inp} value={form.cidade} onChange={e => set('cidade', e.target.value)} />
                </div>

                <div>
                  <label style={lbl}>Estado</label>
                  <select style={inp} value={form.estado} onChange={e => set('estado', e.target.value)}>
                    <option value="">UF</option>
                    {ESTADOS.map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={lbl}>Currículo Resumido</label>
                  <textarea style={{ ...inp, minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }} value={form.curriculo_resumido} onChange={e => set('curriculo_resumido', e.target.value)} placeholder="Descreva brevemente a trajetória e experiências..." />
                </div>

              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModal(false)} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: '#555', fontSize: 14 }}>
                  Cancelar
                </button>
                <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                  <Save size={15} /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function btn(cor) {
  return { padding: '6px 9px', background: cor + '15', border: 'none', borderRadius: 6, color: cor, cursor: 'pointer', display: 'flex', alignItems: 'center' };
}

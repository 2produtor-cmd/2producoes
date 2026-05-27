import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Upload, Trash2, Download, FolderOpen } from 'lucide-react';

export default function Documentos() {
  const [projetos, setProjetos] = useState([]);
  const [projetoSel, setProjetoSel] = useState('');
  const [anexos, setAnexos] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { api.get('/projetos').then(r => setProjetos(r.data)).catch(() => {}); }, []);

  useEffect(() => {
    if (!projetoSel) { setAnexos([]); return; }
    api.get('/anexos', { params: { referencia_id: projetoSel, tipo_referencia: 'projeto' } })
      .then(r => setAnexos(r.data)).catch(() => {});
  }, [projetoSel]);

  async function upload(e) {
    const file = e.target.files[0];
    if (!file || !projetoSel) return toast.error('Selecione um projeto primeiro');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('arquivo', file);
      form.append('referencia_id', projetoSel);
      form.append('tipo_referencia', 'projeto');
      form.append('tipo_documento', 'documento');
      await api.post('/anexos', form);
      toast.success('Arquivo enviado!');
      const { data } = await api.get('/anexos', { params: { referencia_id: projetoSel, tipo_referencia: 'projeto' } });
      setAnexos(data);
    } catch { toast.error('Erro ao enviar arquivo'); }
    finally { setUploading(false); e.target.value = ''; }
  }

  async function excluir(id) {
    if (!confirm('Excluir este arquivo?')) return;
    await api.delete(`/anexos/${id}`);
    setAnexos(a => a.filter(x => x.id !== id));
  }

  function tamanho(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>2Documentos</h1>
        <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Biblioteca de arquivos por projeto</p>
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Selecionar Projeto</label>
            <select value={projetoSel} onChange={e => setProjetoSel(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', background: 'white' }}>
              <option value="">Selecione um projeto...</option>
              {projetos.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.protocolo})</option>)}
            </select>
          </div>
          {projetoSel && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#1a1a2e', color: 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              <Upload size={16} /> {uploading ? 'Enviando...' : 'Upload'}
              <input type="file" style={{ display: 'none' }} onChange={upload} disabled={uploading} />
            </label>
          )}
        </div>
      </div>

      {projetoSel && (
        <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {anexos.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#aaa' }}>
              <FolderOpen size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>Nenhum arquivo neste projeto</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                  {['Arquivo', 'Tipo', 'Tamanho', 'Data', 'Ações'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {anexos.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: '#1a1a2e' }}>{a.nome_original}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#888' }}>{a.tipo_documento || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#888' }}>{tamanho(a.tamanho)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#888' }}>{new Date(a.criado_em).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a href={`http://localhost:3001/api/anexos/download/${a.nome_arquivo}`} target="_blank" rel="noreferrer" style={{ padding: '5px 8px', background: '#eff6ff', border: 'none', borderRadius: 6, color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Download size={13} />
                        </a>
                        <button onClick={() => excluir(a.id)} style={{ padding: '5px 8px', background: '#fee2e2', border: 'none', borderRadius: 6, color: '#ef4444', cursor: 'pointer' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

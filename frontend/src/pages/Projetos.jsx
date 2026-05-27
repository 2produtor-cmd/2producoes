import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Search, FileText, Eye, FolderOpen, ExternalLink } from 'lucide-react';

const STATUS = {
  em_analise:  { label: 'Em Análise',  cor: '#f59e0b' },
  pendente:    { label: 'Pendente',    cor: '#ef4444' },
  aprovado:    { label: 'Aprovado',    cor: '#10b981' },
  reprovado:   { label: 'Reprovado',   cor: '#6b7280' },
  em_execucao: { label: 'Em Execução', cor: '#3b82f6' },
  finalizado:  { label: 'Finalizado',  cor: '#8b5cf6' },
};

export default function Projetos() {
  const [inscricoes, setInscricoes] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/inscricoes', { params: filtroStatus ? { status: filtroStatus } : {} })
      .then(r => setInscricoes(r.data))
      .catch(() => toast.error('Erro ao carregar projetos'));
  }, [filtroStatus]);

  const filtrados = inscricoes.filter(i =>
    !busca ||
    i.nome_projeto?.toLowerCase().includes(busca.toLowerCase()) ||
    i.nome_completo?.toLowerCase().includes(busca.toLowerCase()) ||
    i.protocolo?.toLowerCase().includes(busca.toLowerCase()) ||
    i.categoria?.toLowerCase().includes(busca.toLowerCase())
  );

  async function gerarPDF(id, protocolo, e) {
    e.stopPropagation();
    try {
      const res = await api.get(`/documentos/inscricao/${id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `inscricao-${protocolo}.pdf`; a.click();
    } catch { toast.error('Erro ao gerar PDF'); }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>2Projetos</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{filtrados.length} projeto(s) inscrito(s)</p>
        </div>
        <a href="/inscricao" target="_blank" rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#10b981', color: 'white', padding: '10px 18px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
          <ExternalLink size={15} /> Formulário de Inscrição
        </a>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por projeto, proponente, protocolo..."
            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          style={{ padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', background: 'white' }}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {filtrados.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#aaa' }}>
            <FolderOpen size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p>Nenhum projeto encontrado</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                {['Protocolo', 'Projeto', 'Proponente', 'Categoria', 'Cidade', 'Status', 'Data', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(i => (
                <tr key={i.id}
                  onClick={() => navigate(`/projetos/${i.id}`)}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#888', fontFamily: 'monospace' }}>{i.protocolo}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>{i.nome_projeto || '—'}</div>
                    {i.categoria && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{i.categoria}</div>}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{i.nome_completo || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{i.categoria || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{i.cidade_execucao || i.cidade || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: (STATUS[i.status]?.cor || '#888') + '20', color: STATUS[i.status]?.cor || '#888' }}>
                      {STATUS[i.status]?.label || i.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#888' }}>{new Date(i.criado_em).toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => navigate(`/projetos/${i.id}`)} style={btn('#3b82f6')} title="Abrir"><Eye size={14} /></button>
                      <button onClick={e => gerarPDF(i.id, i.protocolo, e)} style={btn('#10b981')} title="PDF"><FileText size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function btn(cor) {
  return { padding: '6px 10px', background: cor + '15', border: 'none', borderRadius: 6, color: cor, cursor: 'pointer', display: 'flex', alignItems: 'center' };
}

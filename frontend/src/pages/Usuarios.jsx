import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', perfil: 'participante' });
  const [mostrarForm, setMostrarForm] = useState(false);
  const { usuario } = useAuth();

  useEffect(() => { api.get('/auth/usuarios').then(r => setUsuarios(r.data)).catch(() => {}); }, []);

  async function criar(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/usuarios', form);
      setUsuarios(u => [...u, data]);
      setForm({ nome: '', email: '', senha: '', perfil: 'participante' });
      setMostrarForm(false);
      toast.success('Usuário criado!');
    } catch (err) { toast.error(err.response?.data?.erro || 'Erro ao criar usuário'); }
  }

  async function toggleAtivo(u) {
    await api.put(`/auth/usuarios/${u.id}`, { ...u, ativo: !u.ativo });
    setUsuarios(us => us.map(x => x.id === u.id ? { ...x, ativo: !x.ativo } : x));
  }

  const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>Usuários</h1>
        <button onClick={() => setMostrarForm(!mostrarForm)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          <Plus size={16} /> Novo Usuário
        </button>
      </div>

      {mostrarForm && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          <form onSubmit={criar} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            {[['nome','Nome'],['email','E-mail'],['senha','Senha']].map(([c, l]) => (
              <div key={c}>
                <label style={lbl}>{l} *</label>
                <input type={c === 'senha' ? 'password' : 'text'} style={inp} value={form[c]} onChange={e => setForm(f => ({ ...f, [c]: e.target.value }))} required />
              </div>
            ))}
            <div>
              <label style={lbl}>Perfil</label>
              <select style={inp} value={form.perfil} onChange={e => setForm(f => ({ ...f, perfil: e.target.value }))}>
                <option value="participante">Participante</option>
                <option value="produtor">Produtor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" style={{ padding: '9px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Criar</button>
          </form>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
              {['Nome', 'E-mail', 'Perfil', 'Status', 'Cadastro', 'Ação'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>{u.nome}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: u.perfil === 'admin' ? '#fef3c7' : u.perfil === 'produtor' ? '#eff6ff' : '#f0fdf4', color: u.perfil === 'admin' ? '#92400e' : u.perfil === 'produtor' ? '#1d4ed8' : '#065f46' }}>
                    {u.perfil}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: u.ativo ? '#d1fae5' : '#fee2e2', color: u.ativo ? '#065f46' : '#991b1b' }}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#888' }}>{new Date(u.criado_em).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '12px 16px' }}>
                  {u.id !== usuario?.id && (
                    <button onClick={() => toggleAtivo(u)} style={{ padding: '5px 8px', background: u.ativo ? '#fee2e2' : '#d1fae5', border: 'none', borderRadius: 6, cursor: 'pointer', color: u.ativo ? '#ef4444' : '#10b981' }}>
                      {u.ativo ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function Financeiro() {
  const [lancamentos, setLancamentos] = useState([]);
  const [resumo, setResumo] = useState({ entradas: 0, saidas: 0, saldo: 0 });
  const [form, setForm] = useState({ tipo: 'entrada', descricao: '', valor: '', categoria: '', data_lancamento: new Date().toISOString().split('T')[0] });
  const [mostrarForm, setMostrarForm] = useState(false);

  async function carregar() {
    const [l, r] = await Promise.all([api.get('/financeiro'), api.get('/financeiro/resumo')]);
    setLancamentos(l.data);
    setResumo(r.data);
  }

  useEffect(() => { carregar(); }, []);

  async function salvar(e) {
    e.preventDefault();
    if (!form.descricao || !form.valor) return toast.error('Preencha os campos obrigatórios');
    try {
      await api.post('/financeiro', form);
      toast.success('Lançamento adicionado!');
      setForm({ tipo: 'entrada', descricao: '', valor: '', categoria: '', data_lancamento: new Date().toISOString().split('T')[0] });
      setMostrarForm(false);
      carregar();
    } catch { toast.error('Erro ao salvar'); }
  }

  async function excluir(id) {
    if (!confirm('Excluir este lançamento?')) return;
    await api.delete(`/financeiro/${id}`);
    carregar();
  }

  const fmt = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>2Financeiro</h1>
        <button onClick={() => setMostrarForm(!mostrarForm)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          <Plus size={16} /> Novo Lançamento
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Entradas', valor: resumo.entradas, cor: '#10b981', icon: TrendingUp },
          { label: 'Saídas', valor: resumo.saidas, cor: '#ef4444', icon: TrendingDown },
          { label: 'Saldo', valor: resumo.saldo, cor: Number(resumo.saldo) >= 0 ? '#10b981' : '#ef4444', icon: DollarSign }
        ].map(({ label, valor, cor, icon: Icon }) => (
          <div key={label} style={{ background: 'white', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: cor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={22} color={cor} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: cor }}>{fmt(valor)}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {mostrarForm && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>Novo Lançamento</h3>
          <form onSubmit={salvar} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={lbl}>Tipo</label>
              <select style={inp} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Descrição *</label>
              <input style={inp} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Valor (R$) *</label>
              <input type="number" step="0.01" style={inp} value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Data</label>
              <input type="date" style={inp} value={form.data_lancamento} onChange={e => setForm(f => ({ ...f, data_lancamento: e.target.value }))} />
            </div>
            <button type="submit" style={{ padding: '9px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Salvar</button>
          </form>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
              {['Data', 'Tipo', 'Descrição', 'Valor', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lancamentos.map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#888' }}>{new Date(l.data_lancamento).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: l.tipo === 'entrada' ? '#d1fae5' : '#fee2e2', color: l.tipo === 'entrada' ? '#065f46' : '#991b1b' }}>
                    {l.tipo === 'entrada' ? '↑ Entrada' : '↓ Saída'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: '#1a1a2e' }}>{l.descricao}</td>
                <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: l.tipo === 'entrada' ? '#10b981' : '#ef4444' }}>{fmt(l.valor)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => excluir(l.id)} style={{ padding: '5px 8px', background: '#fee2e2', border: 'none', borderRadius: 6, color: '#ef4444', cursor: 'pointer' }}><Trash2 size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {lancamentos.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Nenhum lançamento registrado</div>}
      </div>
    </div>
  );
}

const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'white' };
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 };

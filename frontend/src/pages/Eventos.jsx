import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Calendar, MapPin, Clock } from 'lucide-react';

const vazio = { nome: '', local: '', data: '', horario: '', descricao: '', equipamentos: '', cronograma: '', rider_tecnico: '', seguranca: '', alimentacao: '', transporte: '', status: 'planejado' };

export default function Eventos() {
  const [eventos, setEventos] = useState([]);
  const [form, setForm] = useState(vazio);
  const [editando, setEditando] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  useEffect(() => { api.get('/eventos').then(r => setEventos(r.data)).catch(() => {}); }, []);

  function set(c, v) { setForm(f => ({ ...f, [c]: v })); }

  async function salvar(e) {
    e.preventDefault();
    if (!form.nome) return toast.error('Nome do evento é obrigatório');
    try {
      if (editando) {
        await api.put(`/eventos/${editando}`, form);
        toast.success('Evento atualizado!');
      } else {
        await api.post('/eventos', form);
        toast.success('Evento criado!');
      }
      const { data } = await api.get('/eventos');
      setEventos(data);
      setForm(vazio);
      setEditando(null);
      setMostrarForm(false);
    } catch { toast.error('Erro ao salvar evento'); }
  }

  function editar(ev) {
    setForm({ ...vazio, ...ev, data: ev.data?.split('T')[0] || '', horario: ev.horario?.slice(0, 5) || '' });
    setEditando(ev.id);
    setMostrarForm(true);
  }

  const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>2Eventos</h1>
        <button onClick={() => { setForm(vazio); setEditando(null); setMostrarForm(!mostrarForm); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          <Plus size={16} /> Novo Evento
        </button>
      </div>

      {mostrarForm && (
        <div style={{ background: 'white', borderRadius: 12, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 20 }}>{editando ? 'Editar Evento' : 'Novo Evento'}</h3>
          <form onSubmit={salvar}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              {[['nome','Nome *'],['local','Local'],['data','Data'],['horario','Horário'],['status','Status']].map(([c, l]) => (
                <div key={c}>
                  <label style={lbl}>{l}</label>
                  {c === 'data' ? <input type="date" style={inp} value={form[c]} onChange={e => set(c, e.target.value)} /> :
                   c === 'horario' ? <input type="time" style={inp} value={form[c]} onChange={e => set(c, e.target.value)} /> :
                   c === 'status' ? <select style={inp} value={form[c]} onChange={e => set(c, e.target.value)}>{['planejado','em_andamento','realizado','cancelado'].map(s => <option key={s}>{s}</option>)}</select> :
                   <input style={inp} value={form[c]} onChange={e => set(c, e.target.value)} />}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {[['descricao','Descrição'],['equipamentos','Equipamentos'],['cronograma','Cronograma'],['rider_tecnico','Rider Técnico'],['seguranca','Segurança'],['alimentacao','Alimentação'],['transporte','Transporte']].map(([c, l]) => (
                <div key={c}>
                  <label style={lbl}>{l}</label>
                  <textarea style={{ ...inp, minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }} value={form[c]} onChange={e => set(c, e.target.value)} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={{ padding: '10px 24px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Salvar</button>
              <button type="button" onClick={() => setMostrarForm(false)} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: '#555' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {eventos.length === 0 && <p style={{ color: '#aaa', gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>Nenhum evento cadastrado</p>}
        {eventos.map(ev => (
          <div key={ev.id} style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer' }} onClick={() => editar(ev)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>{ev.nome}</h3>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: '#f0f9ff', color: '#0369a1' }}>{ev.status}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ev.local && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#888' }}><MapPin size={13} />{ev.local}</div>}
              {ev.data && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#888' }}><Calendar size={13} />{new Date(ev.data).toLocaleDateString('pt-BR')}</div>}
              {ev.horario && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#888' }}><Clock size={13} />{ev.horario?.slice(0, 5)}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

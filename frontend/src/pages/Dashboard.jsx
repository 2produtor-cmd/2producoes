import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FolderOpen, CheckCircle, Clock, AlertCircle, Calendar, DollarSign, ClipboardList, TrendingUp } from 'lucide-react';

const STATUS_LABEL = { em_analise: 'Em Análise', pendente: 'Pendente', aprovado: 'Aprovado', reprovado: 'Reprovado', em_execucao: 'Em Execução', finalizado: 'Finalizado' };
const STATUS_COR = { em_analise: '#f59e0b', pendente: '#ef4444', aprovado: '#10b981', reprovado: '#6b7280', em_execucao: '#3b82f6', finalizado: '#8b5cf6' };

function Card({ icon: Icon, label, valor, cor, sub }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: cor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} color={cor} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e' }}>{valor}</div>
        <div style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#aaa' }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [dados, setDados] = useState(null);

  useEffect(() => {
    api.get('/projetos/dashboard').then(r => setDados(r.data)).catch(() => {});
  }, []);

  if (!dados) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Carregando...</div>;

  const saldo = Number(dados.financeiro?.entradas || 0) - Number(dados.financeiro?.saidas || 0);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Visão geral do sistema 2Produções</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <Card icon={FolderOpen} label="Total de Projetos" valor={dados.projetos?.total || 0} cor="#3b82f6" />
        <Card icon={CheckCircle} label="Aprovados" valor={dados.projetos?.aprovados || 0} cor="#10b981" />
        <Card icon={Clock} label="Em Análise" valor={dados.projetos?.em_analise || 0} cor="#f59e0b" />
        <Card icon={AlertCircle} label="Pendentes" valor={dados.projetos?.pendentes || 0} cor="#ef4444" />
        <Card icon={ClipboardList} label="Inscrições" valor={dados.inscricoes || 0} cor="#8b5cf6" />
        <Card icon={Calendar} label="Próximos Eventos" valor={dados.proximos_eventos || 0} cor="#06b6d4" />
        <Card icon={TrendingUp} label="Entradas" valor={`R$ ${Number(dados.financeiro?.entradas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} cor="#10b981" />
        <Card icon={DollarSign} label="Saldo" valor={`R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} cor={saldo >= 0 ? '#10b981' : '#ef4444'} />
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Projetos Recentes</h2>
          <Link to="/projetos" style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
        </div>
        {dados.projetos_recentes?.length === 0 && <p style={{ color: '#aaa', fontSize: 13 }}>Nenhum projeto cadastrado ainda.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dados.projetos_recentes?.map(p => (
            <Link key={p.id} to={`/projetos/${p.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: 8, textDecoration: 'none', color: 'inherit' }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>{p.nome}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: STATUS_COR[p.status] + '20', color: STATUS_COR[p.status] }}>
                {STATUS_LABEL[p.status] || p.status}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

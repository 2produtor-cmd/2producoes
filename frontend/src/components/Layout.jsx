import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, FolderOpen, ClipboardList, Calendar,
  DollarSign, FileText, Users, LogOut, Menu, X, ChevronRight, UserCircle
} from 'lucide-react';

const menu = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projetos', label: '2Projetos', icon: FolderOpen },
  { path: '/inscricoes', label: '2Inscrições', icon: ClipboardList },
  { path: '/eventos', label: '2Eventos', icon: Calendar },
  { path: '/financeiro', label: '2Financeiro', icon: DollarSign },
  { path: '/documentos', label: '2Documentos', icon: FileText },
  { path: '/pessoas', label: '2Pessoas', icon: UserCircle },
  { path: '/usuarios', label: 'Usuários', icon: Users, adminOnly: true },
];

export default function Layout({ children }) {
  const [aberto, setAberto] = useState(true);
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const itensMenu = menu.filter(m => !m.adminOnly || usuario?.perfil === 'admin');

  return (
    <div style={s.root}>
      <aside style={{ ...s.sidebar, width: aberto ? 240 : 64 }}>
        <div style={s.sideTop}>
          <div style={s.brand}>
            {aberto && <span style={s.brandText}>2Produções</span>}
            <button onClick={() => setAberto(!aberto)} style={s.menuBtn}>
              {aberto ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
          <nav style={s.nav}>
            {itensMenu.map(item => {
              const ativo = location.pathname.startsWith(item.path);
              return (
                <Link key={item.path} to={item.path} style={{ ...s.navItem, ...(ativo ? s.navAtivo : {}) }}>
                  <item.icon size={18} />
                  {aberto && <span style={s.navLabel}>{item.label}</span>}
                  {aberto && ativo && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
                </Link>
              );
            })}
          </nav>
        </div>
        <div style={s.sideBottom}>
          {aberto && (
            <div style={s.userInfo}>
              <div style={s.avatar}>{usuario?.nome?.[0]?.toUpperCase()}</div>
              <div>
                <div style={s.userName}>{usuario?.nome}</div>
                <div style={s.userRole}>{usuario?.perfil}</div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={s.logoutBtn} title="Sair">
            <LogOut size={18} />
            {aberto && <span>Sair</span>}
          </button>
        </div>
      </aside>
      <main style={s.main}>
        {children}
      </main>
    </div>
  );
}

const s = {
  root: { display: 'flex', minHeight: '100vh', background: '#f4f6f9' },
  sidebar: { background: '#1a1a2e', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'width 0.2s', overflow: 'hidden', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' },
  sideTop: { flex: 1 },
  brand: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  brandText: { fontWeight: 800, fontSize: 16, letterSpacing: 1, color: '#e2e8f0' },
  menuBtn: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4, borderRadius: 4 },
  nav: { padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13, fontWeight: 500, transition: 'all 0.15s' },
  navAtivo: { background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 700 },
  navLabel: { whiteSpace: 'nowrap' },
  sideBottom: { padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 8 },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#0f3460', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 },
  userName: { fontSize: 12, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap' },
  userRole: { fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', borderRadius: 8, fontSize: 13, fontWeight: 500 },
  main: { flex: 1, padding: 28, overflow: 'auto' }
};

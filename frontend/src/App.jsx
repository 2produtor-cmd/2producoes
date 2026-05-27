import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projetos from './pages/Projetos';
import InscricaoDetalhe from './pages/InscricaoDetalhe';
import Inscricoes from './pages/Inscricoes';
import InscricaoPublica from './pages/InscricaoPublica';
import Financeiro from './pages/Financeiro';
import Eventos from './pages/Eventos';
import Documentos from './pages/Documentos';
import Pessoas from './pages/Pessoas';
import Register from './pages/Register'; // Importar o novo componente
import Usuarios from './pages/Usuarios';

function RotaProtegida({ children }) {
  const { usuario } = useAuth();
  return usuario ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} /> {/* Nova rota para registro */}
          <Route path="/inscricao" element={<InscricaoPublica />} />
          <Route path="/*" element={
            <RotaProtegida>
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/projetos" element={<Projetos />} />
                  <Route path="/projetos/:id" element={<InscricaoDetalhe />} />
                  <Route path="/inscricoes" element={<Inscricoes />} />
                  <Route path="/financeiro" element={<Financeiro />} />
                  <Route path="/eventos" element={<Eventos />} />
                  <Route path="/documentos" element={<Documentos />} />
                  <Route path="/pessoas" element={<Pessoas />} />
                  <Route path="/usuarios" element={<Usuarios />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </RotaProtegida>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

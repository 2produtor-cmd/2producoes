import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

function Register() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    if (nome.trim().length < 3) {
      toast.error('O nome deve ter pelo menos 3 caracteres');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Por favor, insira um e-mail válido');
      return false;
    }

    if (senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await api.post('/auth/register', { nome, email, senha });
      toast.success('Usuário registrado com sucesso! Faça login para continuar.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.erro || 'Erro ao registrar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h2>Registrar Novo Usuário</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nome Completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Registrar'}
        </button>
      </form>
      <p>
        Já tem uma conta?{' '}
        <Link to="/login">Fazer Login</Link>
      </p>
    </div>
  );
}

export default Register;
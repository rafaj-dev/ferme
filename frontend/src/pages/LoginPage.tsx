import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../hooks/useAuth';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [formData, setFormData] = useState({
    session: '',
    password: '',
  });

  // ✅ Si un token existe déjà, on redirige directement vers le dashboard
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) navigate('/dashboard');
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.session.trim() || !formData.password.trim()) return;

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-secondary)] via-white to-[var(--color-accent)] flex">
      {/* Section gauche */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] items-center justify-center p-12">
        <div className="text-center text-white max-w-md">
          <img 
            src="/login.png"
            alt="Farm Management Logo" 
            className="w-[160px] h-[160px] mx-auto mb-8"
          />
          <h3 className="text-4xl font-bold mb-6">Farm Management</h3>
          <p className="text-lg opacity-90">
            Votre solution complète de gestion agricole. Suivez les dépenses, surveillez les ventes et optimisez vos opérations.
          </p>
        </div>
      </div>

      {/* Section droite */}
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <img 
              src="/logo.png"
              alt="Spacer Logo" 
              className="w-[70px] h-[70px] mx-auto mb-4"
            />
            <h2 className="text-3xl font-bold text-[var(--color-text)]">Content de vous revoir</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Session"
              type="text"
              name="session"
              placeholder="Entrez votre session"
              value={formData.session}
              onChange={handleChange}
              required
            />
            <Input
              label="Mot de passe"
              type="password"
              name="password"
              placeholder="Entrez votre mot de passe"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full py-4 text-lg font-semibold rounded-lg"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Connexion...
                </div>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

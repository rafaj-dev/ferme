import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Sprout } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-accent) 100%)' }}>
      <div className="text-center animate-lazy">
        {/* Icône décorative */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full flex items-center justify-center logo-float" style={{ background: 'var(--color-card-bg)', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}>
              <Sprout size={64} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="absolute -top-2 -right-2 w-20 h-20 rounded-full opacity-20" style={{ background: 'var(--color-primary)' }}></div>
            <div className="absolute -bottom-2 -left-2 w-16 h-16 rounded-full opacity-10" style={{ background: 'var(--color-primary-dark)' }}></div>
          </div>
        </div>

        {/* Titre 404 */}
        <h1 className="dashboard-title mb-4" style={{ fontSize: '6rem', color: 'var(--color-primary)', lineHeight: '1' }}>
          404
        </h1>

        {/* Message */}
        <h2 className="dashboard-subtitle mb-3" style={{ fontSize: '1.875rem', fontWeight: '600', color: 'var(--color-text)' }}>
          Page introuvable
        </h2>
        <p className="dashboard-subtitle mb-8" style={{ fontSize: '1.125rem', color: 'var(--color-text-muted)', maxWidth: '28rem', margin: '0 auto 2rem' }}>
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary flex items-center gap-2 px-6 py-3"
            style={{ fontSize: '1rem', minWidth: '160px' }}
          >
            <ArrowLeft size={20} />
            Retour
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary flex items-center gap-2 px-6 py-3"
            style={{ fontSize: '1rem', minWidth: '160px' }}
          >
            <Home size={20} />
            Accueil
          </button>
        </div>

        {/* Liens rapides */}
        <div className="mt-12">
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Ou accédez directement à :
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { label: 'Cultures', path: '/culture' },
              { label: 'Produits', path: '/produit' },
              { label: 'Animaux', path: '/animal' },
              { label: 'Ventes', path: '/sale' }
            ].map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="text-sm px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                style={{
                  color: 'var(--color-primary-dark)',
                  background: 'var(--color-card-bg)',
                  border: '1px solid var(--color-input-border)',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: '500'
                }}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
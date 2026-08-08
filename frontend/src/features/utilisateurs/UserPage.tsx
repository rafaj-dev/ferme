/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Users,
  Search,
  Shield,
  UserCheck, 
  UserX,
  User,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '../../components/Sidebar';
import { useUsers } from '../../hooks/useUsers';

const UsersPage: React.FC = () => {
  const {
    users,
    loading,
    setFilters,
    createUser,
    updateUserStatus,
    creating,
    updating,
  } = useUsers();

  const [showAddUser, setShowAddUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('Tous');
  const [selectedStatus, setSelectedStatus] = useState('Tous');
  
  const [newUser, setNewUser] = useState({
    session: '',
    name: '',
    firstName: '',
    role: 'admin',
    isActive: true
  });

  const roles = ['Tous', 'admin', 'user'];
  const statuses = ['Tous', 'actif', 'inactif'];

  // Gérer la recherche avec debounce - version corrigée
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters({ search: searchTerm || undefined });
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]); // Retirer setFilters des dépendances

  // Gérer le filtre par rôle - version corrigée
  const handleRoleChange = useCallback((role: string) => {
    setSelectedRole(role);
    setFilters({ 
      role: role === 'Tous' ? undefined : [role] 
    });
  }, [setFilters]);

  // Gérer le filtre par statut - version corrigée
  const handleStatusChange = useCallback((status: string) => {
    setSelectedStatus(status);
    setFilters({ 
      isActive: status === 'Tous' ? undefined : (status === 'actif' ? 'true' : 'false')
    });
  }, [setFilters]);

  const handleAddUser = async () => {
    if (!newUser.session || !newUser.name || !newUser.firstName) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await createUser(newUser);
      setNewUser({ session: '', name: '', firstName: '', role: 'employe', isActive: true });
      setShowAddUser(false);
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  };


  const handleToggleStatus = async (user: any) => {
    try {
      await updateUserStatus(user.session, { isActive: !user.isActive });
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrateur',
      'user': 'Utilisateur',
    };
    return roleMap[role] || role;
  };

  const getStatusDisplay = (isActive: boolean) => {
    return isActive ? 'Actif' : 'Inactif';
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex min-h-screen bg-[var(--color-background)]">
        <Sidebar />
        <div className="flex-1 lg:ml-64 overflow-auto p-8 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader className="animate-spin text-[var(--color-primary)]" size={24} />
            <p className="text-[var(--color-text)]">Chargement des utilisateurs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Header avec statistiques */}
       <div className="flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-green-400 via-emerald-600 to-emerald-800">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20 mix-blend-overlay"></div>

          <div className="relative px-4 py-6 sm:px-6 md:px-8 lg:px-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform backdrop-blur-sm bg-white/10 border border-white/20">
                  <img 
                    src="/src/assets/logo.png" 
                    alt="Logo" 
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain"
                  />
                </div>
              </div>

              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight drop-shadow-md break-words">
                  Gestion des utilisateurs
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-emerald-50/90 max-w-xl leading-relaxed break-words">
                  Suivi intelligent et gestion complète de votre inventaire
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Barre d'actions */}
        <div className="mb-6 animate-lazy">
          <div className="card bg-white/70 backdrop-blur-md p-4 shadow-lg border border-white/50">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
              {/* Recherche */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher par session ou nom..."
                  className="input w-full pl-10 py-3"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtres et boutons */}
              <div className="flex flex-wrap gap-3">
                <select
                  className="input px-4 py-3 min-w-[150px]"
                  value={selectedRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                >
                  {roles.map(role => (
                    <option key={role} value={role}>
                      {role === 'Tous' ? 'Tous les rôles' : getRoleDisplayName(role)}
                    </option>
                  ))}
                </select>

                <select
                  className="input px-4 py-3 min-w-[130px]"
                  value={selectedStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status === 'Tous' ? 'Tous statuts' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setShowAddUser(true)}
                  disabled={creating}
                  className="bg-[#129619] rounded-md text-white flex items-center gap-2 px-6 py-3 whitespace-nowrap shadow-md hover:shadow-lg transition-shadow"
                >
                  {creating ? (
                    <Loader className="animate-spin" size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                  {creating ? 'Création...' : 'Ajouter Utilisateur'}
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* Grille des utilisateurs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-lazy">
          {users.map((user, index: number) => (
            <div 
              key={user.idUser} 
              className="card bg-white/70 backdrop-blur-md p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/50"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Header de la carte */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-[var(--color-accent)] rounded-full flex items-center justify-center text-white shadow-md">
                    <User size={28} />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-[var(--color-text)]">
                      {user.name} {user.firstName ? user.firstName : ''}
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                      Session: {user.session}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {user.isActive ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <XCircle size={16} className="text-red-600" />
                      )}
                      <span className={`text-xs font-body ${
                        user.isActive ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {getStatusDisplay(user.isActive)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-[var(--color-text-muted)] font-body text-sm">
                  <User size={16} />
                  <span className="truncate">Session : {user.session}</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--color-text-muted)] font-body text-sm">
                  <Shield size={16} />
                  <span className="px-2 py-1 bg-white/60 backdrop-blur-sm rounded-full border border-white/40 shadow-sm">
                    {getRoleDisplayName(user.role)}
                  </span>
                </div>
                {user.createdAt && (
                  <div className="text-xs text-[var(--color-text-muted)] font-body">
                    Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-[var(--color-input-border)]">
                <button 
                  onClick={() => handleToggleStatus(user)}
                  disabled={updating}
                  className={`flex-1 py-2 px-3 rounded-lg font-body text-sm transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1 disabled:opacity-50 ${
                    user.isActive
                      ? 'bg-red-50/80 hover:bg-red-100/80 text-red-700 backdrop-blur-sm'
                      : 'bg-green-50/80 hover:bg-green-100/80 text-green-700 backdrop-blur-sm'
                  }`}
                >
                  {updating ? (
                    <Loader className="animate-spin" size={16} />
                  ) : user.isActive ? (
                    <>
                      <UserX size={16} />
                      Désactiver
                    </>
                  ) : (
                    <>
                      <UserCheck size={16} />
                      Activer
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && !loading && (
          <div className="card bg-white/70 backdrop-blur-md shadow-lg border border-white/50 text-center py-12">
            <Users size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
            <p className="text-[var(--color-text-muted)] font-body">Aucun utilisateur trouvé</p>
          </div>
        )}

        {/* Modal Ajouter Utilisateur */}
        {showAddUser && (
          <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card bg-white/90 backdrop-blur-xl max-w-md w-full p-6 animate-lazy shadow-2xl border border-white/60">
              <h2 className="card-title text-2xl mb-6 text-[var(--color-text)]">Nouvel Utilisateur</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/40">
                  <div className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--color-text)] font-medium">Profil utilisateur</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Icône par défaut</p>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-[var(--color-text)]">Session *</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={newUser.session}
                    onChange={(e) => setNewUser({...newUser, session: e.target.value})}
                    placeholder="Ex: jean.dupont"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-[var(--color-text)]">Nom *</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    placeholder="Ex: Dupont"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-[var(--color-text)]">Prénom *</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    placeholder="Ex: Jean"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-[var(--color-text)]">Rôle</label>
                  <select
                    className="input w-full"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                    {roles.filter(r => r !== 'Tous').map(role => (
                      <option key={role} value={role}>
                        {getRoleDisplayName(role)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddUser(false)}
                  disabled={creating}
                  className="btn-secondary flex-1 py-3 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={creating}
                  className="btn-primary flex-1 py-3 disabled:opacity-50"
                >
                  {creating ? 'Création...' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
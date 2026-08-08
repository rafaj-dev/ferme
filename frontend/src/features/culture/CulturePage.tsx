import React, { useState, useEffect } from 'react';
import {
  Plus,
  TrendingDown,
  Calendar,
  DollarSign,
  Trash2,
  Search,
  XCircle,
  Sprout,
  CheckCircle,
  Circle,
  Package,
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useCultures } from '../../hooks/useCultures';
import type { CreateCultureDto, CreateCultureEventDto, CreateHarvestDto, SeedCultureDto } from '../../services/cultureService';
import { notificationService } from '../../services/notificationService';

interface CombinedExpense {
  id: number;
  cultureId: number;
  date: string;
  type: string;
  description: string;
  cost?: number;
  quantity?: number;
  note?: string;
  isHarvest: boolean;
}

const CulturePage: React.FC = () => {
  const {
    cultures,
    batches,
    loading,
    error,
    creating,
    updating,
    harvesting,
    seeding,
    createCulture,
    updateCulture,
    deleteCulture,
    createHarvest,
    createCultureEvent,
    seedCulture,
    getCultureEvents,
    getHarvests,
    refreshCultures,
    refreshBatches,
  } = useCultures();

  const [showAddCulture, setShowAddCulture] = useState(false);
  const [showAddDepense, setShowAddDepense] = useState(false);
  const [showAddHarvest, setShowAddHarvest] = useState(false);
  const [showAddSeed, setShowAddSeed] = useState(false);
  const [selectedCulture, setSelectedCulture] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Tous');
  const [expenses, setExpenses] = useState<CombinedExpense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);

  // Formulaire nouvelle culture
  const [newCulture, setNewCulture] = useState<CreateCultureDto>({
    name: '',
    area: 0,
    startDate: '',
    endDate: '',
    status: 'en_cours',
    note: '',
  });

  // Formulaire nouvelle dépense (événement)
  const [newDepense, setNewDepense] = useState<CreateCultureEventDto>({
    cultureId: 0,
    type: 'fertilization',
    description: '',
    cost: 0,
    date: new Date().toISOString().split('T')[0],
  });

  // Formulaire nouvelle récolte
  const [newHarvest, setNewHarvest] = useState<CreateHarvestDto>({
    cultureId: 0,
    productId: 0,
    quantity: 0,
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  // Formulaire nouveau semis
  const [newSeed, setNewSeed] = useState<SeedCultureDto>({
    batchId: 0,
    quantity: 0,
    cultureId: 0,
    date: new Date().toISOString().split('T')[0],
  });

  const typesDepenses = [
    'Tous',
    'fertilization',
    'pesticide',
    'labor',
    'water',
    'fuel',
    'equipment',
    'other',
    'harvest',
  ];

  // Charger les dépenses combinées
  const loadExpenses = async () => {
    try {
      setExpensesLoading(true);
      const allExpenses: CombinedExpense[] = [];

      for (const culture of cultures) {
        if (!selectedCulture || culture.id === selectedCulture) {
          // Charger les événements
          const events = await getCultureEvents(culture.id);
          events.forEach(event => {
            allExpenses.push({
              id: event.id,
              cultureId: event.cultureId,
              date: event.date,
              type: event.type,
              description: event.description,
              cost: parseFloat(event.cost),
              isHarvest: false,
            });
          });

          // Charger les récoltes
          const harvests = await getHarvests(culture.id);
          harvests.forEach(harvest => {
            allExpenses.push({
              id: harvest.id,
              cultureId: harvest.cultureId,
              date: harvest.date,
              type: 'harvest',
              description: harvest.note || 'Récolte',
              quantity: parseFloat(harvest.quantity),
              isHarvest: true,
            });
          });
        }
      }

      // Trier par date (plus récent en premier)
      allExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setExpenses(allExpenses);
    } catch (err) {
      console.error('Erreur lors du chargement des dépenses:', err);
      notificationService.error('Erreur lors du chargement des dépenses');
    } finally {
      setExpensesLoading(false);
    }
  };

  // Filtrer les dépenses
  const filteredExpenses = expenses.filter(expense => {
    const cultureName = cultures.find(c => c.id === expense.cultureId)?.name || '';
    const matchesSearch =
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cultureName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'Tous' || expense.type === filterType;
    return matchesSearch && matchesType;
  });

  // Recharger les dépenses quand les cultures ou la sélection changent
  useEffect(() => {
    loadExpenses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cultures, selectedCulture]);

  const handleAddCulture = async () => {
    if (newCulture.name && newCulture.area && newCulture.startDate && newCulture.endDate) {
      try {
        await createCulture({
          name: newCulture.name,
          area: newCulture.area,
          startDate: newCulture.startDate,
          endDate: newCulture.endDate,
          status: 'en_cours',
          note: newCulture.note || '',
        });
        setNewCulture({ name: '', area: 0, startDate: '', endDate: '', status: 'en_cours', note: '' });
        setShowAddCulture(false);
        await refreshCultures();
        notificationService.success('Culture ajoutée avec succès');
      } catch (err) {
        console.error('Erreur lors de l\'ajout de la culture:', err);
        notificationService.error('Erreur lors de l\'ajout de la culture');
      }
    } else {
      notificationService.error('Veuillez remplir tous les champs obligatoires');
    }
  };

  const handleAddDepense = async () => {
    if (newDepense.cultureId && newDepense.description && newDepense.cost) {
      try {
        await createCultureEvent({
          cultureId: newDepense.cultureId,
          type: newDepense.type,
          description: newDepense.description,
          cost: newDepense.cost,
          date: newDepense.date,
        });
        setNewDepense({
          cultureId: 0,
          type: 'fertilization',
          description: '',
          cost: 0,
          date: new Date().toISOString().split('T')[0],
        });
        setShowAddDepense(false);
        await loadExpenses();
        notificationService.success('Dépense ajoutée avec succès');
      } catch (err) {
        console.error('Erreur lors de l\'ajout de la dépense:', err);
        notificationService.error('Erreur lors de l\'ajout de la dépense');
      }
    } else {
      notificationService.error('Veuillez remplir tous les champs obligatoires');
    }
  };

  const handleAddHarvest = async () => {
    if (newHarvest.cultureId && newHarvest.productId && newHarvest.quantity) {
      try {
        await createHarvest({
          cultureId: newHarvest.cultureId,
          productId: newHarvest.productId,
          quantity: newHarvest.quantity,
          date: newHarvest.date,
          note: newHarvest.note || '',
        });
        setNewHarvest({
          cultureId: 0,
          productId: 0,
          quantity: 0,
          date: new Date().toISOString().split('T')[0],
          note: '',
        });
        setShowAddHarvest(false);
        await refreshCultures();
        await refreshBatches();
        await loadExpenses();
        notificationService.success('Récolte enregistrée avec succès');
      } catch (err) {
        console.error('Erreur lors de l\'ajout de la récolte:', err);
        notificationService.error('Erreur lors de l\'ajout de la récolte');
      }
    } else {
      notificationService.error('Veuillez remplir tous les champs obligatoires');
    }
  };

  const handleAddSeed = async () => {
    if (newSeed.batchId && newSeed.quantity && newSeed.cultureId) {
      try {
        await seedCulture({
          batchId: newSeed.batchId,
          quantity: newSeed.quantity,
          cultureId: newSeed.cultureId,
          date: newSeed.date,
        });
        setNewSeed({
          batchId: 0,
          quantity: 0,
          cultureId: 0,
          date: new Date().toISOString().split('T')[0],
        });
        setShowAddSeed(false);
        await refreshCultures();
        await refreshBatches();
        notificationService.success('Semis effectué avec succès');
      } catch (err) {
        console.error('Erreur lors du semis:', err);
        notificationService.error('Erreur lors du semis');
      }
    } else {
      notificationService.error('Veuillez remplir tous les champs obligatoires');
    }
  };

  const handleDeleteCulture = async (id: number) => {
    try {
      await deleteCulture(id);
      await loadExpenses();
      notificationService.success('Culture supprimée avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression de la culture:', err);
      notificationService.error('Erreur lors de la suppression de la culture');
    }
  };

const handleTerminerCulture = async (id: number) => {
  try {
    // CORRECTION: S'assurer que toutes les données requises sont envoyées
    const cultureToUpdate = cultures.find(c => c.id === id);
    if (!cultureToUpdate) {
      notificationService.error('Culture non trouvée');
      return;
    }

    // Envoyer uniquement le statut à mettre à jour
    await updateCulture(id, { 
      status: 'termine',
      name: cultureToUpdate.name,
      area: parseFloat(cultureToUpdate.area), // Déjà un nombre, pas besoin de conversion
      startDate: cultureToUpdate.startDate,
      endDate: cultureToUpdate.endDate,
      note: cultureToUpdate.note || ''
    });
    
    notificationService.success('Culture marquée comme terminée');
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    notificationService.error('Erreur lors de la mise à jour du statut');
  }
};
  const getTypeDisplayName = (type: string) => {
    const typeMap: { [key: string]: string } = {
      fertilization: 'Fertilisation',
      pesticide: 'Pesticide',
      seeding: 'Semis',
      labor: 'Main d\'œuvre',
      water: 'Eau',
      fuel: 'Carburant',
      equipment: 'Équipement',
      other: 'Autre',
      harvest: 'Récolte',
    };
    return typeMap[type] || type;
  };

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
                    src="/logo.png"
                    alt="Logo"
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain"
                  />
                </div>
              </div>

              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight drop-shadow-md break-words">
                  Gestion des Cultures
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-emerald-50/90 max-w-xl leading-relaxed break-words">
                  Suivi intelligent et en temps réel pour une ferme plus efficace
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 m-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Section Cultures */}
        <div className="mb-8 mt-6 animate-lazy px-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-display font-semibold text-[var(--color-text)] flex items-center gap-2">
              <Sprout size={24} />
              Mes Cultures
            </h2>
            <button
              onClick={() => setShowAddCulture(true)}
              className="bg-[#129619] rounded-md text-white flex items-center gap-2 px-6 py-3 whitespace-nowrap shadow-md hover:shadow-lg transition-shadow"
              disabled={creating}
            >
              <Plus size={18} />
              Nouvelle Culture
            </button>
          </div>

          {loading && <div className="text-center py-4">Chargement...</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cultures.map((culture, index) => (
              <div
                key={culture.id}
                className={`card bg-white/70 backdrop-blur-md p-5 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/50 cursor-pointer ${
                  selectedCulture === culture.id ? 'ring-2 ring-[var(--color-primary)]' : ''
                }`}
                onClick={() => setSelectedCulture(selectedCulture === culture.id ? null : culture.id)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-display font-semibold text-lg text-[var(--color-text)] mb-1">
                      {culture.name}
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)] font-body">
                      Surface: {culture.area} ha
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-body flex items-center gap-1 ${
                      culture.status === 'en_cours'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {culture.status === 'en_cours' ? (
                      <>
                        <CheckCircle size={12} />
                        En cours
                      </>
                    ) : (
                      <>
                        <Circle size={12} />
                        Terminé
                      </>
                    )}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] font-body">
                    <Calendar size={14} />
                    <span>
                      {new Date(culture.startDate).toLocaleDateString('fr-FR')} →{' '}
                      {new Date(culture.endDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-body">
                    <DollarSign size={14} className="text-red-600" />
                    <span className="font-semibold text-[var(--color-text)]">
                      {culture.totalExpenses?.toLocaleString() || 0} Ar
                    </span>
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] font-body">
                    Coût/ha:{' '}
                    {(culture.totalExpenses ? culture.totalExpenses / parseFloat(culture.area) : 0).toLocaleString()} Ar
                  </div>
                </div>

                <div className="flex gap-2">
                  {culture.status === 'en_cours' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTerminerCulture(culture.id);
                      }}
                      className="flex-1 py-2 px-3 bg-gray-100/80 hover:bg-gray-200/80 backdrop-blur-sm rounded-lg text-sm font-body transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1"
                      disabled={updating}
                    >
                      <CheckCircle size={14} />
                      Marquer comme terminé
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCulture(culture.id);
                    }}
                    className="p-2 hover:bg-red-50/80 hover:backdrop-blur-sm rounded-lg transition-all duration-200 hover:shadow-md"
                    disabled={updating}
                  >
                    <Trash2 size={18} className="text-[var(--color-error)]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section Dépenses */}
        <div className="animate-lazy px-4">
          <div className="card bg-white/70 backdrop-blur-md p-4 shadow-lg border border-white/50 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
              {/* Recherche */}
              <div className="relative flex-1 max-w-md">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)]"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Rechercher une dépense..."
                  className="input w-full pl-10 py-3"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtres et boutons */}
              <div className="flex flex-wrap gap-3">
                <select
                  className="input px-4 py-3 min-w-[150px]"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  {typesDepenses.map(type => (
                    <option key={type} value={type}>
                      {getTypeDisplayName(type)}
                    </option>
                  ))}
                </select>

                {selectedCulture && (
                  <button
                    onClick={() => setSelectedCulture(null)}
                    className="btn-secondary flex items-center gap-2 px-4 py-3"
                  >
                    <XCircle size={18} />
                    Tout afficher
                  </button>
                )}

                <button
                  onClick={() => setShowAddDepense(true)}
                  className="bg-[#129619] rounded-md text-white flex items-center gap-2 px-6 py-3 whitespace-nowrap shadow-md hover:shadow-lg transition-shadow"
                  disabled={creating}
                >
                  <Plus size={18} />
                  Ajouter Dépense
                </button>

                <button
                  onClick={() => setShowAddHarvest(true)}
                  className="bg-[#129619] rounded-md text-white flex items-center gap-2 px-6 py-3 whitespace-nowrap shadow-md hover:shadow-lg transition-shadow"
                  disabled={harvesting}
                >
                  <Plus size={18} />
                  Ajouter Récolte
                </button>

                <button
                  onClick={() => setShowAddSeed(true)}
                  className="bg-[#129619] rounded-md text-white flex items-center gap-2 px-6 py-3 whitespace-nowrap shadow-md hover:shadow-lg transition-shadow"
                  disabled={seeding}
                >
                  <Plus size={18} />
                  Ajouter Semis
                </button>
              </div>
            </div>
          </div>

          {/* Tableau des dépenses */}
          <div className="card bg-white/70 backdrop-blur-md overflow-hidden shadow-xl border border-white/50">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-input-border)]">
                    <th className="text-left p-4 font-display text-[var(--color-text)] font-semibold">Date</th>
                    <th className="text-left p-4 font-display text-[var(--color-text)] font-semibold">Culture</th>
                    <th className="text-left p-4 font-display text-[var(--color-text)] font-semibold hidden md:table-cell">
                      Type
                    </th>
                    <th className="text-left p-4 font-display text-[var(--color-text)] font-semibold">Description</th>
                    <th className="text-left p-4 font-display text-[var(--color-text)] font-semibold hidden lg:table-cell">
                      Quantité
                    </th>
                    <th className="text-right p-4 font-display text-[var(--color-text)] font-semibold">Montant</th>
                    <th className="text-right p-4 font-display text-[var(--color-text)] font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expensesLoading ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center">
                        Chargement des dépenses...
                      </td>
                    </tr>
                  ) : filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center">
                        <div className="text-center py-12">
                          <TrendingDown size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
                          <p className="text-[var(--color-text-muted)] font-body">Aucune dépense trouvée</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((expense, index) => {
                      const cultureName = cultures.find(c => c.id === expense.cultureId)?.name || '';
                      return (
                        <tr
                          key={`${expense.isHarvest ? 'harvest' : 'event'}-${expense.id}`}
                          className="border-b border-[var(--color-input-border)] hover:bg-white/50 hover:backdrop-blur-sm transition-all duration-200"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <td className="p-4 font-body text-[var(--color-text-muted)] text-sm">
                            {new Date(expense.date).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="p-4">
                            <div className="font-display font-medium text-[var(--color-text)]">{cultureName}</div>
                          </td>
                          <td className="p-4 hidden md:table-cell">
                            <span className="inline-block px-3 py-1 bg-white/60 backdrop-blur-sm text-[var(--color-text)] rounded-full text-sm font-body shadow-sm border border-white/40">
                              {getTypeDisplayName(expense.type)}
                            </span>
                          </td>
                          <td className="p-4 font-body text-[var(--color-text)]">{expense.description}</td>
                          <td className="p-4 hidden lg:table-cell font-body text-[var(--color-text-muted)] text-sm">
                            {expense.quantity ? `${expense.quantity} unités` : '-'}
                          </td>
                          <td className="p-4 text-right">
                            <span className="font-semibold text-red-600">
                              {expense.cost ? `${expense.cost.toLocaleString()} Ar` : '-'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => {
                                  notificationService.error('Suppression non implémentée');
                                }}
                                className="p-2 hover:bg-red-50/80 hover:backdrop-blur-sm rounded-lg transition-all duration-200 hover:shadow-md"
                              >
                                <Trash2 size={18} className="text-[var(--color-error)]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Ajouter Culture */}
        {showAddCulture && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card bg-white/90 backdrop-blur-xl max-w-md w-full p-6 animate-lazy shadow-2xl border border-white/60">
              <h2 className="card-title text-2xl mb-6 text-[var(--color-text)] flex items-center gap-2">
                <Sprout size={24} />
                Nouvelle Culture
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-[var(--color-text)]">Nom de la culture</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={newCulture.name}
                    onChange={(e) => setNewCulture({ ...newCulture, name: e.target.value })}
                    placeholder="Ex: Riz Pluvial"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-[var(--color-text)]">Surface (hectares)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input w-full"
                    value={newCulture.area}
                    onChange={(e) => setNewCulture({ ...newCulture, area: parseFloat(e.target.value) || 0 })}
                    placeholder="2.5"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-[var(--color-text)]">Note</label>
                  <textarea
                    className="input w-full"
                    value={newCulture.note}
                    onChange={(e) => setNewCulture({ ...newCulture, note: e.target.value })}
                    placeholder="Ex: Culture en zone humide"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-[var(--color-text)]">Date début</label>
                    <input
                      type="date"
                      className="input w-full"
                      value={newCulture.startDate}
                      onChange={(e) => setNewCulture({ ...newCulture, startDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-[var(--color-text)]">Date fin prévue</label>
                    <input
                      type="date"
                      className="input w-full"
                      value={newCulture.endDate}
                      onChange={(e) => setNewCulture({ ...newCulture, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddCulture(false)}
                  className="btn-secondary flex-1 py-3"
                  disabled={creating}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddCulture}
                  className="btn-primary flex-1 py-3"
                  disabled={creating}
                >
                  {creating ? 'Création...' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Ajouter Dépense */}
        {showAddDepense && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card bg-white/90 backdrop-blur-xl max-w-md w-full p-6 animate-lazy shadow-2xl border border-white/60">
              <h2 className="card-title text-2xl mb-6 text-[var(--color-text)] flex items-center gap-2">
                <Package size={24} />
                Nouvelle Dépense
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-[var(--color-text)]">Culture</label>
                  <select
                    className="input w-full"
                    value={newDepense.cultureId}
                    onChange={(e) => setNewDepense({ ...newDepense, cultureId: parseInt(e.target.value) || 0 })}
                  >
                    <option value="0">Sélectionner une culture</option>
                    {cultures.filter(c => c.status === 'en_cours').map(culture => (
                      <option key={culture.id} value={culture.id}>
                        {culture.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-[var(--color-text)]">Type de dépense</label>
                  <select
                    className="input w-full"
                    value={newDepense.type}
                    onChange={(e) => setNewDepense({ ...newDepense, type: e.target.value })}
                  >
                    {typesDepenses
                      .filter(t => t !== 'Tous' && t !== 'harvest')
                      .map(type => (
                        <option key={type} value={type}>
                          {getTypeDisplayName(type)}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-[var(--color-text)]">Description</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={newDepense.description}
                    onChange={(e) => setNewDepense({ ...newDepense, description: e.target.value })}
                    placeholder="Ex: Application de compost organique"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-[var(--color-text)]">Montant (Ar)</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={newDepense.cost}
                    onChange={(e) => setNewDepense({ ...newDepense, cost: parseFloat(e.target.value) || 0 })}
                    placeholder="120000"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-[var(--color-text)]">Date</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={newDepense.date}
                    onChange={(e) => setNewDepense({ ...newDepense, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddDepense(false)}
                  className="btn-secondary flex-1 py-3"
                  disabled={creating}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddDepense}
                  className="btn-primary flex-1 py-3"
                  disabled={creating}
                >
                  {creating ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Ajouter Récolte */}
        {showAddHarvest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card bg-white/90 backdrop-blur-xl max-w-md w-full p-6 animate-lazy shadow-2xl border border-white/60">
              <h2 className="card-title text-2xl mb-6 text-[var(--color-text)] flex items-center gap-2">
                <Sprout size={24} />
                Nouvelle Récolte
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-[var(--color-text)]">Culture</label>
                  <select
                    className="input w-full"
                    value={newHarvest.cultureId}
                    onChange={(e) => setNewHarvest({ ...newHarvest, cultureId: parseInt(e.target.value) || 0 })}
                  >
                    <option value="0">Sélectionner une culture</option>
                    {cultures.filter(c => c.status === 'en_cours').map(culture => (
                      <option key={culture.id} value={culture.id}>
                        {culture.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-[var(--color-text)]">Produit</label>
                  <select
                    className="input w-full"
                    value={newHarvest.productId}
                    onChange={(e) => setNewHarvest({ ...newHarvest, productId: parseInt(e.target.value) || 0 })}
                  >
                    <option value="0">Sélectionner un produit</option>
                    {batches.map(batch => (
                      <option key={batch.id} value={batch.productId}>
                        {batch.product?.name || `Lot ${batch.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-[var(--color-text)]">Quantité</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input w-full"
                    value={newHarvest.quantity}
                    onChange={(e) => setNewHarvest({ ...newHarvest, quantity: parseFloat(e.target.value) || 0 })}
                    placeholder="320.75"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-[var(--color-text)]">Note</label>
                  <textarea
                    className="input w-full"
                    value={newHarvest.note}
                    onChange={(e) => setNewHarvest({ ...newHarvest, note: e.target.value })}
                    placeholder="Ex: Récolte après pluie légère"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-[var(--color-text)]">Date</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={newHarvest.date}
                    onChange={(e) => setNewHarvest({ ...newHarvest, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddHarvest(false)}
                  className="btn-secondary flex-1 py-3"
                  disabled={harvesting}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddHarvest}
                  className="btn-primary flex-1 py-3"
                  disabled={harvesting}
                >
                  {harvesting ? 'Enregistrement...' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Ajouter Semis */}
        {showAddSeed && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card bg-white/90 backdrop-blur-xl max-w-md w-full p-6 animate-lazy shadow-2xl border border-white/60">
              <h2 className="card-title text-2xl mb-6 text-[var(--color-text)] flex items-center gap-2">
                <Sprout size={24} />
                Nouveau Semis
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-[var(--color-text)]">Culture</label>
                  <select
                    className="input w-full"
                    value={newSeed.cultureId}
                    onChange={(e) => setNewSeed({ ...newSeed, cultureId: parseInt(e.target.value) || 0 })}
                  >
                    <option value="0">Sélectionner une culture</option>
                    {cultures.filter(c => c.status === 'en_cours').map(culture => (
                      <option key={culture.id} value={culture.id}>
                        {culture.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-[var(--color-text)]">Lot</label>
                  <select
                    className="input w-full"
                    value={newSeed.batchId}
                    onChange={(e) => setNewSeed({ ...newSeed, batchId: parseInt(e.target.value) || 0 })}
                  >
                    <option value="0">Sélectionner un lot</option>
                    {batches.map(batch => (
                      <option key={batch.id} value={batch.id}>
                        {batch.product?.name || `Lot ${batch.id}`} ({batch.remaining} unités restantes)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-[var(--color-text)]">Quantité</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input w-full"
                    value={newSeed.quantity}
                    onChange={(e) => setNewSeed({ ...newSeed, quantity: parseFloat(e.target.value) || 0 })}
                    placeholder="25.5"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-[var(--color-text)]">Date</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={newSeed.date}
                    onChange={(e) => setNewSeed({ ...newSeed, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddSeed(false)}
                  className="btn-secondary flex-1 py-3"
                  disabled={seeding}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddSeed}
                  className="btn-primary flex-1 py-3"
                  disabled={seeding}
                >
                  {seeding ? 'Traitement...' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CulturePage;
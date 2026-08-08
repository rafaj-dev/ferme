/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Search, 
  Loader,
  Heart,
  Utensils,
  Stethoscope,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  ArrowUp,
  DollarSign
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '../../components/Sidebar';
import { useAnimals } from '../../hooks/useAnimals';

// Définir le type des événements d'animal
type AnimalEventType = 'feed' | 'vaccination' | 'health' | 'other' | 'sale';

const AnimauxPage: React.FC = () => {
  const {
    animals,
    batches,
    loading,
    creating,
    updating,
    feeding,
    createAnimal,
    updateAnimal,
    feedAnimals,
    createAnimalEvent,
    refreshAnimals, // AJOUT: Import de la fonction de rafraîchissement
  } = useAnimals();

  const [showAddAnimal, setShowAddAnimal] = useState(false);
  const [showFeedAnimals, setShowFeedAnimals] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showEditAnimal, setShowEditAnimal] = useState(false);
  const [showSellAnimal, setShowSellAnimal] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<number[]>([]);
  const [expandedCards, setExpandedCards] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'sold' | 'deceased'>('active');
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
  // État pour forcer le re-rendu après une vente
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [newAnimal, setNewAnimal] = useState({
    tag: '',
    species: '',
    birthDate: new Date().toISOString().split('T')[0],
    buyPrice: 0,
    status: 'active' as 'active' | 'sold' | 'deceased'
  });

  const [editAnimal, setEditAnimal] = useState({
    id: 0,
    tag: '',
    species: '',
    birthDate: '',
    buyPrice: 0,
    status: 'active' as 'active' | 'sold' | 'deceased'
  });

  const [sellAnimal, setSellAnimal] = useState({
    id: 0,
    tag: '',
    species: '',
    sellPrice: 0,
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const [feedData, setFeedData] = useState({
    batchId: 0,
    quantity: 0,
    animals: [] as number[],
    date: new Date().toISOString().split('T')[0]
  });

  const [newEvent, setNewEvent] = useState({
    animalId: 0,
    type: 'vaccination' as AnimalEventType,
    date: new Date().toISOString().split('T')[0],
    note: '',
    cost: 0
  });

  // Gestion du scroll pour le bouton retour en haut
  useEffect(() => {
    const handleScroll = () => {
      const contentElement = document.getElementById('main-content');
      if (contentElement) {
        const scrollTop = contentElement.scrollTop;
        const isMobile = window.innerWidth < 768;
        setShowScrollToTop(isMobile && scrollTop > 500);
      }
    };

    const contentElement = document.getElementById('main-content');
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll, { passive: true });
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Fonction pour retourner en haut du contenu principal
  const scrollToTop = () => {
    const contentElement = document.getElementById('main-content');
    if (contentElement) {
      contentElement.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Filtrer les animaux par recherche et statut
  const filteredAnimals = animals.filter(animal =>
    (animal.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
     animal.species.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === 'all' || animal.status === statusFilter)
  );

  // Trier : animaux actifs en premier
  const sortedAnimals = [...filteredAnimals].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return 0;
  });

  // Lots disponibles pour l'alimentation (catégorie FEED)
  const feedBatches = batches.filter(batch => 
    batch.product?.category === 'FEED' && parseFloat(batch.remaining) > 0
  );

  const handleAddAnimal = async () => {
    if (!newAnimal.tag.trim() || !newAnimal.species.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await createAnimal({
        tag: newAnimal.tag,
        species: newAnimal.species,
        birthDate: newAnimal.birthDate,
        buyPrice: newAnimal.buyPrice,
        status: newAnimal.status
      });
      
      setNewAnimal({
        tag: '',
        species: '',
        birthDate: new Date().toISOString().split('T')[0],
        buyPrice: 0,
        status: 'active'
      });
      setShowAddAnimal(false);
      toast.success('Animal créé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la création de l\'animal');
    }
  };

  const handleEditAnimal = async () => {
    if (!editAnimal.tag.trim() || !editAnimal.species.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await updateAnimal(editAnimal.id, {
        tag: editAnimal.tag,
        species: editAnimal.species,
        birthDate: editAnimal.birthDate,
        buyPrice: editAnimal.buyPrice,
        status: editAnimal.status
      });
      setShowEditAnimal(false);
      toast.success('Animal modifié avec succès');
    } catch (error) {
      toast.error('Erreur lors de la modification de l\'animal');
    }
  };

  // FONCTION CORRIGÉE: Vendre un animal avec rafraîchissement
  const handleSellAnimal = async () => {
    if (sellAnimal.sellPrice <= 0) {
      toast.error('Veuillez saisir un prix de vente valide');
      return;
    }

    try {
      // 1. Créer l'événement de vente
      await createAnimalEvent({
        animalId: sellAnimal.id,
        type: 'sale',
        date: new Date(sellAnimal.date).toISOString(),
        note: sellAnimal.note || `Vente de l'animal ${sellAnimal.tag}`,
        cost: -sellAnimal.sellPrice // Coût négatif pour indiquer un revenu
      });

      // 2. FORCER LE RAFRAÎCHISSEMENT DES DONNÉES
      // Attendre un peu pour que la base de données se mette à jour
      setTimeout(async () => {
        try {
          await refreshAnimals(); // Rafraîchir les données depuis l'API
          setRefreshKey(prev => prev + 1); // Forcer le re-rendu du composant
        } catch (error) {
          console.error('Erreur lors du rafraîchissement:', error);
        }
      }, 500);

      setShowSellAnimal(false);
      setSellAnimal({
        id: 0,
        tag: '',
        species: '',
        sellPrice: 0,
        date: new Date().toISOString().split('T')[0],
        note: ''
      });
      toast.success('Animal vendu avec succès');
    } catch (error) {
      console.error('Erreur vente animal:', error);
      toast.error('Erreur lors de la vente de l\'animal');
    }
  };

  const handleFeedAnimals = async () => {
    if (feedData.animals.length === 0) {
      toast.error('Veuillez sélectionner au moins un animal');
      return;
    }
    if (!feedData.batchId) {
      toast.error('Veuillez sélectionner un lot d\'alimentation');
      return;
    }
    if (feedData.quantity <= 0) {
      toast.error('Veuillez saisir une quantité valide');
      return;
    }

    try {
      await feedAnimals({
        batchId: feedData.batchId,
        quantity: feedData.quantity,
        animals: feedData.animals,
        date: new Date(feedData.date).toISOString()
      });
      setFeedData({
        batchId: 0,
        quantity: 0,
        animals: [],
        date: new Date().toISOString().split('T')[0]
      });
      setShowFeedAnimals(false);
      toast.success('Animaux nourris avec succès');
    } catch (error) {
      toast.error('Erreur lors du nourrissage des animaux');
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.animalId) {
      toast.error('Veuillez sélectionner un animal');
      return;
    }
    if (!newEvent.note.trim()) {
      toast.error('Veuillez saisir une description');
      return;
    }
    if (newEvent.cost < 0 && newEvent.type !== 'sale') {
      toast.error('Le coût ne peut pas être négatif');
      return;
    }

    try {
      await createAnimalEvent({
        animalId: newEvent.animalId,
        type: newEvent.type,
        date: new Date(newEvent.date).toISOString(),
        note: newEvent.note,
        cost: newEvent.cost
      });
      setNewEvent({
        animalId: 0,
        type: 'vaccination',
        date: new Date().toISOString().split('T')[0],
        note: '',
        cost: 0
      });
      setShowAddEvent(false);
      toast.success('Événement créé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la création de l\'événement');
    }
  };

  const toggleAnimalSelection = (animalId: number) => {
    setFeedData(prev => ({
      ...prev,
      animals: prev.animals.includes(animalId)
        ? prev.animals.filter(id => id !== animalId)
        : [...prev.animals, animalId]
    }));
  };

  const toggleEventExpansion = (animalId: number) => {
    setExpandedEvents(prev =>
      prev.includes(animalId)
        ? prev.filter(id => id !== animalId)
        : [...prev, animalId]
    );
  };

  const toggleCardExpansion = (animalId: number) => {
    setExpandedCards(prev =>
      prev.includes(animalId)
        ? prev.filter(id => id !== animalId)
        : [...prev, animalId]
    );
  };

  const openEditModal = (animal: any) => {
    setEditAnimal({
      id: animal.id,
      tag: animal.tag,
      species: animal.species,
      birthDate: animal.birthDate.split('T')[0],
      buyPrice: parseFloat(animal.buyPrice),
      status: animal.status
    });
    setShowEditAnimal(true);
  };

  // FONCTION: Ouvrir le modal de vente
  const openSellModal = (animal: any) => {
    setSellAnimal({
      id: animal.id,
      tag: animal.tag,
      species: animal.species,
      sellPrice: 0,
      date: new Date().toISOString().split('T')[0],
      note: ''
    });
    setShowSellAnimal(true);
  };

  const getEventTypeIcon = (type: AnimalEventType) => {
    switch (type) {
      case 'feed': return <Utensils size={16} />;
      case 'vaccination': return <Stethoscope size={16} />;
      case 'health': return <Heart size={16} />;
      case 'sale': return <DollarSign size={16} />;
      default: return <MoreHorizontal size={16} />;
    }
  };

  const getEventTypeLabel = (type: AnimalEventType) => {
    const labels: Record<AnimalEventType, string> = {
      'feed': 'Nourrissage',
      'vaccination': 'Vaccination',
      'health': 'Soin santé',
      'sale': 'Vente',
      'other': 'Autre'
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'active': 'Actif',
      'sold': 'Vendu',
      'deceased': 'Décédé'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-700',
      'sold': 'bg-blue-100 text-blue-700',
      'deceased': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  // Vérifier si l'animal peut être modifié ou vendu (seulement les actifs)
  const canEditAnimal = (animal: any) => {
    return animal.status === 'active';
  };

  // Calculer le bénéfice/pertes pour un animal vendu
  const calculateProfit = (animal: any) => {
    const buyPrice = parseFloat(animal.buyPrice);
    const saleEvent = animal.events?.find((event: any) => event.type === 'sale');
    
    if (saleEvent) {
      const sellPrice = Math.abs(parseFloat(saleEvent.cost)); // Coût négatif dans l'événement
      const profit = sellPrice - buyPrice;
      return profit;
    }
    return 0;
  };

  if (loading && animals.length === 0) {
    return (
      <div className="flex min-h-screen bg-[var(--color-background)]">
        <Sidebar />
        <div className="flex-1 lg:ml-64 overflow-auto p-8 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader className="animate-spin text-[var(--color-primary)]" size={24} />
            <p className="text-[var(--color-text)]">Chargement des animaux...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-background)]" key={refreshKey}> {/* AJOUT: key pour forcer le re-rendu */}
      <Sidebar />
      
      {/* Container principal avec header et barre d'actions fixes */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Header fixe */}
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
                  Gestion des Animaux
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-emerald-50/90 max-w-xl leading-relaxed break-words">
                  Suivi intelligent et en temps réel pour une ferme plus efficace
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Barre d'actions fixe */}
        <div className="flex-shrink-0 bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-200 py-4">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Recherche et Filtres */}
              <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full max-w-2xl">
                {/* Recherche */}
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Rechercher par tag ou espèce..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filtre Statut */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <select
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white appearance-none"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                  >
                    <option value="active">Actifs</option>
                    <option value="all">Tous</option>
                    <option value="sold">Vendus</option>
                    <option value="deceased">Décédés</option>
                  </select>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto justify-start lg:justify-end">
                <button
                  onClick={() => setShowFeedAnimals(true)}
                  className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
                  disabled={feeding || animals.length === 0}
                >
                  {feeding ? (
                    <Loader className="animate-spin" size={18} />
                  ) : (
                    <Utensils size={18} />
                  )}
                  <span className="hidden sm:inline">Nourrir</span>
                </button>

                <button
                  onClick={() => setShowAddAnimal(true)}
                  className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
                  disabled={creating}
                >
                  {creating ? (
                    <Loader className="animate-spin" size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                  <span>Nouvel Animal</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal scrollable */}
        <div 
          id="main-content"
          className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8"
        >
          {/* Cartes des animaux */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {sortedAnimals.map((animal) => {
              const isExpanded = expandedCards.includes(animal.id);
              const isEventsExpanded = expandedEvents.includes(animal.id);
              const events = animal.events || [];
              const displayedEvents = isEventsExpanded ? events : events.slice(0, 2);
              const hasMoreEvents = events.length > 2;
              const isEditable = canEditAnimal(animal);
              const profit = calculateProfit(animal);
              const hasBeenSold = animal.status === 'sold';

              // Version mobile compacte
              if (window.innerWidth < 640 && !isExpanded) {
                return (
                  <div 
                    key={animal.id} 
                    className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
                    onClick={() => toggleCardExpansion(animal.id)}
                  >
                    {/* En-tête compacte pour mobile */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 truncate">{animal.tag}</h3>
                          <p className="text-gray-600 text-sm truncate">{animal.species}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(animal.status)} whitespace-nowrap ml-2`}>
                          {getStatusLabel(animal.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500">Naissance</p>
                          <p className="font-medium">{new Date(animal.birthDate).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Dépenses</p>
                          <p className="font-medium text-red-600">{(animal.totalExpenses || 0).toLocaleString()} Ar</p>
                        </div>
                      </div>

                      {/* Affichage du bénéfice si vendu */}
                      {hasBeenSold && (
                        <div className="mt-2">
                          <p className={`text-xs font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {profit >= 0 ? '✓ Bénéfice: ' : '✗ Perte: '}
                            {Math.abs(profit).toLocaleString()} Ar
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {events.length} événement{events.length > 1 ? 's' : ''}
                        </span>
                        <ChevronDown size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                );
              }

              // Version desktop ou mobile étendue
              return (
                <div key={animal.id} className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                  {/* En-tête de la carte */}
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{animal.tag}</h3>
                        <p className="text-gray-600 text-sm truncate">{animal.species}</p>
                      </div>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${getStatusColor(animal.status)} whitespace-nowrap ml-2`}>
                        {getStatusLabel(animal.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-gray-500">Naissance</p>
                        <p className="font-medium truncate">{new Date(animal.birthDate).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Prix d'achat</p>
                        <p className="font-medium truncate">{parseFloat(animal.buyPrice).toLocaleString()} Ar</p>
                      </div>
                    </div>

                    {/* Affichage du bénéfice si vendu */}
                    {hasBeenSold && (
                      <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-600">Résultat:</span>
                          <span className={`text-sm font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {profit >= 0 ? '✓ Bénéfice: ' : '✗ Perte: '}
                            {Math.abs(profit).toLocaleString()} Ar
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dépenses totales */}
                  <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-xs sm:text-sm">Dépenses totales:</span>
                      <span className="font-bold text-red-600 text-sm sm:text-base">
                        {(animal.totalExpenses || 0).toLocaleString()} Ar
                      </span>
                    </div>
                  </div>

                  {/* Événements */}
                  <div className="p-3 sm:p-4">
                    <div className="flex justify-between items-center mb-2 sm:mb-3">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                        Événements ({events.length})
                      </h4>
                      {hasMoreEvents && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEventExpansion(animal.id);
                          }}
                          className="flex items-center gap-1 text-xs sm:text-sm text-[var(--color-primary)] hover:underline"
                        >
                          {isEventsExpanded ? (
                            <>
                              <ChevronUp size={14} />
                              <span className="hidden sm:inline">Réduire</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown size={14} />
                              <span className="hidden sm:inline">Voir plus</span>
                              <span className="sm:hidden">Plus</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 max-h-32 sm:max-h-48 overflow-y-auto">
                      {displayedEvents.map((event: any) => (
                        <div key={event.id} className="flex items-center gap-2 sm:gap-3 p-2 bg-gray-50 rounded-lg">
                          <div className={`flex-shrink-0 ${
                            event.type === 'sale' ? 'text-green-600' : 'text-[var(--color-primary)]'
                          }`}>
                            {getEventTypeIcon(event.type as AnimalEventType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium truncate">
                              {getEventTypeLabel(event.type as AnimalEventType)}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {event.note}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(event.date).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <span className={`text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                            event.type === 'sale' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {event.type === 'sale' ? '+' : ''}{parseFloat(event.cost).toLocaleString()} Ar
                          </span>
                        </div>
                      ))}
                      
                      {events.length === 0 && (
                        <p className="text-xs sm:text-sm text-gray-500 text-center py-2">
                          Aucun événement
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                      {isEditable ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewEvent({
                                animalId: animal.id,
                                type: 'vaccination',
                                date: new Date().toISOString().split('T')[0],
                                note: '',
                                cost: 0
                              });
                              setShowAddEvent(true);
                            }}
                            className="flex-1 py-2 rounded-lg text-xs sm:text-sm bg-[var(--color-primary)] text-white hover:bg-green-600 transition-colors"
                          >
                            Événement
                          </button>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openSellModal(animal);
                            }}
                            className="flex-1 py-2 rounded-lg text-xs sm:text-sm bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <DollarSign size={12} />
                            Vendre
                          </button>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(animal);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 text-[var(--color-primary)]"
                            title="Modifier l'animal"
                          >
                            <Edit2 size={14} />
                          </button>
                        </>
                      ) : (
                        <div className="flex-1 text-center">
                          <span className="text-xs text-gray-500">
                            {animal.status === 'sold' ? 'Animal vendu' : 'Animal décédé'}
                          </span>
                        </div>
                      )}
                      
                      {/* Bouton pour réduire sur mobile */}
                      {window.innerWidth < 640 && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCardExpansion(animal.id);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                        >
                          <X size={14} className="text-gray-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!loading && sortedAnimals.length === 0 && (
            <div className="text-center py-12">
              <Heart size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">Aucun animal trouvé</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Essayez de modifier votre recherche ou vos filtres'
                  : 'Commencez par ajouter votre premier animal'
                }
              </p>
            </div>
          )}
        </div>

        {/* Bouton Retour en Haut - Mobile seulement */}
        {showScrollToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 bg-[var(--color-primary)] text-white p-4 rounded-full shadow-lg hover:bg-[var(--color-primary-dark)] transition-all duration-300 transform hover:scale-110 md:hidden"
            aria-label="Retour en haut de la page"
          >
            <ArrowUp size={24} />
          </button>
        )}
      </div>

      {/* Modal Nouvel Animal */}
      {showAddAnimal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <h2 className="text-2xl mb-6 text-gray-900 font-bold">Nouvel Animal</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-gray-700">Tag *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={newAnimal.tag}
                    onChange={(e) => setNewAnimal({...newAnimal, tag: e.target.value.toUpperCase()})}
                    placeholder="Ex: BOV-001"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-gray-700">Espèce *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={newAnimal.species}
                    onChange={(e) => setNewAnimal({...newAnimal, species: e.target.value})}
                    placeholder="Ex: Vache, Poulet, Chèvre..."
                  />
                </div>

                <div>
                  <label className="block mb-2 text-gray-700">Date de naissance</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={newAnimal.birthDate}
                    onChange={(e) => setNewAnimal({...newAnimal, birthDate: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-gray-700">Prix d'achat (Ar)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={newAnimal.buyPrice}
                    onChange={(e) => setNewAnimal({...newAnimal, buyPrice: parseFloat(e.target.value)})}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-gray-700">Statut</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={newAnimal.status}
                    onChange={(e) => setNewAnimal({...newAnimal, status: e.target.value as any})}
                  >
                    <option value="active">Actif</option>
                    <option value="sold">Vendu</option>
                    <option value="deceased">Décédé</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddAnimal(false)}
                  className="flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddAnimal}
                  className="flex-1 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
                  disabled={creating}
                >
                  {creating ? <Loader className="animate-spin mx-auto" size={18} /> : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Vendre Animal */}
      {showSellAnimal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <h2 className="text-2xl mb-6 text-gray-900 font-bold">Vendre l'Animal</h2>
              
              <div className="space-y-4">

                <div>
                  <label className="block mb-2 text-gray-700">Prix de vente (Ar) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={sellAnimal.sellPrice}
                    onChange={(e) => setSellAnimal({...sellAnimal, sellPrice: parseFloat(e.target.value)})}
                    placeholder="Prix de vente"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-gray-700">Date de vente *</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={sellAnimal.date}
                    onChange={(e) => setSellAnimal({...sellAnimal, date: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-gray-700">Notes (optionnel)</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={sellAnimal.note}
                    onChange={(e) => setSellAnimal({...sellAnimal, note: e.target.value})}
                    placeholder="Notes sur la vente..."
                    rows={3}
                  />
                </div>

                {/* Résumé de la vente */}
                {sellAnimal.sellPrice > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 font-medium">Revenu de vente:</span>
                      <span className="text-green-700 font-bold text-lg">
                        +{sellAnimal.sellPrice.toLocaleString()} Ar
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSellAnimal(false)}
                  className="flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSellAnimal}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={updating || sellAnimal.sellPrice <= 0}
                >
                  {updating ? (
                    <Loader className="animate-spin" size={18} />
                  ) : (
                    <>
                      <DollarSign size={18} />
                      Vendre
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nourrir Animaux */}
      {showFeedAnimals && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <h2 className="text-2xl mb-6 text-gray-900 font-bold">Nourrir les Animaux</h2>
              
              <div className="space-y-6">
                {/* Sélection du lot */}
                <div>
                  <label className="block mb-2 text-gray-700">Lot d'alimentation *</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={feedData.batchId}
                    onChange={(e) => setFeedData({...feedData, batchId: parseInt(e.target.value)})}
                  >
                    <option value={0}>Sélectionner un lot</option>
                    {feedBatches.map(batch => (
                      <option key={batch.id} value={batch.id}>
                        {batch.product?.name} - Restant: {batch.remaining} {batch.product?.unit?.code}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantité */}
                <div>
                  <label className="block mb-2 text-gray-700">Quantité totale *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={feedData.quantity}
                    onChange={(e) => setFeedData({...feedData, quantity: parseFloat(e.target.value)})}
                    placeholder="Quantité totale à distribuer"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block mb-2 text-gray-700">Date *</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={feedData.date}
                    onChange={(e) => setFeedData({...feedData, date: e.target.value})}
                  />
                </div>

                {/* Sélection des animaux */}
                <div>
                  <label className="block mb-2 text-gray-700">Animaux à nourrir *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-300 rounded-lg">
                    {animals.filter(a => a.status === 'active').map(animal => (
                      <label key={animal.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={feedData.animals.includes(animal.id)}
                          onChange={() => toggleAnimalSelection(animal.id)}
                          className="w-4 h-4"
                        />
                        <span className="font-medium">{animal.tag}</span>
                        <span className="text-gray-600 text-sm">{animal.species}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Résumé */}
                {feedData.animals.length > 0 && feedData.quantity > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Quantité par animal: <strong>{(feedData.quantity / feedData.animals.length).toFixed(2)}</strong>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowFeedAnimals(false)}
                  className="flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleFeedAnimals}
                  className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  disabled={feeding}
                >
                  {feeding ? <Loader className="animate-spin mx-auto" size={18} /> : 'Nourrir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajouter Événement */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <h2 className="text-2xl mb-6 text-gray-900 font-bold">Nouvel Événement</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-gray-700">Animal *</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={newEvent.animalId}
                    onChange={(e) => setNewEvent({...newEvent, animalId: parseInt(e.target.value)})}
                  >
                    <option value={0}>Sélectionner un animal</option>
                    {animals.filter(a => a.status === 'active').map(animal => (
                      <option key={animal.id} value={animal.id}>
                        {animal.tag} ({animal.species})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-gray-700">Type d'événement *</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({...newEvent, type: e.target.value as AnimalEventType})}
                  >
                    <option value="vaccination">Vaccination</option>
                    <option value="health">Soin santé</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-gray-700">Date *</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-gray-700">Description *</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={newEvent.note}
                    onChange={(e) => setNewEvent({...newEvent, note: e.target.value})}
                    placeholder="Description de l'événement..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-gray-700">Coût (Ar)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={newEvent.cost}
                    onChange={(e) => setNewEvent({...newEvent, cost: parseFloat(e.target.value)})}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddEvent(false)}
                  className="flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddEvent}
                  className="flex-1 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                  Créer Événement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Modifier Animal */}
      {showEditAnimal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <h2 className="text-2xl mb-6 text-gray-900 font-bold">Modifier l'Animal</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-gray-700">Tag *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={editAnimal.tag}
                    onChange={(e) => setEditAnimal({...editAnimal, tag: e.target.value.toUpperCase()})}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-gray-700">Espèce *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={editAnimal.species}
                    onChange={(e) => setEditAnimal({...editAnimal, species: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-gray-700">Date de naissance</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={editAnimal.birthDate}
                    onChange={(e) => setEditAnimal({...editAnimal, birthDate: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-gray-700">Prix d'achat (Ar)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={editAnimal.buyPrice}
                    onChange={(e) => setEditAnimal({...editAnimal, buyPrice: parseFloat(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-gray-700">Statut</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={editAnimal.status}
                    onChange={(e) => setEditAnimal({...editAnimal, status: e.target.value as any})}
                  >
                    <option value="active">Actif</option>
                    <option value="sold">Vendu</option>
                    <option value="deceased">Décédé</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditAnimal(false)}
                  className="flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleEditAnimal}
                  className="flex-1 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
                  disabled={updating}
                >
                  {updating ? <Loader className="animate-spin mx-auto" size={18} /> : 'Modifier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimauxPage;
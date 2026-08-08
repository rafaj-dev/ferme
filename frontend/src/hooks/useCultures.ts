import { useState, useEffect, useCallback } from 'react';
import {
  cultureService,
  type Culture,
  type CreateCultureDto,
  type CreateCultureEventDto,
  type CreateHarvestDto,
  type SeedCultureDto,
  type CultureEvent,
  type Harvest,
  type Batch,
} from '../services/cultureService';
import { notificationService } from '../services/notificationService';

interface UseCulturesReturn {
  cultures: Culture[];
  batches: Batch[];
  loading: boolean;
  error: string;
  creating: boolean;
  updating: boolean;
  harvesting: boolean;
  seeding: boolean;
  createCulture: (data: CreateCultureDto) => Promise<void>;
  updateCulture: (id: number, data: Partial<CreateCultureDto>) => Promise<void>;
  deleteCulture: (id: number) => Promise<void>;
  createHarvest: (data: CreateHarvestDto) => Promise<void>;
  createCultureEvent: (data: CreateCultureEventDto) => Promise<void>;
  seedCulture: (data: SeedCultureDto) => Promise<void>;
  getCultureEvents: (cultureId: number) => Promise<CultureEvent[]>;
  getHarvests: (cultureId: number) => Promise<Harvest[]>;
  refreshCultures: () => Promise<void>;
  refreshBatches: () => Promise<void>;
}

export const useCultures = (): UseCulturesReturn => {
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [harvesting, setHarvesting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Charger les cultures
  const loadCultures = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      ;
      const data = await cultureService.getAll();
      ;
      setCultures(data || []);

    } catch (err) {
      console.error('❌ Erreur chargement cultures:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des cultures';
      setError(errorMessage);
      setCultures([]);
      notificationService.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les lots
  const loadBatches = useCallback(async () => {
    try {
      ;
      const data = await cultureService.getBatches();
      ;
      setBatches(data || []);

    } catch (err) {
      console.error('❌ Erreur chargement lots:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des lots';
      setError(errorMessage);
      setBatches([]);
    }
  }, []);

  // Rafraîchir les cultures
  const refreshCultures = async () => {
    await loadCultures();
  };

  // Rafraîchir les lots
  const refreshBatches = async () => {
    await loadBatches();
  };

  // Créer une culture
  const createCulture = async (data: CreateCultureDto): Promise<void> => {
    try {
      setCreating(true);
      setError('');

      ;
      const newCulture = await cultureService.create(data);
      ;

      setCultures(prev => [...prev, newCulture]);
      notificationService.success('Culture créée avec succès');

    } catch (err) {
      console.error('❌ Erreur création culture:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la culture';
      setError(errorMessage);
      notificationService.error(errorMessage);
      throw err;
    } finally {
      setCreating(false);
    }
  };

 // Mettre à jour une culture
// Mettre à jour une culture
const updateCulture = async (id: number, data: Partial<CreateCultureDto>): Promise<void> => {
  try {
    setUpdating(true);
    setError('');

    ;
    
    // CORRECTION: Ne pas convertir area ici, laisser le service gérer le format
    const updatedCulture = await cultureService.update(id, data);
    ;

    setCultures(prev =>
      prev.map(culture => (culture.id === id ? updatedCulture : culture))
    );
    notificationService.success('Culture mise à jour avec succès');

  } catch (err) {
    console.error('❌ Erreur mise à jour culture:', err);
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la culture';
    setError(errorMessage);
    notificationService.error(errorMessage);
    throw err;
  } finally {
    setUpdating(false);
  }
};

  // Supprimer une culture
  const deleteCulture = async (id: number): Promise<void> => {
    try {
      setUpdating(true);
      setError('');

      ;
      await cultureService.delete(id);

      setCultures(prev => prev.filter(culture => culture.id !== id));
      notificationService.success('Culture supprimée avec succès');

    } catch (err) {
      console.error('❌ Erreur suppression culture:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la culture';
      setError(errorMessage);
      notificationService.error(errorMessage);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  // Enregistrer une récolte
  const createHarvest = async (data: CreateHarvestDto): Promise<void> => {
    try {
      setHarvesting(true);
      setError('');

      ;
      await cultureService.createHarvest(data);

      // Recharger les cultures pour mettre à jour les récoltes
      await loadCultures();
      // Recharger les lots pour mettre à jour les stocks
      await loadBatches();

      notificationService.success('Récolte enregistrée avec succès');

    } catch (err) {
      console.error('❌ Erreur création récolte:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement de la récolte';
      setError(errorMessage);
      notificationService.error(errorMessage);
      throw err;
    } finally {
      setHarvesting(false);
    }
  };

  // Créer un événement pour une culture
  const createCultureEvent = async (data: CreateCultureEventDto): Promise<void> => {
    try {
      setError('');

      ;
      const newEvent = await cultureService.createEvent(data);
      ;

      // Mettre à jour la culture avec le nouvel événement
      setCultures(prev =>
        prev.map(culture =>
          culture.id === data.cultureId
            ? {
                ...culture,
                events: [...(culture.events || []), newEvent],
                totalExpenses: (culture.totalExpenses || 0) + parseFloat(newEvent.cost),
              }
            : culture
        )
      );

      notificationService.success('Événement créé avec succès');

    } catch (err) {
      console.error('❌ Erreur création événement culture:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de l\'événement';
      setError(errorMessage);
      notificationService.error(errorMessage);
      throw err;
    }
  };

  // Semer ou appliquer des intrants à une culture
  const seedCulture = async (data: SeedCultureDto): Promise<void> => {
    try {
      setSeeding(true);
      setError('');

      ;
      await cultureService.seed(data);

      // Recharger les cultures pour mettre à jour les événements
      await loadCultures();
      // Recharger les lots pour mettre à jour les stocks
      await loadBatches();

      notificationService.success('Semis/Application effectué avec succès');

    } catch (err) {
      console.error('❌ Erreur semis/application:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du semis/application';
      setError(errorMessage);
      notificationService.error(errorMessage);
      throw err;
    } finally {
      setSeeding(false);
    }
  };

  // Récupérer les événements d'une culture
  const getCultureEvents = async (cultureId: number): Promise<CultureEvent[]> => {
    try {
      return await cultureService.getEvents(cultureId);
    } catch (err) {
      console.error('❌ Erreur récupération événements culture:', err);
      return [];
    }
  };

  // Récupérer les récoltes d'une culture
  const getHarvests = async (cultureId: number): Promise<Harvest[]> => {
    try {
      return await cultureService.getHarvests(cultureId);
    } catch (err) {
      console.error('❌ Erreur récupération récoltes:', err);
      return [];
    }
  };

  // Charger au montage
  useEffect(() => {
    loadCultures();
    loadBatches();
  }, [loadCultures, loadBatches]);

  return {
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
  };
};
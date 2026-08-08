/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Loader,
  Package,
  Play,
  BarChart3,
  Workflow,
  Factory,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  Utensils,
  AlertTriangle,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '../../components/Sidebar';
import { useRecipes } from '../../hooks/useRecipes';
import type { 
  CreateRecipeDto, 
  CreateProductionDto,
  RecipeIngredient, 
  Recipe
} from '../../services/recipeService';

const RecipePage: React.FC = () => {
  const {
    recipes,
    productionBatches,
    products,
    units,
    loading,
    error,
    creatingRecipe,
    creatingProduction,
    deletingRecipe,
    createRecipe,
    createProductionBatch,
    deleteRecipe,
    getMaxProductionQuantity,
  } = useRecipes();

  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [showAddProduction, setShowAddProduction] = useState(false);
  const [showRecipeDetails, setShowRecipeDetails] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'recipes' | 'production'>('recipes');
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [deletingRecipeId, setDeletingRecipeId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<{show: boolean; recipe: Recipe | null}>({
    show: false,
    recipe: null
  });
 
  const [maxQuantityData, setMaxQuantityData] = useState<any>(null);
  const [calculatingMax, setCalculatingMax] = useState(false);

  // Formulaire nouvelle recette
  const [newRecipe, setNewRecipe] = useState<CreateRecipeDto>({
    name: '',
    description: '',
    outputProductId: 0,
    outputQuantity: 1,
    ingredients: [],
  });

  // Formulaire nouveau lot de production
  const [newProduction, setNewProduction] = useState<CreateProductionDto>({
    recipeId: 0,
    outputProductId: 0,
    outputQuantity: 1,
    date: new Date().toISOString().split('T')[0],
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

  // Filtrer les recettes par recherche
  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtrer les lots de production par recherche
  const filteredProductionBatches = productionBatches.filter(batch =>
    batch.recipe?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.outputProduct?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Produits finis pour le sélecteur
  const finishedProducts = products.filter(p => 
    p.category === 'FINISHED_GOOD'
  );

  // Ingrédients pour le sélecteur
  const ingredientProducts = products.filter(p => 
    p.category === 'INGREDIENT'
  );

  const handleAddRecipe = async () => {
    if (!newRecipe.name.trim() || !newRecipe.outputProductId || newRecipe.ingredients.length === 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await createRecipe(newRecipe);
      setNewRecipe({
        name: '',
        description: '',
        outputProductId: 0,
        outputQuantity: 1,
        ingredients: [],
      });
      setShowAddRecipe(false);
      toast.success('Recette créée avec succès');
    } catch (error) {
      console.error('Erreur lors de la création de la recette:', error);
    }
  };

  const handleAddProduction = async () => {
    if (!newProduction.recipeId || !newProduction.outputQuantity) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      // CORRECTION: S'assurer que outputQuantity est un nombre
      const productionData = {
        ...newProduction,
        outputQuantity: Number(newProduction.outputQuantity) // Convertir en nombre
      };

      await createProductionBatch(productionData);
      setNewProduction({
        recipeId: 0,
        outputProductId: 0,
        outputQuantity: 1,
        date: new Date().toISOString().split('T')[0],
      });
      setShowAddProduction(false);
      setMaxQuantityData(null); // Réinitialiser les données de capacité
      toast.success('Lot de production créé avec succès');
    } catch (error) {
      console.error('Erreur lors de la création du lot de production:', error);
    }
  };

  const handleDeleteRecipe = async (recipeId: number) => {
    try {
      setDeletingRecipeId(recipeId);
      await deleteRecipe(recipeId);
      setShowDeleteModal({ show: false, recipe: null });
      toast.success('Recette supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de la recette:', error);
      toast.error('Erreur lors de la suppression de la recette');
    } finally {
      setDeletingRecipeId(null);
    }
  };

  const openDeleteModal = (recipe: Recipe) => {
    setShowDeleteModal({ show: true, recipe });
  };

  const closeDeleteModal = () => {
    setShowDeleteModal({ show: false, recipe: null });
  };

  const handleAddIngredient = () => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          productId: 0,
          quantity: 0,
          unitId: 1, // Unité par défaut (KG)
        }
      ]
    }));
  };

  const handleRemoveIngredient = (index: number) => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleIngredientChange = (index: number, field: keyof RecipeIngredient, value: any) => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ingredient, i) =>
        i === index ? { ...ingredient, [field]: value } : ingredient
      )
    }));
  };

  const handleCalculateMaxQuantity = async (recipeId: number) => {
    try {
      setCalculatingMax(true);
      const data = await getMaxProductionQuantity(recipeId);
      setMaxQuantityData(data);
    } catch (error) {
      console.error('Erreur lors du calcul de la quantité maximale:', error);
      toast.error('Erreur lors du calcul de la quantité maximale');
    } finally {
      setCalculatingMax(false);
    }
  };

  const handleRecipeSelect = (recipeId: number) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
      setNewProduction(prev => ({
        ...prev,
        recipeId: recipe.id,
        outputProductId: recipe.outputProductId,
        outputQuantity: Number(recipe.outputQuantity) 
      }));
      handleCalculateMaxQuantity(recipeId);
    }
  };

  const getProductName = (productId: number) => {
    return products.find(p => p.id === productId)?.name || 'Produit inconnu';
  };

  const getUnitName = (unitId: number) => {
    return units.find(u => u.id === unitId)?.name || 'Unité inconnue';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading && recipes.length === 0) {
    return (
      <div className="flex min-h-screen bg-[var(--color-background)]">
        <Sidebar />
        <div className="flex-1 lg:ml-64 overflow-auto p-8 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader className="animate-spin text-[var(--color-primary)]" size={24} />
            <p className="text-[var(--color-text)]">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
      <Sidebar />
      
      {/* Container principal avec header et barre d'actions fixes */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Header fixe */}
        <div className="flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-green-400 via-green-600 to-green-800">
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
                  Gestion des Recettes & Production
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-blue-50/90 max-w-xl leading-relaxed break-words">
                  Créez des recettes et gérez votre production en temps réel
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
                    placeholder="Rechercher..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Onglets */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('recipes')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'recipes'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Workflow  size={16} className="inline mr-2" />
                    Recettes
                  </button>
                  <button
                    onClick={() => setActiveTab('production')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'production'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Factory  size={16} className="inline mr-2" />
                    Production
                  </button>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto justify-start lg:justify-end">
                {activeTab === 'recipes' ? (
                  <button
                    onClick={() => setShowAddRecipe(true)}
                    className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
                    disabled={creatingRecipe}
                  >
                    {creatingRecipe ? (
                      <Loader className="animate-spin" size={18} />
                    ) : (
                      <Plus size={18} />
                    )}
                    <span>Nouvelle Recette</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAddProduction(true)}
                    className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
                    disabled={creatingProduction}
                  >
                    {creatingProduction ? (
                      <Loader className="animate-spin" size={18} />
                    ) : (
                      <Play size={18} />
                    )}
                    <span>Nouvelle Production</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal scrollable */}
        <div 
          id="main-content"
          className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8"
        >
          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-100 text-red-700 p-4 mb-6 rounded-lg">
              {error}
            </div>
          )}

          {/* Section Recettes */}
          {activeTab === 'recipes' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredRecipes.map((recipe) => (
                  <div key={recipe.id} className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                    {/* En-tête de la carte */}
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                            {recipe.name}
                          </h3>
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                            {recipe.description}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowRecipeDetails(
                            showRecipeDetails === recipe.id ? null : recipe.id
                          )}
                          className="flex-shrink-0 ml-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {showRecipeDetails === recipe.id ? (
                            <ChevronUp size={16} className="text-gray-500" />
                          ) : (
                            <ChevronDown size={16} className="text-gray-500" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Produit: {getProductName(recipe.outputProductId)}</span>
                        <span className="font-semibold">
                          {recipe.outputQuantity} {getUnitName(recipe.outputProduct?.unitId || 1)}
                        </span>
                      </div>
                    </div>

                    {/* Ingrédients (affichés si dépliés) */}
                    {showRecipeDetails === recipe.id && (
                      <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-3">Ingrédients:</h4>
                        <div className="space-y-2">
                          {recipe.ingredients.map((ingredient, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span>{getProductName(ingredient.productId)}</span>
                              <span className="font-medium">
                                {ingredient.quantity} {getUnitName(ingredient.unitId)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setNewProduction({
                              recipeId: recipe.id,
                              outputProductId: recipe.outputProductId,
                              outputQuantity: recipe.outputQuantity,
                              date: new Date().toISOString().split('T')[0],
                            });
                            setShowAddProduction(true);
                          }}
                          className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg text-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
                        >
                          <Play size={14} />
                          Produire
                        </button>
                        <button
                          onClick={() => openDeleteModal(recipe)}
                          disabled={deletingRecipe && deletingRecipeId === recipe.id}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                          {deletingRecipe && deletingRecipeId === recipe.id ? (
                            <Loader className="animate-spin" size={14} />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredRecipes.length === 0 && (
                <div className="text-center py-12">
                  <Utensils size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg">Aucune recette trouvée</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {searchTerm 
                      ? 'Essayez de modifier votre recherche'
                      : 'Commencez par créer votre première recette'
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Section Production */}
          {activeTab === 'production' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left p-4 font-semibold text-gray-900">Date</th>
                        <th className="text-left p-4 font-semibold text-gray-900">Recette</th>
                        <th className="text-left p-4 font-semibold text-gray-900 hidden lg:table-cell">
                          Produit
                        </th>
                        <th className="text-left p-4 font-semibold text-gray-900">Quantité</th>
                        <th className="text-right p-4 font-semibold text-gray-900">Coût</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProductionBatches.map((batch) => (
                        <tr key={batch.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                          <td className="p-4 text-sm text-gray-600">
                            {formatDate(batch.date)}
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-gray-900">
                              {batch.recipe?.name || 'Recette inconnue'}
                            </div>
                          </td>
                          <td className="p-4 hidden lg:table-cell text-sm text-gray-600">
                            {batch.outputProduct?.name || 'Produit inconnu'}
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-gray-900">
                              {batch.outputQuantity} {getUnitName(batch.outputProduct?.unitId || 1)}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <span className="font-semibold text-green-600">
                              {batch.costTotal?.toLocaleString()} Ar
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredProductionBatches.length === 0 && (
                  <div className="text-center py-12">
                    <Package size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">Aucun lot de production trouvé</p>
                    <p className="text-gray-400 text-sm mt-2">
                      {searchTerm 
                        ? 'Essayez de modifier votre recherche'
                        : 'Commencez par créer votre premier lot de production'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Affichage des données de quantité maximale */}
          {maxQuantityData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <BarChart3 size={18} />
                Capacité de production - {maxQuantityData.recipeName}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">Quantité maximale:</p>
                  <p className="font-bold text-lg text-blue-900">
                    {maxQuantityData.maxProducible} {getUnitName(maxQuantityData.outputProduct?.unitId || 1)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Lots complets:</p>
                  <p className="font-bold text-lg text-blue-900">
                    {maxQuantityData.maxCompleteBatches}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Ingrédient limitant:</p>
                  <p className="font-bold text-red-600">
                    {maxQuantityData.limitingIngredient.productName}
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium text-blue-800 mb-2">Statut des ingrédients:</h4>
                <div className="space-y-2">
                  {maxQuantityData.ingredientsStatus.map((ingredient: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>{ingredient.productName}</span>
                      <span className={`font-medium ${
                        ingredient.maxBatches === 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {ingredient.available} / {ingredient.requiredPerBatch} 
                        ({ingredient.maxBatches} lots)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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

      {/* Modal Nouvelle Recette */}
      {showAddRecipe && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <h2 className="text-2xl mb-6 text-gray-900 font-bold">Nouvelle Recette</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-gray-700">Nom de la recette *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={newRecipe.name}
                    onChange={(e) => setNewRecipe({...newRecipe, name: e.target.value})}
                    placeholder="Ex: Provende poulet croissance"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-gray-700">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={newRecipe.description}
                    onChange={(e) => setNewRecipe({...newRecipe, description: e.target.value})}
                    placeholder="Ex: Mélange équilibré pour les poulets de 6 à 12 semaines"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-gray-700">Produit de sortie *</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      value={newRecipe.outputProductId}
                      onChange={(e) => setNewRecipe({...newRecipe, outputProductId: parseInt(e.target.value)})}
                    >
                      <option value={0}>Sélectionner un produit</option>
                      {finishedProducts.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-gray-700">Quantité de sortie *</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      value={newRecipe.outputQuantity}
                      onChange={(e) => setNewRecipe({...newRecipe, outputQuantity: parseFloat(e.target.value)})}
                      placeholder="1"
                    />
                  </div>
                </div>

                {/* Ingrédients */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-gray-700">Ingrédients *</label>
                    <button
                      type="button"
                      onClick={handleAddIngredient}
                      className="flex items-center gap-1 text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                    >
                      <Plus size={14} />
                      Ajouter
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newRecipe.ingredients.map((ingredient, index) => (
                      <div key={index} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                            value={ingredient.productId}
                            onChange={(e) => handleIngredientChange(index, 'productId', parseInt(e.target.value))}
                          >
                            <option value={0}>Sélectionner un ingrédient</option>
                            {ingredientProducts.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                            value={ingredient.quantity}
                            onChange={(e) => handleIngredientChange(index, 'quantity', parseFloat(e.target.value))}
                            placeholder="0.0"
                          />
                        </div>
                        <div className="w-20">
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                            value={ingredient.unitId}
                            onChange={(e) => handleIngredientChange(index, 'unitId', parseInt(e.target.value))}
                          >
                            {units.map(unit => (
                              <option key={unit.id} value={unit.id}>
                                {unit.code}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {newRecipe.ingredients.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Aucun ingrédient ajouté
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddRecipe(false)}
                  className="flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddRecipe}
                  className="flex-1 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
                  disabled={creatingRecipe}
                >
                  {creatingRecipe ? <Loader className="animate-spin mx-auto" size={18} /> : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouvelle Production */}
      {showAddProduction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <h2 className="text-2xl mb-6 text-gray-900 font-bold">Nouvelle Production</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-gray-700">Recette *</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={newProduction.recipeId}
                    onChange={(e) => handleRecipeSelect(parseInt(e.target.value))}
                  >
                    <option value={0}>Sélectionner une recette</option>
                    {recipes.map(recipe => (
                      <option key={recipe.id} value={recipe.id}>
                        {recipe.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-gray-700">Quantité à produire *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={newProduction.outputQuantity}
                    onChange={(e) => setNewProduction({...newProduction, outputQuantity: Number(e.target.value)})}
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-gray-700">Date *</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={newProduction.date}
                    onChange={(e) => setNewProduction({...newProduction, date: e.target.value})}
                  />
                </div>

                {/* Affichage des informations de capacité */}
                {maxQuantityData && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Capacité maximale: <strong>{maxQuantityData.maxProducible}</strong> {getUnitName(maxQuantityData.outputProduct?.unitId || 1)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Ingrédient limitant: {maxQuantityData.limitingIngredient.productName}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddProduction(false)}
                  className="flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddProduction}
                  className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  disabled={creatingProduction || calculatingMax}
                >
                  {creatingProduction ? (
                    <Loader className="animate-spin mx-auto" size={18} />
                  ) : calculatingMax ? (
                    <Loader className="animate-spin mx-auto" size={18} />
                  ) : (
                    'Produire'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteModal.show && showDeleteModal.recipe && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-2xl transform transition-all">
            {/* En-tête de la modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Supprimer la recette
                </h3>
              </div>
              <button
                onClick={closeDeleteModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={deletingRecipe}
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Contenu de la modal */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 mb-3">
                  Êtes-vous sûr de vouloir supprimer cette recette ? Cette action est irréversible.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
                    <div>
                      <p className="font-semibold text-red-800 text-sm">
                        Recette à supprimer :
                      </p>
                      <p className="text-red-700 text-sm mt-1">
                        <strong>{showDeleteModal.recipe.name}</strong>
                      </p>
                      {showDeleteModal.recipe.description && (
                        <p className="text-red-600 text-xs mt-1">
                          {showDeleteModal.recipe.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions de la modal */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closeDeleteModal}
                disabled={deletingRecipe}
                className="flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteRecipe(showDeleteModal.recipe!.id)}
                disabled={deletingRecipe}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingRecipe ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipePage;
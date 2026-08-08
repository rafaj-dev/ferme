/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Package, 
  Trash2, 
  Search, 
  Loader, 
  Filter,
  AlertTriangle,
  X,
  Ruler
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '../../components/Sidebar';
import { useProducts } from '../../hooks/useProducts';
import { useUnits } from '../../hooks/useUnits';
import type { ProductsFilters, Unit } from '../../services/productService';

const ProduitsPage: React.FC = () => {
  const {
    products,
    loading,
    productStocks,
    setFilters,
    createProduct,
    deleteProduct,
    creating,
    deleting
  } = useProducts();

  const {
    units,
    loading: unitsLoading,
    createUnit,
    deleteUnit,
    creating: creatingUnit,
    deleting: deletingUnit
  } = useUnits();

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
  const [showDeleteUnitModal, setShowDeleteUnitModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'units'>('products');

  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: 'INGREDIENT',
    unitId: 1,
    isSellable: true
  });

  const [newUnit, setNewUnit] = useState({
    code: '',
    name: ''
  });

  const categories = ['Tous', 'AGRICULTURE', 'FEED', 'INGREDIENT', 'FINISHED_GOOD', 'ANIMAL'];

  // S'assurer que products est toujours un tableau
  const productsList = products || [];

  // Gérer la recherche avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newFilters: ProductsFilters = {};
      
      if (searchTerm.trim()) {
        newFilters.search = searchTerm.trim();
      }
      
      if (selectedCategory !== 'Tous') {
        console.log("fsdkjmqfkjsmldfk")
        newFilters.category = selectedCategory;
      }
      
      setFilters(newFilters);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCategory, setFilters]);

  // Mettre à jour unitId quand units change
  useEffect(() => {
    if (units.length > 0 && !newProduct.unitId) {
      setNewProduct(prev => ({
        ...prev,
        unitId: units[0].id
      }));
    }
  }, [units]);

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.sku || !newProduct.unitId) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await createProduct(newProduct);
      setNewProduct({ 
        name: '', 
        sku: '', 
        category: 'INGREDIENT', 
        unitId: units[0]?.id || 1, 
        isSellable: true 
      });
      setShowAddProduct(false);
    } catch (error) {
      // Erreur déjà gérée dans le hook
    }
  };

  const handleAddUnit = async () => {
    if (!newUnit.code || !newUnit.name) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      await createUnit(newUnit);
      setNewUnit({ code: '', name: '' });
      setShowAddUnit(false);
    } catch (error) {
      // Erreur déjà gérée dans le hook
    }
  };

  const handleDeleteProduct = (id: number) => {
    setProductToDelete(id);
    setShowDeleteProductModal(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete);
      setShowDeleteProductModal(false);
      setProductToDelete(null);
    } catch (error) {
      // Erreur déjà gérée dans le hook
    }
  };

  const openDeleteUnitModal = (unit: Unit) => {
    setUnitToDelete(unit);
    setShowDeleteUnitModal(true);
  };

  const handleDeleteUnit = async () => {
    if (!unitToDelete) return;
    try {
      await deleteUnit(unitToDelete.id);
      setShowDeleteUnitModal(false);
      setUnitToDelete(null);
      toast.success('Unité supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'unité:', error);
      toast.error('Erreur lors de la suppression de l\'unité');
    }
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      'AGRICULTURE': 'Agriculture',
      'FEED': 'Alimentation animale',
      'INGREDIENT': 'Ingrédient',
      'FINISHED_GOOD': 'Produit fini',
      'ANIMAL': 'Animal'
    };
    return labels[cat] || cat;
  };

  if (loading && productsList.length === 0) {
    return (
      <div className="flex min-h-screen bg-[var(--color-background)]">
        <Sidebar />
        <div className="flex-1 lg:ml-64 overflow-auto p-8 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader className="animate-spin text-[var(--color-primary)]" size={24} />
            <p className="text-[var(--color-text)]">Chargement des produits...</p>
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
                    src="/logo.png"
                    alt="Logo" 
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain"
                  />
                </div>
              </div>

              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight drop-shadow-md break-words">
                  Gestion des Produits & Unités
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-emerald-50/90 max-w-xl leading-relaxed break-words">
                  Suivi intelligent et gestion complète de votre inventaire
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
                    placeholder={activeTab === 'products' ? "Rechercher par nom ou SKU..." : "Rechercher une unité..."}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filtre Catégorie (uniquement pour les produits) */}
                {activeTab === 'products' && (
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <select
                      className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white appearance-none"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat === 'Tous' ? 'Toutes catégories' : getCategoryLabel(cat)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Onglets */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('products')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'products'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Package size={16} className="inline mr-2" />
                    Produits
                  </button>
                  <button
                    onClick={() => setActiveTab('units')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'units'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Ruler size={16} className="inline mr-2" />
                    Unités
                  </button>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto justify-start lg:justify-end">
                <button
                  onClick={() => setShowAddUnit(true)}
                  className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
                  disabled={unitsLoading}
                >
                  {unitsLoading ? (
                    <Loader className="animate-spin" size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                  <span className="hidden sm:inline">Nouvelle Unité</span>
                  <span className="sm:hidden">Unité</span>
                </button>

                {activeTab === 'products' && (
                  <button
                    onClick={() => setShowAddProduct(true)}
                    className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
                    disabled={creating}
                  >
                    {creating ? (
                      <Loader className="animate-spin" size={18} />
                    ) : (
                      <Plus size={18} />
                    )}
                    <span className="hidden sm:inline">Nouveau Produit</span>
                    <span className="sm:hidden">Produit</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          
          {/* Section Produits */}
          {activeTab === 'products' && (
            <div className="bg-white/70 backdrop-blur-md rounded-lg shadow-lg border border-white/50 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="animate-spin text-[var(--color-primary)]" size={48} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-4 font-semibold text-[var(--color-text)]">Produit</th>
                        <th className="text-left p-4 font-semibold text-[var(--color-text)] hidden md:table-cell">SKU</th>
                        <th className="text-left p-4 font-semibold text-[var(--color-text)]">Catégorie</th>
                        <th className="text-left p-4 font-semibold text-[var(--color-text)]">Unité</th>
                        <th className="text-left p-4 font-semibold text-[var(--color-text)]">Stock</th>
                        <th className="text-left p-4 font-semibold text-[var(--color-text)] hidden lg:table-cell">Vendable</th>
                        <th className="text-right p-4 font-semibold text-[var(--color-text)]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productsList.map((product) => (
                        <tr 
                          key={product.id} 
                          className="border-b border-gray-200 hover:bg-white/50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="font-medium text-[var(--color-text)]">{product.name}</div>
                            <div className="text-sm text-[var(--color-text-muted)] md:hidden">{product.sku}</div>
                          </td>
                          <td className="p-4 hidden md:table-cell text-[var(--color-text-muted)]">
                            {product.sku}
                          </td>
                          <td className="p-4">
                            <span className="inline-block px-3 py-1 bg-[var(--color-accent)] text-[var(--color-text)] rounded-full text-sm">
                              {getCategoryLabel(product.category)}
                            </span>
                          </td>
                          <td className="p-4 text-[var(--color-text)]">
                            {product.unit?.code || 'N/A'}
                          </td>
                          <td className="p-4">
                            <span className={`font-semibold ${(productStocks[product.id] || 0) < 10 ? 'text-red-600' : 'text-green-600'}`}>
                              {productStocks[product.id] !== undefined ? `${productStocks[product.id]} ${product.unit?.code}` : '...'}
                            </span>
                          </td>
                          <td className="p-4 hidden lg:table-cell">
                            <span className={`px-3 py-1 rounded-full text-sm ${product.isSellable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              {product.isSellable ? 'Oui' : 'Non'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => handleDeleteProduct(product.id)}
                                disabled={deleting}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {deleting ? (
                                  <Loader className="animate-spin text-red-600" size={18} />
                                ) : (
                                  <Trash2 size={18} className="text-red-600" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {!loading && productsList.length === 0 && (
                <div className="text-center py-12">
                  <Package size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
                  <p className="text-[var(--color-text-muted)]">Aucun produit trouvé</p>
                </div>
              )}
            </div>
          )}

          {/* Section Unités */}
          {activeTab === 'units' && (
            <div className="bg-white/70 backdrop-blur-md rounded-lg shadow-lg border border-white/50 overflow-hidden">
              {unitsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="animate-spin text-[var(--color-primary)]" size={48} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-4 font-semibold text-[var(--color-text)]">Code</th>
                        <th className="text-left p-4 font-semibold text-[var(--color-text)]">Nom</th>
                        <th className="text-right p-4 font-semibold text-[var(--color-text)]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {units.map((unit) => (
                        <tr 
                          key={unit.id} 
                          className="border-b border-gray-200 hover:bg-white/50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="font-medium text-[var(--color-text)]">{unit.code}</div>
                          </td>
                          <td className="p-4 text-[var(--color-text)]">
                            {unit.name}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => openDeleteUnitModal(unit)}
                                disabled={deletingUnit}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {deletingUnit ? (
                                  <Loader className="animate-spin text-red-600" size={18} />
                                ) : (
                                  <Trash2 size={18} className="text-red-600" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {!unitsLoading && units.length === 0 && (
                <div className="text-center py-12">
                  <Ruler size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
                  <p className="text-[var(--color-text-muted)]">Aucune unité trouvée</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Ajouter Produit */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                <h2 className="text-2xl mb-6 text-gray-900 font-bold">Nouveau Produit</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-gray-700">Nom du produit *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      placeholder="Ex: Farine de blé"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-gray-700">SKU *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                      placeholder="Ex: FAR-001"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-gray-700">Catégorie *</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    >
                      {categories.filter(c => c !== 'Tous').map(cat => (
                        <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-gray-700">Unité *</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      value={newProduct.unitId}
                      onChange={(e) => setNewProduct({...newProduct, unitId: parseInt(e.target.value)})}
                    >
                      {units.map(unit => (
                        <option key={unit.id} value={unit.id}>{unit.name} ({unit.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isSellable"
                      checked={newProduct.isSellable}
                      onChange={(e) => setNewProduct({...newProduct, isSellable: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <label htmlFor="isSellable" className="text-gray-700">Produit vendable</label>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddProduct(false)}
                    className="flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddProduct}
                    className="flex-1 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
                    disabled={creating}
                  >
                    {creating ? <Loader className="animate-spin mx-auto" size={18} /> : 'Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Supprimer Produit */}
        {showDeleteProductModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-2xl text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Supprimer le produit
              </h2>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowDeleteProductModal(false);
                    setProductToDelete(null);
                  }}
                  className="px-5 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDeleteProduct}
                  disabled={deleting}
                  className="px-5 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader className="animate-spin mx-auto" size={18} />
                  ) : (
                    "Supprimer"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Ajouter Unité */}
        {showAddUnit && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                <h2 className="text-2xl mb-6 text-gray-900 font-bold">Nouvelle Unité</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-gray-700">Code de l'unité *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      value={newUnit.code}
                      onChange={(e) => setNewUnit({...newUnit, code: e.target.value.toUpperCase()})}
                      placeholder="Ex: KG, L, U"
                      maxLength={10}
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-gray-700">Nom de l'unité *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      value={newUnit.name}
                      onChange={(e) => setNewUnit({...newUnit, name: e.target.value})}
                      placeholder="Ex: Kilogramme, Litre, Unité"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddUnit(false);
                      setNewUnit({ code: '', name: '' });
                    }}
                    className="flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddUnit}
                    className="flex-1 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
                    disabled={creatingUnit}
                  >
                    {creatingUnit ? <Loader className="animate-spin mx-auto" size={18} /> : 'Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Supprimer Unité */}
        {showDeleteUnitModal && unitToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full shadow-2xl transform transition-all">
              {/* En-tête de la modal */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="text-red-600" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Supprimer l'unité
                  </h3>
                </div>
                <button
                  onClick={() => setShowDeleteUnitModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={deletingUnit}
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Contenu de la modal */}
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-gray-700 mb-3">
                    Êtes-vous sûr de vouloir supprimer cette unité ? Cette action est irréversible.
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
                      <div>
                        <p className="font-semibold text-red-800 text-sm">
                          Unité à supprimer :
                        </p>
                        <p className="text-red-700 text-sm mt-1">
                          <strong>{unitToDelete.name}</strong> ({unitToDelete.code})
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions de la modal */}
              <div className="flex gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowDeleteUnitModal(false)}
                  disabled={deletingUnit}
                  className="flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteUnit}
                  disabled={deletingUnit}
                  className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deletingUnit ? (
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
    </div>
  );
};

export default ProduitsPage;
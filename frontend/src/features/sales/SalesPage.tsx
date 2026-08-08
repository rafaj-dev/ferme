/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Loader,
  Trash2,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowUp,
  User,
  ShoppingCart,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '../../components/Sidebar';
import { useSales } from '../../hooks/useSales';
import type { 
  CreateSaleDto,
  SaleItem as SaleItemType
} from '../../services/saleService';

interface SaleItemForm {
  productId: number;
  productionBatchId: number;
  quantity: number;
  unitPrice: number;
}

const SalesPage: React.FC = () => {
  const {
    sales,
    products,
    availableBatches,
    units,
    loading,
    error,
    creating,
    deleting,
    createSale,
    deleteSale,
    loadAvailableBatches,
    availableBatchesLoading,
    checkProductExists,
    checkBatchExists,
  } = useSales();

  const [showAddSale, setShowAddSale] = useState(false);
  const [showSaleDetails, setShowSaleDetails] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Formulaire nouvelle vente
  const [newSale, setNewSale] = useState<CreateSaleDto>({
    customer: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
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


  // Filtrer les ventes par recherche et client
  const filteredSales = sales.filter(sale =>
    (sale.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
     sale.items.some(item => 
       item.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
     )) &&
    (customerFilter === '' || sale.customer.toLowerCase().includes(customerFilter.toLowerCase()))
  );

  // Clients uniques pour le filtre
  const uniqueCustomers = [...new Set(sales.map(sale => sale.customer))];

  const handleAddSale = async () => {
    if (!newSale.customer.trim() || newSale.items.length === 0) {
      toast.error('Veuillez remplir tous les champs obligatoires et ajouter au moins un article');
      return;
    }

    // Validation des articles
    for (const item of newSale.items) {
      if (!item.productId || item.productId <= 0 || 
          !item.productionBatchId || item.productionBatchId <= 0 || 
          !item.quantity || item.quantity <= 0 || 
          item.unitPrice === null || item.unitPrice === undefined || item.unitPrice < 0) {
        toast.error('Veuillez compléter tous les champs pour chaque article avec des valeurs valides');
        return;
      }
    }

    try {
      // VÉRIFICATION DES IDS AVANT ENVOI - VERSION SIMPLIFIÉE
      ;
      ;
      
      for (const item of newSale.items) {
        ;
        
        // Vérifier le produit
        const productExists = await checkProductExists(item.productId);
        ;
        
        if (!productExists) {
          const product = products.find(p => p.id === item.productId);
          throw new Error(`Le produit sélectionné "${product?.name || 'Inconnu'}" (ID: ${item.productId}) n'existe pas en base de données`);
        }

        // Vérifier le lot
        const batchExists = await checkBatchExists(item.productionBatchId);
        ;
        
        if (!batchExists) {
          // Récupérer tous les lots pour afficher ceux disponibles
          // On caste le module en any pour éviter l'erreur TS si la fonction n'est pas exportée,
          // puis on cherche une source de lots disponible (fonction exportée ou fallback local).
          const mod: any = await import('../../services/saleService');
          let allBatches: any[] = [];

          if (typeof mod.getAllProductionBatches === 'function') {
            allBatches = await mod.getAllProductionBatches();
          }

          // Fallback si la fonction n'existe pas ou ne renvoie rien utile
          if ((!allBatches || allBatches.length === 0) && Array.isArray(availableBatches) && availableBatches.length > 0) {
            allBatches = availableBatches;
          }

          const availableBatchIds = (allBatches || []).map((b: any) => b.id || b.batchId || 'unknown');
          
          throw new Error(`Le lot de production sélectionné (ID: ${item.productionBatchId}) n'existe pas en base de données. Lots disponibles: ${availableBatchIds.join(', ')}`);
        }
      }

      // S'assurer que toutes les valeurs sont des nombres valides
      const saleData: CreateSaleDto = {
        customer: newSale.customer.trim(),
        date: newSale.date,
        items: newSale.items.map(item => ({
          productId: Number(item.productId),
          productionBatchId: Number(item.productionBatchId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice)
        }))
      };

      ;
      await createSale(saleData);
      
      // Réinitialiser le formulaire
      setNewSale({
        customer: '',
        date: new Date().toISOString().split('T')[0],
        items: [],
      });
      setShowAddSale(false);
      toast.success('Vente créée avec succès');
    } catch (error) {
      console.error('Erreur lors de la création de la vente:', error);
      // Le toast d'erreur est géré dans le hook useSales
    }
  };

  const handleAddItem = () => {
    setNewSale(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: 0,
          productionBatchId: 0,
          quantity: 0,
          unitPrice: 0
        }
      ]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setNewSale(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Fonction utilitaire pour convertir en nombre de manière sécurisée
  const safeParseNumber = (value: any): number => {
    if (value === '' || value === null || value === undefined) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const handleItemChange = async (index: number, field: keyof SaleItemForm, value: any) => {
    // Conversion sécurisée en nombre pour les champs numériques
    let processedValue = value;
    if (field === 'quantity' || field === 'unitPrice') {
      processedValue = safeParseNumber(value);
    } else if (field === 'productId' || field === 'productionBatchId') {
      processedValue = safeParseNumber(value);
    }

    const updatedItems = newSale.items.map((item, i) =>
      i === index ? { ...item, [field]: processedValue } : item
    );

    setNewSale(prev => ({
      ...prev,
      items: updatedItems
    }));

    // Si le produit change, charger les lots disponibles
    if (field === 'productId' && processedValue > 0) {
      const productId = Number(processedValue);
      await loadAvailableBatches(productId);
      
      // Réinitialiser le lot de production quand le produit change
      const resetItems = updatedItems.map((item, i) =>
        i === index ? { 
          ...item, 
          productionBatchId: 0,
          unitPrice: 0
        } : item
      );
      
      setNewSale(prev => ({
        ...prev,
        items: resetItems
      }));

      // Si un seul lot est disponible, le sélectionner automatiquement
      if (availableBatches.length === 1) {
        const singleBatch = availableBatches[0];
        const autoSelectedItems = resetItems.map((item, i) =>
          i === index ? { 
            ...item, 
            productionBatchId: singleBatch.id,
            unitPrice: singleBatch.unitPrice || 0
          } : item
        );
        
        setNewSale(prev => ({
          ...prev,
          items: autoSelectedItems
        }));
      }
    }

    // Si le lot change, mettre à jour le prix unitaire automatiquement
    if (field === 'productionBatchId' && processedValue > 0) {
      const selectedBatch = availableBatches.find(b => b.id === Number(processedValue));
      if (selectedBatch && selectedBatch.unitPrice) {
        const updatedWithPrice = updatedItems.map((item, i) =>
          i === index ? { ...item, unitPrice: selectedBatch.unitPrice || 0 } : item
        );
        
        setNewSale(prev => ({
          ...prev,
          items: updatedWithPrice
        }));
      }
    }
  };

  const handleDeleteSale = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette vente ?')) {
      try {
        await deleteSale(id);
        toast.success('Vente supprimée avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression de la vente:', error);
      }
    }
  };

  const getUnitName = (unitId: number) => {
    return units.find(u => u.id === unitId)?.name || 'Unité inconnue';
  };

  const getBatchInfo = (batchId: number) => {
    const batch = availableBatches.find(b => b.id === batchId);
    if (!batch) return 'Lot inconnu';
    
    const remaining = batch.remaining;
    const unitPrice = batch.unitPrice ? ` - ${parseFloat(batch.unitPrice.toString()).toLocaleString()} Ar/unité` : '';
    const expiryInfo = batch.expiryDate ? ` - Exp: ${formatDate(batch.expiryDate)}` : '';
    
    return `Lot #${batch.id} (${remaining} restants${unitPrice}${expiryInfo})`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const calculateItemTotal = (quantity: number, unitPrice: number) => {
    return Number(quantity) * Number(unitPrice);
  };

  const calculateSaleTotal = (items: SaleItemType[]) => {
    return items.reduce((total, item) => {
      return total + calculateItemTotal(Number(item.quantity), Number(item.unitPrice));
    }, 0);
  };

  if (loading && sales.length === 0) {
    return (
      <div className="flex min-h-screen bg-[var(--color-background)]">
        <Sidebar />
        <div className="flex-1 lg:ml-64 overflow-auto p-8 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader className="animate-spin text-[var(--color-primary)]" size={24} />
            <p className="text-[var(--color-text)]">Chargement des ventes...</p>
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
                    src="/src/assets/logo.png" 
                    alt="Logo" 
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain"
                  />
                </div>
              </div>

              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight drop-shadow-md break-words">
                  Gestion des Ventes
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-purple-50/90 max-w-xl leading-relaxed break-words">
                  Suivez et gérez vos ventes en temps réel
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
                    placeholder="Rechercher par client ou produit..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filtre Client */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <select
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white appearance-none min-w-[150px]"
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value)}
                  >
                    <option value="">Tous les clients</option>
                    {uniqueCustomers.map(customer => (
                      <option key={customer} value={customer}>
                        {customer}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto justify-start lg:justify-end">
                <button
                  onClick={() => setShowAddSale(true)}
                  className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
                  disabled={creating}
                >
                  {creating ? (
                    <Loader className="animate-spin" size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                  <span>Nouvelle Vente</span>
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
          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-100 text-red-700 p-4 mb-6 rounded-lg">
              {error}
            </div>
          )}

          {/* Section Ventes */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left p-4 font-semibold text-gray-900">Date</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Client</th>
                      <th className="text-left p-4 font-semibold text-gray-900 hidden lg:table-cell">
                        Articles
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-900">Montant Total</th>
                      <th className="text-right p-4 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <React.Fragment key={sale.id}>
                        <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                          <td className="p-4 text-sm text-gray-600">
                            {formatDate(sale.date)}
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              <User size={16} className="text-gray-400" />
                              {sale.customer}
                            </div>
                          </td>
                          <td className="p-4 hidden lg:table-cell text-sm text-gray-600">
                            {sale.items.length} article{sale.items.length > 1 ? 's' : ''}
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-green-600 flex items-center gap-1">
                              {parseFloat(sale.totalAmount.toString()).toLocaleString()} Ar
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setShowSaleDetails(
                                  showSaleDetails === sale.id ? null : sale.id
                                )}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Détails"
                              >
                                {showSaleDetails === sale.id ? (
                                  <ChevronUp size={16} className="text-blue-500" />
                                ) : (
                                  <ChevronDown size={16} className="text-blue-500" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteSale(sale.id)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                                disabled={deleting}
                              >
                                <Trash2 size={16} className="text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Détails de la vente */}
                        {showSaleDetails === sale.id && (
                          <tr>
                            <td colSpan={5} className="p-4 bg-gray-50">
                              <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900">Détails de la vente:</h4>
                                <div className="grid gap-2">
                                  {sale.items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border">
                                      <div>
                                        <p className="font-medium">{item.product?.name}</p>
                                        <p className="text-sm text-gray-600">
                                          Lot #{item.productionBatchId} • 
                                          {item.quantity} {getUnitName(item.product?.unitId || 1)} • 
                                          {parseFloat(item.unitPrice.toString()).toLocaleString()} Ar/unité
                                        </p>
                                      </div>
                                      <span className="font-semibold text-green-600">
                                        {calculateItemTotal(Number(item.quantity), Number(item.unitPrice)).toLocaleString()} Ar
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                {sale.financialTransaction && (
                                  <div className="p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-700">
                                      Transaction: {sale.financialTransaction.note} 
                                      (Ref: #{sale.financialTransaction.id})
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredSales.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg">Aucune vente trouvée</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {searchTerm || customerFilter
                      ? 'Essayez de modifier votre recherche ou vos filtres'
                      : 'Commencez par créer votre première vente'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
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

      {/* Modal Nouvelle Vente */}
      {showAddSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <h2 className="text-2xl mb-6 text-gray-900 font-bold">Nouvelle Vente</h2>
              
              <div className="space-y-6">
                {/* Informations générales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-gray-700">Client *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      value={newSale.customer}
                      onChange={(e) => setNewSale({...newSale, customer: e.target.value})}
                      placeholder="Nom du client"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-gray-700">Date *</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      value={newSale.date}
                      onChange={(e) => setNewSale({...newSale, date: e.target.value})}
                    />
                  </div>
                </div>

                {/* Articles */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-gray-700 text-lg font-semibold">Articles *</label>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Plus size={16} />
                      Ajouter un article
                    </button>
                  </div>

                  <div className="space-y-4">
                    {newSale.items.map((item, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-gray-900">Article {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {/* Produit */}
                          <div>
                            <label className="block mb-1 text-sm text-gray-700">Produit *</label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                              value={item.productId || ''}
                              onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                            >
                              <option value="">Sélectionner un produit</option>
                              {products.map(product => (
                                <option key={product.id} value={product.id}>
                                  {product.name} (ID: {product.id})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Lot de production */}
                          <div>
                            <label className="block mb-1 text-sm text-gray-700">Lot *</label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                              value={item.productionBatchId || ''}
                              onChange={(e) => handleItemChange(index, 'productionBatchId', e.target.value)}
                              disabled={!item.productId || availableBatchesLoading}
                            >
                              <option value="">
                                {availableBatchesLoading ? 'Chargement...' : 'Sélectionner un lot'}
                              </option>
                              {availableBatches.map(batch => (
                                <option key={batch.id} value={batch.id}>
                                  {getBatchInfo(batch.id)}
                                </option>
                              ))}
                            </select>
                            
                            {/* Information sur le stock disponible */}
                            {availableBatches.length === 0 && item.productId && !availableBatchesLoading && (
                              <p className="text-xs text-red-500 mt-1">
                                Aucun lot disponible pour ce produit
                              </p>
                            )}
                          </div>

                          {/* Quantité */}
                          <div>
                            <label className="block mb-1 text-sm text-gray-700">Quantité *</label>
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                              value={item.quantity || ''}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              placeholder="0.0"
                            />
                          </div>

                          {/* Prix unitaire */}
                          <div>
                            <label className="block mb-1 text-sm text-gray-700">Prix unitaire (Ar) *</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                              value={item.unitPrice || ''}
                              onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        {/* Total de l'article */}
                        {item.quantity > 0 && item.unitPrice > 0 && (
                          <div className="mt-2 text-right">
                            <span className="text-sm font-semibold text-green-600">
                              Total: {calculateItemTotal(item.quantity, item.unitPrice).toLocaleString()} Ar
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {newSale.items.length === 0 && (
                    <p className="text-center text-gray-500 py-6 border-2 border-dashed border-gray-300 rounded-lg">
                      Aucun article ajouté
                    </p>
                  )}

                  {/* Total de la vente */}
                  {newSale.items.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-blue-900">Total de la vente:</span>
                        <span className="text-xl font-bold text-blue-900">
                          {calculateSaleTotal(newSale.items).toLocaleString()} Ar
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddSale(false)}
                  className="flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddSale}
                  className="flex-1 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
                  disabled={creating || newSale.items.length === 0}
                >
                  {creating ? <Loader className="animate-spin mx-auto" size={18} /> : 'Créer la vente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;
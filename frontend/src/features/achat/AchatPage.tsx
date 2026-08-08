/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { 
  Plus, 
  ShoppingCart, 
  Trash2, 
  Search, 
  Loader,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '../../components/Sidebar';
import { usePurchases } from '../../hooks/usePurchases';
import { useProducts } from '../../hooks/useProducts';

const AchatsPage: React.FC = () => {
  const {
    purchases,
    loading,
    creating,
    deleting,
    createPurchase,
    deletePurchase
  } = usePurchases();

  const { products } = useProducts();

  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<number | null>(null);
  
  const [newPurchase, setNewPurchase] = useState({
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    items: [{
      productId: 0,
      quantity: 0,
      unitPrice: 0
    }]
  });

  // Filtrer les achats par recherche
  const filteredPurchases = purchases.filter(purchase =>
    purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.items.some(item => 
      item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product?.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleAddPurchase = async () => {
    if (!newPurchase.supplier.trim() || newPurchase.items.length === 0) {
      toast.error('Veuillez remplir le fournisseur et ajouter au moins un produit');
      return;
    }

    // Valider les items
    for (const item of newPurchase.items) {
      if (!item.productId || item.quantity <= 0 || item.unitPrice <= 0) {
        toast.error('Veuillez remplir tous les champs des produits (quantité et prix > 0)');
        return;
      }
    }

    try {
      await createPurchase({
        ...newPurchase,
        date: new Date(newPurchase.date).toISOString()
      });
      
      setNewPurchase({
        supplier: '',
        date: new Date().toISOString().split('T')[0],
        items: [{
          productId: 0,
          quantity: 0,
          unitPrice: 0
        }]
      });
      setShowAddPurchase(false);
      
    } catch (error) {
      // Erreur déjà gérée dans le hook
    }
  };

  const handleDeletePurchase = (id: number) => {
    setPurchaseToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeletePurchase = async () => {
    if (!purchaseToDelete) return;
    try {
      await deletePurchase(purchaseToDelete);
      setShowDeleteModal(false);
      setPurchaseToDelete(null);
    } catch (error) {
      // Erreur déjà gérée dans le hook
    }
  };

  const addItem = () => {
    setNewPurchase(prev => ({
      ...prev,
      items: [...prev.items, { productId: 0, quantity: 0, unitPrice: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    setNewPurchase(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateItem = (index: number, field: string, value: any) => {
    setNewPurchase(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Calculer le total de l'achat en cours
  const currentTotal = newPurchase.items.reduce((total, item) => {
    return total + (item.quantity * item.unitPrice);
  }, 0);

  if (loading && purchases.length === 0) {
    return (
      <div className="flex min-h-screen bg-[var(--color-background)]">
        <Sidebar />
        <div className="flex-1 lg:ml-64 overflow-auto p-8 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader className="animate-spin text-[var(--color-primary)]" size={24} />
            <p className="text-[var(--color-text)]">Chargement des achats...</p>
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
                  Gestion des Achats
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-emerald-50/90 max-w-xl leading-relaxed break-words">
                  Suivi intelligent et gestion complète de votre inventaire
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Barre d'actions fixe - MÊME STYLE QUE PRODUITS */}
        <div className="flex-shrink-0 bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-200 py-4">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Recherche */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher par fournisseur ou produit..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Bouton d'action */}
              <div className="flex w-full lg:w-auto justify-start lg:justify-end">
                <button
                  onClick={() => setShowAddPurchase(true)}
                  className="bg-[#129619] rounded-md text-white flex items-center gap-2 px-6 py-3 whitespace-nowrap shadow-md hover:shadow-lg transition-shadow"
                  disabled={creating}
                >
                  {creating ? (
                    <Loader className="animate-spin" size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                  <span className="hidden sm:inline">Nouvel Achat</span>
                  <span className="sm:hidden">Achat</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Tableau des achats */}
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
                      <th className="text-left p-4 font-semibold text-[var(--color-text)]">ID</th>
                      <th className="text-left p-4 font-semibold text-[var(--color-text)]">Fournisseur</th>
                      <th className="text-left p-4 font-semibold text-[var(--color-text)] hidden md:table-cell">Date</th>
                      <th className="text-left p-4 font-semibold text-[var(--color-text)]">Produits</th>
                      <th className="text-left p-4 font-semibold text-[var(--color-text)]">Montant Total</th>
                      <th className="text-right p-4 font-semibold text-[var(--color-text)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchases.map((purchase) => (
                      <tr 
                        key={purchase.id} 
                        className="border-b border-gray-200 hover:bg-white/50 transition-colors"
                      >
                        <td className="p-4 font-medium text-[var(--color-text)]">
                          #{purchase.id}
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-[var(--color-text)]">{purchase.supplier}</div>
                        </td>
                        <td className="p-4 hidden md:table-cell text-[var(--color-text-muted)]">
                          {new Date(purchase.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            {purchase.items.map((item, index) => (
                              <div key={index} className="text-sm">
                                <span className="font-medium">{item.product?.name}</span>
                                <span className="text-[var(--color-text-muted)] ml-2">
                                  {item.quantity} {item.product?.unit?.code} × {parseFloat(item.unitPrice).toLocaleString()} Ar
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-[var(--color-text)]">
                            {parseFloat(purchase.totalAmount).toLocaleString()} Ar
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => handleDeletePurchase(purchase.id)}
                              disabled={deleting}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Trash2 size={18} className="text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {!loading && filteredPurchases.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
                <p className="text-[var(--color-text-muted)]">Aucun achat trouvé</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Ajouter Achat */}
        {showAddPurchase && (
          <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
              <h2 className="text-2xl mb-6 text-[var(--color-text)] font-bold">Nouvel Achat</h2>
              
              <div className="space-y-6">
                {/* Informations de base */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-[var(--color-text)]">Fournisseur *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      value={newPurchase.supplier}
                      onChange={(e) => setNewPurchase({...newPurchase, supplier: e.target.value})}
                      placeholder="Nom du fournisseur"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-[var(--color-text)]">Date *</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      value={newPurchase.date}
                      onChange={(e) => setNewPurchase({...newPurchase, date: e.target.value})}
                    />
                  </div>
                </div>

                {/* Produits */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-[var(--color-text)]">Produits</h3>
                    <button
                      onClick={addItem}
                      className="bg-green-500 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
                    >
                      <Plus size={16} />
                      Ajouter un produit
                    </button>
                  </div>

                  <div className="space-y-4">
                    {newPurchase.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                        <div>
                          <label className="block mb-2 text-sm text-[var(--color-text)]">Produit *</label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                            value={item.productId}
                            onChange={(e) => updateItem(index, 'productId', parseInt(e.target.value))}
                          >
                            <option value={0}>Sélectionner un produit</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} ({product.sku})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block mb-2 text-sm text-[var(--color-text)]">Quantité *</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label className="block mb-2 text-sm text-[var(--color-text)]">Prix unitaire (Ar) *</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                            placeholder="0"
                          />
                        </div>

                        <div className="flex items-end">
                          <button
                            onClick={() => removeItem(index)}
                            className="bg-red-500 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
                            disabled={newPurchase.items.length === 1}
                          >
                            <Trash2 size={16} />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-[var(--color-text)]">Total:</span>
                    <span className="text-2xl font-bold text-[var(--color-primary)]">
                      {currentTotal.toLocaleString()} Ar
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddPurchase(false)}
                  className="flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddPurchase}
                  className="flex-1 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
                  disabled={creating}
                >
                  {creating ? <Loader className="animate-spin mx-auto" size={18} /> : 'Créer l\'achat'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-2xl text-center">
              <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
                Supprimer l'achat
              </h2>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir supprimer cet achat ? Cette action est irréversible.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPurchaseToDelete(null);
                  }}
                  className="px-5 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDeletePurchase}
                  disabled={deleting}
                  className="px-5 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
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
      </div>
    </div>
  );
};

export default AchatsPage;
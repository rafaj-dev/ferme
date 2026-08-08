/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart3,
  LineChart,
} from 'lucide-react';
import { useFinancial } from '../../hooks/useFinancial';
import Sidebar from '../../components/Sidebar';

// Import correct de Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Enregistrer les composants nécessaires
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Composant pour les cartes de statistiques
const StatCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
  className?: string;
}> = ({ title, value, subtitle, icon, trend, trendValue, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-6 ${className}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        {trend && trendValue && (
          <div className={`flex items-center mt-2 text-sm ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span className="ml-1">{trendValue}</span>
          </div>
        )}
      </div>
      <div className="text-blue-600 bg-blue-50 rounded-full p-3">
        {icon}
      </div>
    </div>
  </div>
);

// Composant pour le graphique Chart.js

// Version simplifiée avec gestion d'erreur
const SimpleFinancialChart: React.FC<{ 
  data: any[];
  type: 'line' | 'bar';
}> = ({ data, type }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Importer Chart.js dynamiquement pour éviter les problèmes d'import
    import('chart.js/auto').then(({ Chart }) => {
      // Détruire l'instance existante si elle existe
      const existingChart = (chartRef.current as any)?._chart;
      if (existingChart) {
        existingChart.destroy();
      }

      // Préparer les données
      const labels = data.map(month => {
        const mois = month.month;
        return `${mois}`;
      });

      const incomeData = data.map(month => month.income);
      const expenseData = data.map(month => month.expense);

      // Configuration
      const config = {
        type: type,
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Revenus',
              data: incomeData,
              borderColor: '#10b981',
              backgroundColor: type === 'line' 
                ? 'rgba(16, 185, 129, 0.1)' 
                : 'rgba(16, 185, 129, 0.8)',
              borderWidth: type === 'line' ? 1 : 2,
              fill: type === 'line',
              tension: type === 'line' ? 0.4 : 0,
            },
            {
              label: 'Dépenses',
              data: expenseData,
              borderColor: '#ef4444',
              backgroundColor: type === 'line' 
                ? 'rgba(239, 68, 68, 0.1)' 
                : 'rgba(239, 68, 68, 0.8)',
              borderWidth: type === 'line' ? 1 : 2,
              fill: type === 'line',
              tension: type === 'line' ? 0.4 : 0,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top' as const,
            },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += new Intl.NumberFormat('fr-FR').format(context.parsed.y) + ' Ar';
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return new Intl.NumberFormat('fr-FR', {
                    notation: 'compact',
                    maximumFractionDigits: 1,
                  }).format(value) + ' Ar';
                }
              }
            }
          }
        }
      };

      // Créer le graphique
      new Chart(ctx, config);
    }).catch(error => {
      console.error('Erreur lors du chargement de Chart.js:', error);
    });

  }, [data, type]);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Évolution mensuelle</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {type === 'line' ? <LineChart size={16} /> : <BarChart3 size={16} />}
          <span className="capitalize">{type === 'line' ? 'Courbes' : 'Barres'}</span>
        </div>
      </div>
      <div className="h-64">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

const FinancialDashboard: React.FC = () => {
  const {
    transactions,
    balance,
    monthlySummary,
    recentTransactions,
    loading,
    error,
  } = useFinancial();

  const [selectedYear] = useState(new Date().getFullYear());
  const [chartType] = useState<'line' | 'bar'>('line');

  // Filtrer les transactions pour les 30 derniers jours
  const recentTransactionsData = recentTransactions.slice(0, 5);

  // Formater le montant
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' Ar';
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Obtenir le type de transaction avec icône
  const getTransactionType = (type: 'INCOME' | 'EXPENSE') => {
    return type === 'INCOME' 
      ? { label: 'Revenu', icon: <ArrowUpRight size={16} className="text-green-600" /> }
      : { label: 'Dépense', icon: <ArrowDownRight size={16} className="text-red-600" /> };
  };

  if (loading && !balance) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 lg:ml-64 overflow-auto p-8 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <RefreshCw className="animate-spin text-blue-600" size={24} />
            <p className="text-gray-600">Chargement du tableau de bord...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64 overflow-auto">
        {/* Header */}
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
                  Tableau de Bord Financier
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-emerald-50/90 max-w-xl leading-relaxed break-words">
                   Aperçu de vos finances et performances
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="p-6">
          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-100 text-red-700 p-4 mb-6 rounded-lg">
              {error}
            </div>
          )}

          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Solde Actuel"
              value={balance ? formatAmount(balance.balance) : '0 Ar'}
              subtitle="Solde total"
              icon={<DollarSign size={24} />}
              trend={balance?.balance && balance.balance >= 0 ? 'up' : 'down'}
              trendValue={balance ? `${balance.balance >= 0 ? '+' : ''}${formatAmount(balance.balance)}` : undefined}
              className={balance?.balance && balance.balance >= 0 ? 'border-green-200' : 'border-red-200'}
            />
            
            <StatCard
              title="Revenus Totaux"
              value={balance ? formatAmount(balance.income) : '0 Ar'}
              subtitle={`${balance?.transactions || 0} transactions`}
              icon={<TrendingUp size={24} />}
              trend="up"
              trendValue="Revenus"
              className="border-green-200"
            />
            
            <StatCard
              title="Dépenses Totales"
              value={balance ? formatAmount(balance.expense) : '0 Ar'}
              subtitle={`${balance?.transactions || 0} transactions`}
              icon={<TrendingDown size={24} />}
              trend="down"
              trendValue="Dépenses"
              className="border-red-200"
            />
            
            <StatCard
              title="Période"
              value={selectedYear.toString()}
              subtitle="Année en cours"
              icon={<Calendar size={24} />}
              className="border-blue-200"
            />
          </div>

          {/* Graphique et transactions récentes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Graphique Chart.js - Utiliser la version simplifiée */}
            <SimpleFinancialChart data={monthlySummary} type={chartType} />

            {/* Transactions récentes */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Transactions Récentes
              </h3>
              <div className="space-y-3">
                {recentTransactionsData.map((transaction) => {
                  const typeInfo = getTransactionType(transaction.type);
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'INCOME' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {typeInfo.icon}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {transaction.note || 'Transaction'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(transaction.date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'INCOME' ? '+' : '-'}{formatAmount(transaction.amount)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {typeInfo.label.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {recentTransactionsData.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    Aucune transaction récente
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tableau des transactions complètes */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Toutes les Transactions
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Date</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Description</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Type</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Référence</th>
                    <th className="text-right py-3 px-6 font-semibold text-gray-900">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => {
                    const typeInfo = getTransactionType(transaction.type);
                    const reference = transaction.sale?.customer || transaction.purchase?.supplier || 'Autre';
                    
                    return (
                      <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-6 text-sm text-gray-600">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="py-3 px-6">
                          <p className="font-medium text-gray-900">{transaction.note}</p>
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            {typeInfo.icon}
                            <span className="text-sm text-gray-600 capitalize">
                              {typeInfo.label.toLowerCase()}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-600">
                          {reference}
                        </td>
                        <td className="py-3 px-6 text-right">
                          <span className={`font-semibold ${
                            transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'INCOME' ? '+' : '-'}{formatAmount(transaction.amount)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        Aucune transaction trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
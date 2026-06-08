/**
 * Página de Dashboard de Ganancias
 */
'use client';

import { useState, useEffect } from 'react';
import { 
  getProfitKPIs, 
  getProfitComparison, 
  getProfitByCategory,
  getProfitTimeline,
  getOperatingExpenses
} from '@/server/actions/profit.actions';
import { formatCurrency } from '@/lib/utils';

interface ProfitMetrics {
  salesRevenue: number;
  salesCost: number;
  salesProfit: number;
  servicesRevenue: number;
  servicesProfit: number;
  warrantyLoss: number;
  operatingExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: string;
}

export default function GananciasPage() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [metrics, setMetrics] = useState<ProfitMetrics | null>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [byCategory, setByCategory] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [kpiData, comparisonData, categoryData, timelineData, expensesData] = await Promise.all([
        getProfitKPIs(period),
        getProfitComparison(period === 'day' ? 'week' : 'month'),
        getProfitByCategory(),
        getProfitTimeline(period === 'day' ? 'day' : period === 'week' ? 'week' : 'month'),
        getOperatingExpenses(period),
      ]);

      if (kpiData) setMetrics(kpiData.metrics);
      if (comparisonData) setComparison(comparisonData);
      if (categoryData) setByCategory(categoryData);
      if (timelineData) setTimeline(timelineData);
      if (expensesData) setExpenses(expensesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard de Ganancias</h1>
        
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('day')}
            className={`px-4 py-2 rounded-lg ${period === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Día
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-lg ${period === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Semana
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg ${period === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Mes
          </button>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-600 mb-1">Ganancia Neta</h3>
          <p className={`text-2xl font-bold ${metrics?.netProfit && metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(metrics?.netProfit || 0)}
          </p>
          {comparison && (
            <div className={`text-xs mt-2 flex items-center gap-1 ${comparison.change.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              <span>{comparison.change.trend === 'up' ? '↑' : '↓'} {Math.abs(parseFloat(comparison.change.percentage))}% vs período anterior</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-600 mb-1">Ganancia Bruta</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(metrics?.grossProfit || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">Margen: {metrics?.profitMargin}%</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-600 mb-1">Ventas</h3>
          <p className="text-xl font-semibold text-green-600">
            {formatCurrency(metrics?.salesProfit || 0)}
          </p>
          <p className="text-xs text-gray-500">Ingresos: {formatCurrency(metrics?.salesRevenue || 0)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-600 mb-1">Servicios</h3>
          <p className="text-xl font-semibold text-purple-600">
            {formatCurrency(metrics?.servicesProfit || 0)}
          </p>
          <p className="text-xs text-gray-500">Ingresos: {formatCurrency(metrics?.servicesRevenue || 0)}</p>
        </div>
      </div>

      {/* Segunda fila de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-600 mb-1">Pérdida por Garantías</h3>
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(-(metrics?.warrantyLoss || 0))}
          </p>
          <p className="text-xs text-gray-500 mt-2">Costo de repuestos en garantías</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-600 mb-1">Gastos Operativos</h3>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(metrics?.operatingExpenses || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">Fijos, salarios, insumos</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-600 mb-1">Comparativo</h3>
          {comparison ? (
            <>
              <div className="flex justify-between text-sm mb-1">
                <span>Período actual:</span>
                <span className="font-semibold">{formatCurrency(comparison.current.profit)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Período anterior:</span>
                <span className="font-semibold">{formatCurrency(comparison.previous.profit)}</span>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm">Sin datos comparativos</p>
          )}
        </div>
      </div>

      {/* Gráfico de Timeline (simulado con barras CSS) */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Evolución de Ganancias</h2>
        <div className="h-48 flex items-end gap-2">
          {timeline.map((item, index) => {
            const maxValue = Math.max(...timeline.map(d => Math.abs(d.total)), 1);
            const height = Math.abs(item.total) / maxValue * 100;
            const isPositive = item.total >= 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className={`w-full rounded-t ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ height: `${height}%` }}
                  title={`${item.label}: ${formatCurrency(item.total)}`}
                />
                <span className="text-xs text-gray-500 mt-1 truncate w-full text-center">{item.label}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Ganancia</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Pérdida</span>
          </div>
        </div>
      </div>

      {/* Desglose por Categoría y Gastos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ganancia por Categoría */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Ganancia por Categoría</h2>
          <div className="space-y-3">
            {byCategory.slice(0, 5).map((cat, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{cat.categoryName}</span>
                    <span className="text-sm font-semibold text-green-600">{formatCurrency(cat.profit)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${Math.min(cat.margin, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">Margen: {cat.margin}%</span>
                </div>
              </div>
            ))}
            {byCategory.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">Sin datos de categorías</p>
            )}
          </div>
        </div>

        {/* Gastos Operativos */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Gastos Operativos</h2>
          <div className="space-y-3">
            {expenses?.expenses?.slice(0, 5).map((exp: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{exp.category}</span>
                    <span className="text-sm font-semibold text-red-600">{formatCurrency(exp.amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${exp.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{exp.percentage}% ({exp.count} movimientos)</span>
                </div>
              </div>
            ))}
            {(!expenses?.expenses || expenses.expenses.length === 0) && (
              <p className="text-gray-400 text-sm text-center py-4">Sin gastos registrados</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

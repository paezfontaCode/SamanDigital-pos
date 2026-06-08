/**
 * Server Actions para cálculo de ganancias y reportes financieros
 */
'use server';

import { prisma } from '@/lib/db/prisma';

/**
 * Obtener KPIs principales de ganancias
 */
export async function getProfitKPIs(period: 'day' | 'week' | 'month' = 'day') {
  try {
    const now = new Date();
    let startDate = new Date();
    
    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      const dayOfWeek = now.getDay();
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    // Ganancia por ventas del período
    const salesProfit = await prisma.saleItem.aggregate({
      where: {
        sale: {
          createdAt: { gte: startDate },
          isDeleted: false,
        },
      },
      _sum: { 
        subtotal: true 
      },
    });

    // Calcular costo de productos vendidos
    const salesCost = await prisma.$queryRaw`
      SELECT SUM(si.quantity * p.costPrice) as total
      FROM SaleItem si
      JOIN Product p ON p.id = si.productId
      JOIN Sale s ON s.id = si.saleId
      WHERE s.createdAt >= ${startDate} AND s.isDeleted = false
    ` as Array<{ total: number }>;

    // Ganancia por servicios (tickets entregados)
    const servicesProfit = await prisma.ticketItem.aggregate({
      where: {
        ticket: {
          deliveredAt: { gte: startDate },
          status: 'ENTREGADO',
          isWarrantyService: false,
        },
      },
      _sum: { subtotal: true },
    });

    // Pérdida por garantías (repuestos usados en garantías)
    const warrantyLoss = await prisma.$queryRaw`
      SELECT SUM(ti.quantity * p.costPrice) as total
      FROM TicketItem ti
      JOIN Product p ON p.id = ti.productId
      JOIN Ticket t ON t.id = ti.ticketId
      WHERE t.isWarrantyService = true 
        AND t.status = 'ENTREGADO'
        AND t.deliveredAt >= ${startDate}
    ` as Array<{ total: number }>;

    // Gastos operativos del período
    const operatingExpenses = await prisma.cashMovement.aggregate({
      where: {
        type: 'EXPENSE',
        category: { in: ['FIXED_EXPENSE', 'SALARY', 'SUPPLIES', 'MAINTENANCE'] },
        createdAt: { gte: startDate },
      },
      _sum: { amount: true },
    });

    const grossProfit = (salesProfit._sum.subtotal || 0) - (salesCost[0]?.total || 0) + (servicesProfit._sum.subtotal || 0);
    const netProfit = grossProfit - (warrantyLoss[0]?.total || 0) - (operatingExpenses._sum.amount || 0);

    return {
      period,
      startDate,
      metrics: {
        salesRevenue: salesProfit._sum.subtotal || 0,
        salesCost: salesCost[0]?.total || 0,
        salesProfit: (salesProfit._sum.subtotal || 0) - (salesCost[0]?.total || 0),
        servicesRevenue: servicesProfit._sum.subtotal || 0,
        servicesProfit: servicesProfit._sum.subtotal || 0, // En servicios, el margen es mayor
        warrantyLoss: warrantyLoss[0]?.total || 0,
        operatingExpenses: operatingExpenses._sum.amount || 0,
        grossProfit,
        netProfit,
        profitMargin: grossProfit > 0 ? ((grossProfit / ((salesProfit._sum.subtotal || 0) + (servicesProfit._sum.subtotal || 0))) * 100).toFixed(2) : '0',
      },
    };
  } catch (error) {
    console.error('Error calculando KPIs:', error);
    return null;
  }
}

/**
 * Obtener datos para gráfico comparativo
 */
export async function getProfitComparison(period: 'week' | 'month' = 'month') {
  try {
    const now = new Date();
    const currentStart = new Date();
    const previousStart = new Date();

    if (period === 'month') {
      currentStart.setDate(1);
      currentStart.setHours(0, 0, 0, 0);
      
      previousStart.setMonth(previousStart.getMonth() - 1);
      previousStart.setDate(1);
      previousStart.setHours(0, 0, 0, 0);
    } else {
      const dayOfWeek = now.getDay();
      currentStart.setDate(now.getDate() - dayOfWeek);
      currentStart.setHours(0, 0, 0, 0);
      
      previousStart.setDate(previousStart.getDate() - dayOfWeek - 7);
      previousStart.setHours(0, 0, 0, 0);
    }

    // Período actual
    const current = await getProfitKPIs(period);
    
    // Período anterior (cálculo manual)
    const previousSales = await prisma.$queryRaw`
      SELECT SUM(si.subtotal - (si.quantity * p.costPrice)) as profit
      FROM SaleItem si
      JOIN Product p ON p.id = si.productId
      JOIN Sale s ON s.id = si.saleId
      WHERE s.createdAt >= ${previousStart} AND s.createdAt < ${currentStart} AND s.isDeleted = false
    ` as Array<{ profit: number }>;

    const previousServices = await prisma.ticketItem.aggregate({
      where: {
        ticket: {
          deliveredAt: { gte: previousStart, lt: currentStart },
          status: 'ENTREGADO',
          isWarrantyService: false,
        },
      },
      _sum: { subtotal: true },
    });

    const previousTotal = (previousSales[0]?.profit || 0) + (previousServices._sum.subtotal || 0);
    const currentTotal = current?.metrics.netProfit || 0;

    const change = previousTotal !== 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

    return {
      current: {
        period: 'actual',
        profit: currentTotal,
      },
      previous: {
        period: 'anterior',
        profit: previousTotal,
      },
      change: {
        absolute: currentTotal - previousTotal,
        percentage: change.toFixed(2),
        trend: change >= 0 ? 'up' : 'down',
      },
    };
  } catch (error) {
    console.error('Error en comparación:', error);
    return null;
  }
}

/**
 * Obtener ganancia por categoría de producto
 */
export async function getProfitByCategory() {
  try {
    const categories = await prisma.productCategory.findMany({
      include: {
        products: {
          where: { isDeleted: false },
        },
      },
    });

    const result = await Promise.all(
      categories.map(async (category) => {
        const productIds = category.products.map(p => p.id);
        
        if (productIds.length === 0) {
          return {
            categoryName: category.name,
            revenue: 0,
            cost: 0,
            profit: 0,
            margin: 0,
            itemsSold: 0,
          };
        }

        const sales = await prisma.$queryRaw`
          SELECT 
            SUM(si.subtotal) as revenue,
            SUM(si.quantity * p.costPrice) as cost,
            SUM(si.quantity) as itemsSold
          FROM SaleItem si
          JOIN Product p ON p.id = si.productId
          JOIN Sale s ON s.id = si.saleId
          WHERE si.productId IN (${productIds.join(',')}) AND s.isDeleted = false
        ` as Array<{ revenue: number; cost: number; itemsSold: number }>;

        const revenue = sales[0]?.revenue || 0;
        const cost = sales[0]?.cost || 0;
        const profit = revenue - cost;
        const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : '0';

        return {
          categoryName: category.name,
          revenue,
          cost,
          profit,
          margin: parseFloat(margin),
          itemsSold: sales[0]?.itemsSold || 0,
        };
      })
    );

    return result.filter(r => r.profit !== 0).sort((a, b) => b.profit - a.profit);
  } catch (error) {
    console.error('Error obteniendo ganancias por categoría:', error);
    return [];
  }
}

/**
 * Obtener resumen diario/semanal/mensual para gráfico
 */
export async function getProfitTimeline(type: 'day' | 'week' | 'month' = 'week') {
  try {
    const days = type === 'day' ? 24 : type === 'week' ? 7 : 30;
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // Ventas del día
      const sales = await prisma.$queryRaw`
        SELECT SUM(si.subtotal - (si.quantity * p.costPrice)) as profit
        FROM SaleItem si
        JOIN Product p ON p.id = si.productId
        JOIN Sale s ON s.id = si.saleId
        WHERE s.createdAt >= ${date} AND s.createdAt < ${nextDate} AND s.isDeleted = false
      ` as Array<{ profit: number }>;

      // Servicios del día
      const services = await prisma.ticketItem.aggregate({
        where: {
          ticket: {
            deliveredAt: { gte: date, lt: nextDate },
            status: 'ENTREGADO',
            isWarrantyService: false,
          },
        },
        _sum: { subtotal: true },
      });

      // Garantías del día
      const warranties = await prisma.$queryRaw`
        SELECT SUM(ti.quantity * p.costPrice) as loss
        FROM TicketItem ti
        JOIN Product p ON p.id = ti.productId
        JOIN Ticket t ON t.id = ti.ticketId
        WHERE t.isWarrantyService = true 
          AND t.status = 'ENTREGADO'
          AND t.deliveredAt >= ${date} AND t.deliveredAt < ${nextDate}
      ` as Array<{ loss: number }>;

      const totalProfit = (sales[0]?.profit || 0) + (services._sum.subtotal || 0) - (warranties[0]?.loss || 0);

      data.push({
        date: date.toISOString().split('T')[0],
        label: type === 'day' 
          ? `${String(date.getHours()).padStart(2, '0')}:00`
          : `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
        sales: sales[0]?.profit || 0,
        services: services._sum.subtotal || 0,
        warranties: -(warranties[0]?.loss || 0),
        total: totalProfit,
      });
    }

    return data;
  } catch (error) {
    console.error('Error obteniendo timeline:', error);
    return [];
  }
}

/**
 * Obtener gastos operativos detallados
 */
export async function getOperatingExpenses(period: 'day' | 'week' | 'month' = 'month') {
  try {
    const now = new Date();
    let startDate = new Date();
    
    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      const dayOfWeek = now.getDay();
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    const expenses = await prisma.cashMovement.groupBy({
      by: ['category'],
      where: {
        type: 'EXPENSE',
        category: { in: ['FIXED_EXPENSE', 'SALARY', 'SUPPLIES', 'MAINTENANCE', 'OTHER'] },
        createdAt: { gte: startDate },
      },
      _sum: { amount: true },
      _count: true,
    });

    const total = expenses.reduce((sum, e) => sum + (e._sum.amount || 0), 0);

    return {
      expenses: expenses.map(e => ({
        category: e.category,
        amount: e._sum.amount || 0,
        count: e._count,
        percentage: total > 0 ? (((e._sum.amount || 0) / total) * 100).toFixed(2) : '0',
      })),
      total,
      period,
    };
  } catch (error) {
    console.error('Error obteniendo gastos:', error);
    return null;
  }
}

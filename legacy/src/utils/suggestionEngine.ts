import { Product, Order, ReplenishmentSchedule, SmartSuggestion, SmartSuggestionsSummary, SuggestionUrgency } from '../types';

export function calculateSmartSuggestions(
  products: Product[] = [],
  orders: Order[] = [],
  schedules: ReplenishmentSchedule[] = [],
  surgeFactor = 1.0,
  referenceDate = new Date('2026-08-31T12:00:00')
): SmartSuggestionsSummary {
  const dayNamesEs = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const monthNamesEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const safeProducts = Array.isArray(products) ? products : [];
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeSchedules = Array.isArray(schedules) ? schedules : [];

  const suggestions: SmartSuggestion[] = safeProducts.map((product) => {
    // 1. Analyze historical orders for this product
    const matchingOrderItems: { orderDate: string; quantity: number; unitPrice: number; orderNumber: string }[] = [];

    safeOrders.forEach((order) => {
      if (order && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (item && (item.productId === product.id || (item.productName && product.name && item.productName.toLowerCase().includes(product.name.toLowerCase().split(' ')[0])))) {
            matchingOrderItems.push({
              orderDate: order.date || '2026-08-01',
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || product.basePrice,
              orderNumber: order.orderNumber || 'PED'
            });
          }
        });
      }
    });

    const historicalOrderCount = matchingOrderItems.length;
    let lastOrderedDate: string | undefined = undefined;
    let daysSinceLastOrder: number | undefined = undefined;
    let avgOrderIntervalDays: number | undefined = undefined;

    if (matchingOrderItems.length > 0) {
      // Sort descending by date
      matchingOrderItems.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
      lastOrderedDate = matchingOrderItems[0].orderDate;
      const lastOrderTime = new Date(lastOrderedDate).getTime();
      daysSinceLastOrder = Math.max(1, Math.round((referenceDate.getTime() - lastOrderTime) / (1000 * 60 * 60 * 24)));

      if (matchingOrderItems.length >= 2) {
        const oldestTime = new Date(matchingOrderItems[matchingOrderItems.length - 1].orderDate).getTime();
        const totalSpanDays = Math.max(1, Math.round((lastOrderTime - oldestTime) / (1000 * 60 * 60 * 24)));
        avgOrderIntervalDays = Math.round(totalSpanDays / (matchingOrderItems.length - 1));
      } else {
        avgOrderIntervalDays = 14; // Default estimate
      }
    }

    // 2. Consumption & Burn Rate calculation
    const baseDailyBurn = (product.dailyBurnRate && product.dailyBurnRate > 0) ? product.dailyBurnRate : 1.0;
    const effectiveBurnRate = Number((baseDailyBurn * surgeFactor).toFixed(2));
    const currentStock = product.currentStockOnPremise ?? 0;
    const estimatedDaysLeft = Math.max(0.1, Number((currentStock / effectiveBurnRate).toFixed(1)));

    // 3. Predicted Depletion Date calculation
    const depletionDateObj = new Date(referenceDate.getTime() + estimatedDaysLeft * 24 * 60 * 60 * 1000);
    const yyyy = depletionDateObj.getFullYear();
    const mm = String(depletionDateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(depletionDateObj.getDate()).padStart(2, '0');
    const predictedDepletionDate = `${yyyy}-${mm}-${dd}`;
    const dayOfWeek = dayNamesEs[depletionDateObj.getDay()];
    const monthName = monthNamesEs[depletionDateObj.getMonth()];
    const predictedDepletionDayName = `${dayOfWeek} ${dd} ${monthName}`;

    // 4. Urgency Classification
    let urgencyLevel: SuggestionUrgency = 'moderate';
    if (estimatedDaysLeft <= 3.0) {
      urgencyLevel = 'critical';
    } else if (estimatedDaysLeft <= 6.5) {
      urgencyLevel = 'warning';
    }

    // 5. Wholesale Tier Optimization & Suggested Quantity
    const targetDaysCoverage = 18;
    const targetDemandUnits = Math.ceil(effectiveBurnRate * targetDaysCoverage);
    let suggestedQuantity = Math.max(1, targetDemandUnits);

    let suggestedUnitPrice = product.basePrice || 0;
    let appliedDiscountPercentage = 0;
    let recommendedTierNote: string | undefined = undefined;

    if (Array.isArray(product.wholesaleTiers) && product.wholesaleTiers.length > 0) {
      const sortedTiers = [...product.wholesaleTiers].sort((a, b) => a.minKg - b.minKg);
      
      let bestTier = sortedTiers[0];
      for (const tier of sortedTiers) {
        if (targetDemandUnits >= tier.minKg || (tier.minKg - targetDemandUnits <= 3 && tier.discountPercentage > 0)) {
          bestTier = tier;
        }
      }

      suggestedQuantity = Math.max(suggestedQuantity, bestTier.minKg || 1);
      suggestedUnitPrice = bestTier.unitPrice;
      appliedDiscountPercentage = bestTier.discountPercentage;
      
      if (bestTier.discountPercentage > 0) {
        recommendedTierNote = `Escala Mayorista: ${bestTier.discountPercentage}% de descuento por lote de ${bestTier.minKg}+ unidades`;
      }
    }

    const totalBaseCost = (product.basePrice || 0) * suggestedQuantity;
    const totalSuggestedCost = Number((suggestedUnitPrice * suggestedQuantity).toFixed(2));
    const estimatedSavings = Number((totalBaseCost - totalSuggestedCost).toFixed(2));

    // 6. Check Active Replenishment Schedule
    const matchingSchedule = safeSchedules.find(
      (s) => s && (s.productId === product.id || (s.productName && product.name && s.productName.toLowerCase().includes(product.name.toLowerCase().split(' ')[0]))) && s.status === 'active'
    );
    const hasActiveSchedule = Boolean(matchingSchedule);
    const activeScheduleDays = matchingSchedule ? matchingSchedule.scheduledDays : undefined;

    // 7. Reasoning and AI Confidence
    let reason = '';
    const unitLabel = (product.unit || 'unidades').split(' ')[0];

    if (urgencyLevel === 'critical') {
      reason = `Riesgo inminente de desabastecimiento: Con ${currentStock} ${unitLabel} en bodega y un consumo de ${effectiveBurnRate} ${unitLabel}/día, tu stock se agotará el ${predictedDepletionDayName}. `;
      if (historicalOrderCount > 0) {
        reason += `Históricamente reordenas cada ~${avgOrderIntervalDays} días. `;
      }
      if (estimatedSavings > 0) {
        reason += `Aprovecha el lote de ${suggestedQuantity} ${unitLabel} para ahorrar $${estimatedSavings.toFixed(2)} USD (-${appliedDiscountPercentage}%).`;
      }
    } else if (urgencyLevel === 'warning') {
      reason = `Rotación acelerada: Quedan ${currentStock} ${unitLabel} (${estimatedDaysLeft} días de cobertura). Se proyecta quiebre el ${predictedDepletionDayName}. `;
      if (hasActiveSchedule) {
        reason += `Tienes despacho programado los ${activeScheduleDays?.join(', ')}, pero sugerimos adelantar volumen.`;
      } else {
        reason += `Sugerimos reabastecer ${suggestedQuantity} ${unitLabel} para cubrir las próximas 2 semanas y evitar retrasos de tostaduría.`;
      }
    } else {
      reason = `Insumo de alta rotación con stock estable (${estimatedDaysLeft} días restantes). Cobertura proyectada hasta el ${predictedDepletionDayName}.`;
    }

    // AI Confidence Score based on data consistency
    let aiConfidenceScore = 92;
    if (historicalOrderCount >= 3) aiConfidenceScore = 98;
    else if (historicalOrderCount >= 1) aiConfidenceScore = 95;
    if (surgeFactor > 1.0) aiConfidenceScore = Math.min(99, aiConfidenceScore + 1);

    return {
      id: `sug-${product.id}`,
      productId: product.id,
      productName: product.name,
      category: product.category,
      imageUrl: product.imageUrl,
      currentStock,
      optimalStockLevel: product.optimalStockLevel,
      unit: product.unit,
      unitWeightKg: product.unitWeightKg,
      basePrice: product.basePrice,
      dailyBurnRate: product.dailyBurnRate,
      effectiveBurnRate,
      estimatedDaysLeft,
      predictedDepletionDate,
      predictedDepletionDayName,
      suggestedQuantity,
      suggestedUnitPrice,
      appliedDiscountPercentage,
      estimatedSavings,
      totalSuggestedCost,
      urgencyLevel,
      historicalOrderCount,
      lastOrderedDate,
      daysSinceLastOrder,
      avgOrderIntervalDays,
      reason,
      aiConfidenceScore,
      recommendedTierNote,
      hasActiveSchedule,
      activeScheduleDays
    };
  });

  // Sort suggestions: Critical first, then Warning, then Moderate; then by lowest days remaining
  suggestions.sort((a, b) => {
    const score = { critical: 0, warning: 1, moderate: 2 };
    if (score[a.urgencyLevel] !== score[b.urgencyLevel]) {
      return score[a.urgencyLevel] - score[b.urgencyLevel];
    }
    return a.estimatedDaysLeft - b.estimatedDaysLeft;
  });

  const criticalCount = (suggestions || []).filter((s) => s && s.urgencyLevel === 'critical').length;
  const warningCount = (suggestions || []).filter((s) => s && s.urgencyLevel === 'warning').length;
  const moderateCount = (suggestions || []).filter((s) => s && s.urgencyLevel === 'moderate').length;

  const totalPotentialSavings = Number(
    (suggestions || [])
      .filter((s) => s && (s.urgencyLevel === 'critical' || s.urgencyLevel === 'warning'))
      .reduce((acc, s) => acc + (s ? s.estimatedSavings || 0 : 0), 0)
      .toFixed(2)
  );

  const urgentItemsCost = Number(
    (suggestions || [])
      .filter((s) => s && (s.urgencyLevel === 'critical' || s.urgencyLevel === 'warning'))
      .reduce((acc, s) => acc + (s ? s.totalSuggestedCost || 0 : 0), 0)
      .toFixed(2)
  );

  const totalSuggestedCost = Number(
    (suggestions || []).reduce((acc, s) => acc + (s ? s.totalSuggestedCost || 0 : 0), 0).toFixed(2)
  );

  const averageCoverageDays = Number(
    ((suggestions || []).reduce((acc, s) => acc + (s ? s.estimatedDaysLeft || 0 : 0), 0) / Math.max(1, suggestions.length)).toFixed(1)
  );

  return {
    criticalCount,
    warningCount,
    moderateCount,
    totalPotentialSavings,
    averageCoverageDays,
    totalSuggestedCost,
    urgentItemsCost,
    suggestions
  };
}

import { reportingFields } from "@/utils/constant";

import { CalculatedField, FieldValue } from "@/types";
import { formatCurrency } from "@/utils/page-utils/commonUtils";

export const getStatsCards = (calculatedValues: FieldValue) => {
    const overUnderBudget = reportingFields.targets.find(f => f.value === 'overUnderBudget') as CalculatedField;
    const weeklyBudget = reportingFields.targets.find(f => f.value === 'weeklyBudget') as CalculatedField;
    const budgetSpent = reportingFields.targets.find(f => f.value === 'budgetSpent') as CalculatedField;
    
    return [
        {
            title: overUnderBudget?.name || '',
            value: formatCurrency(calculatedValues?.overUnderBudget || 0)
        },
        {
            title: weeklyBudget?.name || '',
            value: formatCurrency(calculatedValues?.weeklyBudget || 0)
        },
        {
            title: budgetSpent?.name || '',
            value: formatCurrency(calculatedValues?.budgetSpent || 0)
        }
    ]
}
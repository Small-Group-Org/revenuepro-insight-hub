import { reportingFields } from "@/utils/constant";

import { CalculatedField, FieldValue } from "@/types";
import { formatCurrency } from "@/utils/page-utils/commonUtils";

export const getStatsCards = (calculatedValues: FieldValue, isLoadingCampaignData?: boolean, hasMetaIntegration?: boolean) => {
    const overUnderBudget = reportingFields.targets.find(f => f.value === 'overUnderBudget') as CalculatedField;
    const weeklyBudget = reportingFields.targets.find(f => f.value === 'weeklyBudget') as CalculatedField;
    const budgetSpent = reportingFields.targets.find(f => f.value === 'budgetSpent') as CalculatedField;
    
    // Show "-" for budgetSpent when meta integration is active and campaign data is still loading
    const budgetSpentValue = (isLoadingCampaignData && hasMetaIntegration) 
        ? '-' 
        : formatCurrency(calculatedValues?.budgetSpent || 0);
    
    // Show "-" for overUnderBudget when budgetSpent is loading
    const overUnderBudgetValue = (isLoadingCampaignData && hasMetaIntegration)
        ? '-'
        : formatCurrency(calculatedValues?.overUnderBudget || 0);
    
    return [
        {
            title: overUnderBudget?.name || '',
            value: overUnderBudgetValue
        },
        {
            title: weeklyBudget?.name || '',
            value: formatCurrency(calculatedValues?.weeklyBudget || 0)
        },
        {
            title: budgetSpent?.name || '',
            value: budgetSpentValue
        }
    ]
}
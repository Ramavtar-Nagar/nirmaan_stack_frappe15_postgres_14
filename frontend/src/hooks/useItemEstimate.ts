import { ApprovedQuotations } from '@/types/NirmaanStack/ApprovedQuotations'; // Assuming this type
import getThreeMonthsLowestFiltered from '@/utils/getThreeMonthsLowest';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { useMemo } from 'react';

export const useItemEstimate = (threshold: number = 2) => {
  const { data: quote_data } = useFrappeGetDocList<ApprovedQuotations>(
    'Approved Quotations',
    {
      fields: ['*'],
      limit: 100000,
    },
    `Approved Quotations`
  );

  const getItemEstimate = useMemo(
    () => (itemId : string) : number => {
      return getThreeMonthsLowestFiltered(quote_data, itemId, threshold)
    }
  , [quote_data]);

  return { getItemEstimate };
};
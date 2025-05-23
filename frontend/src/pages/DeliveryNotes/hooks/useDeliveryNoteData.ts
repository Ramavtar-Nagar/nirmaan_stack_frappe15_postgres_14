// src/hooks/useDeliveryNoteData.ts
import { FrappeDoc, useFrappeGetDoc } from 'frappe-react-sdk';
import { useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { decodeFrappeId, derivePoIdFromDnId } from '../constants'; // Adjust path
import { ProcurementOrder } from '@/types/NirmaanStack/ProcurementOrders';
import { KeyedMutator } from 'swr';

interface UseDeliveryNoteDataResult {
  deliveryNoteId: string | null;
  poId: string | null;
  data: ProcurementOrder | null;
  isLoading: boolean;
  error: Error | null;
  mutate: KeyedMutator<FrappeDoc<ProcurementOrder>>,
}

export function useDeliveryNoteData(): UseDeliveryNoteDataResult {
  const { dnId: encodedDnId } = useParams<{ dnId: string }>();

  const deliveryNoteId = useMemo(() => {
    if (!encodedDnId) return null;
    try {
        return decodeFrappeId(encodedDnId);
    } catch (e) {
        console.error("Error decoding DN ID:", e);
        return null; // Or handle error appropriately
    }
  }, [encodedDnId]);

  const poId = useMemo(() => {
    if (!deliveryNoteId) return null;
    try {
        return derivePoIdFromDnId(deliveryNoteId);
    } catch(e) {
        console.error("Error deriving PO ID:", e);
        return null;
    }
  }, [deliveryNoteId]);

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useFrappeGetDoc<ProcurementOrder>(
    "Procurement Orders", // Fetching the PO DocType
    poId!, // Use the derived PO ID
    poId ? `procurement_order_${poId}` : null
  );

  // Handle the case where the hook returns `undefined` for data when loading/error
  const safeData = data || null;
  const typedError = error instanceof Error ? error : null; // Ensure error is an Error object

  return {
    deliveryNoteId,
    poId,
    data: safeData,
    isLoading,
    error: typedError,
    mutate,
  };
}
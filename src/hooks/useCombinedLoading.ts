import { useMemo } from 'react';
import { useReportingDataStore } from '@/stores/reportingDataStore';
import { useTargetStore } from '@/stores/targetStore';
import { useUserStore } from '@/stores/userStore';

export const useCombinedLoading = () => {
  const { isLoading: isReportingLoading } = useReportingDataStore();
  const { isLoading: isTargetLoading } = useTargetStore();
  const { loading: isUserLoading } = useUserStore();

  const isLoading = useMemo(() => {
    return isReportingLoading || isTargetLoading || isUserLoading;
  }, [isReportingLoading, isTargetLoading, isUserLoading]);

  return {
    isLoading,
    isReportingLoading,
    isTargetLoading,
    isUserLoading
  };
};

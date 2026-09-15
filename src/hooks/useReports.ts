import { useMutation } from '@tanstack/react-query';

import { reportsApi, toApiError } from '../api';
import type { CreateReportRequest } from '../api/types';
import { useToastStore } from '../store/toastStore';

export function useCreateReport() {
  const show = useToastStore(s => s.show);
  return useMutation({
    mutationFn: (body: CreateReportRequest) => reportsApi.create(body),
    onSuccess: () => show('Thanks, our team will review this report.', 'success'),
    onError: error => {
      const apiError = toApiError(error);
      show(apiError.message, apiError.status === 409 ? 'info' : 'error');
    },
  });
}

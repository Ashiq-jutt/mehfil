import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import { catalogApi } from '../../../api/catalog';
import { reportsApi } from '../../../api/reports';
import { useAuthStore } from '../../../store/authStore';
import { toast } from '../../../store/toastStore';
import { ReportDialog } from '../ReportDialog';

jest.mock('../../../api/catalog', () => ({
  catalogApi: {
    getReportReasons: jest.fn(async () => [
      { code: 'bullying', label: 'Bullying or harassment' },
      { code: 'spam', label: 'Spam or scam' },
    ]),
  },
}));

jest.mock('../../../api/reports', () => ({
  reportsApi: { create: jest.fn(async () => ({ id: 1, targetType: 'Club', targetId: '29451765', reason: 'spam', status: 'Open', createdAt: '' })) },
}));

let client: QueryClient | null = null;

function renderDialog(onClose = jest.fn()) {
  // Garbage collection is scheduled when the last observer unmounts, which happens after this
  // test's afterEach; gcTime 0 on both caches keeps those timers from outliving the run.
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <ReportDialog visible onClose={onClose} targetType="Club" targetId="29451765" targetLabel="Club · ANAYA" />
    </QueryClientProvider>,
  );
}

describe('ReportDialog', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'signedIn' });
    jest.clearAllMocks();
  });

  afterEach(() => {
    client?.clear();
    client = null;
    toast.clear();
  });

  it('loads reasons, requires one, then submits and closes', async () => {
    const onClose = jest.fn();
    await renderDialog(onClose);

    await waitFor(() => expect(screen.getByText('Spam or scam')).toBeTruthy());
    expect(catalogApi.getReportReasons).toHaveBeenCalledTimes(1);

    // Submit is disabled until a reason is picked.
    await fireEvent.press(screen.getByText('Submit report'));
    expect(reportsApi.create).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText('Spam or scam'));
    await fireEvent.press(screen.getByText('Submit report'));

    await waitFor(() => expect(reportsApi.create).toHaveBeenCalledWith({ targetType: 'Club', targetId: '29451765', reason: 'spam', details: null }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Simple fetch mock helper
function mockFetchSequence(sequence: Array<{ matcher: RegExp | string, method?: string, response: any, status?: number }>) {
  const calls: any[] = [];
  (globalThis as any).fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = (init?.method || 'GET').toUpperCase();
    calls.push({ url, method, body: init?.body });
    const index = sequence.findIndex((s) => {
      const urlMatch = typeof s.matcher === 'string' ? url.includes(s.matcher) : s.matcher.test(url);
      const methodMatch = (s.method || 'GET').toUpperCase() === method;
      return urlMatch && methodMatch;
    });
    if (index === -1) {
      console.warn('Unmatched fetch', url, method);
      return new Response(JSON.stringify({}), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    const match = sequence.splice(index, 1)[0];
    return new Response(JSON.stringify(match.response), { status: match.status ?? 200, headers: { 'Content-Type': 'application/json' } });
  }) as any;
  return { calls };
}

function renderApp() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <App />
    </QueryClientProvider>
  );
}

describe('Chat flows', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1-8: end-to-end happy path with upload, NL->SQL, XmR chart confirmation', async () => {
    const user = userEvent.setup();

    // Initial data-sources GET, conversations GET, messages GET for no conversation
    mockFetchSequence([
      { matcher: /\/api\/data-sources$/, response: [{ id: 1, userId: 1, name: 'CSV Source', type: 'csv', createdAt: new Date().toISOString() }] },
      { matcher: /\/api\/conversations$/, response: [] },
      // When messages for null conversation are disabled, no call
      // Upload CSV
      { matcher: /\/api\/csv-upload$/, method: 'POST', response: { id: 10, userId: 1, filename: 'data.csv', originalName: 'data.csv', size: 100, createdAt: new Date().toISOString(), data_source_id: 1, conversation_id: 42, columns: ['date','value'], row_count: 5, message: 'uploaded' } },
      // After upload, conversations GET shows list (not required for flow)
      { matcher: /\/api\/conversations$/, response: [] },
      // FE creates a conversation on first send
      { matcher: /\/api\/conversations$/, method: 'POST', response: { id: 99, userId: 1, title: 'Summarise the uploaded file', createdAt: new Date().toISOString() } },
      // Messages GET for conversation 99
      { matcher: /\/api\/conversations\/99\/messages$/, response: [] },
      // Send natural language chat -> backend returns assistant with sqlQuery and sqlResults
      { matcher: /\/api\/chat$/, method: 'POST', response: { id: 100, conversationId: 99, role: 'assistant', content: 'Here is a summary and analysis', sqlQuery: 'SELECT * FROM t', sqlResults: [{ date: '2024-01-01', value: 10 }, { date: '2024-01-02', value: 12 }], createdAt: new Date().toISOString() } },
      // Ask to create XmR chart -> assistant confirms details
      { matcher: /\/api\/chat$/, method: 'POST', response: { id: 101, conversationId: 99, role: 'assistant', content: 'Confirm: dates 2024-01-01..2024-01-02, values from column value?', createdAt: new Date().toISOString() } },
      // User confirms -> assistant returns chartData
      { matcher: /\/api\/chat$/, method: 'POST', response: { id: 102, conversationId: 99, role: 'assistant', content: 'XmR chart created', chartData: { type: 'xmr', data: [{ x: '2024-01-01', y: 10 }, { x: '2024-01-02', y: 12 }], insights: { processStable: true, outOfControlPoints: [], averageValue: 11, averageRange: 2 } }, createdAt: new Date().toISOString() } },
    ]);

    renderApp();

    // 1. User starts a chat -> select data source already auto-selected, click New Query
    const newQueryButtons = await screen.findAllByText('New Query');
    await user.click(newQueryButtons[0]);

    // 2. User uploads a file -> open upload from input area button
    const uploadButtons = await screen.findAllByText('Upload CSV');
    await user.click(uploadButtons[0]);

    // Interact with the modal: simulate file selection and upload
    const input = await screen.findByLabelText('CSV File');
    const file = new File(['date,value\n2024-01-01,10'], 'data.csv', { type: 'text/csv' });
    await user.upload(input as HTMLInputElement, file);

    const uploadAndProcess = await screen.findByText('Upload & Process');
    await user.click(uploadAndProcess);

    // Ensure messages API for conversation 42 is ready
    await screen.findByText(/XMR Data Insights/i);

    // 3. User asks the agent to understand the file content and summarise content
    const textarea = await screen.findByPlaceholderText(/Ask anything about your data/i);
    await user.type(textarea, 'Summarise the uploaded file');
    const sendBtn = await screen.findByRole('button', { name: /Send/i });
    await user.click(sendBtn);

    // The assistant response with summary should appear
    await screen.findByText(/summary and analysis/i);

    // 4. User asks a question (NL->SQL)
    await user.type(textarea, 'What is the trend?');
    await user.click(sendBtn);
    await screen.findByText(/Confirm:/i);

    // 5-6-7. Confirmation flow
    await user.type(textarea, 'Yes, proceed');
    await user.click(sendBtn);

    // 8. Agent creates XmR chart -> chart component rendered (header)
    await screen.findByText('XmR Chart');

    // Verify SQL table rendered earlier
    await screen.findByText('Export CSV');
  });
});



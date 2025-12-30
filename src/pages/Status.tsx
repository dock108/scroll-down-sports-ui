import { getApiBaseUrl, getAppVersion, useMockAdapters } from '../utils/env';
import { PageLayout } from '../components/layout/PageLayout';

export const Status = () => {
  const apiUrl = getApiBaseUrl();
  const version = getAppVersion();

  return (
    <PageLayout header="Status" contentClassName="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Scroll Down Sports UI</h1>
        <p className="mt-2 text-sm text-gray-600">
          The UI is running. Use this endpoint for health checks.
        </p>
        <dl className="mt-4 space-y-2 text-sm text-gray-700">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="font-medium text-gray-500">Version</dt>
            <dd className="font-mono">{version}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="font-medium text-gray-500">API Base URL</dt>
            <dd className="font-mono">{apiUrl || 'Not configured'}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="font-medium text-gray-500">Mock Adapters</dt>
            <dd>{useMockAdapters() ? 'Enabled' : 'Disabled'}</dd>
          </div>
        </dl>
      </section>
    </PageLayout>
  );
};

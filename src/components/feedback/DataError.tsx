import { getApiBaseUrl } from '../../utils/env';

interface DataErrorProps {
  message: string;
  onRetry?: () => void;
}

export const DataError = ({ message, onRetry }: DataErrorProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="max-w-md text-center space-y-4">
        <div className="text-red-500 text-5xl">⚠</div>
        <h2 className="text-xl font-semibold text-gray-800">Data Unavailable</h2>
        <p className="text-gray-600">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-primary btn-primary--sm btn-primary--rounded btn-primary--hover-strong"
          >
            Try Again
          </button>
        )}
        <p className="text-xs text-gray-400 mt-4">
          API: {getApiBaseUrl() || 'Not configured'}
        </p>
      </div>
    </div>
  );
};

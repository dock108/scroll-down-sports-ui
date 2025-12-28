interface DataErrorProps {
  message: string;
  onRetry?: () => void;
}

const DataError = ({ message, onRetry }: DataErrorProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="max-w-md text-center space-y-4">
        <div className="text-red-500 text-5xl">⚠</div>
        <h2 className="text-xl font-semibold text-gray-800">Data Unavailable</h2>
        <p className="text-gray-600">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="min-h-[48px] rounded-full bg-blue-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-700"
          >
            Try Again
          </button>
        )}
        <p className="text-xs text-gray-400 mt-4">
          API: {import.meta.env.VITE_SPORTS_API_URL || 'Not configured'}
        </p>
      </div>
    </div>
  );
};

export default DataError;

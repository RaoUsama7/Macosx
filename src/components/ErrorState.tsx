type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export default function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center"
    >
      <h2 className="text-lg font-semibold text-red-900">{title}</h2>
      <p className="mt-2 text-sm text-red-800">{message}</p>
      {onRetry ? (
        <button
          type="button"
          className="mt-6 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-900 shadow-sm transition hover:bg-red-50"
          onClick={onRetry}
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

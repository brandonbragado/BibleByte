import type { ReactNode } from "react";
import { EmptyState, ErrorState, LoadingState } from "./states";

type QueryStateBoundaryProps = {
  isLoading: boolean;
  isError: boolean;
  isEmpty?: boolean;
  loadingMessage: string;
  errorTitle: string;
  errorMessage: string;
  emptyTitle?: string;
  emptyMessage?: string;
  onRetry?: () => void;
  children: ReactNode;
};

export function QueryStateBoundary({
  isLoading,
  isError,
  isEmpty = false,
  loadingMessage,
  errorTitle,
  errorMessage,
  emptyTitle,
  emptyMessage,
  onRetry,
  children
}: QueryStateBoundaryProps) {
  if (isLoading) {
    return <LoadingState message={loadingMessage} />;
  }

  if (isError) {
    return <ErrorState title={errorTitle} message={errorMessage} actionLabel="Retry" onActionPress={onRetry} />;
  }

  if (isEmpty && emptyTitle && emptyMessage) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return <>{children}</>;
}

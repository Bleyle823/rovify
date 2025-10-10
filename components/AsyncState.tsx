'use client';

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiRefreshCw, FiWifi, FiWifiOff } from 'react-icons/fi';
import LoadingSpinner, { SkeletonCard, SkeletonText, SkeletonButton } from '@/components/LoadingSpinner';
import { AppError } from '@/utils/error-handling';

interface AsyncStateProps {
  isLoading?: boolean;
  error?: AppError | Error | string | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
  emptyComponent?: ReactNode;
  className?: string;
}

export default function AsyncState({
  isLoading = false,
  error = null,
  isEmpty = false,
  emptyMessage = 'No data available',
  emptyIcon,
  onRetry,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  className = '',
}: AsyncStateProps) {
  const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;
    if (error instanceof AppError) return error.message;
    if (error instanceof Error) return error.message;
    return 'An unexpected error occurred';
  };

  const getErrorTitle = (error: any): string => {
    if (error instanceof AppError) {
      switch (error.status) {
        case 400:
          return 'Invalid Request';
        case 401:
          return 'Authentication Required';
        case 403:
          return 'Access Denied';
        case 404:
          return 'Not Found';
        case 409:
          return 'Conflict';
        case 422:
          return 'Validation Error';
        case 429:
          return 'Too Many Requests';
        case 500:
          return 'Server Error';
        case 502:
        case 503:
        case 504:
          return 'Service Unavailable';
        default:
          return 'Error';
      }
    }
    return 'Error';
  };

  const isNetworkError = (error: any): boolean => {
    if (error instanceof AppError) {
      return error.code === 'NETWORK_ERROR';
    }
    return false;
  };

  const isRetryable = (error: any): boolean => {
    if (error instanceof AppError) {
      return error.isRetryable;
    }
    return false;
  };

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {loadingComponent || (
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            )}
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-12 px-4"
          >
            {errorComponent || (
              <div className="text-center max-w-md">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  {isNetworkError(error) ? (
                    <FiWifiOff className="w-8 h-8 text-red-600" />
                  ) : (
                    <FiAlertCircle className="w-8 h-8 text-red-600" />
                  )}
                </motion.div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {getErrorTitle(error)}
                </h3>
                
                <p className="text-gray-600 mb-6">
                  {getErrorMessage(error)}
                </p>

                {error instanceof AppError && error.suggestions && error.suggestions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Suggestions:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {error.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-gray-400 mt-1">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {onRetry && isRetryable(error) && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF5722] text-white rounded-lg font-medium hover:bg-[#E64A19] transition-colors"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    Try Again
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        ) : isEmpty ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-12 px-4"
          >
            {emptyComponent || (
              <div className="text-center max-w-md">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  {emptyIcon || (
                    <FiAlertCircle className="w-8 h-8 text-gray-400" />
                  )}
                </motion.div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {emptyMessage}
                </h3>
                
                <p className="text-gray-600">
                  There's nothing to show here yet.
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Specialized components for common use cases
export function LoadingState({ message = 'Loading...', className = '' }: { message?: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <LoadingSpinner size="lg" text={message} />
    </div>
  );
}

export function ErrorState({ 
  error, 
  onRetry, 
  className = '' 
}: { 
  error: AppError | Error | string; 
  onRetry?: () => void; 
  className?: string; 
}) {
  return (
    <AsyncState
      error={error}
      onRetry={onRetry}
      className={className}
    >
      <div />
    </AsyncState>
  );
}

export function EmptyState({ 
  message = 'No data available', 
  icon, 
  className = '' 
}: { 
  message?: string; 
  icon?: ReactNode; 
  className?: string; 
}) {
  return (
    <AsyncState
      isEmpty={true}
      emptyMessage={message}
      emptyIcon={icon}
      className={className}
    >
      <div />
    </AsyncState>
  );
}

// Hook for managing async state
export function useAsyncState<T>() {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const execute = async (asyncFn: () => Promise<T>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (err) {
      const appError = err instanceof AppError ? err : new AppError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
      setError(appError);
      throw appError;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setIsLoading(false);
  };

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
  };
}

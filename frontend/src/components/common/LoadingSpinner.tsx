interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
  fullscreen?: boolean;
}

export const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  className = '',
  fullscreen = false 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'border-blue-500',
    white: 'border-white',
    gray: 'border-gray-500'
  };

  const spinner = (
    <div
      className={`
        animate-spin rounded-full border-2 border-t-transparent
        ${sizeClasses[size]}
        ${colorClasses[color]}
        ${className}
      `}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
          {spinner}
          <span className="text-gray-700">Loading...</span>
        </div>
      </div>
    );
  }

  return spinner;
};

export const LoadingPage = ({ message = 'Loading...' }: { message?: string }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export const LoadingButton = ({ 
  isLoading, 
  children, 
  className = '',
  ...props 
}: {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={`
        relative inline-flex items-center justify-center
        ${isLoading ? 'cursor-not-allowed opacity-75' : ''}
        ${className}
      `}
    >
      {isLoading && (
        <LoadingSpinner 
          size="sm" 
          color="white" 
          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" 
        />
      )}
      <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  );
};
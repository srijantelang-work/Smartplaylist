interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Loading({ size = 'md', variant = 'spinner', className = '', text }: LoadingProps) {
  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div className={`${sizeClasses[size]} animate-spin`}>
            <svg className="text-[#1DB954]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        );
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`${sizeClasses[size]} bg-[#1DB954] rounded-full animate-pulse`}
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        );
      case 'pulse':
        return (
          <div className={`${sizeClasses[size]} bg-[#1DB954] rounded-full animate-ping`} />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      {renderLoader()}
      {text && <p className={`text-[#E8E8E8] ${textSizeClasses[size]}`}>{text}</p>}
    </div>
  );
} 
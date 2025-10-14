import React, { memo, useCallback } from 'react';
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  ChevronRightIcon,
  LoaderIcon 
} from '../ui/icons';

export interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  loading?: boolean;
  onClick?: () => void;
  subtitle?: string;
}

export const EnhancedStatCard: React.FC<StatCardProps> = memo(({
  title,
  value,
  icon,
  color,
  trend,
  loading = false,
  onClick,
  subtitle
}) => {
  const handleClick = useCallback(() => {
    if (onClick) onClick();
  }, [onClick]);

  const isClickable = !!onClick;

  return (
    <div 
      className={`
        relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 
        transition-all duration-200 hover:shadow-md
        ${isClickable ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}
      `}
      onClick={handleClick}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {title}
            </p>
            
            {loading ? (
              <div className="flex items-center space-x-2">
                <LoaderIcon className="w-5 h-5 animate-spin text-gray-400" />
                <span className="text-gray-400">Caricamento...</span>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {value}
                </p>
                
                {subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {subtitle}
                  </p>
                )}
                
                {trend && (
                  <div className="flex items-center mt-2">
                    {trend.isPositive ? (
                      <TrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      trend.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trend.isPositive ? '+' : ''}{trend.value}%
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      {trend.label}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className={`
            ${color} rounded-lg p-3 flex items-center justify-center
            ${loading ? 'opacity-50' : ''}
          `}>
            {icon}
          </div>
        </div>
        
        {isClickable && !loading && (
          <div className="absolute top-4 right-4">
            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
});
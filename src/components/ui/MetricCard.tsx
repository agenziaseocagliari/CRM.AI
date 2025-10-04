import React from 'react';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  iconType: 'chart' | 'trending' | 'error' | 'speed' | 'shield' | 'globe';
  status?: 'healthy' | 'warning' | 'critical';
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  iconType, 
  status,
  className 
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'chart':
        return '📊';
      case 'trending':
        return '📈';
      case 'error':
        return status === 'critical' ? '🚨' : '✅';
      case 'speed':
        return '⚡';
      case 'shield':
        return '🛡️';
      case 'globe':
        return '🌐';
      default:
        return '?';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={cn(
      "bg-white rounded-lg shadow-md p-6 border border-gray-200",
      className
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={cn("text-2xl font-bold", getStatusColor())}>
            {value}
          </p>
        </div>
        <div className="text-2xl">
          {getIcon(iconType)}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
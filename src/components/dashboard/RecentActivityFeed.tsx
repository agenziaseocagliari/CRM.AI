import React, { memo, useCallback } from 'react';
import { 
  UsersIcon, 
  DollarSignIcon, 
  CalendarIcon, 
  ClipboardListIcon,
  LoaderIcon,
  ClockIcon
} from '../ui/icons';
import { RecentActivity } from '../../services/dashboardService';

interface RecentActivityFeedProps {
  activities: RecentActivity[];
  loading?: boolean;
  onViewAll?: () => void;
}

const getActivityIcon = (type: RecentActivity['type']) => {
  const iconClasses = "w-5 h-5 text-white";
  
  switch (type) {
    case 'contact':
      return <UsersIcon className={iconClasses} />;
    case 'deal':
      return <DollarSignIcon className={iconClasses} />;
    case 'event':
      return <CalendarIcon className={iconClasses} />;
    case 'form':
      return <ClipboardListIcon className={iconClasses} />;
    default:
      return <ClockIcon className={iconClasses} />;
  }
};

const getActivityColor = (type: RecentActivity['type']) => {
  switch (type) {
    case 'contact':
      return 'bg-blue-500';
    case 'deal':
      return 'bg-green-500';
    case 'event':
      return 'bg-purple-500';
    case 'form':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};

const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Adesso';
  if (diffInMinutes < 60) return `${diffInMinutes}m fa`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h fa`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}g fa`;
  
  return activityTime.toLocaleDateString('it-IT', { 
    day: '2-digit', 
    month: 'short' 
  });
};

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = memo(({
  activities,
  loading = false,
  onViewAll
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Attività Recente
          </h3>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Vedi tutto
            </button>
          )}
        </div>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoaderIcon className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Caricamento attività...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nessuna attività recente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 group">
                <div className={`
                  ${getActivityColor(activity.type)} rounded-full p-2 flex-shrink-0
                  group-hover:scale-110 transition-transform duration-200
                `}>
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </p>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {activity.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
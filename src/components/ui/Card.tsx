
import React from 'react';

interface CardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, value, icon, color, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`flex items-center justify-center w-12 h-12 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

import React from 'react';

interface CardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

export const Card: React.FC<CardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-card p-6 rounded-lg shadow flex items-center">
      <div className={`p-4 rounded-full ${color}`}>
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
      </div>
    </div>
  );
};
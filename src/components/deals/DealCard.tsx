import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { User, Calendar, Euro, MoreHorizontal, TrendingUp, Phone, Mail } from 'lucide-react';
import { Deal } from '../../services/dealsService';

interface DealCardProps {
  deal: Deal;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function DealCard({ deal, onClick, onEdit, onDelete }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: deal.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Format currency value
  const formatCurrency = (value: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get probability color
  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'bg-green-500';
    if (probability >= 60) return 'bg-blue-500';
    if (probability >= 40) return 'bg-yellow-500';
    if (probability >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Get days until close date
  const getDaysUntilClose = (closeDate?: string) => {
    if (!closeDate) return null;
    const today = new Date();
    const close = new Date(closeDate);
    const diffTime = close.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilClose = getDaysUntilClose(deal.expected_close_date);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`
        bg-white rounded-lg border-2 border-gray-200 
        hover:border-blue-400 hover:shadow-md
        transition-all duration-200 cursor-pointer
        p-4 space-y-3
        ${isDragging ? 'opacity-50 rotate-2 scale-105 shadow-xl border-blue-500' : ''}
      `}
    >
      {/* Header with title and actions */}
      <div className="flex items-start justify-between">
        <h4 className="font-semibold text-gray-900 leading-tight line-clamp-2 flex-1">
          {deal.title}
        </h4>
        
        <div className="ml-2 flex-shrink-0">
          <button 
            className="text-gray-400 hover:text-gray-600 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Show dropdown menu
            }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Deal Value */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Euro className="w-4 h-4 text-green-600" />
          <span className="text-xl font-bold text-green-600">
            {formatCurrency(deal.value || 0, deal.currency)}
          </span>
        </div>
        
        {/* Probability badge */}
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-gray-500" />
          <span className="text-xs text-gray-600">{deal.probability}%</span>
        </div>
      </div>

      {/* Probability bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${getProbabilityColor(deal.probability)}`}
          style={{ width: `${deal.probability}%` }}
        />
      </div>

      {/* Contact info */}
      {deal.contact && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-3 h-3" />
            <span className="truncate">{deal.contact.name}</span>
          </div>
          
          {deal.contact.email && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Mail className="w-3 h-3" />
              <span className="truncate">{deal.contact.email}</span>
            </div>
          )}
          
          {deal.contact.phone && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Phone className="w-3 h-3" />
              <span className="truncate">{deal.contact.phone}</span>
            </div>
          )}
        </div>
      )}

      {/* Expected close date */}
      {deal.expected_close_date && (
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span className="text-gray-600">
            {new Date(deal.expected_close_date).toLocaleDateString('it-IT')}
          </span>
          
          {daysUntilClose !== null && (
            <span className={`
              text-xs px-2 py-1 rounded-full
              ${daysUntilClose < 0 
                ? 'bg-red-100 text-red-700' 
                : daysUntilClose <= 7 
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
              }
            `}>
              {daysUntilClose < 0 
                ? `${Math.abs(daysUntilClose)} giorni fa`
                : daysUntilClose === 0
                  ? 'Oggi'
                  : `${daysUntilClose} giorni`
              }
            </span>
          )}
        </div>
      )}

      {/* Deal source */}
      {deal.source && (
        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">
          {deal.source}
        </div>
      )}

      {/* Notes preview */}
      {deal.notes && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border-l-2 border-gray-200">
          <p className="line-clamp-2">{deal.notes}</p>
        </div>
      )}

      {/* Footer with assigned user */}
      {deal.assigned_user && (
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-semibold">
                {deal.assigned_user.email?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <span className="text-xs text-gray-500 truncate">
              {deal.assigned_user.email || 'Non assegnato'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// CSS classes for line-clamp (add to your global CSS)
// .line-clamp-1 {
//   display: -webkit-box;
//   -webkit-line-clamp: 1;
//   -webkit-box-orient: vertical;
//   overflow: hidden;
// }

// .line-clamp-2 {
//   display: -webkit-box;
//   -webkit-line-clamp: 2;
//   -webkit-box-orient: vertical;
//   overflow: hidden;
// }
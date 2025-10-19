import { addDays, addMonths, endOfMonth, format, getDay, getDaysInMonth, parseISO, startOfMonth, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import { AlertTriangle, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Eye, Mail } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

// Types
interface RenewalReminder {
  policy_id: string;
  user_id: string;
  policy_number: string;
  renewal_date: string;
  client_name: string;
  policy_type: string;
  premium_amount: number;
  organization_id: string;
  days_to_renewal: number;
  priority_level: 'critical' | 'high' | 'medium' | 'low';
  renewal_status: 'expired' | 'urgent' | 'upcoming' | 'future';
  created_at: string;
  updated_at: string;
}

interface CalendarDay {
  date: Date;
  reminders: RenewalReminder[];
  hasReminders: boolean;
  priorityLevel: 'critical' | 'high' | 'medium' | 'low' | null;
}

// Custom Hook for data fetching (replacing SWR)
const useRenewalReminders = (organizationId: string | null) => {
  const [data, setData] = useState<RenewalReminder[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!organizationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data: renewalData, error: renewalError } = await supabase
        .from('renewal_reminders')
        .select('*')
        .eq('organization_id', organizationId)
        .order('renewal_date', { ascending: true });

      if (renewalError) throw renewalError;

      console.log('🔍 [RenewalCalendar] Fetched renewal reminders:', renewalData);
      setData(renewalData);
    } catch (err) {
      console.error('❌ [RenewalCalendar] Error fetching renewal reminders:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
};

// Priority Colors
const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'critical': return 'bg-red-500 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-yellow-500 text-black';
    case 'low': return 'bg-blue-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

// Status Colors
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'expired': return 'bg-red-100 text-red-800 border-red-200';
    case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'upcoming': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'future': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Quick Actions Hook
const useQuickActions = () => {
  const sendReminderAction = useCallback(async (policyId: string, clientName: string) => {
    try {
      // Call Supabase Edge Function for sending reminder
      const { data, error } = await supabase.functions.invoke('sendReminder', {
        body: { 
          policyId,
          clientName,
          reminderType: 'renewal'
        }
      });

      if (error) throw error;

      toast.success(`Promemoria di rinnovo inviato a ${clientName}`, {
        icon: '📧',
        duration: 4000
      });

      return data;
    } catch (error) {
      console.error('❌ [RenewalCalendar] Error sending reminder:', error);
      toast.error('Impossibile inviare il promemoria', {
        icon: '❌'
      });
      throw error;
    }
  }, []);

  return {
    sendReminder: sendReminderAction
  };
};

// Calendar Component
const CustomCalendar: React.FC<{
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  calendarData: Map<string, CalendarDay>;
}> = ({ currentDate, onDateChange, onMonthChange, calendarData }) => {
  const daysInMonth = getDaysInMonth(currentDate);
  const startDate = startOfMonth(currentDate);
  const firstDayOfWeek = getDay(startDate);
  
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const monthYear = format(currentDate, 'MMMM yyyy', { locale: it });

  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    onMonthChange(newDate);
  };

  const renderCalendarDay = (dayNumber: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayData = calendarData.get(dateKey);
    const isSelected = format(date, 'yyyy-MM-dd') === format(onDateChange.length ? new Date() : date, 'yyyy-MM-dd');

    return (
      <button
        key={dayNumber}
        onClick={() => onDateChange(date)}
        className={`
          relative h-10 w-10 rounded-lg border transition-all duration-200 hover:bg-blue-50
          ${isSelected ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 hover:border-blue-300'}
          ${dayData?.hasReminders ? 'font-semibold' : ''}
        `}
        data-testid={`calendar-day-${dayNumber}`}
      >
        <span className="text-sm">{dayNumber}</span>
        {dayData?.hasReminders && (
          <span
            className={`
              absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs flex items-center justify-center
              ${getPriorityColor(dayData.priorityLevel || 'low')}
            `}
            data-testid={`renewal-badge-${dateKey}`}
            title={`${dayData.reminders.length} scadenz${dayData.reminders.length === 1 ? 'a' : 'e'} di rinnovo`}
          >
            {dayData.reminders.length}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4" data-testid="renewal-calendar">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Mese precedente"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-semibold capitalize">{monthYear}</h3>
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Mese successivo"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} className="h-10" />
        ))}
        
        {/* Calendar days */}
        {Array.from({ length: daysInMonth }, (_, i) => renderCalendarDay(i + 1))}
      </div>
    </div>
  );
};

// Main Component
const RenewalCalendar: React.FC = () => {
  const { organizationId } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  const quickActions = useQuickActions();
  const { data: renewalReminders, isLoading, error, refetch } = useRenewalReminders(organizationId);

  // Process calendar data
  const calendarData = useMemo(() => {
    if (!renewalReminders) return new Map<string, CalendarDay>();

    const dataMap = new Map<string, CalendarDay>();
    
    // Initialize calendar with empty days for current month
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    for (let date = start; date <= end; date = addDays(date, 1)) {
      const dateKey = format(date, 'yyyy-MM-dd');
      dataMap.set(dateKey, {
        date: new Date(date),
        reminders: [],
        hasReminders: false,
        priorityLevel: null
      });
    }

    // Add reminders to calendar days
    renewalReminders.forEach((reminder: RenewalReminder) => {
      const reminderDate = parseISO(reminder.renewal_date);
      const dateKey = format(reminderDate, 'yyyy-MM-dd');
      
      const existingDay = dataMap.get(dateKey) || {
        date: reminderDate,
        reminders: [],
        hasReminders: false,
        priorityLevel: null
      };

      existingDay.reminders.push(reminder);
      existingDay.hasReminders = true;
      
      // Set highest priority level for the day
      if (!existingDay.priorityLevel || 
          ['critical', 'high', 'medium', 'low'].indexOf(reminder.priority_level) < 
          ['critical', 'high', 'medium', 'low'].indexOf(existingDay.priorityLevel)) {
        existingDay.priorityLevel = reminder.priority_level;
      }

      dataMap.set(dateKey, existingDay);
    });

    return dataMap;
  }, [renewalReminders, currentMonth]);

  // Get reminders for selected date
  const selectedDateReminders = useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return calendarData.get(dateKey)?.reminders || [];
  }, [calendarData, selectedDate]);

  // Handle reminder actions
  const handleSendReminder = useCallback(async (reminder: RenewalReminder) => {
    await quickActions.sendReminder(reminder.policy_id, reminder.client_name);
    refetch(); // Refresh data after action
  }, [quickActions, refetch]);

  const handleOpenPolicyDetail = useCallback((reminder: RenewalReminder) => {
    try {
      // Navigate directly to policy detail page using Italian routing
      navigate(`/assicurazioni/polizze/${reminder.policy_id}`);
    } catch (error) {
      console.error('❌ [RenewalCalendar] Error navigating to policy detail:', error);
      toast.error('Impossibile aprire i dettagli della polizza');
    }
  }, [navigate]);

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 text-red-600">
          <AlertTriangle size={24} />
          <span className="font-medium">Errore nel caricamento del calendario scadenze: {error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span>Caricamento calendario scadenze...</span>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CalendarIcon size={28} className="text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Calendario Scadenze Rinnovi</h2>
        </div>
        <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {renewalReminders?.length || 0} scadenze nei prossimi 90 giorni
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <CustomCalendar
            currentDate={currentMonth}
            onDateChange={setSelectedDate}
            onMonthChange={setCurrentMonth}
            calendarData={calendarData}
          />
        </div>

        {/* Selected Date Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-lg font-semibold mb-4">
            {format(selectedDate, 'dd MMMM yyyy', { locale: it })}
          </h4>
          
          {selectedDateReminders.length === 0 ? (
            <p className="text-gray-500 italic">Nessuna scadenza per questa data</p>
          ) : (
            <div className="space-y-3">
              {selectedDateReminders.map((reminder) => (
                <div key={reminder.policy_id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{reminder.policy_number}</p>
                      <p className="text-sm text-gray-600">{reminder.client_name}</p>
                      <p className="text-xs text-gray-500">{reminder.policy_type}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(reminder.renewal_status)}`}>
                      {reminder.days_to_renewal > 0 
                        ? `${reminder.days_to_renewal} giorni`
                        : reminder.days_to_renewal === 0 
                          ? 'Oggi'
                          : `Scaduta ${Math.abs(reminder.days_to_renewal)} giorni fa`
                      }
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">
                    Premio: €{reminder.premium_amount.toLocaleString('it-IT', { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>

                  {/* Quick Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSendReminder(reminder)}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
                      data-testid={`send-reminder-${reminder.policy_id}`}
                    >
                      <Mail size={14} />
                      <span>Invia Promemoria</span>
                    </button>
                    <button
                      onClick={() => handleOpenPolicyDetail(reminder)}
                      className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
                      data-testid={`open-detail-${reminder.policy_id}`}
                    >
                      <Eye size={14} />
                      <span>Dettagli</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-medium text-gray-900">Legenda priorità:</span>
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm">Critica (≤7 giorni)</span>
            </span>
            <span className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-orange-500"></div>
              <span className="text-sm">Alta (≤30 giorni)</span>
            </span>
            <span className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span className="text-sm">Media (≤60 giorni)</span>
            </span>
            <span className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-sm">Bassa (≤90 giorni)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenewalCalendar;
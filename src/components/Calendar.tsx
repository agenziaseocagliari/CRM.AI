import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useCrmData } from '../hooks/useCrmData';
import CalendarContainer from './calendar/CalendarContainer';

export const Calendar: React.FC = () => {
  const crmData = useOutletContext<ReturnType<typeof useCrmData>>();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <CalendarContainer />
    </div>
  );
};

export default Calendar;
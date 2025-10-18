import { useState, useEffect } from 'react';
import { diagnostics } from '../utils/diagnostics';

const DiagnosticDashboard: React.FC = () => {
  const [events, setEvents] = useState(diagnostics.getEvents());
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const interval = setInterval(() => {
      setEvents([...diagnostics.getEvents()]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredEvents = filter === 'all' ? events : events.filter(e => e.type === filter);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          padding: '10px 20px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          zIndex: 9999,
          fontSize: '14px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}
      >
        🔬 Open Diagnostics ({events.length})
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.95)',
      color: 'white',
      zIndex: 10000,
      overflow: 'auto',
      padding: '20px',
      fontFamily: 'monospace'
    }}>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setIsOpen(false)} 
          style={{ padding: '5px 15px', background: '#dc3545', border: 'none', color: 'white', borderRadius: '3px' }}
        >
          Close
        </button>
        <button 
          onClick={() => diagnostics.clear()} 
          style={{ padding: '5px 15px', background: '#ffc107', border: 'none', color: 'black', borderRadius: '3px' }}
        >
          Clear Log
        </button>
        <button 
          onClick={() => diagnostics.downloadLog()} 
          style={{ padding: '5px 15px', background: '#28a745', border: 'none', color: 'white', borderRadius: '3px' }}
        >
          Download Log
        </button>
        
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: '5px', background: '#333', color: 'white', border: '1px solid #555' }}
        >
          <option value="all">All Events</option>
          <option value="route">Routes Only</option>
          <option value="component">Components Only</option>
          <option value="error">Errors Only</option>
          <option value="auth">Auth Only</option>
        </select>
      </div>

      <h2>Diagnostic Events ({filteredEvents.length})</h2>
      
      <div style={{ marginBottom: '20px', padding: '10px', background: '#333', borderRadius: '5px' }}>
        <strong>Quick Stats:</strong>
        <div>Routes: {events.filter(e => e.type === 'route').length}</div>
        <div>Components: {events.filter(e => e.type === 'component').length}</div>
        <div>Errors: {events.filter(e => e.type === 'error').length}</div>
        <div>Last Event: {events.length > 0 ? new Date(events[events.length - 1].timestamp).toLocaleTimeString() : 'None'}</div>
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid white', background: '#333' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Time</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Location</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Data</th>
          </tr>
        </thead>
        <tbody>
          {filteredEvents.slice(-50).map((event, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '5px', fontSize: '10px' }}>
                {new Date(event.timestamp).toLocaleTimeString()}
              </td>
              <td style={{ 
                padding: '5px',
                color: event.type === 'error' ? '#ff6b6b' : 
                       event.type === 'route' ? '#4dabf7' :
                       event.type === 'component' ? '#51c759' :
                       event.type === 'auth' ? '#ff922b' : '#adb5bd'
              }}>
                {event.type}
              </td>
              <td style={{ padding: '5px', maxWidth: '200px', wordBreak: 'break-word' }}>
                {event.location}
              </td>
              <td style={{ padding: '5px', fontSize: '10px', maxWidth: '300px' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {filteredEvents.length > 50 && (
        <div style={{ textAlign: 'center', padding: '10px', color: '#adb5bd' }}>
          Showing last 50 events. Download log for complete history.
        </div>
      )}
    </div>
  );
};

export default DiagnosticDashboard;
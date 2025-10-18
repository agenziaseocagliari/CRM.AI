import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { diagnostics } from '../utils/diagnostics';

const RouteDebug: React.FC = () => {
  const location = useLocation();
  const params = useParams();

  useEffect(() => {
    diagnostics.log('route', 'Navigation', {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      params,
      state: location.state,
      fullUrl: window.location.href
    });
  }, [location, params]);

  // Visual debug panel in development
  if (import.meta.env.DEV) {
    return (
      <div style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        fontSize: '12px',
        zIndex: 9999,
        maxWidth: '400px',
        borderTopLeftRadius: '8px'
      }}>
        <strong>🔍 Route Debug:</strong>
        <div>Path: {location.pathname}</div>
        <div>Params: {JSON.stringify(params)}</div>
        <div>Search: {location.search}</div>
      </div>
    );
  }

  return null;
};

export default RouteDebug;
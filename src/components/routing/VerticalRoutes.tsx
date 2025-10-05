/**
 * GUARDIAN AI CRM - VERTICAL ROUTING SYSTEM
 * Sistema di routing per landing pages verticali
 * Data: 2025-10-05
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import InsuranceAgencyLanding from '../../pages/verticals/InsuranceAgencyLanding';
import MarketingAgencyLanding from '../../pages/verticals/MarketingAgencyLanding';

const VerticalRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Vertical Landing Pages */}
      <Route path="/assicurazioni" element={<InsuranceAgencyLanding />} />
      <Route path="/insurance-agency" element={<InsuranceAgencyLanding />} />
      <Route path="/marketing" element={<MarketingAgencyLanding />} />
      <Route path="/marketing-agency" element={<MarketingAgencyLanding />} />
      
      {/* Future Verticals - Placeholder routes */}
      <Route path="/real-estate" element={<div>Real Estate Landing (Coming Soon)</div>} />
      <Route path="/healthcare" element={<div>Healthcare Landing (Coming Soon)</div>} />
      <Route path="/legal" element={<div>Legal Landing (Coming Soon)</div>} />
      <Route path="/consulting" element={<div>Consulting Landing (Coming Soon)</div>} />
      <Route path="/construction" element={<div>Construction Landing (Coming Soon)</div>} />
      <Route path="/automotive" element={<div>Automotive Landing (Coming Soon)</div>} />
      <Route path="/fitness" element={<div>Fitness Landing (Coming Soon)</div>} />
      <Route path="/beauty" element={<div>Beauty Landing (Coming Soon)</div>} />
      <Route path="/food" element={<div>Food Service Landing (Coming Soon)</div>} />
      
      {/* Main homepage */}
      <Route path="/" element={<div>Main Homepage</div>} />
    </Routes>
  );
};

export default VerticalRoutes;
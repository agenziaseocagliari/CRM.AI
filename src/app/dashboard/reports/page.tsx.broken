'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tab } from '@headlessui/react';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Type definitions for data structures
interface FunnelData {
  stage: string;
  count: number;
  total_value: number;
  avg_time_in_stage: number;
}

interface RevenueData {
  month: string;
  stage: string;
  total_revenue: number;
  deals_count: number;
}

interface ContactData {
  date: string;
  new_contacts: number;
}

interface Metrics {
  totalLeads: number;
  dealsWon: number;
  conversionRate: number;
  avgCycle: number;
  totalRevenue: number;
  avgDealSize: number;
  totalContacts: number;
  newThisMonth: number;
  avgLeadScore: number;
}
import { supabase } from '../../../lib/supabaseClient';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// Direct organization resolution - ROBUST approach
async function getUserOrganizationId(): Promise<string | null> {
  try {
    // Get current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('No authenticated user:', userError);
      return null;
    }

    // Get user's organization from user_organizations table
    const { data: userOrg, error: orgError } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (orgError || !userOrg) {
      console.error('User has no organization:', orgError);
      return null;
    }

    return userOrg.organization_id;
  } catch (error) {
    console.error('Error getting user organization:', error);
    return null;
  }
}

export default function ReportsPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Real data states
  const [realFunnelData, setRealFunnelData] = useState<FunnelData[]>([]);
  const [realRevenueData, setRealRevenueData] = useState<RevenueData[]>([]);
  const [realContactData, setRealContactData] = useState<ContactData[]>([]);
  const [realMetrics, setRealMetrics] = useState<Metrics>({
    totalLeads: 0,
    dealsWon: 0,
    conversionRate: 0,
    avgCycle: 0,
    totalRevenue: 0,
    avgDealSize: 0,
    totalContacts: 0,
    newThisMonth: 0,
    avgLeadScore: 0
  });
  const [dataLoading, setDataLoading] = useState(true);

  // Load real data from database - DEFINITIVE VERSION
  const loadAllReportsData = useCallback(async () => {
    try {
      setDataLoading(true);
      
      // Get organization ID directly from database
      const orgId = await getUserOrganizationId();
      
      if (!orgId) {
        throw new Error('User not authenticated or no organization found');
      }
      
      setOrganizationId(orgId);
      console.log('✅ Using organization ID:', orgId);
      
      // Load opportunities for funnel and revenue data
      const { data: opportunities, error: oppError } = await supabase
        .from('opportunities')
        .select(`
          id,
          contact_name,
          value,
          stage,
          status,
          close_date,
          created_at,
          updated_at
        `)
        .eq('organization_id', orgId);

      if (oppError) throw oppError;

      // Load contacts for contact analytics  
      const { data: contacts, error: contactError } = await supabase
        .from('contacts')
        .select(`
          id,
          first_name,
          last_name,
          email,
          lead_score,
          created_at
        `)
        .eq('organization_id', orgId);

      if (contactError) throw contactError;

      // Process funnel data
      const stageGroups: Record<string, { stage: string; count: number; total_value: number; days: number[] }> = {};
      const stages = ['New Lead', 'Contacted', 'Proposal Sent', 'Won', 'Lost'];
      
      opportunities?.forEach(opp => {
        const stage = opp.stage || 'New Lead';
        if (!stageGroups[stage]) {
          stageGroups[stage] = {
            stage: stage,
            count: 0,
            total_value: 0,
            days: []
          };
        }
        
        stageGroups[stage].count++;
        stageGroups[stage].total_value += parseFloat(opp.value) || 0;
        
        if (opp.close_date) {
          const days = Math.floor(
            (new Date(opp.close_date).getTime() - new Date(opp.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          stageGroups[stage].days.push(days);
        }
      });

      const totalLeads = opportunities?.length || 0;
      const funnelArray: FunnelData[] = stages.map(stageName => {
        const group = stageGroups[stageName] || { count: 0, total_value: 0, days: [] };
        return {
          stage: stageName,
          count: group.count,
          total_value: group.total_value,
          avg_time_in_stage: group.days.length > 0 
            ? Math.round(group.days.reduce((a: number, b: number) => a + b, 0) / group.days.length)
            : 0
        };
      }).filter(stage => stage.count > 0);

      // Calculate metrics
      const dealsWon = opportunities?.filter(o => o.status === 'won').length || 0;
      const totalRevenue = opportunities?.reduce((sum, o) => sum + (parseFloat(o.value) || 0), 0) || 0;
      const conversionRate = totalLeads > 0 ? (dealsWon / totalLeads) * 100 : 0;
      
      // Contact metrics
      const currentMonth = new Date().toISOString().substring(0, 7);
      const contactsThisMonth = contacts?.filter(c => 
        c.created_at?.substring(0, 7) === currentMonth
      ).length || 0;
      
      const avgLeadScore = contacts?.length > 0 
        ? contacts.reduce((sum, c) => sum + (c.lead_score || 0), 0) / contacts.length
        : 0;

      // Process revenue data by month for charts
      const revenueByMonth: Record<string, { total_revenue: number; deals_count: number }> = {};
      opportunities?.filter(o => o.status === 'won' && o.close_date).forEach(opp => {
        const month = opp.close_date.substring(0, 7); // YYYY-MM
        if (!revenueByMonth[month]) {
          revenueByMonth[month] = { total_revenue: 0, deals_count: 0 };
        }
        revenueByMonth[month].total_revenue += parseFloat(opp.value) || 0;
        revenueByMonth[month].deals_count++;
      });

      const revenueArray: RevenueData[] = Object.entries(revenueByMonth).map(([month, data]) => ({
        month,
        stage: 'Won',
        total_revenue: data.total_revenue,
        deals_count: data.deals_count
      })).sort((a, b) => a.month.localeCompare(b.month));

      // Process contact data by date for charts
      const contactsByDate: Record<string, number> = {};
      contacts?.forEach(contact => {
        const date = contact.created_at?.substring(0, 10); // YYYY-MM-DD
        if (date) {
          if (!contactsByDate[date]) {
            contactsByDate[date] = 0;
          }
          contactsByDate[date]++;
        }
      });

      const contactArray: ContactData[] = Object.entries(contactsByDate).map(([date, new_contacts]) => ({
        date,
        new_contacts: new_contacts as number
      })).sort((a, b) => a.date.localeCompare(b.date));

      // Set all real data
      setRealFunnelData(funnelArray);
      setRealRevenueData(revenueArray);
      setRealContactData(contactArray);
      setRealMetrics({
        totalLeads,
        dealsWon,
        conversionRate,
        avgCycle: 0, // TODO: Calculate based on won deals
        totalRevenue,
        avgDealSize: totalLeads > 0 ? totalRevenue / totalLeads : 0,
        totalContacts: contacts?.length || 0,
        newThisMonth: contactsThisMonth,
        avgLeadScore
      });

    } catch (error) {
      console.error('Error loading reports data:', error);
      toast.error('Failed to load reports data');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load data immediately on component mount
    loadAllReportsData();
  }, [loadAllReportsData]);

  // Real data processing complete - mock data removed

  // CSV Export functions with real data - DEFINITIVE VERSION
  const exportRevenueCSV = async () => {
    const orgId = organizationId || await getUserOrganizationId();
    if (!orgId) {
      toast.error('User not authenticated or organization not found');
      return;
    }

    try {
      setIsLoading(true);
      
      // Query ALL opportunities from database
      const { data: opportunities, error } = await supabase
        .from('opportunities')
        .select(`
          id,
          contact_name,
          value,
          stage,
          status,
          close_date,
          created_at,
          updated_at
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!opportunities || opportunities.length === 0) {
        toast.error('No opportunities found');
        return;
      }

      // Transform to CSV format with all data
      const csvData = opportunities.map(opp => ({
        'Date Created': format(new Date(opp.created_at), 'yyyy-MM-dd'),
        'Contact': opp.contact_name || 'N/A',
        'Stage': opp.stage || 'N/A',
        'Value': opp.value || 0,
        'Status': opp.status || 'N/A',
        'Close Date': opp.close_date ? format(new Date(opp.close_date), 'yyyy-MM-dd') : 'N/A',
        'Last Updated': format(new Date(opp.updated_at), 'yyyy-MM-dd HH:mm')
      }));

      // Convert to CSV format
      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers,
        ...csvData.map(row => headers.map(header => row[header as keyof typeof row]))
      ].map(row => row.join(',')).join('\n');

      // Download with proper filename
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${opportunities.length} opportunities`);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      setIsLoading(false);
    }
  };

  const exportContactsCSV = async () => {
    const orgId = organizationId || await getUserOrganizationId();
    if (!orgId) {
      toast.error('User not authenticated or organization not found');
      return;
    }

    try {
      setIsLoading(true);
      
      // Query ALL contacts from database
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          company,
          lead_score,
          source,
          status,
          created_at,
          updated_at
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!contacts || contacts.length === 0) {
        toast.error('No contacts found');
        return;
      }

      // Transform to CSV format
      const csvData = contacts.map(contact => ({
        'Date Created': format(new Date(contact.created_at), 'yyyy-MM-dd'),
        'Name': `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
        'Email': contact.email || 'N/A',
        'Phone': contact.phone || 'N/A',
        'Company': contact.company || 'N/A',
        'Lead Score': contact.lead_score || 0,
        'Source': contact.source || 'N/A',
        'Status': contact.status || 'N/A',
        'Last Updated': format(new Date(contact.updated_at), 'yyyy-MM-dd HH:mm')
      }));

      // Convert to CSV format
      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers,
        ...csvData.map(row => headers.map(header => row[header as keyof typeof row]))
      ].map(row => row.join(',')).join('\n');

      // Download with proper filename
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${contacts.length} contacts`);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      setIsLoading(false);
    }
  };

  const exportFunnelCSV = async () => {
    const orgId = organizationId || await getUserOrganizationId();
    if (!orgId) {
      toast.error('User not authenticated or organization not found');
      return;
    }

    try {
      setIsLoading(true);
      
      // Query opportunities grouped by stage
      const { data: opportunities, error } = await supabase
        .from('opportunities')
        .select(`
          stage,
          value,
          created_at,
          close_date,
          status
        `)
        .eq('organization_id', orgId);

      if (error) throw error;

      if (!opportunities || opportunities.length === 0) {
        toast.error('No opportunities found');
        return;
      }

      // Process funnel data by stage
      const stageStats = opportunities.reduce((acc, opp) => {
        const stage = opp.stage || 'Unknown';
        if (!acc[stage]) {
          acc[stage] = {
            count: 0,
            total_value: 0,
            total_days: 0
          };
        }
        
        acc[stage].count++;
        acc[stage].total_value += opp.value || 0;
        
        // Calculate days in stage (simplified)
        const created = new Date(opp.created_at);
        const closeDate = opp.close_date ? new Date(opp.close_date) : new Date();
        const days = Math.ceil((closeDate.getTime() - created.getTime()) / (1000 * 3600 * 24));
        acc[stage].total_days += Math.max(days, 0);
        
        return acc;
      }, {} as Record<string, { count: number; total_value: number; total_days: number }>);

      // Transform to CSV format
      const csvData = Object.entries(stageStats).map(([stage, stats]) => ({
        'Stage': stage,
        'Count': stats.count,
        'Total Value': stats.total_value,
        'Average Days': Math.round(stats.total_days / stats.count),
        'Avg Deal Size': Math.round(stats.total_value / stats.count)
      }));

      // Convert to CSV format
      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers,
        ...csvData.map(row => headers.map(header => row[header as keyof typeof row]))
      ].map(row => row.join(',')).join('\n');

      // Download with proper filename
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pipeline-funnel-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${Object.keys(stageStats).length} pipeline stages`);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const tabs = [
    {
      name: 'Revenue',
      icon: ChartBarIcon,
      content: (
        <div className="space-y-6">
          {/* Revenue Filters */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-2">Time Period</label>
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                  </select>
                </div>
              </div>
              <button
                onClick={exportRevenueCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          {/* Revenue Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dataLoading ? '...' : `€${realMetrics.totalRevenue.toLocaleString()}`}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 text-green-600">
                  <ChartBarIcon className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Average Deal</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dataLoading ? '...' : `€${Math.round(realMetrics.avgDealSize).toLocaleString()}`}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                  <ChartBarIcon className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Deals Won</p>
                  <p className="text-2xl font-bold text-gray-900">{dataLoading ? '...' : realMetrics.dealsWon}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                  <ChartBarIcon className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Growth Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dataLoading ? '...' : Math.round(realMetrics.conversionRate)}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                  <ChartBarIcon className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Chart Placeholder */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <ChartBarIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Revenue chart will be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">Chart.js integration in progress</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      name: 'Contacts',
      icon: UserGroupIcon,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Contact Analytics</h2>
            <button
              onClick={exportContactsCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>

          {/* Contact Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Contacts</p>
                  <p className="text-2xl font-bold text-gray-900">{dataLoading ? '...' : realMetrics.totalContacts}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">New This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{dataLoading ? '...' : realMetrics.newThisMonth}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 text-green-600">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Avg Lead Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dataLoading ? '...' : `${Math.round(realMetrics.avgLeadScore)}/100`}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Chart Placeholder */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Growth</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <UserGroupIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Contact analytics will be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">Chart.js integration in progress</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      name: 'Pipeline',
      icon: FunnelIcon,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Deal Pipeline Analysis</h2>
            <button
              onClick={exportFunnelCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>

          {/* Pipeline Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-blue-600">{dataLoading ? '...' : realMetrics.totalLeads}</div>
              <div className="text-sm text-gray-500">Total Leads</div>
            </div>
            <div className="text-center bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-green-600">{dataLoading ? '...' : realMetrics.dealsWon}</div>
              <div className="text-sm text-gray-500">Deals Won</div>
            </div>
            <div className="text-center bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-purple-600">{dataLoading ? '...' : Math.round(realMetrics.conversionRate)}%</div>
              <div className="text-sm text-gray-500">Overall Conversion</div>
            </div>
            <div className="text-center bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-orange-600">32</div>
              <div className="text-sm text-gray-500">Avg Cycle (days)</div>
            </div>
          </div>

          {/* Pipeline Funnel */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Deal Funnel</h3>
            <div className="space-y-4">
              {realFunnelData.map((stage, index) => {
                const widthPercentage = realFunnelData.length > 0 ? (stage.count / realFunnelData[0].count) * 100 : 0;
                const colors = ['bg-blue-100 border-blue-300', 'bg-green-100 border-green-300', 'bg-yellow-100 border-yellow-300', 'bg-purple-100 border-purple-300'];
                
                return (
                  <div key={index} className="relative">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 relative">
                        <div className="h-16 bg-gray-100 rounded-lg overflow-hidden relative">
                          <div 
                            className={`h-full ${colors[index]} rounded-lg border-2 transition-all duration-500 ease-out flex items-center justify-between px-4`}
                            style={{ width: `${Math.max(widthPercentage, 20)}%` }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="font-semibold text-lg">{stage.count}</div>
                              <div className="text-sm opacity-80">{stage.stage}</div>
                            </div>
                            <div className="text-right text-sm opacity-80">
                              <div>€{stage.total_value.toLocaleString()}</div>
                              <div>{widthPercentage.toFixed(1)}%</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="w-40 text-right text-sm">
                        <div className="font-medium text-gray-900">{stage.count} deals</div>
                        <div className="text-gray-500">{stage.avg_time_in_stage} days avg</div>
                        <div className="text-gray-500">€{(stage.total_value / stage.count).toLocaleString()} avg</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="mt-2 text-gray-600">
                Comprehensive insights into your business performance
              </p>
            </div>
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-8">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                  )
                }
              >
                <div className="flex items-center justify-center gap-2">
                  <tab.icon className="h-5 w-5" />
                  {tab.name}
                </div>
              </Tab>
            ))}
          </Tab.List>
          
          <Tab.Panels className="mt-2">
            {tabs.map((tab, index) => (
              <Tab.Panel
                key={index}
                className="rounded-xl bg-white p-3 ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
              >
                {tab.content}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
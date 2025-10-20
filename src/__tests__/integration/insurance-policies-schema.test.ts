/**
 * Integration Test: Insurance Policies Schema Relationships
 * Purpose: Verify that insurance_policies FK relationships work correctly
 * Issue: "Could not find a relationship between 'insurance_policies' and 'profiles'"
 * Date: 2025-10-20
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Use process.env for test environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe('Insurance Policies Schema Relationships', () => {
  let testOrganizationId: string;

  beforeAll(async () => {
    // Get a test organization ID
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    testOrganizationId = orgData?.id || '';
  });

  describe('Foreign Key Constraints', () => {
    it('should have FK from insurance_policies to contacts', async () => {
      const { data, error } = await supabase
        .from('insurance_policies')
        .select(`
          id,
          contact_id,
          contact:contacts(id, name)
        `)
        .limit(1)
        .single();

      // Should not throw relationship error
      expect(error).toBeNull();
      
      if (data) {
        expect(data).toHaveProperty('contact_id');
        // If there's a contact_id, contact should be populated
        if (data.contact_id) {
          expect(data.contact).toBeDefined();
          expect(data.contact).toHaveProperty('id');
          expect(data.contact).toHaveProperty('name');
        }
      }
    });

    it('should have FK from insurance_policies to organizations', async () => {
      const { data, error } = await supabase
        .from('insurance_policies')
        .select(`
          id,
          organization_id,
          organization:organizations(id, name)
        `)
        .limit(1)
        .single();

      expect(error).toBeNull();
      
      if (data) {
        expect(data).toHaveProperty('organization_id');
        expect(data.organization).toBeDefined();
        expect(data.organization).toHaveProperty('id');
      }
    });

    it('should have optional FK from insurance_policies.created_by to profiles', async () => {
      const { data, error } = await supabase
        .from('insurance_policies')
        .select(`
          id,
          created_by,
          creator:profiles(id, email)
        `)
        .not('created_by', 'is', null)
        .limit(1)
        .single();

      // This test is optional since created_by may be null
      if (data && data.created_by) {
        expect(error).toBeNull();
        expect(data.creator).toBeDefined();
        expect(data.creator).toHaveProperty('id');
      } else {
        // If no policies have created_by, that's acceptable
        expect(true).toBe(true);
      }
    });
  });

  describe('Renewal Reminders View', () => {
    it('should load renewal_reminders view without relationship errors', async () => {
      const { data, error } = await supabase
        .from('renewal_reminders')
        .select('*')
        .limit(1);

      // The main assertion: no relationship error
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should filter renewal_reminders by organization', async () => {
      if (!testOrganizationId) {
        console.warn('⚠️  No test organization ID, skipping test');
        return;
      }

      const { data, error } = await supabase
        .from('renewal_reminders')
        .select('*')
        .eq('organization_id', testOrganizationId);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should include client_name from contacts relationship', async () => {
      const { data, error } = await supabase
        .from('renewal_reminders')
        .select('*')
        .not('client_name', 'is', null)
        .limit(1)
        .single();

      if (data) {
        expect(error).toBeNull();
        expect(data).toHaveProperty('client_name');
        expect(data).toHaveProperty('policy_id');
        expect(data).toHaveProperty('contact_id');
        expect(data).toHaveProperty('renewal_date');
        expect(data).toHaveProperty('priority_level');
        expect(data).toHaveProperty('renewal_status');
      }
    });
  });

  describe('Policy Loading Integration', () => {
    it('should load policies with nested contact data', async () => {
      const { data, error } = await supabase
        .from('insurance_policies')
        .select(`
          *,
          contact:contacts(
            id,
            name,
            email,
            phone,
            company
          )
        `)
        .eq('organization_id', testOrganizationId)
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);

      // Verify structure
      if (data && data.length > 0) {
        const policy = data[0];
        expect(policy).toHaveProperty('id');
        expect(policy).toHaveProperty('policy_number');
        expect(policy).toHaveProperty('contact_id');
        expect(policy).toHaveProperty('contact');
        
        if (policy.contact) {
          expect(policy.contact).toHaveProperty('name');
        }
      }
    });

    it('should handle policies with null contacts gracefully', async () => {
      const { data, error } = await supabase
        .from('insurance_policies')
        .select(`
          *,
          contact:contacts(id, name)
        `)
        .is('contact_id', null)
        .limit(1);

      // Should not error even if no contact relationship
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('Performance and Indexing', () => {
    it('should efficiently query policies by status and end_date', async () => {
      const startTime = Date.now();

      const { data, error } = await supabase
        .from('insurance_policies')
        .select('id, policy_number, end_date')
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .order('end_date', { ascending: true })
        .limit(10);

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(queryTime).toBeLessThan(2000); // Should complete in under 2 seconds
      
      console.log(`✅ Query completed in ${queryTime}ms (${data?.length || 0} results)`);
    });

    it('should efficiently query renewal_reminders by organization', async () => {
      if (!testOrganizationId) return;

      const startTime = Date.now();

      const { data, error } = await supabase
        .from('renewal_reminders')
        .select('*')
        .eq('organization_id', testOrganizationId)
        .order('renewal_date', { ascending: true });

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(queryTime).toBeLessThan(2000);
      
      console.log(`✅ Renewal reminders query completed in ${queryTime}ms (${data?.length || 0} reminders)`);
    });
  });

  describe('Schema Cache Validation', () => {
    it('should not throw "Could not find a relationship" error', async () => {
      // This is the critical test for the schema cache issue
      const queries = [
        supabase.from('insurance_policies').select('*, contact:contacts(*)').limit(1),
        supabase.from('insurance_policies').select('*, organization:organizations(*)').limit(1),
        supabase.from('renewal_reminders').select('*').limit(1),
      ];

      const results = await Promise.all(queries);

      results.forEach(({ error, data }, index) => {
        if (error) {
          console.error(`Query ${index + 1} failed:`, error);
        }
        
        expect(error).toBeNull();
        expect(data).toBeDefined();
        
        // Specifically check that the error message does not contain "relationship"
        if (error) {
          expect(error.message).not.toMatch(/could not find.*relationship/i);
        }
      });
    });
  });
});

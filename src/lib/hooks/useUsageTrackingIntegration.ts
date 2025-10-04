// ===================================================================
// GUARDIAN AI CRM - USAGE TRACKING INTEGRATION HOOKS
// File: src/lib/hooks/useUsageTrackingIntegration.ts
// Hook per integrare il tracking nell'AI service esistente
// ===================================================================

import { useCallback } from 'react';
import { useUsageTracking } from '../../hooks/useUsageTracking';
import { ServiceType } from '../../types/usage';

interface UseUsageTrackingIntegrationProps {
  organizationId: string;
  onQuotaExceeded?: (serviceType: ServiceType) => void;
  onQuotaWarning?: (serviceType: ServiceType, percentage: number) => void;
}

export const useUsageTrackingIntegration = ({
  organizationId,
  onQuotaExceeded,
  onQuotaWarning
}: UseUsageTrackingIntegrationProps) => {
  const { trackUsage, checkQuota, isLoading } = useUsageTracking();

  /**
   * Wrapper per le chiamate AI che include il tracking automatico
   */
  const trackAIRequest = useCallback(async (
    originalFunction: () => Promise<any>,
    metadata?: Record<string, any>
  ) => {
    try {
      // Verifica quota prima della chiamata
      const canProceed = await checkQuota('ai_request');
      
      if (!canProceed) {
        if (onQuotaExceeded) {
          onQuotaExceeded('ai_request');
        }
        throw new Error('AI request quota exceeded');
      }

      // Esegui la chiamata originale
      const startTime = Date.now();
      const result = await originalFunction();
      const responseTime = Date.now() - startTime;

      // Traccia l'utilizzo
      await trackUsage({
        organizationId,
        service_type: 'ai_request',
        quantity: 1,
        metadata: {
          responseTimeMs: responseTime,
          ...metadata
        }
      });

      return result;
    } catch (error) {
      // Traccia anche gli errori per visibilità
      await trackUsage({
        organizationId,
        service_type: 'ai_request',
        quantity: 1,
        metadata: {
          error: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          ...metadata
        }
      });
      
      throw error;
    }
  }, [organizationId, trackUsage, checkQuota, onQuotaExceeded]);

  /**
   * Wrapper per l'invio di messaggi WhatsApp
   */
  const trackWhatsAppMessage = useCallback(async (
    originalFunction: () => Promise<any>,
    recipientCount: number = 1,
    metadata?: Record<string, any>
  ) => {
    try {
      // Verifica quota
      const canProceed = await checkQuota('whatsapp_message', recipientCount);
      
      if (!canProceed) {
        if (onQuotaExceeded) {
          onQuotaExceeded('whatsapp_message');
        }
        throw new Error('WhatsApp message quota exceeded');
      }

      // Esegui invio
      const result = await originalFunction();
      
      // Traccia utilizzo
      await trackUsage({
        organizationId,
        service_type: 'whatsapp_message',
        quantity: recipientCount,
        metadata: {
          messagesSent: recipientCount,
          ...metadata
        }
      });

      return result;
    } catch (error) {
      // Traccia errori
      await trackUsage({
        organizationId,
        service_type: 'whatsapp_message',
        quantity: recipientCount,
        metadata: {
          error: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          messagesSent: 0,
          ...metadata
        }
      });
      
      throw error;
    }
  }, [organizationId, trackUsage, checkQuota, onQuotaExceeded]);

  /**
   * Wrapper per l'invio di email marketing
   */
  const trackEmailMarketing = useCallback(async (
    originalFunction: () => Promise<any>,
    recipientCount: number,
    metadata?: Record<string, any>
  ) => {
    try {
      // Verifica quota
      const canProceed = await checkQuota('email_marketing', recipientCount);
      
      if (!canProceed) {
        if (onQuotaExceeded) {
          onQuotaExceeded('email_marketing');
        }
        throw new Error('Email marketing quota exceeded');
      }

      // Esegui invio
      const result = await originalFunction();
      
      // Traccia utilizzo
      await trackUsage({
        organizationId,
        service_type: 'email_marketing',
        quantity: recipientCount,
        metadata: {
          emailsSent: recipientCount,
          ...metadata
        }
      });

      return result;
    } catch (error) {
      // Traccia errori
      await trackUsage({
        organizationId,
        service_type: 'email_marketing',
        quantity: recipientCount,
        metadata: {
          error: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          emailsSent: 0,
          ...metadata
        }
      });
      
      throw error;
    }
  }, [organizationId, trackUsage, checkQuota, onQuotaExceeded]);

  return {
    trackAIRequest,
    trackWhatsAppMessage,
    trackEmailMarketing,
    isLoading
  };
};

export default useUsageTrackingIntegration;
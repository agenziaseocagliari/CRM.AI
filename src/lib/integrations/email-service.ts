// Email notification service for calendar events
// Provides automated confirmations and reminders

interface EventEmailData {
  to_email: string;
  to_name: string;
  event_title: string;
  event_date: string;
  event_time: string;
  organizer_name: string;
  meeting_url?: string;
  event_location?: string;
  event_description?: string;
}

interface ReminderEmailData extends EventEmailData {
  minutes_before: number;
  reminder_type: 'first' | 'final' | 'custom';
}

export class EmailNotificationService {
  
  // Send event confirmation email
  static async sendEventConfirmation(data: EventEmailData): Promise<boolean> {
    try {
      // TODO: Integrate with Brevo (formerly Sendinblue) or SendGrid API
      // For now, log and simulate success
      console.log('📧 Email Confirmation Sent:', {
        to: data.to_email,
        subject: `✅ Confermato: ${data.event_title}`,
        content: this.buildConfirmationEmail(data),
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  // Send reminder email
  static async sendEventReminder(data: ReminderEmailData): Promise<boolean> {
    try {
      const subject = this.buildReminderSubject(data);
      
      console.log('⏰ Reminder Email Sent:', {
        to: data.to_email,
        subject,
        minutes_before: data.minutes_before,
        reminder_type: data.reminder_type,
        content: this.buildReminderEmail(data),
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Reminder send error:', error);
      return false;
    }
  }

  // Build confirmation email subject
  private static buildConfirmationSubject(data: EventEmailData): string {
    return `✅ Appuntamento confermato: ${data.event_title}`;
  }

  // Build reminder email subject
  private static buildReminderSubject(data: ReminderEmailData): string {
    if (data.minutes_before <= 15) {
      return `🚨 INIZIA ORA: ${data.event_title}`;
    } else if (data.minutes_before <= 60) {
      return `⏰ Fra ${data.minutes_before} minuti: ${data.event_title}`;
    } else {
      const hours = Math.floor(data.minutes_before / 60);
      return `📅 Fra ${hours} ore: ${data.event_title}`;
    }
  }

  // Build professional HTML email template for confirmations
  private static buildConfirmationEmail(data: EventEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appuntamento Confermato</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.6; 
      color: #374151;
      margin: 0;
      padding: 0;
      background-color: #f9fafb;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header { 
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
      color: white; 
      padding: 32px 24px; 
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .header p {
      margin: 8px 0 0 0;
      opacity: 0.9;
      font-size: 16px;
    }
    .content {
      padding: 32px 24px;
    }
    .event-card {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    .event-title {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 16px 0;
    }
    .event-details {
      display: grid;
      gap: 12px;
    }
    .detail-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .detail-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
    .detail-text {
      font-weight: 600;
      color: #374151;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 16px 0;
      transition: transform 0.2s ease;
    }
    .button:hover {
      transform: translateY(-1px);
    }
    .actions {
      display: grid;
      gap: 12px;
      margin: 24px 0;
    }
    .secondary-button {
      display: inline-block;
      background: #f3f4f6;
      color: #374151;
      padding: 12px 20px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      text-align: center;
      border: 2px solid #e5e7eb;
    }
    .footer {
      background: #f8fafc;
      padding: 24px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .footer .logo {
      color: #3b82f6;
      font-weight: 700;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>✅ Appuntamento Confermato!</h1>
      <p>Il tuo incontro è stato programmato con successo</p>
    </div>

    <!-- Content -->
    <div class="content">
      <p>Ciao <strong>${data.to_name}</strong>,</p>
      <p>Perfetto! Il tuo appuntamento con <strong>${data.organizer_name}</strong> è stato confermato.</p>

      <!-- Event Details Card -->
      <div class="event-card">
        <div class="event-title">${data.event_title}</div>
        <div class="event-details">
          <div class="detail-row">
            <span class="detail-icon">📅</span>
            <span class="detail-text">${data.event_date}</span>
          </div>
          <div class="detail-row">
            <span class="detail-icon">🕐</span>
            <span class="detail-text">${data.event_time}</span>
          </div>
          ${data.meeting_url ? `
          <div class="detail-row">
            <span class="detail-icon">🎥</span>
            <span class="detail-text">Video conferenza</span>
          </div>
          ` : ''}
          ${data.event_location && !data.meeting_url ? `
          <div class="detail-row">
            <span class="detail-icon">📍</span>
            <span class="detail-text">${data.event_location}</span>
          </div>
          ` : ''}
          <div class="detail-row">
            <span class="detail-icon">👤</span>
            <span class="detail-text">Con ${data.organizer_name}</span>
          </div>
        </div>
      </div>

      ${data.event_description ? `
      <div style="background: #fffbeb; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <h4 style="margin: 0 0 8px 0; color: #92400e;">📝 Dettagli:</h4>
        <p style="margin: 0; color: #92400e;">${data.event_description}</p>
      </div>
      ` : ''}

      <!-- Action Buttons -->
      <div class="actions">
        ${data.meeting_url ? `
          <a href="${data.meeting_url}" class="button">
            🎥 Entra nella Video Call
          </a>
        ` : ''}
        
        <a href="#" class="secondary-button">
          📅 Aggiungi al Calendario
        </a>
        
        <a href="#" class="secondary-button">
          ✏️ Modifica o Cancella
        </a>
      </div>

      <!-- Important Notes -->
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <h4 style="margin: 0 0 8px 0; color: #047857;">💡 Cosa aspettarsi:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #047857;">
          <li>Riceverai un promemoria prima dell'incontro</li>
          <li>Entra nella call 2-3 minuti in anticipo</li>
          ${data.meeting_url ? '<li>Non serve installare nulla - funziona nel browser</li>' : ''}
          <li>Hai domande? Rispondi a questa email</li>
        </ul>
      </div>

      <p>Non vediamo l'ora di incontrarti!</p>
      
      <p style="margin-top: 32px;">
        Un cordiale saluto,<br>
        <strong>${data.organizer_name}</strong>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        Powered by <a href="#" class="logo">CRM.AI</a> - Il calendario professionale gratuito
      </p>
      <p style="margin: 8px 0 0 0; font-size: 12px;">
        Questo calendario è illimitato e sempre gratuito. 
        <a href="#" style="color: #3b82f6;">Crea il tuo →</a>
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  // Build reminder email template
  private static buildReminderEmail(data: ReminderEmailData): string {
    const urgencyColor = data.minutes_before <= 15 ? '#dc2626' : data.minutes_before <= 60 ? '#f59e0b' : '#3b82f6';
    const urgencyBg = data.minutes_before <= 15 ? '#fef2f2' : data.minutes_before <= 60 ? '#fffbeb' : '#eff6ff';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Promemoria Appuntamento</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.6; 
      color: #374151;
      margin: 0;
      padding: 0;
      background-color: #f9fafb;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header { 
      background: ${urgencyColor}; 
      color: white; 
      padding: 24px; 
      text-align: center;
    }
    .content { padding: 24px; }
    .reminder-badge {
      background: ${urgencyBg};
      color: ${urgencyColor};
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 14px;
      display: inline-block;
      margin-bottom: 16px;
    }
    .event-summary {
      background: #f8fafc;
      border-left: 4px solid ${urgencyColor};
      padding: 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .big-button {
      display: block;
      background: ${urgencyColor};
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 18px;
      text-align: center;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${data.minutes_before <= 15 ? '🚨 INIZIA ORA!' : data.minutes_before <= 60 ? '⏰ Inizia Presto' : '📅 Promemoria'}</h1>
    </div>
    
    <div class="content">
      <div class="reminder-badge">
        ${data.minutes_before <= 15 ? 'Fra pochi minuti' : 
          data.minutes_before <= 60 ? `Fra ${data.minutes_before} minuti` : 
          `Fra ${Math.floor(data.minutes_before / 60)} ore`}
      </div>
      
      <p>Ciao <strong>${data.to_name}</strong>,</p>
      <p>${data.minutes_before <= 15 ? 
          'Il tuo appuntamento inizia a breve!' :
          data.minutes_before <= 60 ?
          'Questo è un promemoria per il tuo appuntamento imminente.' :
          'Ti ricordiamo del tuo prossimo appuntamento.'
        }</p>

      <div class="event-summary">
        <h2 style="margin: 0 0 12px 0;">${data.event_title}</h2>
        <p><strong>📅 Data:</strong> ${data.event_date}</p>
        <p><strong>🕐 Ora:</strong> ${data.event_time}</p>
        <p><strong>👤 Con:</strong> ${data.organizer_name}</p>
        ${data.meeting_url ? `<p><strong>🎥 Modalità:</strong> Video conferenza</p>` : ''}
      </div>

      ${data.meeting_url ? `
        <a href="${data.meeting_url}" class="big-button">
          🎥 ENTRA NELLA VIDEO CALL
        </a>
        <p style="text-align: center; font-size: 14px; color: #6b7280;">
          Entra 2-3 minuti prima per testare audio/video
        </p>
      ` : ''}

      ${data.minutes_before <= 15 ? `
        <div style="background: #fef2f2; border: 2px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #dc2626; font-weight: 600;">
            ⚡ <strong>AZIONE RICHIESTA:</strong> L'appuntamento inizia tra pochissimi minuti!
          </p>
        </div>
      ` : ''}

      <p>Ci vediamo presto!</p>
    </div>
  </div>
</body>
</html>`;
  }

  // Schedule reminders for an event
  static async scheduleReminders(eventId: string, eventData: {
    start_time: string;
    reminder_minutes: number[];
    attendees: { email: string; name: string }[];
    title: string;
    organizer_name: string;
  }): Promise<void> {
    try {
      const startTime = new Date(eventData.start_time);
      
      for (const minutes of eventData.reminder_minutes) {
        const reminderTime = new Date(startTime.getTime() - minutes * 60000);
        
        // TODO: Store in event_reminders table for background worker processing
        console.log(`⏰ Scheduled reminder for event ${eventId}:`, {
          eventId,
          minutes_before: minutes,
          reminder_time: reminderTime.toISOString(),
          recipients: eventData.attendees.length,
          trigger_type: minutes <= 15 ? 'urgent' : minutes <= 60 ? 'soon' : 'advance'
        });
        
        // For now, simulate immediate reminder if it's within next hour
        if (reminderTime <= new Date(Date.now() + 60 * 60 * 1000)) {
          for (const attendee of eventData.attendees) {
            await this.sendEventReminder({
              to_email: attendee.email,
              to_name: attendee.name,
              event_title: eventData.title,
              event_date: startTime.toLocaleDateString('it-IT'),
              event_time: startTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
              organizer_name: eventData.organizer_name,
              minutes_before: minutes,
              reminder_type: minutes <= 15 ? 'final' : minutes <= 60 ? 'first' : 'custom'
            });
          }
        }
      }
    } catch (error) {
      console.error('Reminder scheduling failed:', error);
    }
  }

  // Send bulk notifications (Enterprise feature)
  static async sendBulkNotifications(notifications: EventEmailData[]): Promise<{
    successful: number;
    failed: number;
  }> {
    let successful = 0;
    let failed = 0;
    
    for (const notification of notifications) {
      const result = await this.sendEventConfirmation(notification);
      if (result) {
        successful++;
      } else {
        failed++;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('📊 Bulk Notification Results:', { successful, failed });
    return { successful, failed };
  }

  // Validate email address
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Generate unsubscribe link (GDPR compliance)
  static generateUnsubscribeLink(email: string, eventId: string): string {
    // TODO: Implement proper unsubscribe mechanism
    return `#unsubscribe?email=${encodeURIComponent(email)}&event=${eventId}`;
  }
}
export interface EventEmailData {
  eventTitle: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingUrl?: string;
  description?: string;
  organizerName: string;
  attendeeName?: string;
}

// Base email wrapper
function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: white;
      padding: 30px;
      border: 1px solid #e0e0e0;
    }
    .footer {
      background: #f5f5f5;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 10px 0;
    }
    .event-details {
      background: #f9fafb;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
    }
    .detail-row {
      margin: 8px 0;
    }
    .label {
      font-weight: bold;
      color: #555;
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>`;
}

// Event confirmation email
export function eventConfirmationEmail(data: EventEmailData): string {
  return emailWrapper(`
    <div class="header">
      <h1>✅ Evento Confermato</h1>
    </div>
    <div class="content">
      <p>Ciao ${data.attendeeName || 'there'},</p>
      
      <p>Il tuo evento è stato confermato con successo!</p>
      
      <div class="event-details">
        <h2 style="margin-top: 0;">${data.eventTitle}</h2>
        
        <div class="detail-row">
          <span class="label">📅 Data:</span> 
          ${new Date(data.startTime).toLocaleDateString('it-IT', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
        
        <div class="detail-row">
          <span class="label">⏰ Ora:</span> 
          ${new Date(data.startTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - 
          ${new Date(data.endTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
        </div>
        
        ${data.location ? `
          <div class="detail-row">
            <span class="label">📍 Luogo:</span> ${data.location}
          </div>
        ` : ''}
        
        ${data.meetingUrl ? `
          <div class="detail-row">
            <span class="label">🎥 Link Meeting:</span> 
            <a href="${data.meetingUrl}" class="button">Partecipa al Meeting</a>
          </div>
        ` : ''}
        
        ${data.description ? `
          <div class="detail-row">
            <span class="label">📝 Descrizione:</span><br>
            ${data.description}
          </div>
        ` : ''}
      </div>
      
      <p style="margin-top: 20px;">
        <strong>Organizzato da:</strong> ${data.organizerName}
      </p>
      
      <p style="color: #666; font-size: 14px;">
        Riceverai un promemoria prima dell'evento.
      </p>
    </div>
    <div class="footer">
      <p>Questo è un messaggio automatico da CRM.AI</p>
      <p>© 2025 CRM.AI - Sistema di Gestione Calendario</p>
    </div>
  `);
}

// Event reminder email
export function eventReminderEmail(data: EventEmailData, minutesBefore: number): string {
  const timeText = minutesBefore < 60 
    ? `${minutesBefore} minuti`
    : minutesBefore < 1440
      ? `${Math.floor(minutesBefore / 60)} ${minutesBefore >= 120 ? 'ore' : 'ora'}`
      : `${Math.floor(minutesBefore / 1440)} ${minutesBefore >= 2880 ? 'giorni' : 'giorno'}`;

  return emailWrapper(`
    <div class="header">
      <h1>⏰ Promemoria Evento</h1>
    </div>
    <div class="content">
      <p>Ciao ${data.attendeeName || 'there'},</p>
      
      <p><strong>Il tuo evento inizia tra ${timeText}!</strong></p>
      
      <div class="event-details">
        <h2 style="margin-top: 0;">${data.eventTitle}</h2>
        
        <div class="detail-row">
          <span class="label">⏰ Ora:</span> 
          ${new Date(data.startTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
        </div>
        
        ${data.meetingUrl ? `
          <div style="text-align: center; margin: 20px 0;">
            <a href="${data.meetingUrl}" class="button" style="font-size: 16px;">
              🎥 Partecipa Ora
            </a>
          </div>
        ` : data.location ? `
          <div class="detail-row">
            <span class="label">📍 Luogo:</span> ${data.location}
          </div>
        ` : ''}
      </div>
      
      <p style="color: #666; font-size: 14px;">
        Preparati per il tuo evento!
      </p>
    </div>
    <div class="footer">
      <p>Questo è un promemoria automatico da CRM.AI</p>
    </div>
  `);
}

// Event cancellation email
export function eventCancellationEmail(data: EventEmailData): string {
  return emailWrapper(`
    <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
      <h1>❌ Evento Cancellato</h1>
    </div>
    <div class="content">
      <p>Ciao ${data.attendeeName || 'there'},</p>
      
      <p>L'evento seguente è stato cancellato:</p>
      
      <div class="event-details" style="border-left-color: #ef4444;">
        <h2 style="margin-top: 0; text-decoration: line-through;">${data.eventTitle}</h2>
        
        <div class="detail-row">
          <span class="label">📅 Data:</span> 
          ${new Date(data.startTime).toLocaleDateString('it-IT')}
        </div>
        
        <div class="detail-row">
          <span class="label">⏰ Ora:</span> 
          ${new Date(data.startTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      
      <p>Ci scusiamo per l'inconveniente.</p>
    </div>
    <div class="footer">
      <p>Questo è un messaggio automatico da CRM.AI</p>
    </div>
  `);
}

// Event update email
export function eventUpdateEmail(data: EventEmailData): string {
  return emailWrapper(`
    <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
      <h1>🔄 Evento Aggiornato</h1>
    </div>
    <div class="content">
      <p>Ciao ${data.attendeeName || 'there'},</p>
      
      <p>I dettagli del tuo evento sono stati aggiornati:</p>
      
      <div class="event-details" style="border-left-color: #f59e0b;">
        <h2 style="margin-top: 0;">${data.eventTitle}</h2>
        
        <div class="detail-row">
          <span class="label">📅 Data:</span> 
          ${new Date(data.startTime).toLocaleDateString('it-IT', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
        
        <div class="detail-row">
          <span class="label">⏰ Ora:</span> 
          ${new Date(data.startTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - 
          ${new Date(data.endTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
        </div>
        
        ${data.location ? `
          <div class="detail-row">
            <span class="label">📍 Luogo:</span> ${data.location}
          </div>
        ` : ''}
        
        ${data.meetingUrl ? `
          <div class="detail-row">
            <span class="label">🎥 Link Meeting:</span> 
            <a href="${data.meetingUrl}" class="button">Partecipa al Meeting</a>
          </div>
        ` : ''}
      </div>
      
      <p style="color: #666; font-size: 14px;">
        Controlla i nuovi dettagli e aggiorna il tuo calendario.
      </p>
    </div>
    <div class="footer">
      <p>Questo è un messaggio automatico da CRM.AI</p>
    </div>
  `);
}
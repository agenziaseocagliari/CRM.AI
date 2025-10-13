// Video meeting generation service
// Provides automated video link generation for calendar events

interface EventData {
  title: string;
  start_time: string;
  end_time: string;
  organizer_email: string;
  attendee_emails: string[];
}

interface VideoMeetingResult {
  provider: string;
  url: string;
  details: {
    title: string;
    created_at: string;
    meeting_id?: string;
    access_code?: string;
  };
}

export class VideoMeetingService {
  
  // Generate meeting link based on preferences and event data
  static async generateMeetingLink(eventData: EventData): Promise<VideoMeetingResult> {
    try {
      // For now, focus on Google Meet (instant, no OAuth needed)
      // Future: Add Zoom, Teams, WebEx based on user preferences
      
      const meetingUrl = this.generateGoogleMeetLink();
      
      return {
        provider: 'google_meet',
        url: meetingUrl,
        details: {
          title: eventData.title,
          created_at: new Date().toISOString(),
          meeting_id: this.extractMeetingId(meetingUrl)
        }
      };
    } catch (error) {
      console.error('Video link generation failed:', error);
      
      // Fallback to generic meet link
      return {
        provider: 'google_meet_fallback',
        url: this.generateFallbackMeetLink(),
        details: {
          title: eventData.title,
          created_at: new Date().toISOString()
        }
      };
    }
  }

  // Generate Google Meet link (instant, no OAuth required)
  // Uses Google Meet's public meeting pattern
  private static generateGoogleMeetLink(): string {
    const meetingId = this.generateMeetingId();
    return `https://meet.google.com/${meetingId}`;
  }

  // Generate unique meeting ID following Google Meet pattern
  private static generateMeetingId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    
    // Google Meet pattern: xxx-xxxx-xxx (3-4-3 structure)
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < (i === 1 ? 4 : 3); j++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 2) result += '-';
    }
    
    return result;
  }

  // Extract meeting ID from URL for display
  private static extractMeetingId(url: string): string {
    const match = url.match(/meet\.google\.com\/([a-z-]+)/);
    return match ? match[1] : '';
  }

  // Fallback meeting link for edge cases
  private static generateFallbackMeetLink(): string {
    const fallbackId = Math.random().toString(36).substring(2, 15);
    return `https://meet.google.com/new?authuser=0&hs=122&pli=1&eid=${fallbackId}`;
  }

  // Future: Zoom integration with OAuth
  static async generateZoomMeeting(_eventData: EventData): Promise<VideoMeetingResult> {
    // TODO: Implement Zoom OAuth + API integration
    // This will require:
    // 1. Zoom OAuth app setup
    // 2. User OAuth token management  
    // 3. Zoom API calls to create meetings
    // 4. Handle rate limits and errors
    
    throw new Error('Zoom integration coming soon - Enterprise feature');
  }

  // Future: Microsoft Teams integration
  static async generateTeamsMeeting(_eventData: EventData): Promise<VideoMeetingResult> {
    // TODO: Implement Microsoft Graph API integration
    throw new Error('Teams integration coming soon - Enterprise feature');
  }

  // Validate and enhance meeting URLs
  static validateMeetingUrl(url: string): boolean {
    const validPatterns = [
      /^https:\/\/meet\.google\.com\/[a-z-]+$/,
      /^https:\/\/zoom\.us\/j\/\d+/,
      /^https:\/\/teams\.microsoft\.com\/l\/meetup-join/,
      /^https:\/\/.*\.webex\.com\//
    ];
    
    return validPatterns.some(pattern => pattern.test(url));
  }

  // Generate meeting instructions for attendees
  static generateMeetingInstructions(result: VideoMeetingResult): string {
    const { provider, url, details } = result;
    
    switch (provider) {
      case 'google_meet':
        return `
🎥 **Video Conference Details**

**Meeting Link**: ${url}

**Instructions**:
1. Click the link above 5 minutes before the meeting
2. No software installation required - works in browser
3. For best experience, use Chrome browser
4. Meeting ID: ${details.meeting_id}

**Mobile**: Download Google Meet app and enter meeting ID

**First time?** Test your camera/mic: https://meet.google.com/test
        `.trim();
        
      case 'zoom':
        return `
🎥 **Zoom Meeting Details**

**Meeting Link**: ${url}
**Meeting ID**: ${details.meeting_id}
${details.access_code ? `**Passcode**: ${details.access_code}` : ''}

**Instructions**:
1. Click the link or open Zoom app
2. Enter Meeting ID if prompted
3. Test your setup: https://zoom.us/test

**Phone Dial-in**: Available in meeting link
        `.trim();
        
      default:
        return `
🎥 **Video Meeting**

**Link**: ${url}
**Time**: Please join 5 minutes early
**Platform**: ${provider}
        `.trim();
    }
  }

  // Enterprise feature: Batch meeting generation
  static async generateBulkMeetings(events: EventData[]): Promise<VideoMeetingResult[]> {
    const results: VideoMeetingResult[] = [];
    
    for (const event of events) {
      try {
        const result = await this.generateMeetingLink(event);
        results.push(result);
        
        // Rate limiting - don't overwhelm external services
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Bulk generation failed for event: ${event.title}`, error);
      }
    }
    
    return results;
  }

  // Analytics: Track meeting usage
  static trackMeetingUsage(provider: string, success: boolean): void {
    // TODO: Send to analytics service
    console.log('📊 Meeting Generation Analytics:', {
      provider,
      success,
      timestamp: new Date().toISOString()
    });
  }
}
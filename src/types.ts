export type SlotStatus = 'sent' | 'accepted' | 'declined' | 'expired';

export interface TimeSlot {
  id: string;
  date: string;       // ISO date string YYYY-MM-DD
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  sentTo: string;     // name or email of the person
  purpose: string;    // meeting subject / context
  status: SlotStatus;
  sentAt: string;     // ISO datetime when you sent the offer
  notes?: string;
}

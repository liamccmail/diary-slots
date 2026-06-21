export type SlotStatus = 'sent' | 'accepted' | 'declined' | 'expired';

export interface Director {
  id: string;
  name: string;
  color: string; // tailwind-style hex for the tab accent
}

export interface TimeSlot {
  id: string;
  date: string;        // YYYY-MM-DD
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  directorIds: string[]; // which directors are involved
  sentTo: string;      // external contact (client / other party)
  purpose: string;
  status: SlotStatus;
  sentAt: string;      // ISO datetime logged
  notes?: string;
}

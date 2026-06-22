export type SlotStatus = 'sent' | 'accepted' | 'declined' | 'expired';
export type AppointmentType = 'in-person' | 'online';

export interface Director {
  id: string;
  name: string;
  position?: string;
  color: string;
}

export interface TimeSlot {
  id: string;
  date: string;        // YYYY-MM-DD
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  directorIds: string[];
  sentTo: string;
  purpose: string;
  status: SlotStatus;
  sentAt: string;
  appointmentType?: AppointmentType;
  notes?: string;
}

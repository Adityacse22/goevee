/**
 * SERVICE — Booking API layer.
 * Uses the README-defined Express REST API and adapts existing UI input shapes.
 */

import { apiRequest } from '@/services/apiClient';
import type { Booking } from '@/models/booking.model';

interface ApiBooking {
  id: string;
  userId?: string;
  user_id?: string;
  chargerId?: string;
  charger_id?: string;
  vehicleId?: string | null;
  vehicle_id?: string | null;
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  status: string;
  totalPrice?: string | number | null;
  total_price?: string | number | null;
  bookingReference?: string;
  booking_reference?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

function toLocalIso(date: string, time: string): string {
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  return new Date(`${date}T${normalizedTime}`).toISOString();
}

function mapBooking(booking: ApiBooking): Booking {
  const start = booking.startTime ?? booking.start_time ?? '';
  const end = booking.endTime ?? booking.end_time ?? '';
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;

  return {
    id: booking.id,
    user_id: booking.userId ?? booking.user_id ?? '',
    station_id: '',
    connector_id: booking.chargerId ?? booking.charger_id ?? '',
    booking_date: startDate ? startDate.toISOString().slice(0, 10) : '',
    start_time: startDate ? startDate.toISOString().slice(11, 19) : '',
    end_time: endDate ? endDate.toISOString().slice(11, 19) : '',
    duration_hours: startDate && endDate
      ? (endDate.getTime() - startDate.getTime()) / 3_600_000
      : 0,
    total_price: Number(booking.totalPrice ?? booking.total_price ?? 0),
    status: String(booking.status).toLowerCase() as Booking['status'],
    special_requests: booking.bookingReference ?? booking.booking_reference,
    created_at: booking.createdAt ?? booking.created_at ?? '',
    updated_at: booking.updatedAt ?? booking.updated_at ?? '',
  };
}

export async function fetchUserBookings(): Promise<Booking[]> {
  const response = await apiRequest<{ bookings: ApiBooking[] }>('/bookings/me');
  return response.bookings.map(mapBooking);
}

export async function createBooking(
  bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>,
): Promise<Booking> {
  const response = await apiRequest<{ booking: ApiBooking }>('/bookings', {
    method: 'POST',
    body: JSON.stringify({
      chargerId: bookingData.connector_id,
      startTime: toLocalIso(bookingData.booking_date, bookingData.start_time),
      endTime: toLocalIso(bookingData.booking_date, bookingData.end_time),
      totalPrice: bookingData.total_price,
    }),
  });

  return mapBooking(response.booking);
}

export async function cancelBooking(bookingId: string): Promise<Booking> {
  const response = await apiRequest<{ booking: ApiBooking }>(`/bookings/${bookingId}/cancel`, {
    method: 'PATCH',
  });
  return mapBooking(response.booking);
}

/**
 * CONTROLLER — Booking data hooks.
 * Wraps bookingService queries with React Query.
 * Moved from hooks/useBookings.ts.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as bookingService from '@/services/bookingService';
import type { Booking } from '@/models/booking.model';
import toast from 'react-hot-toast';

export const useBookings = (userId?: string) => {
  return useQuery({
    queryKey: ['bookings', userId],
    queryFn: (): Promise<Booking[]> => bookingService.fetchUserBookings(),
    enabled: !!userId,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) =>
      bookingService.createBooking(bookingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking created successfully!');
    },
    onError: (error: any) => {
      console.error('Booking creation failed:', error);
      toast.error(error.message || 'Failed to create booking. Please try again.');
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => bookingService.cancelBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking cancelled successfully.');
    },
    onError: (error: any) => {
      console.error('Booking cancellation failed:', error);
      toast.error(error.message || 'Failed to cancel booking. Please try again.');
    },
  });
};

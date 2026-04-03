import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { socket } from '@/lib/socket';
import api from '@/lib/api';
import type { OrderStatus, DeliveryStatus } from '@medichainlk/shared-types';

interface OrderState {
  status: OrderStatus;
  deliveryStatus: DeliveryStatus | null;
  driverLocation: { lat: number; lng: number } | null;
}

export function useOrderTracking(orderId: string | null) {
  const [liveState, setLiveState] = useState<Partial<OrderState>>({});

  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const res = await api.get(`/orders/${orderId}`);
      return res.data.data;
    },
    enabled: !!orderId,
  });

  useEffect(() => {
    if (!orderId) return;

    socket.connect();
    socket.emit('join:order', orderId);

    socket.on('order:status', (data: { orderId: string; status: OrderStatus }) => {
      if (data.orderId === orderId) setLiveState((s) => ({ ...s, status: data.status }));
    });

    socket.on('delivery:location', (location: { lat: number; lng: number }) => {
      setLiveState((s) => ({ ...s, driverLocation: location }));
    });

    return () => {
      socket.off('order:status');
      socket.off('delivery:location');
      socket.disconnect();
    };
  }, [orderId]);

  return { order, liveState };
}

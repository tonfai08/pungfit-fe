import type { Metadata } from 'next';
import EventPortal from '@/components/bk-public/EventPortal';
import './booking.css';

export const metadata: Metadata = {
  title: 'Events | PungFit',
  description: 'เลือกกิจกรรมและตรวจสอบสถานะการจอง',
};

export default function BookingPage() {
  return <EventPortal />;
}

import { LockerRoom } from '@/components/negotiation/LockerRoom';

interface Props {
  params: Promise<{ room: string }>;
}

export default async function LockerRoomPage({ params }: Props) {
  const { room } = await params;
  const roomNum = room === '2' ? 2 : 1;
  return (
    <main className="min-h-screen bg-[#faf5fa]">
      <LockerRoom room={roomNum} />
    </main>
  );
}

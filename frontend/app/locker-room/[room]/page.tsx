import { LockerRoom } from '@/components/negotiation/LockerRoom';

interface Props {
  params: Promise<{ room: string }>;
}

export default async function LockerRoomPage({ params }: Props) {
  const { room } = await params;
  const roomNum = room === '2' ? 2 : 1;
  return (
    <main className="min-h-screen bg-[#0a0618]">
      <LockerRoom room={roomNum} />
    </main>
  );
}

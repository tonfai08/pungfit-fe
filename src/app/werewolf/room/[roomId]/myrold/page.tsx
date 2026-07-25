"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WerewolfMyRoldAliasPage() {
  const router = useRouter();
  const { roomId } = useParams<{ roomId: string }>();

  useEffect(() => {
    if (!roomId) return;
    router.replace(`/werewolf/room/${roomId}/myrole`);
  }, [roomId, router]);

  return <p className="text-center mt-10">Redirecting...</p>;
}

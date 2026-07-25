"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/api/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace("/dashboard");
      return;
    }
    router.replace("/login");
  }, [router]);

  return <p className="text-center mt-10">Loading...</p>;
}

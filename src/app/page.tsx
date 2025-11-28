"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/api/auth";



export default function Home() {
  const router = useRouter();
 useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
    }else {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      
    </div>
  );
}

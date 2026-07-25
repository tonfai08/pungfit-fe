"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { fadeInUp } from "@/lib/motion";

export default function PageTransition({
  children,
  className = "w-full flex flex-col items-center gap-2",
}: {
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        className={className}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

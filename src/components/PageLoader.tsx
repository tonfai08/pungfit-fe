"use client";

import { motion } from "framer-motion";

export default function PageLoader({
  label = "กำลังโหลด...",
}: {
  label?: string;
}) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 py-24">
      <div className="relative h-12 w-12">
        <span className="absolute inset-0 rounded-full border-4 border-accent/15" />
        <motion.span
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        />
      </div>
      <motion.p
        className="text-sm text-text-secondary"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
      >
        {label}
      </motion.p>
    </div>
  );
}

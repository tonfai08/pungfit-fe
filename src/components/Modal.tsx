"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    // ปิดด้วยปุ่ม ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal Box */}
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        <div
                            className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* ปุ่มปิด */}
                            <button
                                onClick={onClose}
                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>

                            {/* Title */}
                            {title && (
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                                    {title}
                                </h2>
                            )}

                            {/* เนื้อหา */}
                            <div>{children}</div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignOutButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        window.location.href = "/login"; // Hard navigation to clear all state immediately
    };

    return (
        <button
            onClick={handleSignOut}
            disabled={loading}
            className="text-sm px-4 py-2 rounded-lg transition-all duration-150 disabled:opacity-60"
            style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.borderColor = "var(--text-secondary)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.borderColor = "var(--border)";
            }}
        >
            {loading ? "Signing out..." : "Sign out"}
        </button>
    );
}

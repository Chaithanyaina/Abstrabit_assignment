"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Bookmark } from "@/lib/types";
import BookmarkCard from "./BookmarkCard";
import { useRouter } from "next/navigation";
import { useRealtimeBookmarks } from "@/hooks/useRealtimeBookmarks";

interface BookmarkListProps {
    initialBookmarks: Bookmark[];
    userId: string;
}

export default function BookmarkList({ initialBookmarks, userId }: BookmarkListProps) {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
    const supabase = createClient();
    const router = useRouter();

    // 1. Use our new robust Realtime hook
    const { status, realtimeEvent } = useRealtimeBookmarks(userId);

    // 2. Handle Realtime Events (Background Sync)
    useEffect(() => {
        if (!realtimeEvent) return;

        if (realtimeEvent.type === "INSERT") {
            const newBookmark = realtimeEvent.payload.new as Bookmark;
            setBookmarks((prev) => {
                // Deduping: If we already have this ID (from optimistic update), don't add duplicate
                if (prev.some(b => b.id === newBookmark.id)) return prev;
                return [newBookmark, ...prev];
            });
        } else if (realtimeEvent.type === "DELETE") {
            const deletedId = realtimeEvent.payload.old?.id;
            if (deletedId) {
                setBookmarks((prev) => prev.filter((b) => b.id !== deletedId));
            }
        }
    }, [realtimeEvent]);

    // 3. Listen for local inserts (Optimistic Add)
    useEffect(() => {
        const handleNewBookmark = (event: Event) => {
            const customEvent = event as CustomEvent<Bookmark>;
            const newBookmark = customEvent.detail;
            setBookmarks((prev) => {
                if (prev.some(b => b.id === newBookmark.id)) return prev;
                return [newBookmark, ...prev];
            });
        };

        window.addEventListener("new-bookmark", handleNewBookmark);
        return () => window.removeEventListener("new-bookmark", handleNewBookmark);
    }, []);

    // 4. Handle Auth Changes (Security)
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_OUT") {
                router.replace("/login");
            } else if (event === "SIGNED_IN" && session?.user?.id && session.user.id !== userId) {
                window.location.reload();
            }
        });
        return () => subscription.unsubscribe();
    }, [userId, supabase, router]);

    // 4. Optimistic Delete (Immediate UI Feedback)
    const handleDelete = async (id: string) => {
        // Optimistically remove from UI immediately
        setBookmarks(prev => prev.filter(b => b.id !== id));

        // Then fire network request
        const { error } = await supabase.from("bookmarks").delete().eq("id", id);

        // If error, rollback (optional, but good practice - for now we just log)
        if (error) {
            console.error("Failed to delete:", error);
            // In a pro app, we'd revert the state here
        }
    };

    if (bookmarks.length === 0) {
        return (
            <div
                className="rounded-2xl border p-12 text-center"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
                <div className="text-4xl mb-3">📭</div>
                <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                    No bookmarks yet
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Add your first bookmark above
                </p>

                {/* Connection Status Debug (Tiny) */}
                <div className="mt-6 flex justify-center">
                    <div className="flex items-center gap-2 px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-tight"
                        style={{
                            background: status === "connected" ? "rgba(16, 185, 129, 0.1)" : "rgba(239,68,68,0.1)",
                            color: status === "connected" ? "#10b981" : "var(--danger)"
                        }}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status === "connected" ? "animate-pulse" : ""}`}
                            style={{ background: "currentColor" }} />
                        {status === "connected" ? "Sync Active" : "Connecting..."}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="font-semibold text-sm uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                        Your Bookmarks
                    </h2>
                    {/* Connection Status Indicator */}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-tight transition-colors duration-300"
                        style={{
                            background: status === "connected" ? "rgba(16, 185, 129, 0.1)" : "rgba(239,68,68,0.1)",
                            color: status === "connected" ? "#10b981" : "var(--danger)"
                        }}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status === "connected" ? "animate-pulse" : ""}`}
                            style={{ background: "currentColor" }} />
                        {status === "connected" ? "Live" : "Reconnecting"}
                    </div>
                </div>

                <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
                >
                    {bookmarks.length} saved
                </span>
            </div>
            <div className="space-y-3">
                {bookmarks.map((bookmark) => (
                    <BookmarkCard
                        key={bookmark.id}
                        bookmark={bookmark}
                        onDelete={handleDelete}
                    />
                ))}
            </div>
        </div>
    );
}

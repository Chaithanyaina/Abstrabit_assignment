"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Bookmark } from "@/lib/types";
import BookmarkCard from "./BookmarkCard";
import { useRouter } from "next/navigation";

interface BookmarkListProps {
    initialBookmarks: Bookmark[];
    userId: string;
}

export default function BookmarkList({ initialBookmarks, userId }: BookmarkListProps) {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
    const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");
    const supabase = createClient();
    const router = useRouter();

    // Sync state if initialBookmarks change (e.g. after router.refresh() on add/delete)
    useEffect(() => {
        setBookmarks(initialBookmarks);
    }, [initialBookmarks]);

    useEffect(() => {
        const channelName = `bookmarks-user-${userId}`;

        const channel = supabase
            .channel(channelName)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "bookmarks",
                },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        const newBookmark = payload.new as Bookmark;
                        setBookmarks((prev) => {
                            if (prev.some(b => b.id === newBookmark.id)) return prev;
                            return [newBookmark, ...prev];
                        });
                    } else if (payload.eventType === "DELETE") {
                        const deletedId = payload.old?.id;
                        if (deletedId) {
                            setBookmarks((prev) => prev.filter((b) => b.id !== deletedId));
                        }
                    }
                }
            )
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    setStatus("connected");
                } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                    setStatus("error");
                }
            });

        // Auth Listener: Force reload if user changes (e.g. from another tab)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_OUT") {
                router.replace("/login");
            } else if (event === "SIGNED_IN" && session?.user?.id && session.user.id !== userId) {
                window.location.reload(); // Hard reload to fetch new server props
            }
        });

        return () => {
            supabase.removeChannel(channel);
            subscription.unsubscribe();
        };
    }, [userId, supabase, router]);

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from("bookmarks").delete().eq("id", id);
        if (error) {
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
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Your Bookmarks
                </h2>
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

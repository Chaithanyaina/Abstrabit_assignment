"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Bookmark } from "@/lib/types";

export function useRealtimeBookmarks(userId: string) {
    const supabase = createClient();
    const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");
    const [realtimeEvent, setRealtimeEvent] = useState<{
        type: "INSERT" | "DELETE";
        payload: any;
        timestamp: number;
    } | null>(null);

    // Use a ref to track if we're mounted to avoid state updates on unmount
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        if (!userId) return;

        let channel: ReturnType<typeof supabase.channel> | null = null;

        const setupSubscription = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                console.log("[useRealtimeBookmarks] No session found, skipping subscription");
                return;
            }

            console.log(`[useRealtimeBookmarks] Initializing channel for user: ${userId}`);
            const channelName = `bookmarks-user-${userId}`;

            // Channel with RLS policies enabled by the authenticated client
            channel = supabase
                .channel(channelName)
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "bookmarks",
                    },
                    (payload) => {
                        console.log("[useRealtimeBookmarks] Event received:", payload.eventType);

                        if (isMounted.current) {
                            setRealtimeEvent({
                                type: payload.eventType as "INSERT" | "DELETE",
                                payload: payload,
                                timestamp: Date.now(),
                            });
                        }
                    }
                )
                .subscribe((status) => {
                    console.log(`[useRealtimeBookmarks] Status: ${status}`);
                    if (isMounted.current) {
                        if (status === "SUBSCRIBED") {
                            setStatus("connected");
                        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                            setStatus("error");
                        } else {
                            setStatus("connecting");
                        }
                    }
                });
        };

        setupSubscription();

        return () => {
            console.log(`[useRealtimeBookmarks] Cleaning up channel`);
            if (channel) supabase.removeChannel(channel);
        };
    }, [userId, supabase]);

    return { status, realtimeEvent };
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AddBookmarkForm() {
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Basic URL validation
        let normalizedUrl = url.trim();
        if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
            normalizedUrl = "https://" + normalizedUrl;
        }

        try {
            new URL(normalizedUrl);
        } catch {
            setError("Please enter a valid URL");
            return;
        }

        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setError("Session expired. Please log in again.");
            setLoading(false);
            return;
        }

        const { data, error: insertError } = await supabase
            .from("bookmarks")
            .insert({
                title: title.trim(),
                url: normalizedUrl,
                user_id: user.id,
            })
            .select() // Return the inserted data immediately
            .single();

        setLoading(false);

        if (insertError) {
            setError(insertError.message);
        } else {
            // Dispatch custom event for instant UI update (bypassing Realtime latency for local user)
            const event = new CustomEvent("new-bookmark", { detail: data });
            window.dispatchEvent(event);

            setTitle("");
            setUrl("");
        }
    };

    return (
        <div
            className="rounded-2xl border p-6"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
            <h2 className="font-semibold text-sm mb-4 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Add Bookmark
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <input
                        type="text"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                        style={{
                            background: "var(--surface-2)",
                            border: "1px solid var(--border)",
                            color: "var(--text-primary)",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "#10b981")}
                        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                    />
                </div>
                <div>
                    <input
                        type="text"
                        placeholder="URL (e.g. https://example.com)"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                        style={{
                            background: "var(--surface-2)",
                            border: "1px solid var(--border)",
                            color: "var(--text-primary)",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "#10b981")}
                        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                    />
                </div>

                {error && (
                    <p className="text-sm" style={{ color: "var(--danger)" }}>
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                        background: loading ? "var(--surface-2)" : "linear-gradient(135deg, #10b981, #059669)",
                        color: "#fff",
                    }}
                >
                    {loading ? "Adding..." : "Add Bookmark"}
                </button>
            </form>
        </div>
    );
}

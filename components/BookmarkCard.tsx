"use client";

import { useState } from "react";
import type { Bookmark } from "@/lib/types";

interface BookmarkCardProps {
    bookmark: Bookmark;
    onDelete: (id: string) => void;
}

function getFavicon(url: string) {
    try {
        const { hostname } = new URL(url);
        return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
    } catch {
        return null;
    }
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export default function BookmarkCard({ bookmark, onDelete }: BookmarkCardProps) {
    const [deleting, setDeleting] = useState(false);
    const favicon = getFavicon(bookmark.url);

    const handleDelete = async () => {
        setDeleting(true);
        await onDelete(bookmark.id);
    };

    let hostname = "";
    try {
        hostname = new URL(bookmark.url).hostname;
    } catch { }

    return (
        <div
            className="group rounded-xl border p-4 flex items-start gap-4 transition-all duration-200"
            style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                opacity: deleting ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
                if (!deleting) e.currentTarget.style.borderColor = "#10b981";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
            }}
        >
            {/* Favicon */}
            <div
                className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden"
                style={{ background: "var(--surface-2)" }}
            >
                {favicon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={favicon}
                        alt=""
                        width={20}
                        height={20}
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                        }}
                    />
                ) : (
                    <span className="text-sm">🔗</span>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sm leading-snug hover:underline block truncate"
                    style={{ color: "var(--text-primary)" }}
                >
                    {bookmark.title}
                </a>
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
                    {hostname}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-secondary)", opacity: 0.6 }}>
                    {formatDate(bookmark.created_at)}
                </p>
            </div>

            {/* Delete button */}
            <button
                onClick={handleDelete}
                disabled={deleting}
                title="Delete bookmark"
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 disabled:cursor-not-allowed"
                style={{
                    background: "var(--surface-2)",
                    color: "var(--danger)",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--surface-2)";
                }}
            >
                {deleting ? (
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                )}
            </button>
        </div>
    );
}

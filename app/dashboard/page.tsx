import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BookmarkList from "@/components/BookmarkList";
import AddBookmarkForm from "@/components/AddBookmarkForm";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch initial bookmarks server-side
    const { data: bookmarks } = await supabase
        .from("bookmarks")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="min-h-screen" style={{ background: "var(--background)" }}>
            {/* Header */}
            <header
                className="sticky top-0 z-10 border-b"
                style={{
                    background: "rgba(26, 26, 36, 0.85)",
                    backdropFilter: "blur(12px)",
                    borderColor: "var(--border)",
                }}
            >
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🔖</span>
                        <div>
                            <h1 className="font-semibold text-base leading-tight" style={{ color: "var(--text-primary)" }}>
                                Bookmark Manager
                            </h1>
                            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                {user.email}
                            </p>
                        </div>
                    </div>
                    <SignOutButton />
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                <AddBookmarkForm />
                <BookmarkList initialBookmarks={bookmarks ?? []} userId={user.id} />
            </main>
        </div>
    );
}

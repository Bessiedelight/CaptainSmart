import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expose Corner - Anonymous Reports | Captain Smart",
  description:
    "Share and discover anonymous reports and stories from the community. Vote on exposes and stay informed about important issues.",
  keywords:
    "anonymous reports, expose corner, community stories, whistleblowing, captain smart",
  openGraph: {
    title: "Expose Corner - Anonymous Reports | Captain Smart",
    description:
      "Share and discover anonymous reports and stories from the community.",
    type: "website",
  },
};

export default function ExposeCornerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}

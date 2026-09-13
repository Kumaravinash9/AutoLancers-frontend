import { SiteNav } from "@/components/site-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <main className="flex-1">{children}</main>
    </>
  );
}

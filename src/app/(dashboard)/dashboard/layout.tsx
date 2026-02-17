// This layout is now minimal since the parent (dashboard) layout handles
// authentication, header, and footer. This file can be used for
// dashboard-specific layout needs if required in the future.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

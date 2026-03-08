export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--app-bg)' }}>
      <div className="app-mesh absolute inset-0 overflow-hidden pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

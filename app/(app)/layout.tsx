import AppLayout from '@/components/AppLayout';
import { PageTransition } from '@/components/PageTransition';

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <PageTransition>{children}</PageTransition>
    </AppLayout>
  );
}

import { BottomTabs } from '@/components/BottomTabs';

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ds-screen">
      <div style={{ flex: 1 }}>{children}</div>
      <BottomTabs />
    </div>
  );
}

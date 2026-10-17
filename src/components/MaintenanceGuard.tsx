import { type ReactNode } from "react";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import MaintenancePage from "@/pages/MaintenancePage";

export function MaintenanceGuard({ children }: { children: ReactNode }) {
  const { data: settings, isLoading } = useMaintenanceMode();
  const { user, loading: authLoading } = useAuth();
  const isAdmin = useIsAdmin(user?.id);

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (settings?.maintenance_mode && !isAdmin) {
    return (
      <MaintenancePage
        title={settings.maintenance_title}
        subtitle={settings.maintenance_subtitle}
        message={settings.maintenance_message}
        buttonEnabled={settings.maintenance_button_enabled}
        buttonText={settings.maintenance_button_text}
        buttonUrl={settings.maintenance_button_url}
      />
    );
  }

  return <>{children}</>;
}

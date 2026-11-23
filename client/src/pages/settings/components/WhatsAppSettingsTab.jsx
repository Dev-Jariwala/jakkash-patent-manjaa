import QueryError from "@/components/Errors/QueryError";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  getWhatsAppServiceSetting,
  updateWhatsAppServiceSetting,
} from "@/services/settings";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

const WhatsAppSettingsTab = () => {
  const queryClient = useQueryClient();

  const {
    data: setting,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["whatsappServiceSetting"],
    queryFn: async () => {
      const res = await getWhatsAppServiceSetting();
      return res.data;
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: updateWhatsAppServiceSetting,
    onSuccess: (res) => {
      queryClient.setQueryData(["whatsappServiceSetting"], res.data);
      toast.success(
        res.data.whatsapp_service_enabled
          ? "WhatsApp order delivery enabled"
          : "WhatsApp order delivery disabled"
      );
    },
    onError: () => {
      toast.error("Failed to update WhatsApp service setting");
    },
  });

  const handleToggle = (checked) => {
    updateSettingMutation.mutate(checked);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="basic-loader"></div>
      </div>
    );
  }

  if (isError) {
    return <QueryError error={error} />;
  }

  return (
    <div className="max-w-2xl rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            WhatsApp order delivery
          </h2>
          <p className="text-sm text-muted-foreground">
            Enable automatic order delivery through WhatsApp. When disabled,
            selling works exactly as it does today and no orders are sent through
            WhatsApp.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Label
            htmlFor="whatsapp-service-toggle"
            className="text-sm text-muted-foreground"
          >
            {setting?.whatsapp_service_enabled ? "Enabled" : "Disabled"}
          </Label>
          <Switch
            id="whatsapp-service-toggle"
            checked={!!setting?.whatsapp_service_enabled}
            disabled={updateSettingMutation.isPending}
            onCheckedChange={handleToggle}
          />
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSettingsTab;
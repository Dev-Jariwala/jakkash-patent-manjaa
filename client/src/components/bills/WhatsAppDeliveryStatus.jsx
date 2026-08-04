import { Chip } from "@/components/ui/chip";
import { useProcessingElapsedSeconds } from "@/hooks/useProcessingElapsedSeconds";
import {
  formatWhatsAppDeliveryStatusLabel,
  getProcessingStartedAt,
  getWhatsAppDeliveryStatus,
  getWhatsAppDeliveryStatusColor,
  parseWhatsAppMetadata,
  WHATSAPP_DELIVERY_STATUS,
} from "@/lib/whatsappDelivery";

// eslint-disable-next-line react/prop-types
const WhatsAppDeliveryStatus = ({ bill, className }) => {
  const metadata = parseWhatsAppMetadata(bill?.whatsapp_metadata);
  const status = getWhatsAppDeliveryStatus(metadata);
  const isProcessing = status === WHATSAPP_DELIVERY_STATUS.PROCESSING;
  const startedAt = getProcessingStartedAt(metadata);
  const elapsedSeconds = useProcessingElapsedSeconds(startedAt, isProcessing);
  const label = formatWhatsAppDeliveryStatusLabel(status, elapsedSeconds);
  const color = getWhatsAppDeliveryStatusColor(status);
  const title =
    status === WHATSAPP_DELIVERY_STATUS.FAILED && metadata?.error_message
      ? metadata.error_message
      : undefined;

  return (
    <Chip
      variant="light"
      border="none"
      size="xs"
      color={color}
      className={className}
      title={title}
    >
      {label}
    </Chip>
  );
};

export default WhatsAppDeliveryStatus;

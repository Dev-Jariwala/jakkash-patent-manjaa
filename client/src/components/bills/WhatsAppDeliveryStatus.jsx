/* eslint-disable react/prop-types */
import { Chip } from "@/components/ui/chip";
import { useProcessingElapsedSeconds } from "@/hooks/useProcessingElapsedSeconds";
import {
  formatWhatsAppDeliveryStatusLabel,
  getProcessingStartedAt,
  getWhatsAppDeliveryStatus,
  getWhatsAppDeliveryStatusColor,
  isProcessingStalled,
  parseWhatsAppMetadata,
  PROCESSING_STALL_REASON,
  WHATSAPP_DELIVERY_STATUS,
} from "@/lib/whatsappDelivery";

const WhatsAppDeliveryStatus = ({ bill, className }) => {
  const metadata = parseWhatsAppMetadata(bill?.whatsapp_metadata);
  const status = getWhatsAppDeliveryStatus(metadata);
  const isProcessing = status === WHATSAPP_DELIVERY_STATUS.PROCESSING;
  const startedAt = getProcessingStartedAt(metadata);
  const elapsedSeconds = useProcessingElapsedSeconds(startedAt, isProcessing);
  const stalled = isProcessingStalled(status, elapsedSeconds);
  const label = formatWhatsAppDeliveryStatusLabel(status, elapsedSeconds);
  const color = getWhatsAppDeliveryStatusColor(status, { stalled });
  // The chip is the only place a stuck delivery can announce itself: nothing
  // else changes while no worker is writing to the bill.
  const title = stalled
    ? PROCESSING_STALL_REASON
    : status === WHATSAPP_DELIVERY_STATUS.FAILED && metadata?.error_message
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

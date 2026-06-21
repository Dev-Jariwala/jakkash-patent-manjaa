import { fetchBillForDelivery } from "../services/billForDelivery.js";
import { buildBillPdfFilename, generateBillPdfBuffer } from "../services/billPdfGeneration.js";
import {
  buildFailedWhatsAppMetadata,
  buildProviderAcceptedWhatsAppMetadata,
  buildSuccessWhatsAppMetadata,
  WHATSAPP_DELIVERY_STATUS,
} from "../services/whatsappBillMetadata.js";
import { persistWhatsAppMetadata } from "../services/whatsappBillDeliveryPersistence.js";
import {
  normalizeDeliveryError,
  sendBillDocumentOnWhatsApp,
} from "../services/whatsappProvider.js";

export class WhatsAppDeliveryPersistenceAfterSendError extends Error {
  constructor(providerMessageId, originalError) {
    super(
      `WhatsApp provider accepted send (${providerMessageId}) but local metadata persistence failed`
    );
    this.name = "WhatsAppDeliveryPersistenceAfterSendError";
    this.code = "WHATSAPP_DELIVERY_PERSISTENCE_FAILED_AFTER_SEND";
    this.providerMessageId = providerMessageId;
    this.cause = originalError;
  }
}

function parseWhatsAppMetadata(rawMetadata) {
  if (!rawMetadata) {
    return null;
  }

  if (typeof rawMetadata === "string") {
    try {
      return JSON.parse(rawMetadata);
    } catch {
      return null;
    }
  }

  return rawMetadata;
}

async function persistDeliveryFailure({ billId, collectionId, existingMetadata, error }) {
  const failedMetadata = buildFailedWhatsAppMetadata(existingMetadata, error);
  return persistWhatsAppMetadata({
    billId,
    collectionId,
    metadata: failedMetadata,
  });
}

export async function processWhatsAppBillDeliveryJob(job) {
  const { billId, collectionId } = job.data;

  console.log(
    `[whatsapp-delivery-worker] Processing queue job ${job.id} for bill ${billId} (collection ${collectionId})`
  );

  let bill;
  try {
    bill = await fetchBillForDelivery({ billId, collectionId });
  } catch (error) {
    console.error(
      `[whatsapp-delivery-worker] Failed to load bill ${billId} for delivery:`,
      error
    );
    throw error;
  }

  const whatsappMetadata = parseWhatsAppMetadata(bill.whatsapp_metadata);

  if (!whatsappMetadata) {
    const error = new Error("Bill is missing WhatsApp delivery metadata");
    error.code = "WHATSAPP_METADATA_MISSING";
    throw error;
  }

  if (whatsappMetadata.status !== WHATSAPP_DELIVERY_STATUS.PROCESSING) {
    console.warn(
      `[whatsapp-delivery-worker] Skipping job ${job.id} for bill ${billId}: status is "${whatsappMetadata.status}", expected "processing"`
    );
    return {
      billId,
      collectionId,
      skipped: true,
      status: whatsappMetadata.status,
    };
  }

  let pdfBuffer = null;
  let providerMessageId = null;
  let currentMetadata = whatsappMetadata;

  try {
    pdfBuffer = await generateBillPdfBuffer(bill);

    const filename = buildBillPdfFilename(bill);
    ({ providerMessageId } = await sendBillDocumentOnWhatsApp({
      pdfBuffer,
      filename,
      bill,
    }));

    const providerAcceptedMetadata = buildProviderAcceptedWhatsAppMetadata(currentMetadata, {
      providerMessageId,
    });
    const billWithProviderAcceptance = await persistWhatsAppMetadata({
      billId,
      collectionId,
      metadata: providerAcceptedMetadata,
    });
    currentMetadata = billWithProviderAcceptance.whatsapp_metadata || providerAcceptedMetadata;

    const successMetadata = buildSuccessWhatsAppMetadata(currentMetadata, {
      providerMessageId,
    });
    const updatedBill = await persistWhatsAppMetadata({
      billId,
      collectionId,
      metadata: successMetadata,
    });

    console.log(
      `[whatsapp-delivery-worker] Bill ${billId} delivered successfully (provider message ${providerMessageId})`
    );

    return {
      billId,
      collectionId,
      status: updatedBill.whatsapp_metadata?.status || WHATSAPP_DELIVERY_STATUS.SUCCESS,
      providerMessageId,
    };
  } catch (error) {
    if (providerMessageId) {
      console.error(
        `[whatsapp-delivery-worker] Provider accepted send for bill ${billId} (message ${providerMessageId}) but local persistence failed:`,
        error
      );
      throw new WhatsAppDeliveryPersistenceAfterSendError(providerMessageId, error);
    }

    const deliveryError = normalizeDeliveryError(error);
    console.error(
      `[whatsapp-delivery-worker] Delivery failed for bill ${billId}:`,
      deliveryError.message
    );

    try {
      await persistDeliveryFailure({
        billId,
        collectionId,
        existingMetadata: whatsappMetadata,
        error: deliveryError,
      });
      console.error(
        `[whatsapp-delivery-worker] Delivery failed for bill ${billId}; failure metadata persisted`
      );
    } catch (persistError) {
      console.error(
        `[whatsapp-delivery-worker] Delivery failed for bill ${billId} and failure metadata could not be persisted:`,
        deliveryError.message,
        persistError
      );
      throw persistError;
    }

    throw deliveryError;
  } finally {
    pdfBuffer = null;
  }
}

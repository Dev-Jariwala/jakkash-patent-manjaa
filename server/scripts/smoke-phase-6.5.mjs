import assert from "node:assert/strict";
import { handleError } from "../utils/error.js";
import { WhatsAppServiceDisabledError } from "../services/whatsappServiceSetting.js";
import {
  buildBillDeliveryJobId,
  buildCanceledWhatsAppMetadata,
  buildFailedWhatsAppMetadata,
  buildProcessingWhatsAppMetadata,
  createInitialWhatsAppMetadata,
  evaluateWhatsAppDeliveryJobState,
  WHATSAPP_DELIVERY_STATUS,
} from "../services/whatsappBillMetadata.js";

function createMockResponse() {
  const response = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return response;
}

function testHandleErrorPropagatesStatusCode() {
  const res = createMockResponse();
  const error = new WhatsAppServiceDisabledError();

  handleError("testHandleError", res, error);

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.code, "WHATSAPP_SERVICE_DISABLED");
  assert.equal(res.body.success, false);
}

function testHandleErrorDefaultsTo500() {
  const res = createMockResponse();
  const error = new Error("Something broke");

  handleError("testHandleError", res, error);

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.code, "INTERNAL_SERVER_ERROR");
}

function testBuildBillDeliveryJobIdIsUniquePerAttempt() {
  const first = buildBillDeliveryJobId(42);
  const second = buildBillDeliveryJobId(42);

  assert.notEqual(first, second);
  assert.match(first, /^bill-42-[0-9a-f-]{36}$/);
}

function testBuildFailedWhatsAppMetadataPreservesProviderFields() {
  const existing = buildProcessingWhatsAppMetadata(createInitialWhatsAppMetadata({ deliveryRequested: true }), {
    queueJobId: "bill-1-uuid",
  });
  existing.provider_message_id = "wamid.accepted";
  existing.provider_accepted_at = "2026-01-01T00:00:00.000Z";

  const failed = buildFailedWhatsAppMetadata(existing, new Error("persistence failed"));

  assert.equal(failed.status, WHATSAPP_DELIVERY_STATUS.FAILED);
  assert.equal(failed.provider_message_id, "wamid.accepted");
  assert.equal(failed.provider_accepted_at, "2026-01-01T00:00:00.000Z");
}

function testEvaluateWhatsAppDeliveryJobState() {
  const metadata = buildProcessingWhatsAppMetadata(createInitialWhatsAppMetadata({ deliveryRequested: true }), {
    queueJobId: "job-a",
  });

  assert.deepEqual(evaluateWhatsAppDeliveryJobState(metadata, "job-a"), { action: "continue" });
  assert.deepEqual(evaluateWhatsAppDeliveryJobState(metadata, "job-b"), {
    action: "skip",
    reason: "stale_job",
    status: WHATSAPP_DELIVERY_STATUS.PROCESSING,
  });

  const canceled = { ...metadata, cancel_requested: true };
  assert.deepEqual(evaluateWhatsAppDeliveryJobState(canceled, "job-a"), { action: "canceled" });
}

function testBuildCanceledWhatsAppMetadata() {
  const metadata = buildProcessingWhatsAppMetadata(createInitialWhatsAppMetadata({ deliveryRequested: true }), {
    queueJobId: "job-a",
  });
  const canceled = buildCanceledWhatsAppMetadata(metadata);

  assert.equal(canceled.status, WHATSAPP_DELIVERY_STATUS.CANCELED);
  assert.equal(canceled.cancel_requested, true);
  assert.ok(canceled.canceled_at);
}

function testCancelBeforeSuccessCheckpointFlow() {
  const jobId = "job-cancel-test";
  const processingMetadata = buildProcessingWhatsAppMetadata(createInitialWhatsAppMetadata({ deliveryRequested: true }), {
    queueJobId: jobId,
  });

  assert.deepEqual(evaluateWhatsAppDeliveryJobState(processingMetadata, jobId), {
    action: "continue",
  });

  const canceledBeforeSuccess = {
    ...processingMetadata,
    cancel_requested: true,
  };

  assert.deepEqual(evaluateWhatsAppDeliveryJobState(canceledBeforeSuccess, jobId), {
    action: "canceled",
  });

  const persistedCanceled = buildCanceledWhatsAppMetadata(canceledBeforeSuccess);
  assert.equal(persistedCanceled.status, WHATSAPP_DELIVERY_STATUS.CANCELED);
  assert.notEqual(persistedCanceled.status, WHATSAPP_DELIVERY_STATUS.SUCCESS);
}

async function testEnqueueAfterFailureUsesFreshJobId() {
  const metadata = createInitialWhatsAppMetadata({ deliveryRequested: true });
  const failedJobId = buildBillDeliveryJobId(7);
  const failedMetadata = buildFailedWhatsAppMetadata(
    buildProcessingWhatsAppMetadata(metadata, { queueJobId: failedJobId }),
    new Error("first attempt failed")
  );

  assert.equal(failedMetadata.status, WHATSAPP_DELIVERY_STATUS.FAILED);
  assert.equal(failedMetadata.queue_job_id, failedJobId);

  const resendJobId = buildBillDeliveryJobId(7);
  const resendMetadata = buildProcessingWhatsAppMetadata(failedMetadata, { queueJobId: resendJobId });

  assert.notEqual(resendJobId, failedJobId);
  assert.equal(resendMetadata.status, WHATSAPP_DELIVERY_STATUS.PROCESSING);
  assert.equal(resendMetadata.queue_job_id, resendJobId);
}

async function run() {
  testHandleErrorPropagatesStatusCode();
  testHandleErrorDefaultsTo500();
  testBuildBillDeliveryJobIdIsUniquePerAttempt();
  testBuildFailedWhatsAppMetadataPreservesProviderFields();
  testEvaluateWhatsAppDeliveryJobState();
  testBuildCanceledWhatsAppMetadata();
  testCancelBeforeSuccessCheckpointFlow();
  await testEnqueueAfterFailureUsesFreshJobId();

  console.log("Phase 6.5 smoke tests passed");
}

run().catch((error) => {
  console.error("Phase 6.5 smoke tests failed:", error);
  process.exit(1);
});

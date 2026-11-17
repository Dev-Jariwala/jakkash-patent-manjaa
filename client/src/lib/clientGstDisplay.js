const GST_NOT_APPLICABLE_LABEL = "N/A";

export function clientGstListDisplay(client) {
  if (client?.gst_not_applicable) {
    return GST_NOT_APPLICABLE_LABEL;
  }
  const gst = client?.gst_number;
  if (gst == null || gst === "") {
    return "";
  }
  return gst;
}
import { Navigate, useLocation } from "react-router-dom";

function mapLegacySearch(search) {
  const params = new URLSearchParams(search);
  if (params.has("bill_id") && !params.has("order_id")) {
    params.set("order_id", params.get("bill_id"));
    params.delete("bill_id");
  }
  if (params.has("bill_type") && !params.has("order_type")) {
    params.set("order_type", params.get("bill_type"));
    params.delete("bill_type");
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Maps legacy /bills URLs to /orders, preserving sale id and retail/wholesale.
 */
export function LegacyBillsRedirect() {
  const location = useLocation();
  const pathname = location.pathname.replace(/^\/bills/, "/orders");
  return <Navigate to={`${pathname}${mapLegacySearch(location.search)}`} replace />;
}

export function LegacyBillsPathRedirect({ to }) {
  const location = useLocation();
  return <Navigate to={`${to}${mapLegacySearch(location.search)}`} replace />;
}

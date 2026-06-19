export const REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG_ID = "request-resolution:ecommerce-basic-demo";
export const APPROVAL_DECISION_BASIC_CONFIG_ID = "approval-decision:basic-demo";

export function isSafePublicConfigId(id: string): boolean {
  return /^[a-z0-9][a-z0-9:-]*[a-z0-9]$/.test(id);
}

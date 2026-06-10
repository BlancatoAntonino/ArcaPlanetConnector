export const maxRetry = 10;
export const maxWaitTime = 250;

export const MAX_RETRIES = 5;
export const MAX_TIME = 500;

export const cipherKey = "36246a8fcf66b68a0cffe0eb70b7e63b";
export const cipherIV = "36f2d92fbc013353";

export const DIMENSION_UOM = "MM" //millimeters
export const WEIGHT_UOM = "KG" //kilograms
export const VOLUME_UOM = "M3" //cubic meters

export const NO_SLOT_CODE = "NO_SLOT"

export const FB_FIELDS = ["id", "orderFormId", "orderId", "referenceNumber", "reservationCode", "carrierCode", "status", "creationDate", "selectedSlot", "lastInteractionIn"];

export const CONSTRUCTION_TYPE = "constructionType";
export const LOGGER_ENTITY = "PL";
export const guestCheckoutCookie = "CheckoutOrderFormOwnership";

export const VBASE_BUCKET_FAREYE = "SLOT"
export const VBASE_BUCKET_FAREYE_RESERVATION = "reservations"
export const SECONDARY_BUCKET_FAREYE = "SLOTS"
export const VBASE_ORDER_REF_BUCKET = 'ORD_REF'
export const PARTIAL_PATH = "all_slots_"

export const PRODUCT_CHUNK_SIZE_SAVE_JSON = 10000
export const PRODUCT_CHUNK_SIZE_CONVERTION = 10000

export const EMAIL_ENTITY = "CE"

export const CRON_JOB_SERVICES = [
    {
        url: "/_v/arc/dynamic-yield/ping",
        method: "POST",
        type: "ping",
        expression: "*/5 * * * *"
    },
    {
        url: "/_v/arc/dynamic-yield/connector/bulk/products/update?force=true",
        method: "POST",
        type: "bulkUpdate",
        expression: "15 */2 * * *" // Every 2 hours at 15th minute
    },
    {
        url: "/_v/arc/dynamic-yield/connector/feed?force=true",
        method: "POST",
        type: "feed_URL",
        expression: "0 */2 * * *"
    },
    {
        url: "/_v/arc/dynamic-yield/connector/update/franchise/availability",
        method: "POST",
        type: "updateFranchiseAccountAvailability",
        expression: "0 1-23/2 * * *"
    }
];

package com.enfec.one.assets.dto.purchase;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AssetPurchaseOrderResponse(

        UUID id,

        /*
         * Links this purchase order to the
         * onboarding asset request.
         */
        UUID onboardingRequestId,

        String category,

        Integer currentAvailableStock,

        Integer requiredAvailableStock,

        Integer quantityNeeded,

        String brand,

        String model,

        String specifications,

        Integer quantityOrdered,

        /*
         * Number of physical assets from this
         * purchase order that have been received
         * and registered into inventory.
         */
        Integer quantityReceived,

        /*
         * Purchase order lifecycle:
         *
         * ORDERED
         * PARTIALLY_RECEIVED
         * RECEIVED
         */
        String status,

        BigDecimal pricePerUnit,

        BigDecimal totalEstimatedCost,

        String supplier,

        String reason,

        String orderedByName,

        String orderedByEmail,

        Instant orderedAt

) {
}
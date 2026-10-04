package com.enfec.one.assets.dto.asset;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record WarrantyHistoryResponse(

        UUID id,

        UUID assetId,

        LocalDate previousExpiryDate,

        LocalDate newStartDate,

        LocalDate newExpiryDate,

        Integer periodMonths,

        String provider,

        String warrantyReference,

        BigDecimal renewalCost,

        String notes,

        String renewedBy,

        Instant renewedAt

) {
}
package com.enfec.one.assets.dto.asset;

import com.enfec.one.assets.enums.AssetStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record AssetResponse(

        UUID id,

        String assetTag,

        String name,

        String category,

        String brand,

        String model,

        String serialNumber,

        String specifications,

        LocalDate purchaseDate,

        BigDecimal purchasePrice,

        String supplier,

        boolean warrantyAvailable,

        LocalDate warrantyStartDate,

        Integer warrantyPeriodMonths,

        LocalDate warrantyExpiryDate,

        String warrantyProvider,

        String warrantyReference,

        String warrantyStatus,

        Long warrantyDaysRemaining,

        AssetStatus status,

        String assignedTo,

        UUID assignedEmployeeId,

        Instant createdAt,

        Instant updatedAt

) {
}
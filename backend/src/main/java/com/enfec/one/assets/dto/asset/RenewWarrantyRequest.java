package com.enfec.one.assets.dto.asset;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RenewWarrantyRequest(

        @NotNull(message = "New warranty start date is required.")
        LocalDate newStartDate,

        @NotNull(message = "Warranty period is required.")
        @Min(value = 1, message = "Warranty period must be at least 1 month.")
        @Max(value = 240, message = "Warranty period cannot exceed 240 months.")
        Integer periodMonths,

        String provider,

        String warrantyReference,

        @DecimalMin(
                value = "0.0",
                inclusive = true,
                message = "Renewal cost cannot be negative."
        )
        BigDecimal renewalCost,

        String notes

) {
}
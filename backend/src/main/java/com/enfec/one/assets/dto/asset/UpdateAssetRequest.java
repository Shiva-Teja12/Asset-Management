package com.enfec.one.assets.dto.asset;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateAssetRequest(

        @NotBlank
        @Size(max = 80)
        String assetTag,

        @NotBlank
        @Size(max = 200)
        String name,

        @NotBlank
        @Size(max = 100)
        String category,

        @Size(max = 120)
        String brand,

        @Size(max = 150)
        String model,

        @Size(max = 150)
        String serialNumber,

        @Size(max = 2000)
        String specifications,

        LocalDate purchaseDate,

        @DecimalMin(
                value = "0.0",
                inclusive = true
        )
        BigDecimal purchasePrice,

        @Size(max = 200)
        String supplier,

        boolean warrantyAvailable,

        LocalDate warrantyStartDate,

        @Min(1)
        @Max(240)
        Integer warrantyPeriodMonths,

        @Size(max = 200)
        String warrantyProvider,

        @Size(max = 200)
        String warrantyReference

) {
}
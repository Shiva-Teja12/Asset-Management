package com.enfec.one.assets.dto.purchase;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateAssetPurchaseOrderRequest(

        /*
         * OPTIONAL ONBOARDING REQUEST LINK
         *
         * This will contain an onboarding request ID
         * when the purchase order belongs to an
         * onboarding asset request.
         *
         * It remains null for normal inventory
         * replenishment orders created from the
         * Inventory Summary / Reports page.
         */

        UUID onboardingRequestId,

        /*
         * INVENTORY REQUIREMENT
         */

        @NotBlank(
                message = "Category is required."
        )
        @Size(
                max = 100,
                message = "Category cannot exceed 100 characters."
        )
        String category,

        @NotNull(
                message = "Current available stock is required."
        )
        @Min(
                value = 0,
                message = "Current available stock cannot be negative."
        )
        Integer currentAvailableStock,

        @NotNull(
                message = "Required available stock is required."
        )
        @Min(
                value = 0,
                message = "Required available stock cannot be negative."
        )
        Integer requiredAvailableStock,

        @NotNull(
                message = "Quantity needed is required."
        )
        @Min(
                value = 1,
                message = "Quantity needed must be at least 1."
        )
        Integer quantityNeeded,

        /*
         * EQUIPMENT DETAILS
         */

        @NotBlank(
                message = "Brand / Company is required."
        )
        @Size(
                max = 120,
                message = "Brand cannot exceed 120 characters."
        )
        String brand,

        @NotBlank(
                message = "Model is required."
        )
        @Size(
                max = 150,
                message = "Model cannot exceed 150 characters."
        )
        String model,

        @NotBlank(
                message = "Specifications are required."
        )
        @Size(
                max = 2000,
                message = "Specifications cannot exceed 2000 characters."
        )
        String specifications,

        /*
         * ORDER DETAILS
         */

        @NotNull(
                message = "Quantity to order is required."
        )
        @Min(
                value = 1,
                message = "Quantity to order must be at least 1."
        )
        Integer quantityOrdered,

        @NotNull(
                message = "Price per unit is required."
        )
        @DecimalMin(
                value = "0.01",
                message = "Price per unit must be greater than zero."
        )
        BigDecimal pricePerUnit,

        @NotBlank(
                message = "Supplier / Vendor is required."
        )
        @Size(
                max = 200,
                message = "Supplier cannot exceed 200 characters."
        )
        String supplier,

        @NotBlank(
                message = "Reason is required."
        )
        @Size(
                max = 1000,
                message = "Reason cannot exceed 1000 characters."
        )
        String reason

) {
}
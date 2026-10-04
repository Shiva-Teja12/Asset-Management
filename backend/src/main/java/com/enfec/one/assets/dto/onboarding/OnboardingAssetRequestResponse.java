package com.enfec.one.assets.dto.onboarding;

import com.enfec.one.assets.enums.OnboardingRequestStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record OnboardingAssetRequestResponse(

        UUID id,

        String requestNumber,

        String employeeName,

        String employeeEmail,

        String employeeCode,

        String department,

        String designation,

        LocalDate joiningDate,

        String deviceCategory,

        Integer quantity,

        String specifications,

        BigDecimal estimatedCost,

        BigDecimal budgetAvailable,

        BigDecimal amountRequested,

        BigDecimal remainingBudget,

        String budgetStatus,

        String costCenter,

        String businessJustification,

        OnboardingRequestStatus status,

        String createdByEmail,

        String createdByName,

        String assetAdminEmail,

        String assetAdminComment,

        Instant assetAdminReviewedAt,

        String financeEmail,

        String financeComment,

        Instant financeReviewedAt,

        /*
         * Initial VP approval
         */
        String vpEmail,

        String vpComment,

        Instant vpReviewedAt,

        /*
         * Purchase / PR VP approval
         */
        String purchaseVpEmail,

        String purchaseVpComment,

        Instant purchaseVpReviewedAt,

        UUID assignedAssetId,

        Instant allocatedAt,

        Instant createdAt,

        Instant updatedAt
) {
}
package com.enfec.one.assets.dto.onboarding;

import java.util.List;
import java.util.UUID;

public record OnboardingStockResponse(

        UUID requestId,

        String requestNumber,

        String employeeName,

        String employeeEmail,

        String category,

        int requiredQuantity,

        long availableQuantity,

        long shortageQuantity,

        boolean stockAvailable,

        List<AvailableAssetResponse> availableAssets

) {

    public record AvailableAssetResponse(

            UUID id,

            String assetTag,

            String name,

            String category,

            String brand,

            String model,

            String serialNumber,

            String specifications

    ) {
    }
}
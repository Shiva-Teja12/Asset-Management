package com.enfec.one.assets.dto.onboarding;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AllocateOnboardingAssetRequest(

        @NotNull
        UUID assetId

) {
}
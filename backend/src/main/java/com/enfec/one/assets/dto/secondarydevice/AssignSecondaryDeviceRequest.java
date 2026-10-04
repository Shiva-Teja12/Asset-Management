package com.enfec.one.assets.dto.secondarydevice;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class AssignSecondaryDeviceRequest {

    @NotNull(message = "Asset ID is required")
    private UUID assetId;

    public AssignSecondaryDeviceRequest() {
    }

    public UUID getAssetId() {
        return assetId;
    }

    public void setAssetId(UUID assetId) {
        this.assetId = assetId;
    }
}
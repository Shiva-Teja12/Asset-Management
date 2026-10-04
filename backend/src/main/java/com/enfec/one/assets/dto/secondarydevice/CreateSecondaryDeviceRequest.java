package com.enfec.one.assets.dto.secondarydevice;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateSecondaryDeviceRequest {

    @NotBlank(message = "Device category is required")
    @Size(
            max = 100,
            message = "Device category must not exceed 100 characters"
    )
    private String category;

    @NotBlank(message = "Reason is required")
    @Size(
            max = 1000,
            message = "Reason must not exceed 1000 characters"
    )
    private String reason;

    public CreateSecondaryDeviceRequest() {
    }

    public String getCategory() {
        return category;
    }

    public String getReason() {
        return reason;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
package com.enfec.one.assets.dto.asset;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record AssignAssetRequest(

        @NotNull
        UUID employeeId,

        @NotBlank
        @Size(max = 1000)
        String reason

) {
}
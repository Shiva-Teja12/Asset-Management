package com.enfec.one.assets.dto.employee;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateEmployeeDepartmentRequest(

        @NotBlank(message = "Department is required.")
        @Size(
                max = 100,
                message = "Department must be 100 characters or fewer."
        )
        String department

) {
}
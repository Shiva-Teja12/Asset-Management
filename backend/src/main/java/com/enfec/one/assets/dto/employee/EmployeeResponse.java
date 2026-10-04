package com.enfec.one.assets.dto.employee;

import java.util.UUID;

public record EmployeeResponse(

        UUID id,

        String employeeCode,

        String name,

        String email,

        String department,

        UUID managerId,

        String managerName,

        String managerEmail

) {
}
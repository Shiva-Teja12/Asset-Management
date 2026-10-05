package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.employee.EmployeeResponse;
import com.enfec.one.assets.dto.employee.UpdateEmployeeDepartmentRequest;
import com.enfec.one.assets.entity.AppUser;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.exception.ResourceNotFoundException;
import com.enfec.one.assets.repository.AppUserRepository;
import com.enfec.one.assets.repository.AssetAssignmentRepository;
import com.enfec.one.assets.repository.AssetRepository;
import com.enfec.one.assets.repository.SecondaryDeviceRequestRepository;
import com.enfec.one.assets.security.CurrentUser;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private AppUserRepository users;

    @Mock
    private CurrentUser current;

    @Mock
    private AuditService audit;

    @Mock
    private SecondaryDeviceRequestRepository secondaryDeviceRequestRepository;

    @Mock
    private AssetAssignmentRepository assetAssignmentRepository;

    @Mock
    private AssetRepository assetRepository;

    @InjectMocks
    private EmployeeService service;


    @Test
    void all_shouldReturnAllEmployees() {

        AppUser employee = mock(AppUser.class);

        UUID employeeId = UUID.randomUUID();

        when(employee.getId())
                .thenReturn(employeeId);

        when(employee.getName())
                .thenReturn("Manoj");

        when(employee.getEmail())
                .thenReturn("manoj@enfec.com");

        when(employee.getEmployeeCode())
                .thenReturn("EMP-0020");

        when(employee.getDepartment())
                .thenReturn("Engineering");

        when(employee.getManager())
                .thenReturn(null);

        when(users.findAllByRoleOrderByNameAsc(Role.EMPLOYEE))
                .thenReturn(List.of(employee));

        List<EmployeeResponse> result =
                service.all();

        assertNotNull(result);

        assertEquals(
                1,
                result.size()
        );

        assertEquals(
                employeeId,
                result.get(0).id()
        );

        assertEquals(
                "Manoj",
                result.get(0).name()
        );

        assertEquals(
                "EMP-0020",
                result.get(0).employeeCode()
        );

        assertEquals(
                "Engineering",
                result.get(0).department()
        );

        verify(current)
                .requireRole(Role.ASSET_ADMIN);

        verify(users)
                .findAllByRoleOrderByNameAsc(
                        Role.EMPLOYEE
                );
    }


    @Test
    void all_shouldReturnEmptyListWhenNoEmployeesExist() {

        when(users.findAllByRoleOrderByNameAsc(Role.EMPLOYEE))
                .thenReturn(List.of());

        List<EmployeeResponse> result =
                service.all();

        assertNotNull(result);

        assertTrue(result.isEmpty());

        verify(current)
                .requireRole(Role.ASSET_ADMIN);
    }


    @Test
    void me_shouldReturnLoggedInEmployee() {

        UUID employeeId =
                UUID.randomUUID();

        AppUser employee =
                mock(AppUser.class);

        when(employee.getId())
                .thenReturn(employeeId);

        when(employee.getName())
                .thenReturn("Manoj");

        when(employee.getEmail())
                .thenReturn("manoj@enfec.com");

        when(employee.getEmployeeCode())
                .thenReturn("EMP-0020");

        when(employee.getDepartment())
                .thenReturn("Engineering");

        when(employee.getRole())
                .thenReturn(Role.EMPLOYEE);

        when(employee.getManager())
                .thenReturn(null);

        when(current.requireRole(Role.EMPLOYEE))
                .thenReturn(employee);

        when(users.findById(employeeId))
                .thenReturn(Optional.of(employee));

        EmployeeResponse result =
                service.me();

        assertNotNull(result);

        assertEquals(
                employeeId,
                result.id()
        );

        assertEquals(
                "Manoj",
                result.name()
        );

        assertEquals(
                "EMP-0020",
                result.employeeCode()
        );

        assertEquals(
                "Engineering",
                result.department()
        );

        verify(current)
                .requireRole(Role.EMPLOYEE);

        verify(users)
                .findById(employeeId);
    }


    @Test
    void updateDepartment_shouldUpdateEmployeeDepartment() {

        UUID employeeId =
                UUID.randomUUID();

        AppUser admin =
                mock(AppUser.class);

        AppUser employee =
                mock(AppUser.class);

        when(employee.getId())
                .thenReturn(employeeId);

        when(employee.getName())
                .thenReturn("Manoj");

        when(employee.getEmployeeCode())
                .thenReturn("EMP-0020");

        when(employee.getDepartment())
                .thenReturn("Engineering");

        when(employee.getRole())
                .thenReturn(Role.EMPLOYEE);

        when(employee.getManager())
                .thenReturn(null);

        when(current.requireRole(Role.HR_ADMIN))
                .thenReturn(admin);

        when(users.findById(employeeId))
                .thenReturn(Optional.of(employee));

        UpdateEmployeeDepartmentRequest request =
                new UpdateEmployeeDepartmentRequest(
                        "Finance"
                );

        EmployeeResponse result =
                service.updateDepartment(
                        employeeId,
                        request
                );

        assertNotNull(result);

        verify(current)
                .requireRole(Role.HR_ADMIN);

        verify(employee)
                .setDepartment("Finance");

        verify(audit)
                .logWithEmployee(
                        eq(admin),
                        eq("UPDATE_EMPLOYEE_DEPARTMENT"),
                        eq("EMPLOYEE"),
                        eq("USER"),
                        eq(employeeId.toString()),
                        eq("Manoj"),
                        isNull(),
                        eq("Manoj"),
                        eq("Engineering"),
                        eq("Finance"),
                        contains("Department updated")
                );
    }


    @Test
    void updateDepartment_shouldTrimDepartment() {

        UUID employeeId =
                UUID.randomUUID();

        AppUser admin =
                mock(AppUser.class);

        AppUser employee =
                mock(AppUser.class);

        when(employee.getId())
                .thenReturn(employeeId);

        when(employee.getName())
                .thenReturn("Manoj");

        when(employee.getEmployeeCode())
                .thenReturn("EMP-0020");

        when(employee.getDepartment())
                .thenReturn("Engineering");

        when(employee.getRole())
                .thenReturn(Role.EMPLOYEE);

        when(employee.getManager())
                .thenReturn(null);

        when(current.requireRole(Role.HR_ADMIN))
                .thenReturn(admin);

        when(users.findById(employeeId))
                .thenReturn(Optional.of(employee));

        UpdateEmployeeDepartmentRequest request =
                new UpdateEmployeeDepartmentRequest(
                        "   Finance   "
                );

        service.updateDepartment(
                employeeId,
                request
        );

        verify(employee)
                .setDepartment("Finance");
    }


    @Test
    void updateDepartment_shouldThrowExceptionWhenEmployeeNotFound() {

        UUID employeeId =
                UUID.randomUUID();

        AppUser admin =
                mock(AppUser.class);

        when(current.requireRole(Role.HR_ADMIN))
                .thenReturn(admin);

        when(users.findById(employeeId))
                .thenReturn(Optional.empty());

        UpdateEmployeeDepartmentRequest request =
                new UpdateEmployeeDepartmentRequest(
                        "Engineering"
                );

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        service.updateDepartment(
                                employeeId,
                                request
                        )
        );

        verify(current)
                .requireRole(Role.HR_ADMIN);

        verify(audit, never())
                .logWithEmployee(
                        any(),
                        any(),
                        any(),
                        any(),
                        any(),
                        any(),
                        any(),
                        any(),
                        any(),
                        any(),
                        any()
                );
    }


    @Test
    void updateDepartment_shouldRejectUserWhoIsNotEmployee() {

        UUID userId =
                UUID.randomUUID();

        AppUser admin =
                mock(AppUser.class);

        AppUser manager =
                mock(AppUser.class);

        when(current.requireRole(Role.HR_ADMIN))
                .thenReturn(admin);

        when(manager.getRole())
                .thenReturn(Role.MANAGER);

        when(users.findById(userId))
                .thenReturn(Optional.of(manager));

        UpdateEmployeeDepartmentRequest request =
                new UpdateEmployeeDepartmentRequest(
                        "Engineering"
                );

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        service.updateDepartment(
                                userId,
                                request
                        )
        );

        verify(current)
                .requireRole(Role.HR_ADMIN);

        verify(audit, never())
                .logWithEmployee(
                        any(),
                        any(),
                        any(),
                        any(),
                        any(),
                        any(),
                        any(),
                        any(),
                        any(),
                        any(),
                        any()
                );
    }
}
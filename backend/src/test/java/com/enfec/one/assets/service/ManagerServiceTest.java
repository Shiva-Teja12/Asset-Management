package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.manager.ManagerDashboardResponse;
import com.enfec.one.assets.entity.AppUser;
import com.enfec.one.assets.entity.Asset;
import com.enfec.one.assets.entity.AssetAssignment;
import com.enfec.one.assets.enums.AssetStatus;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.enums.SecondaryDeviceRequestStatus;
import com.enfec.one.assets.repository.AppUserRepository;
import com.enfec.one.assets.repository.AssetAssignmentRepository;
import com.enfec.one.assets.repository.AssetEventRepository;
import com.enfec.one.assets.repository.AssetRepository;
import com.enfec.one.assets.repository.SecondaryDeviceRequestRepository;
import com.enfec.one.assets.security.CurrentUser;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ManagerServiceTest {

    @Mock
    private CurrentUser currentUser;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private AssetAssignmentRepository assetAssignmentRepository;

    @Mock
    private AssetEventRepository assetEventRepository;

    @Mock
    private SecondaryDeviceRequestRepository
            secondaryDeviceRequestRepository;

    @InjectMocks
    private ManagerService service;


    @Test
    void getDashboard_shouldReturnManagerDashboard() {

        UUID managerId = UUID.randomUUID();
        UUID employeeId = UUID.randomUUID();
        UUID assetId = UUID.randomUUID();

        AppUser manager = mock(AppUser.class);
        AppUser employee = mock(AppUser.class);
        AssetAssignment assignment =
                mock(AssetAssignment.class);
        Asset asset = mock(Asset.class);

        when(manager.getId())
                .thenReturn(managerId);

        when(manager.getName())
                .thenReturn("Vikram");

        when(employee.getId())
                .thenReturn(employeeId);

        when(assignment.getAssetId())
                .thenReturn(assetId);

        when(asset.getId())
                .thenReturn(assetId);

        when(asset.getStatus())
                .thenReturn(AssetStatus.ASSIGNED);

        when(currentUser.requireRole(Role.MANAGER))
                .thenReturn(manager);

        when(
                appUserRepository
                        .findAllByManager_IdAndRoleOrderByNameAsc(
                                managerId,
                                Role.EMPLOYEE
                        )
        ).thenReturn(
                List.of(employee)
        );

        when(
                assetAssignmentRepository
                        .findAllByEmployeeIdInAndReturnedAtIsNullOrderByAssignedAtDesc(
                                List.of(employeeId)
                        )
        ).thenReturn(
                List.of(assignment)
        );

        when(
                assetRepository.findAllById(
                        List.of(assetId)
                )
        ).thenReturn(
                List.of(asset)
        );

        when(
                secondaryDeviceRequestRepository
                        .countByManager_IdAndStatus(
                                managerId,
                                SecondaryDeviceRequestStatus
                                        .PENDING_MANAGER_APPROVAL
                        )
        ).thenReturn(1L);

        when(
                secondaryDeviceRequestRepository
                        .countByManager_IdAndStatusIn(
                                eq(managerId),
                                any()
                        )
        ).thenReturn(4L);

        when(
                secondaryDeviceRequestRepository
                        .countByManager_IdAndStatus(
                                managerId,
                                SecondaryDeviceRequestStatus
                                        .MANAGER_REJECTED
                        )
        ).thenReturn(0L);


        ManagerDashboardResponse result =
                service.getDashboard();


        assertNotNull(result);

        assertEquals(
                "Vikram",
                result.getManagerName()
        );

        assertEquals(
                1,
                result.getTeamMembers()
        );

        assertEquals(
                1,
                result.getTotalAssetsAssigned()
        );

        assertEquals(
                1,
                result.getInUse()
        );

        assertEquals(
                0,
                result.getInRepair()
        );

        assertEquals(
                1,
                result.getPendingRequests()
        );

        assertEquals(
                4,
                result.getApprovedRequests()
        );

        assertEquals(
                0,
                result.getRejectedRequests()
        );


        verify(currentUser)
                .requireRole(Role.MANAGER);

        verify(appUserRepository)
                .findAllByManager_IdAndRoleOrderByNameAsc(
                        managerId,
                        Role.EMPLOYEE
                );
    }


    @Test
    void getDashboard_shouldReturnZeroAssetsWhenTeamHasNoAssets() {

        UUID managerId = UUID.randomUUID();
        UUID employeeId = UUID.randomUUID();

        AppUser manager = mock(AppUser.class);
        AppUser employee = mock(AppUser.class);

        when(manager.getId())
                .thenReturn(managerId);

        when(manager.getName())
                .thenReturn("Vikram");

        when(employee.getId())
                .thenReturn(employeeId);

        when(currentUser.requireRole(Role.MANAGER))
                .thenReturn(manager);

        when(
                appUserRepository
                        .findAllByManager_IdAndRoleOrderByNameAsc(
                                managerId,
                                Role.EMPLOYEE
                        )
        ).thenReturn(
                List.of(employee)
        );

        when(
                assetAssignmentRepository
                        .findAllByEmployeeIdInAndReturnedAtIsNullOrderByAssignedAtDesc(
                                List.of(employeeId)
                        )
        ).thenReturn(
                List.of()
        );

        when(
                secondaryDeviceRequestRepository
                        .countByManager_IdAndStatus(
                                managerId,
                                SecondaryDeviceRequestStatus
                                        .PENDING_MANAGER_APPROVAL
                        )
        ).thenReturn(0L);

        when(
                secondaryDeviceRequestRepository
                        .countByManager_IdAndStatusIn(
                                eq(managerId),
                                any()
                        )
        ).thenReturn(0L);

        when(
                secondaryDeviceRequestRepository
                        .countByManager_IdAndStatus(
                                managerId,
                                SecondaryDeviceRequestStatus
                                        .MANAGER_REJECTED
                        )
        ).thenReturn(0L);


        ManagerDashboardResponse result =
                service.getDashboard();


        assertNotNull(result);

        assertEquals(
                1,
                result.getTeamMembers()
        );

        assertEquals(
                0,
                result.getTotalAssetsAssigned()
        );

        assertEquals(
                0,
                result.getInUse()
        );

        assertEquals(
                0,
                result.getInRepair()
        );
    }


    @Test
    void getDashboard_shouldReturnEmptyDashboardWhenManagerHasNoEmployees() {

        UUID managerId = UUID.randomUUID();

        AppUser manager = mock(AppUser.class);

        when(manager.getId())
                .thenReturn(managerId);

        when(manager.getName())
                .thenReturn("Vikram");

        when(currentUser.requireRole(Role.MANAGER))
                .thenReturn(manager);

        when(
                appUserRepository
                        .findAllByManager_IdAndRoleOrderByNameAsc(
                                managerId,
                                Role.EMPLOYEE
                        )
        ).thenReturn(
                List.of()
        );

        when(
                secondaryDeviceRequestRepository
                        .countByManager_IdAndStatus(
                                managerId,
                                SecondaryDeviceRequestStatus
                                        .PENDING_MANAGER_APPROVAL
                        )
        ).thenReturn(0L);

        when(
                secondaryDeviceRequestRepository
                        .countByManager_IdAndStatusIn(
                                eq(managerId),
                                any()
                        )
        ).thenReturn(0L);

        when(
                secondaryDeviceRequestRepository
                        .countByManager_IdAndStatus(
                                managerId,
                                SecondaryDeviceRequestStatus
                                        .MANAGER_REJECTED
                        )
        ).thenReturn(0L);


        ManagerDashboardResponse result =
                service.getDashboard();


        assertNotNull(result);

        assertEquals(
                "Vikram",
                result.getManagerName()
        );

        assertEquals(
                0,
                result.getTeamMembers()
        );

        assertEquals(
                0,
                result.getTotalAssetsAssigned()
        );

        verify(
                assetAssignmentRepository,
                never()
        ).findAllByEmployeeIdInAndReturnedAtIsNullOrderByAssignedAtDesc(
                any()
        );
    }
}
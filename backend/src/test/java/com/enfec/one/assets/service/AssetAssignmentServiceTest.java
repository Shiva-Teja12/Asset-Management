package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.asset.AssetResponse;
import com.enfec.one.assets.dto.asset.AssignAssetRequest;
import com.enfec.one.assets.dto.asset.ReturnAssetRequest;
import com.enfec.one.assets.entity.AppUser;
import com.enfec.one.assets.entity.Asset;
import com.enfec.one.assets.entity.AssetAssignment;
import com.enfec.one.assets.enums.AssetStatus;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.exception.ConflictException;
import com.enfec.one.assets.exception.ResourceNotFoundException;
import com.enfec.one.assets.repository.AppUserRepository;
import com.enfec.one.assets.repository.AssetAssignmentRepository;
import com.enfec.one.assets.repository.AssetEventRepository;
import com.enfec.one.assets.repository.AssetRepository;
import com.enfec.one.assets.security.CurrentUser;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssetAssignmentServiceTest {

    @Mock
    private AssetRepository assets;

    @Mock
    private AssetAssignmentRepository assignments;

    @Mock
    private AssetEventRepository events;

    @Mock
    private AppUserRepository users;

    @Mock
    private CurrentUser current;

    @Mock
    private AuditService audit;

    @Mock
    private AssetService assetService;

    @InjectMocks
    private AssetAssignmentService service;


    @Test
    void assign_shouldAssignPrimaryAssetSuccessfully() {

        UUID assetId = UUID.randomUUID();
        UUID employeeId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);
        AppUser employee = mock(AppUser.class);
        Asset asset = mock(Asset.class);
        AssetResponse expected = mock(AssetResponse.class);

        when(admin.getEmail())
                .thenReturn("admin@enfec.com");

        when(employee.getId())
                .thenReturn(employeeId);

        when(employee.getName())
                .thenReturn("Manoj");

        when(employee.getRole())
                .thenReturn(Role.EMPLOYEE);

        when(asset.getId())
                .thenReturn(assetId);

        when(asset.getAssetTag())
                .thenReturn("LAP-001");

        when(asset.getStatus())
                .thenReturn(AssetStatus.IN_STOCK);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(assignments
                .findFirstByAssetIdAndReturnedAtIsNull(assetId))
                .thenReturn(Optional.empty());

        when(users.findById(employeeId))
                .thenReturn(Optional.of(employee));

        when(assetService.one(assetId))
                .thenReturn(expected);

        AssignAssetRequest request =
                new AssignAssetRequest(
                        employeeId,
                        "Employee onboarding"
                );

        AssetResponse result =
                service.assign(assetId, request);

        assertSame(expected, result);

        verify(asset)
                .changeStatus(AssetStatus.ASSIGNED);

        verify(assignments)
                .save(any(AssetAssignment.class));

        verify(events)
                .save(any());

        verify(assetService)
                .one(assetId);
    }


    @Test
    void assign_shouldThrowConflictWhenAssetNotInStock() {

        UUID assetId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);
        Asset asset = mock(Asset.class);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(asset.getStatus())
                .thenReturn(AssetStatus.ASSIGNED);

        AssignAssetRequest request =
                new AssignAssetRequest(
                        UUID.randomUUID(),
                        "Test assignment"
                );

        assertThrows(
                ConflictException.class,
                () -> service.assign(
                        assetId,
                        request
                )
        );

        verify(assignments, never())
                .save(any());
    }


    @Test
    void assign_shouldThrowConflictWhenActiveAssignmentExists() {

        UUID assetId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);
        Asset asset = mock(Asset.class);
        AssetAssignment activeAssignment =
                mock(AssetAssignment.class);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(asset.getStatus())
                .thenReturn(AssetStatus.IN_STOCK);

        when(assignments
                .findFirstByAssetIdAndReturnedAtIsNull(assetId))
                .thenReturn(
                        Optional.of(activeAssignment)
                );

        AssignAssetRequest request =
                new AssignAssetRequest(
                        UUID.randomUUID(),
                        "Test"
                );

        assertThrows(
                ConflictException.class,
                () -> service.assign(
                        assetId,
                        request
                )
        );

        verify(users, never())
                .findById(any());
    }


    @Test
    void assign_shouldThrowExceptionWhenEmployeeNotFound() {

        UUID assetId = UUID.randomUUID();
        UUID employeeId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);
        Asset asset = mock(Asset.class);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(asset.getStatus())
                .thenReturn(AssetStatus.IN_STOCK);

        when(assignments
                .findFirstByAssetIdAndReturnedAtIsNull(assetId))
                .thenReturn(Optional.empty());

        when(users.findById(employeeId))
                .thenReturn(Optional.empty());

        AssignAssetRequest request =
                new AssignAssetRequest(
                        employeeId,
                        "Test"
                );

        assertThrows(
                ResourceNotFoundException.class,
                () -> service.assign(
                        assetId,
                        request
                )
        );

        verify(assignments, never())
                .save(any());
    }


    @Test
    void assignSecondary_shouldAssignSecondaryAssetSuccessfully() {

        UUID assetId = UUID.randomUUID();
        UUID employeeId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);
        AppUser employee = mock(AppUser.class);
        Asset asset = mock(Asset.class);
        AssetResponse expected = mock(AssetResponse.class);

        when(admin.getEmail())
                .thenReturn("admin@enfec.com");

        when(employee.getId())
                .thenReturn(employeeId);

        when(employee.getName())
                .thenReturn("Manoj");

        when(employee.getRole())
                .thenReturn(Role.EMPLOYEE);

        when(asset.getId())
                .thenReturn(assetId);

        when(asset.getAssetTag())
                .thenReturn("MON-003");

        when(asset.getStatus())
                .thenReturn(AssetStatus.IN_STOCK);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(assignments
                .findFirstByAssetIdAndReturnedAtIsNull(assetId))
                .thenReturn(Optional.empty());

        when(users.findById(employeeId))
                .thenReturn(Optional.of(employee));

        when(assetService.one(assetId))
                .thenReturn(expected);

        AssetResponse result =
                service.assignSecondary(
                        assetId,
                        employeeId,
                        "Additional monitor"
                );

        assertSame(expected, result);

        verify(asset)
                .changeStatus(AssetStatus.ASSIGNED);

        verify(assignments)
                .save(any(AssetAssignment.class));

        verify(events)
                .save(any());

        verify(assetService)
                .one(assetId);
    }


    @Test
    void assignSecondary_shouldUseDefaultReasonWhenReasonBlank() {

        UUID assetId = UUID.randomUUID();
        UUID employeeId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);
        AppUser employee = mock(AppUser.class);
        Asset asset = mock(Asset.class);

        when(admin.getEmail())
                .thenReturn("admin@enfec.com");

        when(employee.getId())
                .thenReturn(employeeId);

        when(employee.getName())
                .thenReturn("Manoj");

        when(employee.getRole())
                .thenReturn(Role.EMPLOYEE);

        when(asset.getId())
                .thenReturn(assetId);

        when(asset.getAssetTag())
                .thenReturn("MON-004");

        when(asset.getStatus())
                .thenReturn(AssetStatus.IN_STOCK);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(assignments
                .findFirstByAssetIdAndReturnedAtIsNull(assetId))
                .thenReturn(Optional.empty());

        when(users.findById(employeeId))
                .thenReturn(Optional.of(employee));

        service.assignSecondary(
                assetId,
                employeeId,
                "   "
        );

        ArgumentCaptor<AssetAssignment> captor =
                ArgumentCaptor.forClass(
                        AssetAssignment.class
                );

        verify(assignments)
                .save(captor.capture());

        assertEquals(
                "Secondary device assignment",
                captor.getValue().getReason()
        );
    }


    @Test
    void returnAsset_shouldReturnAssignedAssetSuccessfully() {

        UUID assetId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);
        Asset asset = mock(Asset.class);
        AssetAssignment assignment =
                mock(AssetAssignment.class);
        AssetResponse expected =
                mock(AssetResponse.class);

        when(admin.getEmail())
                .thenReturn("admin@enfec.com");

        when(asset.getId())
                .thenReturn(assetId);

        when(asset.getAssetTag())
                .thenReturn("LAP-001");

        when(asset.getStatus())
                .thenReturn(AssetStatus.ASSIGNED);

        when(assignment.getEmployeeName())
                .thenReturn("Manoj");

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(assignments
                .findFirstByAssetIdAndReturnedAtIsNull(assetId))
                .thenReturn(
                        Optional.of(assignment)
                );

        when(assetService.one(assetId))
                .thenReturn(expected);

        ReturnAssetRequest request =
                new ReturnAssetRequest(
                        "Employee returned device"
                );

        AssetResponse result =
                service.returnAsset(
                        assetId,
                        request
                );

        assertSame(expected, result);

        verify(assignment)
                .close(
                        "admin@enfec.com",
                        "Employee returned device"
                );

        verify(asset)
                .changeStatus(
                        AssetStatus.IN_STOCK
                );

        verify(events)
                .save(any());

        verify(assetService)
                .one(assetId);
    }


    @Test
    void returnAsset_shouldThrowConflictWhenNoActiveAssignment() {

        UUID assetId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);
        Asset asset = mock(Asset.class);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(assignments
                .findFirstByAssetIdAndReturnedAtIsNull(assetId))
                .thenReturn(Optional.empty());

        ReturnAssetRequest request =
                new ReturnAssetRequest(
                        "Return"
                );

        assertThrows(
                ConflictException.class,
                () -> service.returnAsset(
                        assetId,
                        request
                )
        );

        verify(asset, never())
                .changeStatus(any());
    }


    @Test
    void history_shouldReturnAssignmentHistory() {

        UUID assetId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);
        Asset asset = mock(Asset.class);

        AssetAssignment assignment =
                mock(AssetAssignment.class);

        UUID assignmentId =
                UUID.randomUUID();

        UUID employeeId =
                UUID.randomUUID();

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(assignment.getId())
                .thenReturn(assignmentId);

        when(assignment.getAssetId())
                .thenReturn(assetId);

        when(assignment.getEmployeeId())
                .thenReturn(employeeId);

        when(assignment.getEmployeeName())
                .thenReturn("Manoj");

        when(assignment.getReason())
                .thenReturn("Onboarding");

        when(assignments
                .findAllByAssetIdOrderByAssignedAtDesc(assetId))
                .thenReturn(
                        List.of(assignment)
                );

        var result =
                service.history(assetId);

        assertNotNull(result);

        assertEquals(
                1,
                result.size()
        );

        assertEquals(
                assetId,
                result.get(0).assetId()
        );

        assertEquals(
                employeeId,
                result.get(0).employeeId()
        );

        assertEquals(
                "Manoj",
                result.get(0).employeeName()
        );

        verify(assignments)
                .findAllByAssetIdOrderByAssignedAtDesc(
                        assetId
                );
    }


    @Test
    void history_shouldThrowExceptionWhenAssetDoesNotExist() {

        UUID assetId =
                UUID.randomUUID();

        AppUser admin =
                mock(AppUser.class);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(assets.findById(assetId))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> service.history(assetId)
        );

        verify(assignments, never())
                .findAllByAssetIdOrderByAssignedAtDesc(
                        any()
                );
    }
}
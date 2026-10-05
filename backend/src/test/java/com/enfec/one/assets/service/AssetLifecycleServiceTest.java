package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.asset.AssetEventResponse;
import com.enfec.one.assets.dto.asset.AssetResponse;
import com.enfec.one.assets.dto.asset.UpdateAssetStatusRequest;
import com.enfec.one.assets.entity.AppUser;
import com.enfec.one.assets.entity.Asset;
import com.enfec.one.assets.entity.AssetAssignment;
import com.enfec.one.assets.entity.AssetEvent;
import com.enfec.one.assets.enums.AssetStatus;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.exception.BadRequestException;
import com.enfec.one.assets.exception.ResourceNotFoundException;
import com.enfec.one.assets.repository.AssetAssignmentRepository;
import com.enfec.one.assets.repository.AssetEventRepository;
import com.enfec.one.assets.repository.AssetRepository;
import com.enfec.one.assets.security.CurrentUser;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssetLifecycleServiceTest {

    @Mock
    private AssetRepository assets;

    @Mock
    private AssetEventRepository events;

    @Mock
    private AssetAssignmentRepository assignments;

    @Mock
    private CurrentUser current;

    @Mock
    private AuditService audit;

    @Mock
    private AssetService assetService;

    @InjectMocks
    private AssetLifecycleService service;


    @Test
    void changeStatus_shouldChangeAssetStatusSuccessfully() {

        UUID assetId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);
        Asset asset = mock(Asset.class);
        AssetResponse response = mock(AssetResponse.class);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(admin.getEmail())
                .thenReturn("assetadmin@enfec.com");

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(assignments.findFirstByAssetIdAndReturnedAtIsNull(assetId))
                .thenReturn(Optional.empty());

        when(asset.getStatus())
                .thenReturn(AssetStatus.IN_STOCK);

        when(asset.getId())
                .thenReturn(assetId);

        when(asset.getAssetTag())
                .thenReturn("LAP-001");

        when(assetService.one(assetId))
                .thenReturn(response);

        UpdateAssetStatusRequest request =
                new UpdateAssetStatusRequest(
                        AssetStatus.IN_REPAIR,
                        "Hardware issue"
                );

        AssetResponse result =
                service.changeStatus(
                        assetId,
                        request
                );

        assertSame(
                response,
                result
        );

        verify(current)
                .requireRole(Role.ASSET_ADMIN);

        verify(asset)
                .changeStatus(
                        AssetStatus.IN_REPAIR
                );

        verify(events)
                .save(any(AssetEvent.class));

        verify(assetService)
                .one(assetId);
    }


    @Test
    void changeStatus_shouldRejectAssignedStatusWithoutActiveAssignment() {

        UUID assetId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);
        Asset asset = mock(Asset.class);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(assignments.findFirstByAssetIdAndReturnedAtIsNull(assetId))
                .thenReturn(Optional.empty());

        UpdateAssetStatusRequest request =
                new UpdateAssetStatusRequest(
                        AssetStatus.ASSIGNED,
                        "Assign asset"
                );

        BadRequestException exception =
                assertThrows(
                        BadRequestException.class,
                        () ->
                                service.changeStatus(
                                        assetId,
                                        request
                                )
                );

        assertNotNull(exception);

        verify(asset, never())
                .changeStatus(any());

        verify(events, never())
                .save(any());

        verify(assetService, never())
                .one(any());
    }


    @Test
    void changeStatus_shouldRejectInStockWhenActiveAssignmentExists() {

        UUID assetId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);
        Asset asset = mock(Asset.class);
        AssetAssignment assignment =
                mock(AssetAssignment.class);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(assignments.findFirstByAssetIdAndReturnedAtIsNull(assetId))
                .thenReturn(Optional.of(assignment));

        UpdateAssetStatusRequest request =
                new UpdateAssetStatusRequest(
                        AssetStatus.IN_STOCK,
                        "Return to stock"
                );

        assertThrows(
                BadRequestException.class,
                () ->
                        service.changeStatus(
                                assetId,
                                request
                        )
        );

        verify(asset, never())
                .changeStatus(any());

        verify(events, never())
                .save(any());
    }


    @Test
    void changeStatus_shouldRejectRetiredWhenActiveAssignmentExists() {

        UUID assetId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);
        Asset asset = mock(Asset.class);
        AssetAssignment assignment =
                mock(AssetAssignment.class);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(assignments.findFirstByAssetIdAndReturnedAtIsNull(assetId))
                .thenReturn(Optional.of(assignment));

        UpdateAssetStatusRequest request =
                new UpdateAssetStatusRequest(
                        AssetStatus.RETIRED,
                        "Asset reached end of life"
                );

        assertThrows(
                BadRequestException.class,
                () ->
                        service.changeStatus(
                                assetId,
                                request
                        )
        );

        verify(asset, never())
                .changeStatus(any());

        verify(events, never())
                .save(any());
    }


    @Test
    void changeStatus_shouldReturnFromRepairToAssignedEmployee() {

        UUID assetId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);
        Asset asset = mock(Asset.class);
        AssetAssignment assignment =
                mock(AssetAssignment.class);

        AssetResponse response =
                mock(AssetResponse.class);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(admin.getEmail())
                .thenReturn("assetadmin@enfec.com");

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(assignments.findFirstByAssetIdAndReturnedAtIsNull(assetId))
                .thenReturn(Optional.of(assignment));

        when(asset.getStatus())
                .thenReturn(AssetStatus.IN_REPAIR);

        when(asset.getId())
                .thenReturn(assetId);

        when(asset.getAssetTag())
                .thenReturn("LAP-003");

        when(assignment.getEmployeeName())
                .thenReturn("Manoj");

        when(assetService.one(assetId))
                .thenReturn(response);

        UpdateAssetStatusRequest request =
                new UpdateAssetStatusRequest(
                        AssetStatus.ASSIGNED,
                        "Repair completed"
                );

        AssetResponse result =
                service.changeStatus(
                        assetId,
                        request
                );

        assertSame(
                response,
                result
        );

        verify(asset)
                .changeStatus(
                        AssetStatus.ASSIGNED
                );

        verify(events)
                .save(any(AssetEvent.class));

        verify(audit)
                .logWithEmployee(
                        eq(admin),
                        eq("RETURN_FROM_REPAIR"),
                        eq("ASSET"),
                        eq("ASSET"),
                        eq(assetId.toString()),
                        eq("LAP-003"),
                        eq(asset),
                        eq("Manoj"),
                        eq("IN_REPAIR"),
                        eq("ASSIGNED"),
                        contains("Repair completed")
                );
    }


    @Test
    void changeStatus_shouldNotCreateEventWhenStatusDoesNotChange() {

        UUID assetId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);
        Asset asset = mock(Asset.class);
        AssetResponse response =
                mock(AssetResponse.class);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(assignments.findFirstByAssetIdAndReturnedAtIsNull(assetId))
                .thenReturn(Optional.empty());

        when(asset.getStatus())
                .thenReturn(AssetStatus.IN_STOCK);

        when(assetService.one(assetId))
                .thenReturn(response);

        UpdateAssetStatusRequest request =
                new UpdateAssetStatusRequest(
                        AssetStatus.IN_STOCK,
                        "No change"
                );

        AssetResponse result =
                service.changeStatus(
                        assetId,
                        request
                );

        assertSame(
                response,
                result
        );

        verify(asset, never())
                .changeStatus(any());

        verify(events, never())
                .save(any());

        verify(audit, never())
                .logWithEmployee(
                        any(),
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        any(),
                        any(),
                        any(),
                        any(),
                        anyString()
                );

        verify(assetService)
                .one(assetId);
    }


    @Test
    void changeStatus_shouldThrowExceptionWhenAssetNotFound() {

        UUID assetId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(assets.findById(assetId))
                .thenReturn(Optional.empty());

        UpdateAssetStatusRequest request =
                new UpdateAssetStatusRequest(
                        AssetStatus.IN_REPAIR,
                        "Repair"
                );

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        service.changeStatus(
                                assetId,
                                request
                        )
        );

        verify(assignments, never())
                .findFirstByAssetIdAndReturnedAtIsNull(any());

        verify(events, never())
                .save(any());

        verify(assetService, never())
                .one(any());
    }


    @Test
    void history_shouldReturnAssetEvents() {

        UUID assetId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);
        Asset asset = mock(Asset.class);
        AssetEvent event = mock(AssetEvent.class);

        Instant occurredAt = Instant.now();

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(asset.getId())
                .thenReturn(assetId);

        when(asset.getAssetTag())
                .thenReturn("LAP-001");

        when(assignments.findFirstByAssetIdAndReturnedAtIsNull(assetId))
                .thenReturn(Optional.empty());

        when(events.findAllByAssetIdOrderByOccurredAtDesc(assetId))
                .thenReturn(List.of(event));

        when(event.getId())
                .thenReturn(eventId);

        when(event.getAssetId())
                .thenReturn(assetId);

        when(event.getPreviousStatus())
                .thenReturn(AssetStatus.IN_STOCK);

        when(event.getNewStatus())
                .thenReturn(AssetStatus.IN_REPAIR);

        when(event.getActor())
                .thenReturn("assetadmin@enfec.com");

        when(event.getReason())
                .thenReturn("Hardware repair");

        when(event.getOccurredAt())
                .thenReturn(occurredAt);

        List<AssetEventResponse> result =
                service.history(assetId);

        assertNotNull(result);

        assertEquals(
                1,
                result.size()
        );

        assertEquals(
                eventId,
                result.get(0).id()
        );

        assertEquals(
                assetId,
                result.get(0).assetId()
        );

        assertEquals(
                AssetStatus.IN_STOCK,
                result.get(0).previousStatus()
        );

        assertEquals(
                AssetStatus.IN_REPAIR,
                result.get(0).newStatus()
        );

        verify(events)
                .findAllByAssetIdOrderByOccurredAtDesc(
                        assetId
                );

        verify(audit)
                .logWithEmployee(
                        eq(admin),
                        eq("VIEW_ASSET_HISTORY"),
                        eq("ASSET"),
                        eq("ASSET"),
                        eq(assetId.toString()),
                        eq("LAP-001"),
                        eq(asset),
                        isNull(),
                        isNull(),
                        isNull(),
                        eq("Viewed lifecycle, assignment and warranty history")
                );
    }


    @Test
    void history_shouldIncludeAssignedEmployeeInAudit() {

        UUID assetId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);
        Asset asset = mock(Asset.class);
        AssetAssignment assignment =
                mock(AssetAssignment.class);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(asset.getId())
                .thenReturn(assetId);

        when(asset.getAssetTag())
                .thenReturn("LAP-003");

        when(assignments.findFirstByAssetIdAndReturnedAtIsNull(assetId))
                .thenReturn(Optional.of(assignment));

        when(assignment.getEmployeeName())
                .thenReturn("Manoj");

        when(events.findAllByAssetIdOrderByOccurredAtDesc(assetId))
                .thenReturn(List.of());

        List<AssetEventResponse> result =
                service.history(assetId);

        assertNotNull(result);
        assertTrue(result.isEmpty());

        verify(audit)
                .logWithEmployee(
                        eq(admin),
                        eq("VIEW_ASSET_HISTORY"),
                        eq("ASSET"),
                        eq("ASSET"),
                        eq(assetId.toString()),
                        eq("LAP-003"),
                        eq(asset),
                        eq("Manoj"),
                        isNull(),
                        isNull(),
                        eq("Viewed lifecycle, assignment and warranty history")
                );
    }


    @Test
    void history_shouldThrowExceptionWhenAssetNotFound() {

        UUID assetId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(assets.findById(assetId))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        service.history(assetId)
        );

        verify(assignments, never())
                .findFirstByAssetIdAndReturnedAtIsNull(any());

        verify(events, never())
                .findAllByAssetIdOrderByOccurredAtDesc(any());

        verify(audit, never())
                .logWithEmployee(
                        any(),
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        any(),
                        any(),
                        any(),
                        any(),
                        anyString()
                );
    }
}
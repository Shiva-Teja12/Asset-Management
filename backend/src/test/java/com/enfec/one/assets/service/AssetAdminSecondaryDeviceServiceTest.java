package com.enfec.one.assets.service;

import com.enfec.one.assets.entity.SecondaryDeviceRequest;
import com.enfec.one.assets.enums.AssetStatus;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.enums.SecondaryDeviceRequestStatus;
import com.enfec.one.assets.exception.ConflictException;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssetAdminSecondaryDeviceServiceTest {

    @Mock
    private SecondaryDeviceRequestRepository requests;

    @Mock
    private AssetRepository assets;

    @Mock
    private AssetAssignmentRepository assignments;

    @Mock
    private AssetAssignmentService assignmentService;

    @Mock
    private AssetService assetService;

    @Mock
    private CurrentUser current;

    @InjectMocks
    private AssetAdminSecondaryDeviceService service;


    // =========================================================
    // TEST 1
    // Return actionable secondary-device requests
    // =========================================================

    @Test
    void all_shouldReturnActionableRequests() {

        SecondaryDeviceRequest request =
                mock(SecondaryDeviceRequest.class);

        when(
                requests.findAllByStatusInOrderByRequestedAtAsc(
                        any()
                )
        ).thenReturn(
                List.of(request)
        );

        List<?> result =
                service.all();

        assertNotNull(result);

        assertEquals(
                1,
                result.size()
        );

        verify(current)
                .requireRole(Role.ASSET_ADMIN);

        verify(requests)
                .findAllByStatusInOrderByRequestedAtAsc(
                        any()
                );
    }


    // =========================================================
    // TEST 2
    // Return empty list when no requests exist
    // =========================================================

    @Test
    void all_shouldReturnEmptyListWhenNoRequestsExist() {

        when(
                requests.findAllByStatusInOrderByRequestedAtAsc(
                        any()
                )
        ).thenReturn(
                List.of()
        );

        List<?> result =
                service.all();

        assertNotNull(result);

        assertTrue(
                result.isEmpty()
        );

        verify(current)
                .requireRole(Role.ASSET_ADMIN);

        verify(requests)
                .findAllByStatusInOrderByRequestedAtAsc(
                        any()
                );
    }


    // =========================================================
    // TEST 3
    // Matching stock exists -> PENDING_ASSIGNMENT
    // =========================================================

    @Test
    void process_shouldMoveToPendingAssignmentWhenStockExists() {

        UUID requestId =
                UUID.randomUUID();

        SecondaryDeviceRequest request =
                mock(SecondaryDeviceRequest.class);

        when(request.getStatus())
                .thenReturn(
                        SecondaryDeviceRequestStatus.MANAGER_APPROVED
                );

        when(request.getCategory())
                .thenReturn("Monitor");

        when(
                requests.findById(requestId)
        ).thenReturn(
                Optional.of(request)
        );

        /*
         * IMPORTANT:
         * The real service uses COUNT to check stock.
         *
         * 1 means at least one matching Monitor
         * is currently IN_STOCK.
         */
        when(
                assets.countByCategoryIgnoreCaseAndStatus(
                        "Monitor",
                        AssetStatus.IN_STOCK
                )
        ).thenReturn(1L);

        when(
                requests.save(request)
        ).thenReturn(request);

        service.process(requestId);

        verify(current)
                .requireRole(Role.ASSET_ADMIN);

        verify(assets)
                .countByCategoryIgnoreCaseAndStatus(
                        "Monitor",
                        AssetStatus.IN_STOCK
                );

        verify(request)
                .setStatus(
                        SecondaryDeviceRequestStatus.PENDING_ASSIGNMENT
                );

        verify(requests)
                .save(request);
    }


    // =========================================================
    // TEST 4
    // No matching stock -> PENDING_PROCUREMENT
    // =========================================================

    @Test
    void process_shouldMoveToPendingProcurementWhenNoStockExists() {

        UUID requestId =
                UUID.randomUUID();

        SecondaryDeviceRequest request =
                mock(SecondaryDeviceRequest.class);

        when(request.getStatus())
                .thenReturn(
                        SecondaryDeviceRequestStatus.MANAGER_APPROVED
                );

        when(request.getCategory())
                .thenReturn("Monitor");

        when(
                requests.findById(requestId)
        ).thenReturn(
                Optional.of(request)
        );

        /*
         * 0 means there are no matching
         * IN_STOCK Monitor assets.
         */
        when(
                assets.countByCategoryIgnoreCaseAndStatus(
                        "Monitor",
                        AssetStatus.IN_STOCK
                )
        ).thenReturn(0L);

        when(
                requests.save(request)
        ).thenReturn(request);

        service.process(requestId);

        verify(current)
                .requireRole(Role.ASSET_ADMIN);

        verify(assets)
                .countByCategoryIgnoreCaseAndStatus(
                        "Monitor",
                        AssetStatus.IN_STOCK
                );

        verify(request)
                .setStatus(
                        SecondaryDeviceRequestStatus.PENDING_PROCUREMENT
                );

        verify(requests)
                .save(request);
    }


    // =========================================================
    // TEST 5
    // FULFILLED request cannot be processed again
    // =========================================================

    @Test
    void process_shouldRejectFulfilledRequest() {

        UUID requestId =
                UUID.randomUUID();

        SecondaryDeviceRequest request =
                mock(SecondaryDeviceRequest.class);

        when(request.getStatus())
                .thenReturn(
                        SecondaryDeviceRequestStatus.FULFILLED
                );

        when(
                requests.findById(requestId)
        ).thenReturn(
                Optional.of(request)
        );

        assertThrows(
                ConflictException.class,
                () ->
                        service.process(
                                requestId
                        )
        );

        verify(current)
                .requireRole(Role.ASSET_ADMIN);

        verify(assets, never())
                .countByCategoryIgnoreCaseAndStatus(
                        anyString(),
                        any()
                );

        verify(requests, never())
                .save(any());
    }
}
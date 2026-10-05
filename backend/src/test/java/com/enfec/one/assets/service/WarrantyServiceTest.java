package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.asset.AssetResponse;
import com.enfec.one.assets.dto.asset.RenewWarrantyRequest;
import com.enfec.one.assets.entity.AppUser;
import com.enfec.one.assets.entity.Asset;
import com.enfec.one.assets.entity.WarrantyHistory;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.exception.ResourceNotFoundException;
import com.enfec.one.assets.repository.AssetRepository;
import com.enfec.one.assets.repository.WarrantyHistoryRepository;
import com.enfec.one.assets.security.CurrentUser;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WarrantyServiceTest {

    @Mock
    private AssetRepository assets;

    @Mock
    private WarrantyHistoryRepository history;

    @Mock
    private CurrentUser current;

    @Mock
    private AuditService audit;

    @Mock
    private AssetService assetService;

    @InjectMocks
    private WarrantyService service;


    @Test
    void renew_shouldRenewWarrantySuccessfully() {

        UUID assetId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);
        Asset asset = mock(Asset.class);
        AssetResponse response = mock(AssetResponse.class);

        LocalDate previousExpiry =
                LocalDate.of(2026, 10, 31);

        LocalDate newStart =
                LocalDate.of(2026, 11, 1);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(admin.getEmail())
                .thenReturn("admin@enfec.com");

        when(asset.getId())
                .thenReturn(assetId);

        when(asset.getAssetTag())
                .thenReturn("LAP-001");

        when(asset.getWarrantyExpiryDate())
                .thenReturn(previousExpiry);

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(assetService.one(assetId))
                .thenReturn(response);

        RenewWarrantyRequest request =
                new RenewWarrantyRequest(
                        newStart,
                        12,
                        "Dell",
                        "WAR-2026-001",
                        new BigDecimal("5000.00"),
                        "Warranty renewed"
                );

        AssetResponse result =
                service.renew(
                        assetId,
                        request
                );

        assertNotNull(result);
        assertSame(response, result);

        verify(current)
                .requireRole(Role.ASSET_ADMIN);

        verify(assets)
                .findById(assetId);

        verify(asset)
                .renewWarranty(
                        newStart,
                        12,
                        "Dell",
                        "WAR-2026-001"
                );

        verify(history)
                .save(any(WarrantyHistory.class));

        verify(audit)
                .log(
                        eq(admin),
                        eq("RENEW_WARRANTY"),
                        eq("WARRANTY"),
                        eq("ASSET"),
                        eq(assetId.toString()),
                        eq("LAP-001"),
                        eq(asset),
                        eq(previousExpiry.toString()),
                        eq(
                                newStart
                                        .plusMonths(12)
                                        .toString()
                        ),
                        contains(
                                "Warranty renewed for 12 months"
                        )
                );

        verify(assetService)
                .one(assetId);
    }


    @Test
    void renew_shouldSaveWarrantyHistory() {

        UUID assetId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);
        Asset asset = mock(Asset.class);
        AssetResponse response = mock(AssetResponse.class);

        LocalDate previousExpiry =
                LocalDate.of(2026, 12, 31);

        LocalDate newStart =
                LocalDate.of(2027, 1, 1);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(admin.getEmail())
                .thenReturn("admin@enfec.com");

        when(asset.getId())
                .thenReturn(assetId);

        when(asset.getAssetTag())
                .thenReturn("LAP-002");

        when(asset.getWarrantyExpiryDate())
                .thenReturn(previousExpiry);

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(assetService.one(assetId))
                .thenReturn(response);

        RenewWarrantyRequest request =
                new RenewWarrantyRequest(
                        newStart,
                        24,
                        "HP",
                        "HP-WAR-001",
                        new BigDecimal("8000.00"),
                        "Extended warranty"
                );

        service.renew(
                assetId,
                request
        );

        ArgumentCaptor<WarrantyHistory> captor =
                ArgumentCaptor.forClass(
                        WarrantyHistory.class
                );

        verify(history)
                .save(captor.capture());

        WarrantyHistory saved =
                captor.getValue();

        assertEquals(
                assetId,
                saved.getAssetId()
        );

        assertEquals(
                previousExpiry,
                saved.getPreviousExpiryDate()
        );

        assertEquals(
                newStart,
                saved.getNewStartDate()
        );

        assertEquals(
                newStart.plusMonths(24),
                saved.getNewExpiryDate()
        );

        assertEquals(
                24,
                saved.getPeriodMonths()
        );

        assertEquals(
                "HP",
                saved.getProvider()
        );

        assertEquals(
                "HP-WAR-001",
                saved.getWarrantyReference()
        );

        assertEquals(
                new BigDecimal("8000.00"),
                saved.getRenewalCost()
        );

        assertEquals(
                "Extended warranty",
                saved.getNotes()
        );

        assertEquals(
                "admin@enfec.com",
                saved.getRenewedBy()
        );
    }


    @Test
    void renew_shouldConvertBlankOptionalValuesToNull() {

        UUID assetId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);
        Asset asset = mock(Asset.class);
        AssetResponse response = mock(AssetResponse.class);

        LocalDate newStart =
                LocalDate.of(2027, 1, 1);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(admin.getEmail())
                .thenReturn("admin@enfec.com");

        when(asset.getId())
                .thenReturn(assetId);

        when(asset.getAssetTag())
                .thenReturn("LAP-003");

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(assetService.one(assetId))
                .thenReturn(response);

        RenewWarrantyRequest request =
                new RenewWarrantyRequest(
                        newStart,
                        12,
                        "   ",
                        "   ",
                        null,
                        "   "
                );

        service.renew(
                assetId,
                request
        );

        ArgumentCaptor<WarrantyHistory> captor =
                ArgumentCaptor.forClass(
                        WarrantyHistory.class
                );

        verify(history)
                .save(captor.capture());

        WarrantyHistory saved =
                captor.getValue();

        assertNull(saved.getProvider());
        assertNull(saved.getWarrantyReference());
        assertNull(saved.getNotes());

        verify(asset)
                .renewWarranty(
                        newStart,
                        12,
                        null,
                        null
                );
    }


    @Test
    void renew_shouldThrowExceptionWhenAssetNotFound() {

        UUID assetId = UUID.randomUUID();

        AppUser admin = mock(AppUser.class);

        when(current.requireRole(Role.ASSET_ADMIN))
                .thenReturn(admin);

        when(assets.findById(assetId))
                .thenReturn(Optional.empty());

        RenewWarrantyRequest request =
                new RenewWarrantyRequest(
                        LocalDate.of(
                                2027,
                                1,
                                1
                        ),
                        12,
                        "Dell",
                        "WAR-001",
                        new BigDecimal("5000.00"),
                        "Renewal"
                );

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        service.renew(
                                assetId,
                                request
                        )
        );

        verify(history, never())
                .save(any());

        verify(assetService, never())
                .one(any());

        verifyNoInteractions(audit);
    }


    @Test
    void history_shouldReturnWarrantyHistory() {

        UUID assetId = UUID.randomUUID();
        UUID historyId = UUID.randomUUID();

        Asset asset = mock(Asset.class);
        WarrantyHistory item =
                mock(WarrantyHistory.class);

        LocalDate previousExpiry =
                LocalDate.of(2026, 12, 31);

        LocalDate newStart =
                LocalDate.of(2027, 1, 1);

        LocalDate newExpiry =
                LocalDate.of(2028, 1, 1);

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(item.getId())
                .thenReturn(historyId);

        when(item.getAssetId())
                .thenReturn(assetId);

        when(item.getPreviousExpiryDate())
                .thenReturn(previousExpiry);

        when(item.getNewStartDate())
                .thenReturn(newStart);

        when(item.getNewExpiryDate())
                .thenReturn(newExpiry);

        when(item.getPeriodMonths())
                .thenReturn(12);

        when(item.getProvider())
                .thenReturn("Dell");

        when(item.getWarrantyReference())
                .thenReturn("WAR-001");

        when(item.getRenewalCost())
                .thenReturn(
                        new BigDecimal("5000.00")
                );

        when(item.getNotes())
                .thenReturn("Renewed");

        when(item.getRenewedBy())
                .thenReturn("admin@enfec.com");

        when(history
                .findAllByAssetIdOrderByRenewedAtDesc(
                        assetId
                ))
                .thenReturn(List.of(item));

        var result =
                service.history(assetId);

        assertNotNull(result);
        assertEquals(1, result.size());

        assertEquals(
                historyId,
                result.get(0).id()
        );

        assertEquals(
                assetId,
                result.get(0).assetId()
        );

        assertEquals(
                previousExpiry,
                result.get(0)
                        .previousExpiryDate()
        );

        assertEquals(
                newStart,
                result.get(0).newStartDate()
        );

        assertEquals(
                newExpiry,
                result.get(0).newExpiryDate()
        );

        assertEquals(
                12,
                result.get(0).periodMonths()
        );

        assertEquals(
                "Dell",
                result.get(0).provider()
        );

        assertEquals(
                "WAR-001",
                result.get(0)
                        .warrantyReference()
        );

        verify(current)
                .requireRole(Role.ASSET_ADMIN);

        verify(assets)
                .findById(assetId);

        verify(history)
                .findAllByAssetIdOrderByRenewedAtDesc(
                        assetId
                );
    }


    @Test
    void history_shouldReturnEmptyListWhenNoHistoryExists() {

        UUID assetId = UUID.randomUUID();

        Asset asset = mock(Asset.class);

        when(assets.findById(assetId))
                .thenReturn(Optional.of(asset));

        when(history
                .findAllByAssetIdOrderByRenewedAtDesc(
                        assetId
                ))
                .thenReturn(List.of());

        var result =
                service.history(assetId);

        assertNotNull(result);
        assertTrue(result.isEmpty());

        verify(current)
                .requireRole(Role.ASSET_ADMIN);
    }


    @Test
    void history_shouldThrowExceptionWhenAssetNotFound() {

        UUID assetId = UUID.randomUUID();

        when(assets.findById(assetId))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        service.history(assetId)
        );

        verify(current)
                .requireRole(Role.ASSET_ADMIN);

        verify(history, never())
                .findAllByAssetIdOrderByRenewedAtDesc(
                        any()
                );
    }
}
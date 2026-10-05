package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.asset.AssetResponse;
import com.enfec.one.assets.dto.asset.CreateAssetRequest;
import com.enfec.one.assets.entity.Asset;
import com.enfec.one.assets.enums.AssetStatus;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.exception.BadRequestException;
import com.enfec.one.assets.exception.ConflictException;
import com.enfec.one.assets.exception.ResourceNotFoundException;
import com.enfec.one.assets.repository.AssetAssignmentRepository;
import com.enfec.one.assets.repository.AssetPurchaseOrderRepository;
import com.enfec.one.assets.repository.AssetRepository;
import com.enfec.one.assets.security.CurrentUser;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssetServiceTest {

    @Mock
    private AssetRepository assets;

    @Mock
    private AssetAssignmentRepository assignments;

    @Mock
    private AssetPurchaseOrderRepository purchaseOrders;

    @Mock
    private CurrentUser current;

    @InjectMocks
    private AssetService assetService;


    @Test
    void create_shouldCreateAssetSuccessfully() {

        CreateAssetRequest request =
                new CreateAssetRequest(
                        "LAP-TEST-001",
                        "Dell Laptop",
                        "Laptop",
                        "Dell",
                        "Latitude 5450",
                        "SERIAL-001",
                        "Intel Core i7, 16GB RAM",
                        LocalDate.now(),
                        new BigDecimal("75000"),
                        "Dell Supplier",
                        false,
                        null,
                        null,
                        null,
                        null,
                        null
                );

        when(
                assets.existsByAssetTagIgnoreCase(
                        "LAP-TEST-001"
                )
        ).thenReturn(false);

        when(
                assets.save(any(Asset.class))
        ).thenAnswer(
                invocation ->
                        invocation.getArgument(0)
        );

        AssetResponse response =
                assetService.create(request);

        assertNotNull(response);

        assertEquals(
                "LAP-TEST-001",
                response.assetTag()
        );

        assertEquals(
                "Dell Laptop",
                response.name()
        );

        assertEquals(
                "Laptop",
                response.category()
        );

        assertEquals(
                AssetStatus.IN_STOCK,
                response.status()
        );

        verify(current)
                .requireRole(Role.ASSET_ADMIN);

        verify(assets)
                .save(any(Asset.class));
    }


    @Test
    void create_shouldThrowConflictWhenAssetTagAlreadyExists() {

        CreateAssetRequest request =
                new CreateAssetRequest(
                        "LAP-001",
                        "Dell Laptop",
                        "Laptop",
                        "Dell",
                        "Latitude",
                        "SERIAL-001",
                        "16GB RAM",
                        LocalDate.now(),
                        new BigDecimal("70000"),
                        "Supplier",
                        false,
                        null,
                        null,
                        null,
                        null,
                        null
                );

        when(
                assets.existsByAssetTagIgnoreCase(
                        "LAP-001"
                )
        ).thenReturn(true);

        assertThrows(
                ConflictException.class,
                () ->
                        assetService.create(request)
        );

        verify(assets, never())
                .save(any(Asset.class));
    }


    @Test
    void create_shouldThrowExceptionWhenWarrantyStartDateMissing() {

        CreateAssetRequest request =
                new CreateAssetRequest(
                        "LAP-002",
                        "HP Laptop",
                        "Laptop",
                        "HP",
                        "EliteBook",
                        "SERIAL-002",
                        "16GB RAM",
                        LocalDate.now(),
                        new BigDecimal("65000"),
                        "HP Supplier",

                        true,

                        null,

                        12,

                        "HP",
                        "WAR-001",

                        null
                );

        when(
                assets.existsByAssetTagIgnoreCase(
                        "LAP-002"
                )
        ).thenReturn(false);

        assertThrows(
                BadRequestException.class,
                () ->
                        assetService.create(request)
        );

        verify(assets, never())
                .save(any(Asset.class));
    }


    @Test
    void create_shouldThrowExceptionWhenWarrantyPeriodMissing() {

        CreateAssetRequest request =
                new CreateAssetRequest(
                        "LAP-003",
                        "Lenovo Laptop",
                        "Laptop",
                        "Lenovo",
                        "ThinkPad",
                        "SERIAL-003",
                        "16GB RAM",
                        LocalDate.now(),
                        new BigDecimal("68000"),
                        "Lenovo Supplier",

                        true,

                        LocalDate.now(),

                        null,

                        "Lenovo",
                        "WAR-002",

                        null
                );

        when(
                assets.existsByAssetTagIgnoreCase(
                        "LAP-003"
                )
        ).thenReturn(false);

        assertThrows(
                BadRequestException.class,
                () ->
                        assetService.create(request)
        );

        verify(assets, never())
                .save(any(Asset.class));
    }


    @Test
    void all_shouldReturnAllAssets() {

        Asset asset =
                createTestAsset(
                        "LAP-004",
                        "Dell Laptop",
                        "Laptop"
                );

        when(
                assets.findAllByOrderByCreatedAtDesc()
        ).thenReturn(
                List.of(asset)
        );

        when(
                assignments
                        .findFirstByAssetIdAndReturnedAtIsNull(
                                asset.getId()
                        )
        ).thenReturn(
                Optional.empty()
        );

        List<AssetResponse> result =
                assetService.all();

        assertNotNull(result);

        assertEquals(
                1,
                result.size()
        );

        assertEquals(
                "LAP-004",
                result.get(0).assetTag()
        );

        assertEquals(
                "Dell Laptop",
                result.get(0).name()
        );

        verify(current)
                .requireRole(Role.ASSET_ADMIN);
    }


    @Test
    void one_shouldReturnAsset() {

        UUID assetId =
                UUID.randomUUID();

        Asset asset =
                mock(Asset.class);

        when(asset.getId())
                .thenReturn(assetId);

        when(asset.getAssetTag())
                .thenReturn("MON-001");

        when(asset.getName())
                .thenReturn("Monitor");

        when(asset.getCategory())
                .thenReturn("Monitor");

        when(asset.getStatus())
                .thenReturn(AssetStatus.IN_STOCK);

        when(
                assets.findById(assetId)
        ).thenReturn(
                Optional.of(asset)
        );

        when(
                assignments
                        .findFirstByAssetIdAndReturnedAtIsNull(
                                assetId
                        )
        ).thenReturn(
                Optional.empty()
        );

        AssetResponse response =
                assetService.one(assetId);

        assertNotNull(response);

        assertEquals(
                "MON-001",
                response.assetTag()
        );

        assertEquals(
                "Monitor",
                response.category()
        );

        verify(current)
                .requireRole(Role.ASSET_ADMIN);

        verify(assets)
                .findById(assetId);
    }


    @Test
    void one_shouldThrowExceptionWhenAssetNotFound() {

        UUID assetId =
                UUID.randomUUID();

        when(
                assets.findById(assetId)
        ).thenReturn(
                Optional.empty()
        );

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        assetService.one(assetId)
        );

        verify(current)
                .requireRole(Role.ASSET_ADMIN);

        verify(assets)
                .findById(assetId);
    }


    @Test
    void delete_shouldDeleteExistingAsset() {

        UUID assetId =
                UUID.randomUUID();

        Asset asset =
                mock(Asset.class);

        when(
                assets.findById(assetId)
        ).thenReturn(
                Optional.of(asset)
        );

        assetService.delete(assetId);

        verify(current)
                .requireRole(Role.ASSET_ADMIN);

        verify(assets)
                .findById(assetId);

        verify(assets)
                .delete(asset);
    }


    private Asset createTestAsset(
            String assetTag,
            String name,
            String category
    ) {

        return new Asset(
                assetTag,
                name,
                category,

                "Test Brand",
                "Test Model",
                "TEST-SERIAL",

                "Test Specifications",

                LocalDate.now(),

                new BigDecimal("50000"),

                "Test Supplier",

                false,

                null,
                null,
                null,
                null
        );
    }
}
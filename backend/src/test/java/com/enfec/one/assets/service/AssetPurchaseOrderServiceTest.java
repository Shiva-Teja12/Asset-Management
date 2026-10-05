package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.purchase.AssetPurchaseOrderResponse;
import com.enfec.one.assets.dto.purchase.CreateAssetPurchaseOrderRequest;
import com.enfec.one.assets.entity.AppUser;
import com.enfec.one.assets.entity.AssetPurchaseOrder;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.repository.AssetPurchaseOrderRepository;
import com.enfec.one.assets.security.CurrentUser;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssetPurchaseOrderServiceTest {

    @Mock
    private AssetPurchaseOrderRepository orders;

    @Mock
    private CurrentUser current;

    @Mock
    private AuditService audit;

    @Mock
    private AppUser admin;

    private AssetPurchaseOrderService service;

    @BeforeEach
    void setUp() {

        service =
                new AssetPurchaseOrderService(
                        orders,
                        current,
                        audit
                );
    }

    /*
     * =========================================================
     * CREATE
     * =========================================================
     */

    @Test
    void create_shouldCreatePurchaseOrderSuccessfully() {

        UUID onboardingRequestId =
                UUID.randomUUID();

        when(
                current.requireRole(
                        Role.ASSET_ADMIN
                )
        ).thenReturn(admin);

        when(admin.getName())
                .thenReturn("Asset Admin");

        when(admin.getEmail())
                .thenReturn("assetadmin@enfec.com");

        CreateAssetPurchaseOrderRequest request =
                new CreateAssetPurchaseOrderRequest(
                        onboardingRequestId,
                        "Laptop",
                        1,
                        3,
                        2,
                        "Dell",
                        "Latitude 5450",
                        "Intel Core i7, 16GB RAM, 512GB SSD",
                        2,
                        new BigDecimal("75000.00"),
                        "Dell Supplier",
                        "Required for employee onboarding"
                );

        mockSaveWithGeneratedId();

        AssetPurchaseOrderResponse response =
                service.create(request);

        assertNotNull(response);

        assertNotNull(
                response.id()
        );

        assertEquals(
                onboardingRequestId,
                response.onboardingRequestId()
        );

        assertEquals(
                "Laptop",
                response.category()
        );

        assertEquals(
                1,
                response.currentAvailableStock()
        );

        assertEquals(
                3,
                response.requiredAvailableStock()
        );

        assertEquals(
                2,
                response.quantityNeeded()
        );

        assertEquals(
                "Dell",
                response.brand()
        );

        assertEquals(
                "Latitude 5450",
                response.model()
        );

        assertEquals(
                "Intel Core i7, 16GB RAM, 512GB SSD",
                response.specifications()
        );

        assertEquals(
                2,
                response.quantityOrdered()
        );

        assertEquals(
                0,
                response.quantityReceived()
        );

        assertEquals(
                "ORDERED",
                response.status()
        );

        assertEquals(
                0,
                new BigDecimal("75000.00")
                        .compareTo(
                                response.pricePerUnit()
                        )
        );

        assertEquals(
                0,
                new BigDecimal("150000.00")
                        .compareTo(
                                response.totalEstimatedCost()
                        )
        );

        assertEquals(
                "Dell Supplier",
                response.supplier()
        );

        assertEquals(
                "Required for employee onboarding",
                response.reason()
        );

        assertEquals(
                "Asset Admin",
                response.orderedByName()
        );

        assertEquals(
                "assetadmin@enfec.com",
                response.orderedByEmail()
        );

        assertNotNull(
                response.orderedAt()
        );

        verify(current)
                .requireRole(
                        Role.ASSET_ADMIN
                );

        verify(orders)
                .save(
                        any(AssetPurchaseOrder.class)
                );
    }

    @Test
    void create_shouldTrimTextFields() {

        when(
                current.requireRole(
                        Role.ASSET_ADMIN
                )
        ).thenReturn(admin);

        when(admin.getName())
                .thenReturn("Asset Admin");

        when(admin.getEmail())
                .thenReturn("assetadmin@enfec.com");

        CreateAssetPurchaseOrderRequest request =
                new CreateAssetPurchaseOrderRequest(
                        UUID.randomUUID(),
                        "  Laptop  ",
                        0,
                        1,
                        1,
                        "  Dell  ",
                        "  Latitude 5450  ",
                        "  16GB RAM  ",
                        1,
                        new BigDecimal("50000.00"),
                        "  Supplier ABC  ",
                        "  New employee requirement  "
                );

        mockSaveWithGeneratedId();

        AssetPurchaseOrderResponse response =
                service.create(request);

        assertNotNull(response);

        assertEquals(
                "Laptop",
                response.category()
        );

        assertEquals(
                "Dell",
                response.brand()
        );

        assertEquals(
                "Latitude 5450",
                response.model()
        );

        assertEquals(
                "16GB RAM",
                response.specifications()
        );

        assertEquals(
                "Supplier ABC",
                response.supplier()
        );

        assertEquals(
                "New employee requirement",
                response.reason()
        );
    }

    /*
     * =========================================================
     * GET ALL
     * =========================================================
     */

    @Test
    void all_shouldReturnPurchaseOrders() {

        when(
                current.requireRole(
                        Role.ASSET_ADMIN
                )
        ).thenReturn(admin);

        AssetPurchaseOrder first =
                purchaseOrder(
                        UUID.randomUUID(),
                        "Laptop",
                        2
                );

        AssetPurchaseOrder second =
                purchaseOrder(
                        UUID.randomUUID(),
                        "Monitor",
                        1
                );

        when(
                orders.findAllByOrderByOrderedAtDesc()
        ).thenReturn(
                List.of(
                        first,
                        second
                )
        );

        List<AssetPurchaseOrderResponse> result =
                service.all();

        assertNotNull(result);

        assertEquals(
                2,
                result.size()
        );

        assertEquals(
                "Laptop",
                result.get(0).category()
        );

        assertEquals(
                "Monitor",
                result.get(1).category()
        );

        verify(current)
                .requireRole(
                        Role.ASSET_ADMIN
                );

        verify(orders)
                .findAllByOrderByOrderedAtDesc();
    }

    @Test
    void all_shouldReturnEmptyListWhenNoOrdersExist() {

        when(
                current.requireRole(
                        Role.ASSET_ADMIN
                )
        ).thenReturn(admin);

        when(
                orders.findAllByOrderByOrderedAtDesc()
        ).thenReturn(
                List.of()
        );

        List<AssetPurchaseOrderResponse> result =
                service.all();

        assertNotNull(result);

        assertTrue(
                result.isEmpty()
        );

        verify(current)
                .requireRole(
                        Role.ASSET_ADMIN
                );
    }

    /*
     * =========================================================
     * FIND BY ONBOARDING REQUEST
     * =========================================================
     */

    @Test
    void findByOnboardingRequestId_shouldReturnLatestOrder() {

        UUID onboardingRequestId =
                UUID.randomUUID();

        AssetPurchaseOrder order =
                purchaseOrder(
                        onboardingRequestId,
                        "Laptop",
                        1
                );

        when(current.require())
                .thenReturn(admin);

        when(
                orders
                        .findFirstByOnboardingRequestIdOrderByOrderedAtDesc(
                                onboardingRequestId
                        )
        ).thenReturn(
                Optional.of(order)
        );

        AssetPurchaseOrderResponse response =
                service.findByOnboardingRequestId(
                        onboardingRequestId
                );

        assertNotNull(response);

        assertNotNull(
                response.id()
        );

        assertEquals(
                onboardingRequestId,
                response.onboardingRequestId()
        );

        assertEquals(
                "Laptop",
                response.category()
        );

        verify(current)
                .require();

        verify(orders)
                .findFirstByOnboardingRequestIdOrderByOrderedAtDesc(
                        onboardingRequestId
                );
    }

    @Test
    void findByOnboardingRequestId_shouldThrow404WhenOrderNotFound() {

        UUID onboardingRequestId =
                UUID.randomUUID();

        when(current.require())
                .thenReturn(admin);

        when(
                orders
                        .findFirstByOnboardingRequestIdOrderByOrderedAtDesc(
                                onboardingRequestId
                        )
        ).thenReturn(
                Optional.empty()
        );

        ResponseStatusException exception =
                assertThrows(
                        ResponseStatusException.class,
                        () ->
                                service
                                        .findByOnboardingRequestId(
                                                onboardingRequestId
                                        )
                );

        assertEquals(
                404,
                exception
                        .getStatusCode()
                        .value()
        );
    }

    /*
     * =========================================================
     * RECEIVE ONE
     * =========================================================
     */

    @Test
    void receiveOne_shouldMoveOrderToPartiallyReceived() {

        UUID orderId =
                UUID.randomUUID();

        AssetPurchaseOrder order =
                purchaseOrderWithId(
                        orderId,
                        UUID.randomUUID(),
                        "Laptop",
                        2
                );

        when(
                current.requireRole(
                        Role.ASSET_ADMIN
                )
        ).thenReturn(admin);

        when(
                orders.findById(orderId)
        ).thenReturn(
                Optional.of(order)
        );

        when(
                orders.save(order)
        ).thenReturn(order);

        AssetPurchaseOrderResponse response =
                service.receiveOne(orderId);

        assertNotNull(response);

        assertEquals(
                1,
                response.quantityReceived()
        );

        assertEquals(
                "PARTIALLY_RECEIVED",
                response.status()
        );

        verify(orders)
                .save(order);
    }

    @Test
    void receiveOne_shouldMoveOrderToReceived() {

        UUID orderId =
                UUID.randomUUID();

        AssetPurchaseOrder order =
                purchaseOrderWithId(
                        orderId,
                        UUID.randomUUID(),
                        "Monitor",
                        1
                );

        when(
                current.requireRole(
                        Role.ASSET_ADMIN
                )
        ).thenReturn(admin);

        when(
                orders.findById(orderId)
        ).thenReturn(
                Optional.of(order)
        );

        when(
                orders.save(order)
        ).thenReturn(order);

        AssetPurchaseOrderResponse response =
                service.receiveOne(orderId);

        assertNotNull(response);

        assertEquals(
                1,
                response.quantityReceived()
        );

        assertEquals(
                "RECEIVED",
                response.status()
        );
    }

    @Test
    void receiveOne_shouldThrow404WhenOrderDoesNotExist() {

        UUID orderId =
                UUID.randomUUID();

        when(
                current.requireRole(
                        Role.ASSET_ADMIN
                )
        ).thenReturn(admin);

        when(
                orders.findById(orderId)
        ).thenReturn(
                Optional.empty()
        );

        ResponseStatusException exception =
                assertThrows(
                        ResponseStatusException.class,
                        () ->
                                service.receiveOne(
                                        orderId
                                )
                );

        assertEquals(
                404,
                exception
                        .getStatusCode()
                        .value()
        );

        verify(orders, never())
                .save(any());
    }

    @Test
    void receiveOne_shouldRejectWhenEverythingAlreadyReceived() {

        UUID orderId =
                UUID.randomUUID();

        AssetPurchaseOrder order =
                purchaseOrderWithId(
                        orderId,
                        UUID.randomUUID(),
                        "Laptop",
                        1
                );

        /*
         * Complete the order before passing it
         * to the service.
         */
        order.receiveOne();

        assertEquals(
                1,
                order.getQuantityReceived()
        );

        assertEquals(
                "RECEIVED",
                order.getStatus()
        );

        when(
                current.requireRole(
                        Role.ASSET_ADMIN
                )
        ).thenReturn(admin);

        when(
                orders.findById(orderId)
        ).thenReturn(
                Optional.of(order)
        );

        ResponseStatusException exception =
                assertThrows(
                        ResponseStatusException.class,
                        () ->
                                service.receiveOne(
                                        orderId
                                )
                );

        assertEquals(
                409,
                exception
                        .getStatusCode()
                        .value()
        );

        verify(orders, never())
                .save(any());
    }

    /*
     * =========================================================
     * SAVE VALUES
     * =========================================================
     */

    @Test
    void create_shouldSaveCorrectEntityValues() {

        UUID onboardingRequestId =
                UUID.randomUUID();

        when(
                current.requireRole(
                        Role.ASSET_ADMIN
                )
        ).thenReturn(admin);

        when(admin.getName())
                .thenReturn("Asset Admin");

        when(admin.getEmail())
                .thenReturn("admin@enfec.com");

        CreateAssetPurchaseOrderRequest request =
                new CreateAssetPurchaseOrderRequest(
                        onboardingRequestId,
                        "Keyboard",
                        0,
                        3,
                        3,
                        "Logitech",
                        "MX Keys",
                        "Wireless Keyboard",
                        3,
                        new BigDecimal("5000.00"),
                        "ABC Supplier",
                        "Stock requirement"
                );

        mockSaveWithGeneratedId();

        service.create(request);

        ArgumentCaptor<AssetPurchaseOrder> captor =
                ArgumentCaptor.forClass(
                        AssetPurchaseOrder.class
                );

        verify(orders)
                .save(
                        captor.capture()
                );

        AssetPurchaseOrder saved =
                captor.getValue();

        assertNotNull(
                saved.getId()
        );

        assertEquals(
                onboardingRequestId,
                saved.getOnboardingRequestId()
        );

        assertEquals(
                "Keyboard",
                saved.getCategory()
        );

        assertEquals(
                3,
                saved.getQuantityOrdered()
        );

        assertEquals(
                0,
                saved.getQuantityReceived()
        );

        assertEquals(
                "ORDERED",
                saved.getStatus()
        );

        assertEquals(
                0,
                new BigDecimal("15000.00")
                        .compareTo(
                                saved.getTotalEstimatedCost()
                        )
        );

        assertEquals(
                "Asset Admin",
                saved.getOrderedByName()
        );

        assertEquals(
                "admin@enfec.com",
                saved.getOrderedByEmail()
        );
    }

    /*
     * =========================================================
     * ENTITY RECEIVEONE DIRECT TEST
     * =========================================================
     */

    @Test
    void purchaseOrderEntity_shouldRejectReceivingMoreThanOrdered() {

        AssetPurchaseOrder order =
                purchaseOrder(
                        UUID.randomUUID(),
                        "Monitor",
                        1
                );

        order.receiveOne();

        assertEquals(
                1,
                order.getQuantityReceived()
        );

        assertEquals(
                "RECEIVED",
                order.getStatus()
        );

        IllegalStateException exception =
                assertThrows(
                        IllegalStateException.class,
                        order::receiveOne
                );

        assertEquals(
                "All assets for this purchase order have already been received.",
                exception.getMessage()
        );
    }

    /*
     * =========================================================
     * HELPERS
     * =========================================================
     */

    private void mockSaveWithGeneratedId() {

        when(
                orders.save(
                        any(AssetPurchaseOrder.class)
                )
        ).thenAnswer(invocation -> {

            AssetPurchaseOrder order =
                    invocation.getArgument(0);

            /*
             * In the real application Hibernate/JPA generates
             * this UUID because AssetPurchaseOrder.id uses
             * @GeneratedValue.
             *
             * Mockito does not run Hibernate, so the unit test
             * must simulate that generated ID.
             */
            if (order.getId() == null) {

                ReflectionTestUtils.setField(
                        order,
                        "id",
                        UUID.randomUUID()
                );
            }

            return order;
        });
    }

    private AssetPurchaseOrder purchaseOrder(
            UUID onboardingRequestId,
            String category,
            int quantityOrdered
    ) {

        AssetPurchaseOrder order =
                new AssetPurchaseOrder(
                        onboardingRequestId,
                        category,
                        0,
                        quantityOrdered,
                        quantityOrdered,
                        "Dell",
                        "Test Model",
                        "Test Specifications",
                        quantityOrdered,
                        new BigDecimal("50000.00"),
                        "Test Supplier",
                        "Test purchase order",
                        "Asset Admin",
                        "assetadmin@enfec.com"
                );

        ReflectionTestUtils.setField(
                order,
                "id",
                UUID.randomUUID()
        );

        return order;
    }

    private AssetPurchaseOrder purchaseOrderWithId(
            UUID orderId,
            UUID onboardingRequestId,
            String category,
            int quantityOrdered
    ) {

        AssetPurchaseOrder order =
                new AssetPurchaseOrder(
                        onboardingRequestId,
                        category,
                        0,
                        quantityOrdered,
                        quantityOrdered,
                        "Dell",
                        "Test Model",
                        "Test Specifications",
                        quantityOrdered,
                        new BigDecimal("50000.00"),
                        "Test Supplier",
                        "Test purchase order",
                        "Asset Admin",
                        "assetadmin@enfec.com"
                );

        ReflectionTestUtils.setField(
                order,
                "id",
                orderId
        );

        return order;
    }
}
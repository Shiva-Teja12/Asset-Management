package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.purchase.AssetPurchaseOrderResponse;
import com.enfec.one.assets.dto.purchase.CreateAssetPurchaseOrderRequest;
import com.enfec.one.assets.entity.AssetPurchaseOrder;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.repository.AssetPurchaseOrderRepository;
import com.enfec.one.assets.security.CurrentUser;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class AssetPurchaseOrderService {

    private final AssetPurchaseOrderRepository orders;

    private final CurrentUser current;

    private final AuditService audit;

    public AssetPurchaseOrderService(
            AssetPurchaseOrderRepository orders,
            CurrentUser current,
            AuditService audit
    ) {

        this.orders = orders;
        this.current = current;
        this.audit = audit;
    }

    /*
     * PLACE ASSET ORDER
     */

    @Transactional
    public AssetPurchaseOrderResponse create(
            CreateAssetPurchaseOrderRequest request
    ) {

        /*
         * Only Asset Admin can place orders.
         */
        var admin =
                current.requireRole(
                        Role.ASSET_ADMIN
                );

        /*
         * Create the order.
         *
         * The onboarding request ID links this
         * purchase order to the onboarding request
         * that caused the purchase.
         *
         * Ordered By name/email come from
         * the authenticated user.
         */
        AssetPurchaseOrder order =
                new AssetPurchaseOrder(

                        request
                                .onboardingRequestId(),

                        request
                                .category()
                                .trim(),

                        request
                                .currentAvailableStock(),

                        request
                                .requiredAvailableStock(),

                        request
                                .quantityNeeded(),

                        request
                                .brand()
                                .trim(),

                        request
                                .model()
                                .trim(),

                        request
                                .specifications()
                                .trim(),

                        request
                                .quantityOrdered(),

                        request
                                .pricePerUnit(),

                        request
                                .supplier()
                                .trim(),

                        request
                                .reason()
                                .trim(),

                        admin.getName(),

                        admin.getEmail()
                );

        order =
                orders.save(
                        order
                );

        /*
         * Record the order in the
         * central Audit Logs.
         */
        audit.log(
                admin,

                "PLACE_ASSET_ORDER",

                "PURCHASE",

                "PURCHASE_ORDER",

                order
                        .getId()
                        .toString(),

                order.getCategory()
                        + " Order",

                null,

                null,

                null,

                buildAuditDetails(
                        order
                )
        );

        return toResponse(
                order
        );
    }

    /*
     * GET ALL ORDERS
     */

    @Transactional(readOnly = true)
    public List<AssetPurchaseOrderResponse> all() {

        /*
         * Keep existing Asset Admin protection.
         */
        current.requireRole(
                Role.ASSET_ADMIN
        );

        return orders
                .findAllByOrderByOrderedAtDesc()
                .stream()
                .map(
                        this::toResponse
                )
                .toList();
    }

    /*
     * GET PURCHASE ORDER FOR ONBOARDING REQUEST
     *
     * This is used when the received asset is
     * being registered after vendor delivery
     * and inspection.
     *
     * It allows the frontend to automatically
     * obtain Brand, Model, Specifications,
     * Price, Supplier and Order Date from the
     * purchase order.
     */

    @Transactional(readOnly = true)
    public AssetPurchaseOrderResponse findByOnboardingRequestId(
            UUID onboardingRequestId
    ) {

        /*
         * User must be authenticated.
         *
         * We intentionally use require() here instead
         * of requireRole(ASSET_ADMIN) for this lookup.
         *
         * Existing create/order-history authorization
         * remains unchanged.
         */
        current.require();

        AssetPurchaseOrder order =
                orders
                        .findFirstByOnboardingRequestIdOrderByOrderedAtDesc(
                                onboardingRequestId
                        )
                        .orElseThrow(
                                () -> new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "No purchase order found for this onboarding request."
                                )
                        );

        return toResponse(
                order
        );
    }
    /*
     * REGISTER ONE RECEIVED ITEM
     *
     * Called when Asset Admin registers one physical
     * asset that belongs to this purchase order.
     *
     * Examples:
     *
     * 1 ordered:
     * 0/1 ORDERED
     * 1/1 RECEIVED
     *
     * 2 ordered:
     * 0/2 ORDERED
     * 1/2 PARTIALLY_RECEIVED
     * 2/2 RECEIVED
     */
    @Transactional
    public AssetPurchaseOrderResponse receiveOne(
            UUID purchaseOrderId
    ) {

        var admin =
                current.requireRole(
                        Role.ASSET_ADMIN
                );

        AssetPurchaseOrder order =
                orders.findById(
                        purchaseOrderId
                ).orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Purchase order not found."
                        )
                );

        try {

            order.receiveOne();

        } catch (IllegalStateException exception) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    exception.getMessage()
            );
        }

        order =
                orders.save(
                        order
                );

        audit.log(
                admin,

                "RECEIVE_PURCHASE_ORDER_ITEM",

                "PURCHASE",

                "PURCHASE_ORDER",

                order.getId()
                        .toString(),

                order.getCategory()
                        + " Received",

                null,

                null,

                null,

                "Received 1 asset. "
                        + "Quantity Ordered: "
                        + order.getQuantityOrdered()
                        + ", Quantity Received: "
                        + order.getQuantityReceived()
                        + ", Status: "
                        + order.getStatus()
        );

        return toResponse(
                order
        );
    }
    /*
     * ENTITY -> RESPONSE
     */

    private AssetPurchaseOrderResponse toResponse(
            AssetPurchaseOrder order
    ) {

        return new AssetPurchaseOrderResponse(

                order.getId(),

                order.getOnboardingRequestId(),

                order.getCategory(),

                order.getCurrentAvailableStock(),

                order.getRequiredAvailableStock(),

                order.getQuantityNeeded(),

                order.getBrand(),

                order.getModel(),

                order.getSpecifications(),

                order.getQuantityOrdered(),

                /*
                 * NEW:
                 * Number of ordered assets that
                 * have actually been received.
                 */
                order.getQuantityReceived(),

                /*
                 * NEW:
                 * ORDERED / PARTIALLY_RECEIVED / RECEIVED
                 */
                order.getStatus(),

                order.getPricePerUnit(),

                order.getTotalEstimatedCost(),

                order.getSupplier(),

                order.getReason(),

                order.getOrderedByName(),

                order.getOrderedByEmail(),

                order.getOrderedAt()
        );
    }

    /*
     * AUDIT DESCRIPTION
     */

    private String buildAuditDetails(
            AssetPurchaseOrder order
    ) {

        return "Category: "
                + order.getCategory()

                + ", Brand: "
                + order.getBrand()

                + ", Model: "
                + order.getModel()

                + ", Specifications: "
                + order.getSpecifications()

                + ", Quantity Needed: "
                + order.getQuantityNeeded()

                + ", Quantity Ordered: "
                + order.getQuantityOrdered()

                + ", Price Per Unit: "
                + order.getPricePerUnit()

                + ", Total Estimated Cost: "
                + order.getTotalEstimatedCost()

                + ", Supplier: "
                + order.getSupplier()

                + ", Reason: "
                + order.getReason()

                + ", Ordered By: "
                + order.getOrderedByName()

                + " ("
                + order.getOrderedByEmail()
                + ")";
    }
}
package com.enfec.one.assets.enums;

public enum OnboardingRequestStatus {

    /*
     * =========================================================
     * INITIAL ONBOARDING FLOW
     * =========================================================
     */

    PENDING_ASSET_ADMIN,

    PENDING_VP_APPROVAL,

    VP_REJECTED,


    /*
     * =========================================================
     * STOCK CHECK
     * =========================================================
     */

    PENDING_STOCK_CHECK,


    /*
     * =========================================================
     * DIRECT ALLOCATION
     * =========================================================
     */

    PENDING_ALLOCATION,

    ALLOCATED,


    /*
     * =========================================================
     * PURCHASE REQUEST
     * =========================================================
     */

    PR_REQUIRED,

    PENDING_FINANCE_APPROVAL,

    FINANCE_APPROVED,

    FINANCE_REJECTED,


    /*
     * =========================================================
     * SECOND VP APPROVAL FOR PURCHASE
     * =========================================================
     */

    PENDING_PR_VP_APPROVAL,

    PR_VP_APPROVED,

    PR_VP_REJECTED,


    /*
     * =========================================================
     * VENDOR / PROCUREMENT
     * =========================================================
     */

    PENDING_VENDOR_ORDER,

    ORDER_PLACED,

    PENDING_DELIVERY,


    /*
     * =========================================================
     * INSPECTION
     * =========================================================
     */

    PENDING_INSPECTION,

    INSPECTION_PASSED,

    INSPECTION_FAILED,


    /*
     * =========================================================
     * FINAL
     * =========================================================
     */

    COMPLETED
}
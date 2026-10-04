package com.enfec.one.assets.controller;

import com.enfec.one.assets.dto.manager.ManagerDashboardResponse;
import com.enfec.one.assets.dto.manager.TeamAssetResponse;
import com.enfec.one.assets.dto.manager.TeamMemberResponse;
import com.enfec.one.assets.dto.secondarydevice.ManagerDecisionRequest;
import com.enfec.one.assets.dto.secondarydevice.SecondaryDeviceRequestResponse;
import com.enfec.one.assets.service.ManagerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/manager")
public class ManagerController {

    private final ManagerService managerService;

    public ManagerController(
            ManagerService managerService
    ) {
        this.managerService = managerService;
    }

    /*
     * =========================================================
     * MANAGER DASHBOARD
     * =========================================================
     *
     * GET /api/v1/manager/dashboard
     */
    @GetMapping("/dashboard")
    public ResponseEntity<ManagerDashboardResponse>
    getDashboard() {

        return ResponseEntity.ok(
                managerService.getDashboard()
        );
    }


    /*
     * =========================================================
     * MY TEAM
     * =========================================================
     *
     * GET /api/v1/manager/team
     */
    @GetMapping("/team")
    public ResponseEntity<List<TeamMemberResponse>>
    getTeam() {

        return ResponseEntity.ok(
                managerService.getTeam()
        );
    }


    /*
     * =========================================================
     * TEAM ASSETS
     * =========================================================
     *
     * GET /api/v1/manager/team-assets
     *
     * Read-only endpoint.
     *
     * Shows:
     * - Employee
     * - Asset
     * - Primary / Secondary
     * - Current status
     * - Repair reason when IN_REPAIR
     */
    @GetMapping("/team-assets")
    public ResponseEntity<List<TeamAssetResponse>>
    getTeamAssets() {

        return ResponseEntity.ok(
                managerService.getTeamAssets()
        );
    }


    /*
     * =========================================================
     * SECONDARY DEVICE REQUEST LIST
     * =========================================================
     *
     * GET
     * /api/v1/manager/secondary-device-requests
     */
    @GetMapping("/secondary-device-requests")
    public ResponseEntity<
            List<SecondaryDeviceRequestResponse>
            >
    getSecondaryDeviceRequests() {

        return ResponseEntity.ok(
                managerService
                        .getSecondaryDeviceRequests()
        );
    }


    /*
     * =========================================================
     * SECONDARY DEVICE REQUEST DETAILS
     * =========================================================
     *
     * GET
     * /api/v1/manager/secondary-device-requests/{id}
     */
    @GetMapping(
            "/secondary-device-requests/{id}"
    )
    public ResponseEntity<
            SecondaryDeviceRequestResponse
            >
    getSecondaryDeviceRequest(
            @PathVariable UUID id
    ) {

        return ResponseEntity.ok(
                managerService
                        .getSecondaryDeviceRequest(id)
        );
    }


    /*
     * =========================================================
     * APPROVE REQUEST
     * =========================================================
     *
     * POST
     * /api/v1/manager/secondary-device-requests/{id}/approve
     *
     * Body:
     *
     * {
     *   "comment": "Approved for project work"
     * }
     */
    @PostMapping(
            "/secondary-device-requests/{id}/approve"
    )
    public ResponseEntity<
            SecondaryDeviceRequestResponse
            >
    approveRequest(
            @PathVariable UUID id,
            @Valid
            @RequestBody(required = false)
            ManagerDecisionRequest request
    ) {

        return ResponseEntity.ok(
                managerService.approveRequest(
                        id,
                        request
                )
        );
    }


    /*
     * =========================================================
     * REJECT REQUEST
     * =========================================================
     *
     * POST
     * /api/v1/manager/secondary-device-requests/{id}/reject
     *
     * Body:
     *
     * {
     *   "comment": "Existing equipment is sufficient"
     * }
     */
    @PostMapping(
            "/secondary-device-requests/{id}/reject"
    )
    public ResponseEntity<
            SecondaryDeviceRequestResponse
            >
    rejectRequest(
            @PathVariable UUID id,
            @Valid
            @RequestBody(required = false)
            ManagerDecisionRequest request
    ) {

        return ResponseEntity.ok(
                managerService.rejectRequest(
                        id,
                        request
                )
        );
    }
}
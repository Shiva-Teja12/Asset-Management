package com.enfec.one.assets.entity;

import com.enfec.one.assets.enums.AssetAssignmentType;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "asset_assignments")
public class AssetAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID assetId;

    @Column(nullable = false)
    private UUID employeeId;

    @Column(nullable = false, length = 200)
    private String employeeName;

    /*
     * PRIMARY   = Employee's main company device.
     * SECONDARY = Additional device approved through
     *             the secondary-device request workflow.
     *
     * nullable is intentionally allowed at database level
     * so old assignment rows continue working safely.
     *
     * Old rows with NULL are treated as PRIMARY by
     * getAssignmentType().
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "assignment_type", length = 20)
    private AssetAssignmentType assignmentType;

    @Column(nullable = false)
    private Instant assignedAt;

    @Column(nullable = false, length = 200)
    private String assignedBy;

    @Column(length = 1000)
    private String reason;

    private Instant returnedAt;

    @Column(length = 200)
    private String returnedBy;

    @Column(length = 1000)
    private String returnReason;

    protected AssetAssignment() {
    }

    /*
     * EXISTING CONSTRUCTOR
     *
     * Keep this constructor because your existing AssetService
     * is already using it.
     *
     * Normal/manual assignments continue to be PRIMARY.
     */
    public AssetAssignment(
            UUID assetId,
            UUID employeeId,
            String employeeName,
            String assignedBy,
            String reason
    ) {
        this(
                assetId,
                employeeId,
                employeeName,
                assignedBy,
                reason,
                AssetAssignmentType.PRIMARY
        );
    }

    /*
     * NEW CONSTRUCTOR
     *
     * Used when we explicitly need to create either a
     * PRIMARY or SECONDARY assignment.
     */
    public AssetAssignment(
            UUID assetId,
            UUID employeeId,
            String employeeName,
            String assignedBy,
            String reason,
            AssetAssignmentType assignmentType
    ) {
        this.assetId = assetId;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.assignedBy = assignedBy;
        this.reason = reason;

        this.assignmentType =
                assignmentType == null
                        ? AssetAssignmentType.PRIMARY
                        : assignmentType;

        this.assignedAt = Instant.now();
    }

    public void close(String returnedBy, String reason) {
        this.returnedAt = Instant.now();
        this.returnedBy = returnedBy;
        this.returnReason = reason;
    }

    public UUID getId() {
        return id;
    }

    public UUID getAssetId() {
        return assetId;
    }

    public UUID getEmployeeId() {
        return employeeId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    /*
     * Old database rows may have NULL because they were created
     * before assignment_type existed.
     *
     * Those existing assignments are considered PRIMARY.
     */
    public AssetAssignmentType getAssignmentType() {
        return assignmentType == null
                ? AssetAssignmentType.PRIMARY
                : assignmentType;
    }

    public Instant getAssignedAt() {
        return assignedAt;
    }

    public String getAssignedBy() {
        return assignedBy;
    }

    public String getReason() {
        return reason;
    }

    public Instant getReturnedAt() {
        return returnedAt;
    }

    public String getReturnedBy() {
        return returnedBy;
    }

    public String getReturnReason() {
        return returnReason;
    }
}
package com.enfec.one.assets.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "actor_user_id")
    private UUID actorUserId;

    @Column(name = "actor_name", length = 200)
    private String actorName;

    @Column(name = "actor_email", length = 200)
    private String actorEmail;

    @Column(name = "actor_role", length = 50)
    private String actorRole;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(nullable = false, length = 100)
    private String module;

    @Column(name = "entity_type", length = 100)
    private String entityType;

    @Column(name = "entity_id", length = 100)
    private String entityId;

    @Column(name = "entity_name", length = 250)
    private String entityName;

    @Column(name = "asset_category", length = 100)
    private String assetCategory;

    @Column(name = "asset_name", length = 200)
    private String assetName;

    @Column(name = "asset_brand", length = 120)
    private String assetBrand;

    @Column(name = "asset_model", length = 150)
    private String assetModel;

    @Column(name = "asset_tag", length = 80)
    private String assetTag;

    @Column(name = "asset_serial_number", length = 150)
    private String assetSerialNumber;

    @Column(name = "asset_specifications", length = 2000)
    private String assetSpecifications;

    @Column(name = "employee_name", length = 200)
    private String employeeName;

    @Column(name = "old_value", length = 2000)
    private String oldValue;

    @Column(name = "new_value", length = 2000)
    private String newValue;

    @Column(length = 3000)
    private String details;

    @Column(nullable = false, length = 50)
    private String result;

    @Column(name = "ip_address", length = 100)
    private String ipAddress;

    @Column(name = "user_agent", length = 1000)
    private String userAgent;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected AuditLog() {
    }

    public AuditLog(
            UUID actorUserId,
            String actorName,
            String actorEmail,
            String actorRole,
            String action,
            String module,
            String entityType,
            String entityId,
            String entityName,
            String assetCategory,
            String assetName,
            String assetBrand,
            String assetModel,
            String assetTag,
            String assetSerialNumber,
            String assetSpecifications,
            String employeeName,
            String oldValue,
            String newValue,
            String details,
            String result,
            String ipAddress,
            String userAgent
    ) {
        this.actorUserId = actorUserId;
        this.actorName = actorName;
        this.actorEmail = actorEmail;
        this.actorRole = actorRole;
        this.action = action;
        this.module = module;
        this.entityType = entityType;
        this.entityId = entityId;
        this.entityName = entityName;
        this.assetCategory = assetCategory;
        this.assetName = assetName;
        this.assetBrand = assetBrand;
        this.assetModel = assetModel;
        this.assetTag = assetTag;
        this.assetSerialNumber = assetSerialNumber;
        this.assetSpecifications = assetSpecifications;
        this.employeeName = employeeName;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.details = details;
        this.result = result;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getActorUserId() {
        return actorUserId;
    }

    public String getActorName() {
        return actorName;
    }

    public String getActorEmail() {
        return actorEmail;
    }

    public String getActorRole() {
        return actorRole;
    }

    public String getAction() {
        return action;
    }

    public String getModule() {
        return module;
    }

    public String getEntityType() {
        return entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public String getEntityName() {
        return entityName;
    }

    public String getAssetCategory() {
        return assetCategory;
    }

    public String getAssetName() {
        return assetName;
    }

    public String getAssetBrand() {
        return assetBrand;
    }

    public String getAssetModel() {
        return assetModel;
    }

    public String getAssetTag() {
        return assetTag;
    }

    public String getAssetSerialNumber() {
        return assetSerialNumber;
    }

    public String getAssetSpecifications() {
        return assetSpecifications;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public String getOldValue() {
        return oldValue;
    }

    public String getNewValue() {
        return newValue;
    }

    public String getDetails() {
        return details;
    }

    public String getResult() {
        return result;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
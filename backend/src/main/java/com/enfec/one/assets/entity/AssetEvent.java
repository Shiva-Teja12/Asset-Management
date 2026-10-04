package com.enfec.one.assets.entity;

import com.enfec.one.assets.enums.AssetStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "asset_events")
public class AssetEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID assetId;

    @Enumerated(EnumType.STRING)
    private AssetStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssetStatus newStatus;

    @Column(nullable = false, length = 200)
    private String actor;

    @Column(length = 1000)
    private String reason;

    @Column(nullable = false)
    private Instant occurredAt;

    protected AssetEvent() {
    }

    public AssetEvent(
            UUID assetId,
            AssetStatus previousStatus,
            AssetStatus newStatus,
            String actor,
            String reason
    ) {
        this.assetId = assetId;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.actor = actor;
        this.reason = reason;
        this.occurredAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getAssetId() {
        return assetId;
    }

    public AssetStatus getPreviousStatus() {
        return previousStatus;
    }

    public AssetStatus getNewStatus() {
        return newStatus;
    }

    public String getActor() {
        return actor;
    }

    public String getReason() {
        return reason;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }
}
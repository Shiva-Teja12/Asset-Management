package com.enfec.one.assets.entity;

import com.enfec.one.assets.enums.TicketStatus;
import com.enfec.one.assets.enums.TicketType;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "asset_tickets")
public class AssetTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID employeeId;

    @Column(nullable = false, length = 200)
    private String employeeName;

    private UUID assetId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TicketType type;

    @Column(nullable = false, length = 200)
    private String subject;

    @Column(nullable = false, length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TicketStatus status;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant updatedAt;

    protected AssetTicket() {
    }

    public AssetTicket(
            UUID employeeId,
            String employeeName,
            UUID assetId,
            TicketType type,
            String subject,
            String description
    ) {
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.assetId = assetId;
        this.type = type;
        this.subject = subject;
        this.description = description;
        this.status = TicketStatus.OPEN;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public void changeStatus(TicketStatus status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getEmployeeId() {
        return employeeId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public UUID getAssetId() {
        return assetId;
    }

    public TicketType getType() {
        return type;
    }

    public String getSubject() {
        return subject;
    }

    public String getDescription() {
        return description;
    }

    public TicketStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
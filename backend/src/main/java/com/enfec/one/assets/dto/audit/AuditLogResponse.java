package com.enfec.one.assets.dto.audit;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
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
        String userAgent,
        Instant createdAt
) {
}
package com.enfec.one.assets.service;

import com.enfec.one.assets.dto.audit.AuditLogResponse;
import com.enfec.one.assets.entity.AppUser;
import com.enfec.one.assets.entity.Asset;
import com.enfec.one.assets.entity.AuditLog;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.repository.AuditLogRepository;
import com.enfec.one.assets.security.CurrentUser;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;

@Service
public class AuditService {

    private final AuditLogRepository logs;
    private final CurrentUser current;

    public AuditService(
            AuditLogRepository logs,
            CurrentUser current
    ) {
        this.logs = logs;
        this.current = current;
    }

    @Transactional
    public void log(
            AppUser actor,
            String action,
            String module,
            String entityType,
            String entityId,
            String entityName,
            Asset asset,
            String oldValue,
            String newValue,
            String details
    ) {
        save(
                actor,
                action,
                module,
                entityType,
                entityId,
                entityName,
                asset,
                null,
                oldValue,
                newValue,
                details,
                "SUCCESS"
        );
    }

    @Transactional
    public void logWithEmployee(
            AppUser actor,
            String action,
            String module,
            String entityType,
            String entityId,
            String entityName,
            Asset asset,
            String employeeName,
            String oldValue,
            String newValue,
            String details
    ) {
        save(
                actor,
                action,
                module,
                entityType,
                entityId,
                entityName,
                asset,
                employeeName,
                oldValue,
                newValue,
                details,
                "SUCCESS"
        );
    }

    @Transactional(
            propagation = Propagation.REQUIRES_NEW
    )
    public void logFailure(
            AppUser actor,
            String action,
            String module,
            String entityType,
            String entityId,
            String entityName,
            String details
    ) {
        save(
                actor,
                action,
                module,
                entityType,
                entityId,
                entityName,
                null,
                null,
                null,
                null,
                details,
                "FAILED"
        );
    }

    @Transactional(
            propagation = Propagation.REQUIRES_NEW
    )
    public void logFailedLogin(
            String attemptedEmail,
            String details
    ) {
        HttpServletRequest request = getRequest();

        logs.save(
                new AuditLog(
                        null,
                        null,
                        attemptedEmail,
                        null,
                        "LOGIN_FAILED",
                        "SECURITY",
                        "USER",
                        null,
                        attemptedEmail,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        details,
                        "FAILED",
                        getIpAddress(request),
                        request == null
                                ? null
                                : request.getHeader(
                                "User-Agent"
                        )
                )
        );
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> search(
            String user,
            String action,
            String module,
            LocalDate from,
            LocalDate to
    ) {
        current.requireRole(Role.ASSET_ADMIN);

        ZoneId zone =
                ZoneId.systemDefault();

        return logs
                .findAllByOrderByCreatedAtDesc()
                .stream()

                .filter(log ->
                        user == null
                                || user.isBlank()
                                || contains(
                                log.getActorEmail(),
                                user
                        )
                                || contains(
                                log.getActorName(),
                                user
                        )
                )

                .filter(log ->
                        contains(
                                log.getAction(),
                                action
                        )
                )

                .filter(log ->
                        contains(
                                log.getModule(),
                                module
                        )
                )

                .filter(log ->
                        from == null
                                || !log
                                .getCreatedAt()
                                .atZone(zone)
                                .toLocalDate()
                                .isBefore(from)
                )

                .filter(log ->
                        to == null
                                || !log
                                .getCreatedAt()
                                .atZone(zone)
                                .toLocalDate()
                                .isAfter(to)
                )

                .map(this::response)
                .toList();
    }

    @Transactional(readOnly = true)
    public String exportCsv(
            String user,
            String action,
            String module,
            LocalDate from,
            LocalDate to
    ) {
        List<AuditLogResponse> rows =
                search(
                        user,
                        action,
                        module,
                        from,
                        to
                );

        StringBuilder csv =
                new StringBuilder();

        csv.append(
                "Date & Time,"
                        + "User,"
                        + "Role,"
                        + "Action,"
                        + "Module,"
                        + "Entity Type,"
                        + "Entity,"
                        + "Category,"
                        + "Asset Name,"
                        + "Brand,"
                        + "Model,"
                        + "Asset Tag,"
                        + "Serial Number,"
                        + "Specifications,"
                        + "Employee,"
                        + "Old Value,"
                        + "New Value,"
                        + "Details,"
                        + "IP Address,"
                        + "Result\n"
        );

        for (AuditLogResponse row : rows) {

            csv.append(cell(row.createdAt()))
                    .append(',')
                    .append(cell(row.actorEmail()))
                    .append(',')
                    .append(cell(row.actorRole()))
                    .append(',')
                    .append(cell(row.action()))
                    .append(',')
                    .append(cell(row.module()))
                    .append(',')
                    .append(cell(row.entityType()))
                    .append(',')
                    .append(cell(row.entityName()))
                    .append(',')
                    .append(cell(row.assetCategory()))
                    .append(',')
                    .append(cell(row.assetName()))
                    .append(',')
                    .append(cell(row.assetBrand()))
                    .append(',')
                    .append(cell(row.assetModel()))
                    .append(',')
                    .append(cell(row.assetTag()))
                    .append(',')
                    .append(cell(
                            row.assetSerialNumber()
                    ))
                    .append(',')
                    .append(cell(
                            row.assetSpecifications()
                    ))
                    .append(',')
                    .append(cell(
                            row.employeeName()
                    ))
                    .append(',')
                    .append(cell(row.oldValue()))
                    .append(',')
                    .append(cell(row.newValue()))
                    .append(',')
                    .append(cell(row.details()))
                    .append(',')
                    .append(cell(row.ipAddress()))
                    .append(',')
                    .append(cell(row.result()))
                    .append('\n');
        }

        return csv.toString();
    }

    private void save(
            AppUser actor,
            String action,
            String module,
            String entityType,
            String entityId,
            String entityName,
            Asset asset,
            String employeeName,
            String oldValue,
            String newValue,
            String details,
            String result
    ) {
        HttpServletRequest request =
                getRequest();

        AuditLog auditLog =
                new AuditLog(
                        actor == null
                                ? null
                                : actor.getId(),

                        actor == null
                                ? "SYSTEM"
                                : actor.getName(),

                        actor == null
                                ? "SYSTEM"
                                : actor.getEmail(),

                        actor == null
                                ? "SYSTEM"
                                : actor
                                .getRole()
                                .name(),

                        action,
                        module,
                        entityType,
                        entityId,
                        entityName,

                        asset == null
                                ? null
                                : asset.getCategory(),

                        asset == null
                                ? null
                                : asset.getName(),

                        asset == null
                                ? null
                                : asset.getBrand(),

                        asset == null
                                ? null
                                : asset.getModel(),

                        asset == null
                                ? null
                                : asset.getAssetTag(),

                        asset == null
                                ? null
                                : asset.getSerialNumber(),

                        asset == null
                                ? null
                                : asset.getSpecifications(),

                        employeeName,

                        oldValue,
                        newValue,
                        details,
                        result,

                        getIpAddress(request),

                        request == null
                                ? null
                                : request.getHeader(
                                "User-Agent"
                        )
                );

        logs.save(auditLog);
    }

    private boolean contains(
            String value,
            String filter
    ) {
        if (filter == null
                || filter.isBlank()) {
            return true;
        }

        if (value == null) {
            return false;
        }

        return value
                .toLowerCase(Locale.ROOT)
                .contains(
                        filter
                                .trim()
                                .toLowerCase(
                                        Locale.ROOT
                                )
                );
    }

    private String cell(Object value) {

        if (value == null) {
            return "";
        }

        String text =
                String.valueOf(value)
                        .replace(
                                "\"",
                                "\"\""
                        );

        return "\"" + text + "\"";
    }

    private AuditLogResponse response(
            AuditLog log
    ) {
        return new AuditLogResponse(
                log.getId(),
                log.getActorUserId(),
                log.getActorName(),
                log.getActorEmail(),
                log.getActorRole(),
                log.getAction(),
                log.getModule(),
                log.getEntityType(),
                log.getEntityId(),
                log.getEntityName(),
                log.getAssetCategory(),
                log.getAssetName(),
                log.getAssetBrand(),
                log.getAssetModel(),
                log.getAssetTag(),
                log.getAssetSerialNumber(),
                log.getAssetSpecifications(),
                log.getEmployeeName(),
                log.getOldValue(),
                log.getNewValue(),
                log.getDetails(),
                log.getResult(),
                log.getIpAddress(),
                log.getUserAgent(),
                log.getCreatedAt()
        );
    }

    private HttpServletRequest getRequest() {

        if (
                RequestContextHolder
                        .getRequestAttributes()
                        instanceof ServletRequestAttributes attributes
        ) {
            return attributes.getRequest();
        }

        return null;
    }

    private String getIpAddress(
            HttpServletRequest request
    ) {
        if (request == null) {
            return null;
        }

        String forwarded =
                request.getHeader(
                        "X-Forwarded-For"
                );

        if (
                forwarded != null
                        && !forwarded.isBlank()
        ) {
            return forwarded
                    .split(",")[0]
                    .trim();
        }

        return request.getRemoteAddr();
    }
}
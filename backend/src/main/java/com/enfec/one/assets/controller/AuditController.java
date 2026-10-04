package com.enfec.one.assets.controller;

import com.enfec.one.assets.dto.audit.AuditLogResponse;
import com.enfec.one.assets.service.AuditService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/audit-logs")
public class AuditController {

    private final AuditService audit;

    public AuditController(
            AuditService audit
    ) {
        this.audit = audit;
    }

    @GetMapping
    public List<AuditLogResponse> all(
            @RequestParam(required = false)
            String user,

            @RequestParam(required = false)
            String action,

            @RequestParam(required = false)
            String module,

            @RequestParam(required = false)
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate from,

            @RequestParam(required = false)
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate to
    ) {
        return audit.search(
                user,
                action,
                module,
                from,
                to
        );
    }

    @GetMapping(
            value = "/export.csv",
            produces = "text/csv"
    )
    public ResponseEntity<String> export(
            @RequestParam(required = false)
            String user,

            @RequestParam(required = false)
            String action,

            @RequestParam(required = false)
            String module,

            @RequestParam(required = false)
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate from,

            @RequestParam(required = false)
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate to
    ) {
        String csv =
                audit.exportCsv(
                        user,
                        action,
                        module,
                        from,
                        to
                );

        return ResponseEntity
                .ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"audit-logs.csv\""
                )
                .contentType(
                        MediaType.parseMediaType(
                                "text/csv"
                        )
                )
                .body(csv);
    }
}
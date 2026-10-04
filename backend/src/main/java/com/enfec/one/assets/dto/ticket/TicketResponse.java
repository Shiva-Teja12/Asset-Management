package com.enfec.one.assets.dto.ticket; import com.enfec.one.assets.enums.*; import java.time.Instant; import java.util.UUID;
public record TicketResponse(UUID id,UUID employeeId,String employeeName,UUID assetId,TicketType type,String subject,String description,TicketStatus status,Instant createdAt,Instant updatedAt){}

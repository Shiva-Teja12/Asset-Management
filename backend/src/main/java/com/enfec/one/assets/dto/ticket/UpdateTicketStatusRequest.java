package com.enfec.one.assets.dto.ticket; import com.enfec.one.assets.enums.TicketStatus; import jakarta.validation.constraints.*;
public record UpdateTicketStatusRequest(@NotNull TicketStatus status){}

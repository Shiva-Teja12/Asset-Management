package com.enfec.one.assets.dto.ticket; import com.enfec.one.assets.enums.TicketType; import jakarta.validation.constraints.*; import java.util.UUID;
public record CreateTicketRequest(@NotNull TicketType type,UUID assetId,@NotBlank @Size(max=200)String subject,@NotBlank @Size(max=2000)String description){}

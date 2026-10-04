package com.enfec.one.assets.controller;
import com.enfec.one.assets.dto.ticket.*; import com.enfec.one.assets.service.TicketService; import jakarta.validation.Valid; import org.springframework.http.*; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/v1/tickets") public class TicketController {
 private final TicketService service; public TicketController(TicketService s){service=s;}
 @PostMapping ResponseEntity<TicketResponse> create(@Valid @RequestBody CreateTicketRequest r){return ResponseEntity.status(HttpStatus.CREATED).body(service.create(r));}
 @GetMapping("/my") List<TicketResponse> mine(){return service.mine();} @GetMapping List<TicketResponse> all(){return service.all();}
 @PatchMapping("/{id}/status") TicketResponse status(@PathVariable UUID id,@Valid @RequestBody UpdateTicketStatusRequest r){return service.status(id,r);}
}

package com.enfec.one.assets.controller;
import com.enfec.one.assets.dto.auth.*; import com.enfec.one.assets.service.AuthService; import jakarta.validation.Valid; import org.springframework.http.*; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/auth") public class AuthController {
 private final AuthService service; public AuthController(AuthService s){service=s;}
 @PostMapping("/login") AuthResponse login(@Valid @RequestBody LoginRequest r){return service.login(r);}
 @PostMapping("/signup") ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest r){return ResponseEntity.status(HttpStatus.CREATED).body(service.signup(r));}
}

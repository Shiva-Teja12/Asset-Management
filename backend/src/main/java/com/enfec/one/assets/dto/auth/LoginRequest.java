package com.enfec.one.assets.dto.auth;
import jakarta.validation.constraints.*;
public record LoginRequest(@Email @NotBlank String email,@NotBlank String password){}

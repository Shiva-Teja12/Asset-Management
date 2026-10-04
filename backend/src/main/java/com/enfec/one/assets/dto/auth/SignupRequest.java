package com.enfec.one.assets.dto.auth;
import jakarta.validation.constraints.*;
public record SignupRequest(@NotBlank String name,@Email @NotBlank String email,@Size(min=6) String password,String department){}

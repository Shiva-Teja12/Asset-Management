package com.enfec.one.assets.dto.auth;
import com.enfec.one.assets.enums.Role; import java.util.UUID;
public record AuthResponse(String token,UUID userId,String name,String email,Role role,String employeeCode,String department){}

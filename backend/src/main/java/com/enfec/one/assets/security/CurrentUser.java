package com.enfec.one.assets.security;

import com.enfec.one.assets.entity.AppUser;
import com.enfec.one.assets.enums.Role;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {

    public AppUser require() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !(authentication.getPrincipal() instanceof AppUser user)) {

            throw new AccessDeniedException(
                    "Authentication required"
            );
        }

        return user;
    }

    public AppUser requireRole(Role requiredRole) {

        AppUser user = require();

        if (user.getRole() != requiredRole) {
            throw new AccessDeniedException(
                    "You do not have permission to perform this action."
            );
        }

        return user;
    }
}
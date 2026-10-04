package com.enfec.one.assets.security;
import com.enfec.one.assets.repository.AppUserRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;

@Component
public class TokenAuthFilter extends OncePerRequestFilter {
    private final AppUserRepository users;
    public TokenAuthFilter(AppUserRepository users){this.users=users;}
    @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException{
        String h=req.getHeader("Authorization");
        if(h!=null && h.startsWith("Bearer ")){
            users.findByAuthToken(h.substring(7)).ifPresent(u -> {
                var auth=new UsernamePasswordAuthenticationToken(u,null,List.of(() -> "ROLE_"+u.getRole().name()));
                SecurityContextHolder.getContext().setAuthentication(auth);
            });
        }
        chain.doFilter(req,res);
    }
}

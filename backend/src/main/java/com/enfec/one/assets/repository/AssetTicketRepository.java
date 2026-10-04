package com.enfec.one.assets.repository;
import com.enfec.one.assets.entity.AssetTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface AssetTicketRepository extends JpaRepository<AssetTicket,UUID>{
    List<AssetTicket> findAllByOrderByCreatedAtDesc();
    List<AssetTicket> findAllByEmployeeIdOrderByCreatedAtDesc(UUID employeeId);
}

package com.enfec.one.assets.config;

import com.enfec.one.assets.entity.AppUser;
import com.enfec.one.assets.enums.Role;
import com.enfec.one.assets.repository.AppUserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seed(
            AppUserRepository users,
            PasswordEncoder encoder
    ) {

        return args -> {

            /*
             * =================================================
             * ASSET ADMIN
             * =================================================
             *
             * Keeps your existing Asset Admin.
             * Creates it only if it does not already exist.
             */

            if (!users.existsByEmailIgnoreCase(
                    "admin@enfec.local"
            )) {

                AppUser admin =
                        new AppUser(
                                "Admin User",
                                "admin@enfec.local",
                                encoder.encode(
                                        "ChangeMe123!"
                                ),
                                Role.ASSET_ADMIN,
                                null,
                                "IT / Assets"
                        );

                users.save(admin);
            }


            /*
             * =================================================
             * MANAGER - VIKRAM
             * =================================================
             *
             * Ravi already exists as EMPLOYEE,
             * so Vikram is created as the Manager.
             */

            AppUser manager =
                    users
                            .findByEmailIgnoreCase(
                                    "vikram@enfec.local"
                            )
                            .orElse(null);

            if (manager == null) {

                manager =
                        new AppUser(
                                "Vikram",
                                "vikram@enfec.local",
                                encoder.encode(
                                        "ChangeMe123!"
                                ),
                                Role.MANAGER,
                                "MGR-001",
                                "Engineering"
                        );

                manager =
                        users.save(manager);

            } else if (
                    manager.getRole() != Role.MANAGER
            ) {

                throw new IllegalStateException(
                        "vikram@enfec.local already exists "
                                + "but does not have MANAGER role."
                );
            }


            /*
             * =================================================
             * ASSIGN EMPLOYEES TO VIKRAM
             * =================================================
             *
             * All existing EMPLOYEE users whose manager
             * is currently NULL will be assigned to Vikram.
             *
             * Existing manager relationships will NOT
             * be overwritten.
             */

            List<AppUser> employees =
                    users.findAllByRoleOrderByNameAsc(
                            Role.EMPLOYEE
                    );

            List<AppUser> employeesToUpdate =
                    new ArrayList<>();

            for (AppUser employee : employees) {

                if (employee.getManager() == null) {

                    employee.setManager(
                            manager
                    );

                    employeesToUpdate.add(
                            employee
                    );
                }
            }

            if (!employeesToUpdate.isEmpty()) {

                users.saveAll(
                        employeesToUpdate
                );
            }
        };
    }
}
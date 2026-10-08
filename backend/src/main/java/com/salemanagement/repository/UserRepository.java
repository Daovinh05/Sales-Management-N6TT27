package com.salemanagement.repository;

import com.salemanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByUsernameAndIdNot(String username, Long id);
    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Long id);

    @Query("select count(distinct u) from User u join u.roles r where r.name = :roleName")
    long countByRoleName(@Param("roleName") com.salemanagement.enums.ERole roleName);

    @Query("select distinct u from User u join u.roles r where r.name = :roleName")
    java.util.List<User> findByRoleName(@Param("roleName") com.salemanagement.enums.ERole roleName);

    @Query(value = "select distinct u from User u join u.roles r where r.name = :roleName " +
           "and (:name is null or lower(u.fullName) like lower(concat('%', :name, '%'))) " +
           "and (:email is null or lower(u.email) like lower(concat('%', :email, '%')))",
           countQuery = "select count(distinct u) from User u join u.roles r where r.name = :roleName " +
           "and (:name is null or lower(u.fullName) like lower(concat('%', :name, '%'))) " +
           "and (:email is null or lower(u.email) like lower(concat('%', :email, '%')))")
    org.springframework.data.domain.Page<User> findByRoleNameAndFilters(
            @Param("roleName") com.salemanagement.enums.ERole roleName,
            @Param("name") String name,
            @Param("email") String email,
            org.springframework.data.domain.Pageable pageable);
}

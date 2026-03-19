package com.nest.nestapp.repository;

import com.nest.nestapp.model.Apartment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ApartmentRepository extends JpaRepository<Apartment, UUID> {
    List<Apartment> findBySearchId(UUID searchId);

    List<Apartment> findTop200ByExpiresAtAfterOrderByCreatedAtDesc(OffsetDateTime expiresAt);

    @Query("SELECT a.id FROM Apartment a WHERE a.expiresAt < :cutoff")
    List<UUID> findIdsByExpiresAtBefore(@Param("cutoff") OffsetDateTime cutoff);

    @Modifying
    @Query("DELETE FROM Apartment a WHERE a.expiresAt < :cutoff")
    int deleteByExpiresAtBefore(@Param("cutoff") OffsetDateTime cutoff);
}

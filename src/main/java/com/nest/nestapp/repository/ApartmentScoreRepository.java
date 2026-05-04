package com.nest.nestapp.repository;

import com.nest.nestapp.model.ApartmentScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ApartmentScoreRepository extends JpaRepository<ApartmentScore, UUID> {

    @Query("SELECT s FROM ApartmentScore s WHERE s.searchId = :searchId ORDER BY s.finalScore DESC")
    List<ApartmentScore> findBySearchIdOrderByFinalScoreDesc(@Param("searchId") UUID searchId);

    boolean existsBySearchId(UUID searchId);

    List<ApartmentScore> findTop20BySearchIdOrderByFinalScoreDesc(UUID searchId);

    @Modifying
    @Query("DELETE FROM ApartmentScore s WHERE s.apartmentId IN :apartmentIds")
    int deleteByApartmentIdIn(@Param("apartmentIds") List<UUID> apartmentIds);
}

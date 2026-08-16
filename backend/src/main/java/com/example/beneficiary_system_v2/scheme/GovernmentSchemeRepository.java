package com.example.beneficiary_system_v2.scheme;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GovernmentSchemeRepository extends JpaRepository<GovernmentScheme, Long> {

    boolean existsBySchemeName(String schemeName);

    boolean existsBySchemeNameIgnoreCase(String schemeName);

    long countBySource(String source);

    GovernmentScheme findBySchemeNameIgnoreCase(String schemeName);

    List<GovernmentScheme> findByActive(boolean active);

    List<GovernmentScheme> findByCategory(String category);

    List<GovernmentScheme> findByActiveAndCategory(boolean active, String category);

    List<GovernmentScheme> findByVerifiedFalse();

    List<GovernmentScheme> findByActiveTrue();
}

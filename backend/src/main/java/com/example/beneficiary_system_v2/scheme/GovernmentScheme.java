package com.example.beneficiary_system_v2.scheme;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "government_schemes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GovernmentScheme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String schemeName;

    private String category;

    @Lob
    private String description;

    @Lob
    private String benefits;

    @Lob
    private String eligibility;

    @Lob
    private String documentsRequired;

    private String officialLink;
    private String applicationLink;
    private String state;
    private String department;

    @Lob
    private String keywords;

    private String status;
    private LocalDate launchDate;
    private Integer eligibilityScore;
    private Boolean active;
    private Long recommendationCount;
    private LocalDateTime lastUpdated;
}

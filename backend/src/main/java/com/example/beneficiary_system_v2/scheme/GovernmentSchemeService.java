package com.example.beneficiary_system_v2.scheme;

import org.springframework.data.domain.Example;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class GovernmentSchemeService {

    private final GovernmentSchemeRepository repository;

    public GovernmentSchemeService(GovernmentSchemeRepository repository) {
        this.repository = repository;
    }

    public GovernmentScheme create(SchemeRequest req) {
        if (repository.existsBySchemeName(req.schemeName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A scheme with name '" + req.schemeName() + "' already exists.");
        }
        LocalDateTime now = LocalDateTime.now();
        GovernmentScheme scheme = GovernmentScheme.builder()
                .schemeName(req.schemeName())
                .category(req.category())
                .description(req.description())
                .benefits(req.benefits())
                .eligibility(req.eligibility())
                .documentsRequired(req.documentsRequired())
                .officialLink(req.officialLink())
                .applicationLink(req.applicationLink())
                .state(req.state())
                .department(req.department())
                .keywords(req.keywords())
                .status(req.status() != null ? req.status() : "OPEN")
                .launchDate(req.launchDate())
                .eligibilityScore(req.eligibilityScore())
                .active(req.active() != null ? req.active() : true)
                .recommendationCount(req.recommendationCount() != null ? req.recommendationCount() : 0L)
                .lastUpdated(now)
                .source("MANUAL")
                .verified(true)
                .build();
        return repository.save(scheme);
    }

    public GovernmentScheme update(Long id, SchemeRequest req) {
        GovernmentScheme scheme = findOrThrow(id);
        // If schemeName is changing, check uniqueness
        if (!scheme.getSchemeName().equals(req.schemeName()) && repository.existsBySchemeName(req.schemeName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A scheme with name '" + req.schemeName() + "' already exists.");
        }
        scheme.setSchemeName(req.schemeName());
        scheme.setCategory(req.category());
        scheme.setDescription(req.description());
        scheme.setBenefits(req.benefits());
        scheme.setEligibility(req.eligibility());
        scheme.setDocumentsRequired(req.documentsRequired());
        scheme.setOfficialLink(req.officialLink());
        scheme.setApplicationLink(req.applicationLink());
        scheme.setState(req.state());
        scheme.setDepartment(req.department());
        scheme.setKeywords(req.keywords());
        scheme.setStatus(req.status());
        scheme.setLaunchDate(req.launchDate());
        scheme.setEligibilityScore(req.eligibilityScore());
        if (req.active() != null) scheme.setActive(req.active());
        if (req.recommendationCount() != null) scheme.setRecommendationCount(req.recommendationCount());
        scheme.setLastUpdated(LocalDateTime.now());
        return repository.save(scheme);
    }

    public GovernmentScheme setActive(Long id, boolean active) {
        GovernmentScheme scheme = findOrThrow(id);
        scheme.setActive(active);
        scheme.setLastUpdated(LocalDateTime.now());
        return repository.save(scheme);
    }

    public GovernmentScheme verify(Long id) {
        GovernmentScheme scheme = findOrThrow(id);
        scheme.setVerified(true);
        scheme.setLastUpdated(LocalDateTime.now());
        return repository.save(scheme);
    }

    public List<GovernmentScheme> list(Boolean active, String category) {
        if (active == null && category == null) {
            return repository.findAll();
        }
        if (active != null && category != null) {
            return repository.findByActiveAndCategory(active, category);
        }
        if (active != null) {
            return repository.findByActive(active);
        }
        return repository.findByCategory(category);
    }

    public List<GovernmentScheme> pendingReview() {
        return repository.findByVerifiedFalse();
    }

    private GovernmentScheme findOrThrow(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Scheme " + id + " not found."));
    }
}

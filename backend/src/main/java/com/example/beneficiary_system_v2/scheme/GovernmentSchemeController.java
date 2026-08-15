package com.example.beneficiary_system_v2.scheme;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/schemes")
public class GovernmentSchemeController {

    private final GovernmentSchemeRepository governmentSchemeRepository;

    public GovernmentSchemeController(GovernmentSchemeRepository governmentSchemeRepository) {
        this.governmentSchemeRepository = governmentSchemeRepository;
    }

    @GetMapping
    public List<GovernmentScheme> getAllSchemes() {
        return governmentSchemeRepository.findAll();
    }
}

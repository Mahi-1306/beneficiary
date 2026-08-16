package com.example.beneficiary_system_v2.scheme;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/schemes")
public class AdminSchemeController {

    private final GovernmentSchemeService schemeService;
    private final SchemeImportService importService;

    public AdminSchemeController(GovernmentSchemeService schemeService, SchemeImportService importService) {
        this.schemeService = schemeService;
        this.importService = importService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GovernmentScheme create(@Valid @RequestBody SchemeRequest request) {
        return schemeService.create(request);
    }

    @PutMapping("/{id}")
    public GovernmentScheme update(@PathVariable Long id, @Valid @RequestBody SchemeRequest request) {
        return schemeService.update(id, request);
    }

    @PatchMapping("/{id}/deactivate")
    public GovernmentScheme deactivate(@PathVariable Long id) {
        return schemeService.setActive(id, false);
    }

    @PatchMapping("/{id}/activate")
    public GovernmentScheme activate(@PathVariable Long id) {
        return schemeService.setActive(id, true);
    }

    @PatchMapping("/{id}/verify")
    public GovernmentScheme verify(@PathVariable Long id) {
        return schemeService.verify(id);
    }

    @GetMapping
    public List<GovernmentScheme> list(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String category) {
        return schemeService.list(active, category);
    }

    @GetMapping("/pending-review")
    public List<GovernmentScheme> pendingReview() {
        return schemeService.pendingReview();
    }

    // TODO: secure this endpoint
    @PostMapping("/import")
    public ImportResult importSchemes(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file is empty.");
        }
        try {
            return importService.importFromFile(file);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Import failed: " + e.getMessage());
        }
    }
}

package com.example.beneficiary_system_v2.scheme;

import org.springframework.core.io.ClassPathResource;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;

/**
 * Wraps a ClassPathResource as a MultipartFile so the seed runner can call
 * SchemeImportService without pulling in the test-scoped MockMultipartFile.
 */
class ClassPathMultipartFile implements MultipartFile {

    private final ClassPathResource resource;

    ClassPathMultipartFile(ClassPathResource resource) {
        this.resource = resource;
    }

    @Override public String getName() { return resource.getFilename(); }
    @Override public String getOriginalFilename() { return resource.getFilename(); }
    @Override public String getContentType() { return "text/csv"; }
    @Override public boolean isEmpty() { return false; }

    @Override
    public long getSize() {
        try { return resource.contentLength(); } catch (IOException e) { return -1; }
    }

    @Override
    public byte[] getBytes() throws IOException { return resource.getInputStream().readAllBytes(); }

    @Override
    public InputStream getInputStream() throws IOException { return resource.getInputStream(); }

    @Override
    public void transferTo(File dest) throws IOException {
        try (var in = getInputStream(); var out = new java.io.FileOutputStream(dest)) {
            in.transferTo(out);
        }
    }
}

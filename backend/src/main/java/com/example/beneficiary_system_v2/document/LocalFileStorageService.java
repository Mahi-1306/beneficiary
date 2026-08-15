package com.example.beneficiary_system_v2.document;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class LocalFileStorageService {

    private final Path uploadDirectory;

    public LocalFileStorageService(@Value("${app.uploads.directory}") String uploadDirectory) {
        this.uploadDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize();
    }

    public Path store(MultipartFile file, Long documentId) throws IOException {
        Files.createDirectories(uploadDirectory);
        String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename());
        if (originalName.contains("..")) {
            throw new IOException("Invalid file name.");
        }

        Path target = uploadDirectory.resolve(documentId + "_" + originalName).normalize();
        if (!target.startsWith(uploadDirectory)) {
            throw new IOException("Invalid file storage path.");
        }
        file.transferTo(target);
        return target;
    }
}

package com.example.beneficiary_system_v2.document;

import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Path;

@Service
public class OcrService {

    private final String tessdataPath;

    public OcrService(@Value("${app.ocr.tessdata-path}") String tessdataPath) {
        this.tessdataPath = tessdataPath;
    }

    public String extractText(Path filePath, String fileType) throws IOException, TesseractException {
        if ("application/pdf".equalsIgnoreCase(fileType)
                || filePath.getFileName().toString().toLowerCase().endsWith(".pdf")) {
            return extractPdfText(filePath);
        }

        BufferedImage image = ImageIO.read(filePath.toFile());
        if (image == null) {
            throw new IOException("The uploaded file is not a supported image or PDF.");
        }
        return createTesseract().doOCR(image).trim();
    }

    private String extractPdfText(Path filePath) throws IOException, TesseractException {
        StringBuilder extractedText = new StringBuilder();
        try (PDDocument pdf = Loader.loadPDF(filePath.toFile())) {
            PDFRenderer renderer = new PDFRenderer(pdf);
            for (int page = 0; page < pdf.getNumberOfPages(); page++) {
                BufferedImage pageImage = renderer.renderImageWithDPI(page, 300, ImageType.RGB);
                String pageText = createTesseract().doOCR(pageImage).trim();
                if (!pageText.isEmpty()) {
                    if (!extractedText.isEmpty()) {
                        extractedText.append(System.lineSeparator());
                    }
                    extractedText.append(pageText);
                }
            }
        }
        return extractedText.toString();
    }

    private ITesseract createTesseract() {
        ITesseract tesseract = new Tesseract();
        tesseract.setDatapath(tessdataPath);
        tesseract.setLanguage("eng");
        return tesseract;
    }
}

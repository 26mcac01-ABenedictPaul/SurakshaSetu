package com.surakshasetu.model;

/** One piece of digital evidence attached to a complaint (screenshot, receipt, email, ...). */
public class EvidenceFile {

    private String id;            // random id used in download links
    private String originalName;  // sanitised name the citizen uploaded
    private String storedName;    // random name on disk (never the citizen's file name)
    private String contentType;
    private long size;
    private String uploadedAt;

    public EvidenceFile() { }

    public EvidenceFile(String id, String originalName, String storedName, String contentType, long size, String uploadedAt) {
        this.id = id;
        this.originalName = originalName;
        this.storedName = storedName;
        this.contentType = contentType;
        this.size = size;
        this.uploadedAt = uploadedAt;
    }

    public String getId() { return id; }
    public String getOriginalName() { return originalName; }
    public String getStoredName() { return storedName; }
    public String getContentType() { return contentType; }
    public long getSize() { return size; }
    public String getUploadedAt() { return uploadedAt; }
}

package com.surakshasetu.servlet;

import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import com.google.gson.reflect.TypeToken;
import com.surakshasetu.exception.InvalidComplaintDataException;
import com.surakshasetu.model.Complaint;
import com.surakshasetu.model.EvidenceFile;
import com.surakshasetu.model.User;
import com.surakshasetu.util.Api;
import com.surakshasetu.util.EmailService;
import com.surakshasetu.util.JsonStorage;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

/**
 * The full "File a case" form (multipart).
 *
 * POST /api/case  -> citizen files a complaint with incident details, optional financial details and evidence files.
 * GET  /api/case?complaintId=N&file=ID -> download one evidence file (owner, assigned officer or admin only).
 *
 * Uploads are validated on the server (the browser checks are only a convenience): file type by extension AND
 * by its first bytes, size, count, and empty files. Files are stored under data/evidence/<caseId>/ with a random
 * name, and are served back as attachments with X-Content-Type-Options: nosniff.
 */
@WebServlet("/api/case")
@MultipartConfig(fileSizeThreshold = 1024 * 1024, maxFileSize = 5L * 1024 * 1024, maxRequestSize = 32L * 1024 * 1024)
public class CaseServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    private static final List<String> CATEGORIES =
            Arrays.asList("Theft", "Cybercrime", "Assault", "Missing Person", "Harassment", "Murder", "Fraud");
    private static final List<String> PAYMENT_METHODS =
            Arrays.asList("UPI", "Debit card", "Credit card", "Net banking", "Wallet", "Cash / in person", "Cheque", "Other");
    private static final List<String> ALLOWED_EXT =
            Arrays.asList("jpg", "jpeg", "png", "webp", "gif", "pdf", "eml", "txt", "csv", "docx", "xlsx");

    public static final int MAX_FILES = 6;
    public static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final Path EVIDENCE_ROOT = Paths.get("data", "evidence");
    private static final Type USERS = new TypeToken<List<User>>() {}.getType();
    private static final Type COMPLAINTS = new TypeToken<List<Complaint>>() {}.getType();

    /* ------------------------------------------------------------------ POST: file the case */

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        if (!Api.require(req, resp, "user")) return;

        String category = Api.clean(req.getParameter("category"));
        String description = Api.clean(req.getParameter("description"));
        String incidentDate = Api.clean(req.getParameter("incidentDate"));
        String incidentTime = Api.clean(req.getParameter("incidentTime"));
        String platform = limit(Api.clean(req.getParameter("platform")), 80);
        String identifiers = limit(Api.clean(req.getParameter("identifiers")), 400);
        String location = limit(Api.clean(req.getParameter("location")), 300);
        String city = limit(Api.clean(req.getParameter("city")), 80);
        String state = limit(Api.clean(req.getParameter("state")), 80);
        String jurisdiction = limit(Api.clean(req.getParameter("jurisdiction")), 120);
        boolean hasLoss = "yes".equals(req.getParameter("hasLoss"));

        // ---- validate the incident ----
        if (!CATEGORIES.contains(category)) { bad(resp, "Please choose a valid case type."); return; }
        if (description.length() < 10) { bad(resp, "Please describe what happened (at least 10 characters)."); return; }
        if (description.length() > 4000) { bad(resp, "The description is too long (max 4000 characters)."); return; }
        LocalDate date;
        try { date = LocalDate.parse(incidentDate); }
        catch (Exception e) { bad(resp, "Please enter the date of the incident."); return; }
        if (date.isAfter(LocalDate.now())) { bad(resp, "The incident date cannot be in the future."); return; }
        if (!incidentTime.isEmpty()) {
            try {
                LocalTime t = LocalTime.parse(incidentTime);
                if (date.equals(LocalDate.now()) && t.isAfter(LocalTime.now().plusMinutes(5))) {
                    bad(resp, "The incident time cannot be in the future."); return;
                }
            } catch (Exception e) { bad(resp, "The incident time is not valid."); return; }
        }
        if (location.length() < 3) { bad(resp, "Please tell us where it happened."); return; }
        if (!"yes".equals(req.getParameter("confirm"))) { bad(resp, "Please confirm the declaration before submitting."); return; }

        // ---- validate the financial part (only when the citizen lost money) ----
        Map<String, String> financial = new LinkedHashMap<>();
        if (hasLoss) {
            String amount = Api.clean(req.getParameter("amountLost")).replace(",", "");
            String method = Api.clean(req.getParameter("paymentMethod"));
            String txnDate = Api.clean(req.getParameter("transactionDate"));
            BigDecimal amt;
            try { amt = new BigDecimal(amount); }
            catch (Exception e) { bad(resp, "Please enter the amount lost as a number."); return; }
            if (amt.signum() <= 0 || amt.compareTo(new BigDecimal("1000000000")) > 0) {
                bad(resp, "Please enter a valid amount lost."); return;
            }
            if (!PAYMENT_METHODS.contains(method)) { bad(resp, "Please choose how the payment was made."); return; }
            if (!txnDate.isEmpty()) {
                try { if (LocalDate.parse(txnDate).isAfter(LocalDate.now())) { bad(resp, "The transaction date cannot be in the future."); return; } }
                catch (Exception e) { bad(resp, "The transaction date is not valid."); return; }
            }
            financial.put("amountLost", amt.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString());
            financial.put("paymentMethod", method);
            financial.put("bankName", limit(Api.clean(req.getParameter("bankName")), 120));
            financial.put("transactionRef", limit(Api.clean(req.getParameter("transactionRef")), 80));
            financial.put("transactionDate", txnDate);
            financial.put("beneficiary", limit(Api.clean(req.getParameter("beneficiary")), 200));
        }

        // ---- validate the evidence files before anything is saved ----
        List<Part> parts = new ArrayList<>();
        try {
            for (Part p : req.getParts()) {
                if ("evidence".equals(p.getName()) && p.getSubmittedFileName() != null && !p.getSubmittedFileName().isEmpty()) parts.add(p);
            }
        } catch (IllegalStateException e) {
            bad(resp, "The upload is too large. Each file can be up to 5 MB."); return;
        }
        if (parts.size() > MAX_FILES) { bad(resp, "You can attach at most " + MAX_FILES + " files."); return; }

        List<Object[]> accepted = new ArrayList<>();           // {name, ext, bytes, contentType}
        List<Map<String, Object>> rejected = new ArrayList<>();
        for (Part p : parts) {
            String name = safeName(p.getSubmittedFileName());
            String problem = null;
            byte[] data = null;
            String ext = extOf(name);
            if (!ALLOWED_EXT.contains(ext)) problem = "This file type is not allowed.";
            else if (p.getSize() == 0) problem = "The file is empty.";
            else if (p.getSize() > MAX_BYTES) problem = "The file is larger than 5 MB.";
            else {
                try (InputStream in = p.getInputStream()) { data = in.readNBytes((int) MAX_BYTES + 1); }
                if (data.length > MAX_BYTES) problem = "The file is larger than 5 MB.";
                else problem = contentProblem(ext, data);
            }
            if (problem != null) {
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("name", name); r.put("reason", problem);
                rejected.add(r);
            } else {
                accepted.add(new Object[] { name, ext, data, contentTypeOf(ext) });
            }
        }

        // ---- file the case ----
        final Complaint filed;
        List<Map<String, Object>> attached = new ArrayList<>();
        try {
            synchronized (Api.LOCK) {
                filed = Api.SERVICE.fileComplaint(Api.id(req), category, description);

                Map<String, String> details = new LinkedHashMap<>();
                details.put("incidentDate", incidentDate);
                details.put("incidentTime", incidentTime);
                details.put("platform", platform);
                details.put("identifiers", identifiers);
                details.put("location", location);
                details.put("city", city);
                details.put("state", state);
                details.put("jurisdiction", jurisdiction);
                filed.setDetails(details);
                filed.setFinancial(financial);

                List<EvidenceFile> saved = new ArrayList<>();
                if (!accepted.isEmpty()) {
                    Path dir = EVIDENCE_ROOT.resolve(String.valueOf(filed.getComplaintId()));
                    Files.createDirectories(dir);
                    for (Object[] a : accepted) {
                        String id = UUID.randomUUID().toString().replace("-", "");
                        String stored = id + "." + a[1];
                        Files.write(dir.resolve(stored), (byte[]) a[2]);
                        saved.add(new EvidenceFile(id, (String) a[0], stored, (String) a[3], ((byte[]) a[2]).length, LocalDateTime.now().toString()));
                        Map<String, Object> r = new LinkedHashMap<>();
                        r.put("name", a[0]); r.put("size", ((byte[]) a[2]).length);
                        attached.add(r);
                    }
                }
                filed.setEvidence(saved);

                // persist the extra fields on the stored complaint
                List<Complaint> all = JsonStorage.readList("complaints.json", COMPLAINTS);
                for (int i = 0; i < all.size(); i++) {
                    if (all.get(i).getComplaintId() == filed.getComplaintId()) { all.set(i, filed); break; }
                }
                JsonStorage.writeList("complaints.json", all);
            }
        } catch (InvalidComplaintDataException e) {
            bad(resp, e.getMessage()); return;
        } catch (Exception e) {
            Api.send(resp, 500, Api.msg("error", "Server error: " + e.getMessage())); return;
        }

        // confirmation email in the background so the page never waits for SMTP
        for (User u : JsonStorage.<User>readList("users.json", USERS)) {
            if (u.getUserId() == filed.getUserId() && u.getEmail() != null && !u.getEmail().isBlank()) {
                final User owner = u;
                new Thread(() -> EmailService.sendComplaintConfirmation(owner.getEmail(), owner.getUsername(), filed)).start();
                break;
            }
        }

        Map<String, Object> m = Api.msg("success", "Your complaint has been filed. Reference " + filed.getReferenceNo() + ".");
        m.put("complaintId", filed.getComplaintId());
        m.put("referenceNo", filed.getReferenceNo());
        m.put("severity", filed.getSeverity());
        m.put("attached", attached);
        m.put("rejected", rejected);
        Api.send(resp, 201, m);
    }

    /* ------------------------------------------------------------------ GET: download evidence */

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!Api.require(req, resp, null)) return;
        int caseId;
        try { caseId = Integer.parseInt(Api.clean(req.getParameter("complaintId"))); }
        catch (Exception e) { Api.send(resp, 400, Api.msg("error", "Missing case id.")); return; }
        String fileId = Api.clean(req.getParameter("file"));

        Complaint c = null;
        for (Complaint x : Api.SERVICE.getAllComplaints()) if (x.getComplaintId() == caseId) { c = x; break; }
        if (c == null) { Api.send(resp, 404, Api.msg("error", "Case not found.")); return; }

        String role = Api.role(req);
        int me = Api.id(req);
        boolean allowed = "admin".equals(role)
                || ("user".equals(role) && c.getUserId() == me)
                || ("officer".equals(role) && c.getAssignedOfficerId() != null && c.getAssignedOfficerId() == me);
        if (!allowed) { Api.send(resp, 403, Api.msg("error", "You are not allowed to open this file.")); return; }

        EvidenceFile f = null;
        for (EvidenceFile e : c.getEvidence()) if (e.getId().equals(fileId)) { f = e; break; }
        if (f == null) { Api.send(resp, 404, Api.msg("error", "File not found.")); return; }

        Path p = EVIDENCE_ROOT.resolve(String.valueOf(caseId)).resolve(f.getStoredName()).normalize();
        if (!p.startsWith(EVIDENCE_ROOT.resolve(String.valueOf(caseId)).normalize()) || !Files.isRegularFile(p)) {
            Api.send(resp, 404, Api.msg("error", "File not found.")); return;
        }
        resp.setContentType(f.getContentType());
        resp.setHeader("X-Content-Type-Options", "nosniff");
        resp.setHeader("Cache-Control", "private, no-store");
        resp.setHeader("Content-Disposition", "attachment; filename=\"" + f.getOriginalName().replace("\"", "") + "\"");
        resp.setContentLengthLong(Files.size(p));
        Files.copy(p, resp.getOutputStream());
    }

    /* ------------------------------------------------------------------ helpers */

    private static void bad(HttpServletResponse resp, String message) throws IOException {
        Api.send(resp, 400, Api.msg("error", message));
    }

    private static String limit(String s, int max) { return s.length() > max ? s.substring(0, max) : s; }

    /** Keeps only the file name (no folders) and drops control characters and quotes. */
    private static String safeName(String raw) {
        String n = raw == null ? "file" : raw.replace('\\', '/');
        n = n.substring(n.lastIndexOf('/') + 1).replaceAll("[\\p{Cntrl}\"<>:|?*]", "_").trim();
        if (n.isEmpty()) n = "file";
        return n.length() > 100 ? n.substring(n.length() - 100) : n;
    }

    private static String extOf(String name) {
        int i = name.lastIndexOf('.');
        return i < 0 ? "" : name.substring(i + 1).toLowerCase(Locale.ROOT);
    }

    private static String contentTypeOf(String ext) {
        switch (ext) {
            case "jpg": case "jpeg": return "image/jpeg";
            case "png": return "image/png";
            case "webp": return "image/webp";
            case "gif": return "image/gif";
            case "pdf": return "application/pdf";
            case "eml": return "message/rfc822";
            case "csv": return "text/csv";
            case "txt": return "text/plain";
            case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "xlsx": return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            default: return "application/octet-stream";
        }
    }

    /** Checks that the file really is what its extension says. Returns a reason, or null when it is fine. */
    private static String contentProblem(String ext, byte[] d) {
        switch (ext) {
            case "jpg": case "jpeg":
                return d.length > 3 && (d[0] & 0xFF) == 0xFF && (d[1] & 0xFF) == 0xD8 && (d[2] & 0xFF) == 0xFF ? null : "This is not a valid JPEG image.";
            case "png":
                return d.length > 8 && (d[0] & 0xFF) == 0x89 && d[1] == 'P' && d[2] == 'N' && d[3] == 'G' ? null : "This is not a valid PNG image.";
            case "gif":
                return d.length > 6 && d[0] == 'G' && d[1] == 'I' && d[2] == 'F' && d[3] == '8' ? null : "This is not a valid GIF image.";
            case "webp":
                return d.length > 12 && d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F' && d[8] == 'W' && d[9] == 'E' && d[10] == 'B' && d[11] == 'P' ? null : "This is not a valid WebP image.";
            case "pdf":
                return d.length > 5 && d[0] == '%' && d[1] == 'P' && d[2] == 'D' && d[3] == 'F' ? null : "This is not a valid PDF.";
            case "docx": case "xlsx":
                return d.length > 4 && d[0] == 'P' && d[1] == 'K' && d[2] == 3 && d[3] == 4 ? null : "This is not a valid Office document.";
            default: { // eml, txt, csv: must be text
                int n = Math.min(d.length, 4096);
                for (int i = 0; i < n; i++) if (d[i] == 0) return "This does not look like a text file.";
                return new String(d, 0, n, StandardCharsets.UTF_8).isEmpty() ? "The file is empty." : null;
            }
        }
    }
}

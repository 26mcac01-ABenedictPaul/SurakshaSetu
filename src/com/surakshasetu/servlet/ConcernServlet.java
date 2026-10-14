package com.surakshasetu.servlet;

import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import com.google.gson.reflect.TypeToken;
import com.surakshasetu.model.EvidenceFile;
import com.surakshasetu.model.Officer;
import com.surakshasetu.model.User;
import com.surakshasetu.util.Api;
import com.surakshasetu.util.JsonStorage;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

/**
 * "Report a concern": a fast incident alert (accident, fight, quarrel, fire, suspicious activity...) with photos,
 * short videos and voice notes taken on the spot.
 *
 * POST /api/concern (multipart)  type, description, location, lat, lng, occurredAt, danger, media (0-5 files)  -> citizen
 * POST /api/concern action=status concernId, status, note                                                    -> officer / admin
 * GET  /api/concern                  -> citizen: own | officer: concerns from their city | admin: all
 * GET  /api/concern?id=N&file=ID     -> stream one media file inline (owner, officer of that city, admin)
 *
 * Every file is checked on the server: allowed type, size limit per kind, and the file's first bytes must match
 * its extension. Only image/audio/video content types are ever served back, with X-Content-Type-Options: nosniff.
 */
@WebServlet("/api/concern")
@MultipartConfig(fileSizeThreshold = 1024 * 1024, maxFileSize = 26L * 1024 * 1024, maxRequestSize = 70L * 1024 * 1024)
public class ConcernServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final Type CONCERNS = new TypeToken<List<Concern>>() {}.getType();
    private static final Type USERS = new TypeToken<List<User>>() {}.getType();
    private static final Type OFFICERS = new TypeToken<List<Officer>>() {}.getType();
    private static final String FILE = "concerns.json";
    private static final Path ROOT = Paths.get("data", "concerns");

    public static final int MAX_FILES = 5;
    private static final long MAX_IMAGE = 5L << 20, MAX_AUDIO = 10L << 20, MAX_VIDEO = 25L << 20;

    private static final List<String> TYPES = Arrays.asList("Accident", "Fight", "Quarrel / argument", "Fire or smoke", "Suspicious activity", "Other");
    private static final List<String> STATUSES = Arrays.asList("Reported", "Acknowledged", "Help dispatched", "Closed");
    private static final List<String> IMAGE_EXT = Arrays.asList("jpg", "jpeg", "png", "webp", "gif");
    private static final List<String> VIDEO_EXT = Arrays.asList("mp4", "webm", "mov");
    private static final List<String> AUDIO_EXT = Arrays.asList("m4a", "mp3", "ogg", "wav", "weba", "webm", "mp4");

    public static class Concern {
        int concernId;
        String reference;
        int userId;
        String reporter;
        String city;
        String type;
        String description;
        String location;
        Double lat;
        Double lng;
        String occurredAt;
        boolean danger;
        String priority;
        String status;
        String statusNote;
        List<EvidenceFile> media = new ArrayList<>();
        String createdAt;
    }

    /* ------------------------------------------------------------------ POST */

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        if (!Api.require(req, resp, null)) return;
        if ("status".equals(req.getParameter("action"))) { updateStatus(req, resp); return; }
        if (!"user".equals(Api.role(req))) { Api.send(resp, 403, Api.msg("error", "Only citizens can report a concern.")); return; }

        String type = Api.clean(req.getParameter("type"));
        String description = Api.clean(req.getParameter("description"));
        String location = Api.clean(req.getParameter("location"));
        String occurredAt = Api.clean(req.getParameter("occurredAt"));
        boolean danger = "yes".equals(req.getParameter("danger"));

        if (!TYPES.contains(type)) { bad(resp, "Please choose what kind of incident it is."); return; }
        if (location.length() < 3) { bad(resp, "Please tell us where it is happening."); return; }
        if (description.length() > 2000) description = description.substring(0, 2000);
        if (location.length() > 300) location = location.substring(0, 300);
        LocalDateTime when = LocalDateTime.now();
        if (!occurredAt.isEmpty()) {
            try {
                when = LocalDateTime.parse(occurredAt.length() == 16 ? occurredAt + ":00" : occurredAt);
                if (when.isAfter(LocalDateTime.now().plusMinutes(5))) { bad(resp, "The time of the incident cannot be in the future."); return; }
            } catch (Exception e) { bad(resp, "The time of the incident is not valid."); return; }
        }

        // ---- media ----
        List<Part> parts = new ArrayList<>();
        try {
            for (Part p : req.getParts()) if ("media".equals(p.getName()) && p.getSubmittedFileName() != null && !p.getSubmittedFileName().isEmpty()) parts.add(p);
        } catch (IllegalStateException e) { bad(resp, "The upload is too large. Videos can be up to 25 MB."); return; }
        if (parts.size() > MAX_FILES) { bad(resp, "You can attach at most " + MAX_FILES + " files."); return; }
        if (description.length() < 10 && parts.isEmpty()) { bad(resp, "Add a photo, video or voice note, or describe what is happening (at least 10 characters)."); return; }

        List<Object[]> accepted = new ArrayList<>();   // {name, ext, bytes, contentType}
        List<Map<String, Object>> rejected = new ArrayList<>();
        for (Part p : parts) {
            String name = safeName(p.getSubmittedFileName());
            String ext = extOf(name);
            String problem = null, ctype = null;
            byte[] data = null;
            ctype = contentTypeFor(ext, p.getContentType());
            if (ctype == null) problem = "This file type is not allowed.";
            else if (p.getSize() == 0) problem = "The file is empty.";
            else {
                long cap = ctype.startsWith("image/") ? MAX_IMAGE : ctype.startsWith("audio/") ? MAX_AUDIO : MAX_VIDEO;
                if (p.getSize() > cap) problem = "The file is larger than " + (cap >> 20) + " MB.";
                else {
                    try (InputStream in = p.getInputStream()) { data = in.readNBytes((int) cap + 1); }
                    problem = data.length > cap ? "The file is larger than " + (cap >> 20) + " MB." : signatureProblem(ext, data);
                }
            }
            if (problem != null) {
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("name", name); r.put("reason", problem);
                rejected.add(r);
            } else accepted.add(new Object[] { name, ext, data, ctype });
        }
        if (description.length() < 10 && accepted.isEmpty()) { bad(resp, "None of the files could be accepted, and there is no description. " + (rejected.isEmpty() ? "" : rejected.get(0).get("reason"))); return; }

        // ---- save ----
        final Concern c = new Concern();
        List<Map<String, Object>> attached = new ArrayList<>();
        try {
            synchronized (Api.LOCK) {
                List<Concern> list = JsonStorage.readList(FILE, CONCERNS);
                for (Concern x : list) c.concernId = Math.max(c.concernId, x.concernId);
                c.concernId++;
                c.reference = String.format("RC-%d-%05d", LocalDate.now().getYear(), c.concernId);
                c.userId = Api.id(req);
                c.reporter = Api.name(req);
                for (User u : JsonStorage.<User>readList("users.json", USERS)) if (u.getUserId() == c.userId) { c.city = u.getCity(); break; }
                c.type = type; c.description = description; c.location = location;
                c.lat = num(req.getParameter("lat"), -90, 90); c.lng = num(req.getParameter("lng"), -180, 180);
                if (c.lat == null || c.lng == null) { c.lat = null; c.lng = null; }
                c.occurredAt = when.toString(); c.danger = danger;
                c.priority = danger ? "Critical" : ("Fire or smoke".equals(type) || "Accident".equals(type) || "Fight".equals(type)) ? "Major" : "Minor";
                c.status = "Reported"; c.createdAt = LocalDateTime.now().toString();

                if (!accepted.isEmpty()) {
                    Path dir = ROOT.resolve(String.valueOf(c.concernId));
                    Files.createDirectories(dir);
                    for (Object[] a : accepted) {
                        String id = UUID.randomUUID().toString().replace("-", "");
                        String stored = id + "." + a[1];
                        Files.write(dir.resolve(stored), (byte[]) a[2]);
                        c.media.add(new EvidenceFile(id, (String) a[0], stored, (String) a[3], ((byte[]) a[2]).length, LocalDateTime.now().toString()));
                        Map<String, Object> r = new LinkedHashMap<>();
                        r.put("name", a[0]); r.put("size", ((byte[]) a[2]).length); r.put("type", a[3]);
                        attached.add(r);
                    }
                }
                list.add(c);
                JsonStorage.writeList(FILE, list);
            }
        } catch (Exception e) {
            Api.send(resp, 500, Api.msg("error", "Server error: " + e.getMessage())); return;
        }

        Map<String, Object> m = Api.msg("success", "Your report has been sent. Reference " + c.reference + ".");
        m.put("reference", c.reference);
        m.put("priority", c.priority);
        m.put("attached", attached);
        m.put("rejected", rejected);
        Api.send(resp, 201, m);
    }

    private void updateStatus(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String role = Api.role(req);
        if (!"officer".equals(role) && !"admin".equals(role)) { Api.send(resp, 403, Api.msg("error", "Not allowed.")); return; }
        String status = Api.clean(req.getParameter("status")), note = Api.clean(req.getParameter("note"));
        if (!STATUSES.contains(status)) { bad(resp, "Invalid status."); return; }
        if (note.length() > 200) note = note.substring(0, 200);
        int id;
        try { id = Integer.parseInt(Api.clean(req.getParameter("concernId"))); } catch (Exception e) { bad(resp, "Invalid request."); return; }
        synchronized (Api.LOCK) {
            List<Concern> list = JsonStorage.readList(FILE, CONCERNS);
            for (Concern c : list) if (c.concernId == id) {
                if ("officer".equals(role) && !sameCity(officerCity(Api.id(req)), c.city)) { Api.send(resp, 403, Api.msg("error", "This report is outside your area.")); return; }
                c.status = status; c.statusNote = note;
                JsonStorage.writeList(FILE, list);
                Api.send(resp, 200, Api.msg("success", "Updated to \"" + status + "\"."));
                return;
            }
        }
        Api.send(resp, 404, Api.msg("error", "Report not found."));
    }

    /* ------------------------------------------------------------------ GET */

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!Api.require(req, resp, null)) return;
        String role = Api.role(req);
        int me = Api.id(req);
        String officerCity = "officer".equals(role) ? officerCity(me) : null;

        List<Concern> all = JsonStorage.readList(FILE, CONCERNS);
        String idParam = Api.clean(req.getParameter("id"));

        if (!idParam.isEmpty()) {                       // stream one file
            Concern c = null;
            try { int id = Integer.parseInt(idParam); for (Concern x : all) if (x.concernId == id) { c = x; break; } } catch (Exception e) { /* below */ }
            if (c == null) { Api.send(resp, 404, Api.msg("error", "Report not found.")); return; }
            if (!canSee(role, me, officerCity, c)) { Api.send(resp, 403, Api.msg("error", "You are not allowed to open this file.")); return; }
            EvidenceFile f = null;
            String fid = Api.clean(req.getParameter("file"));
            for (EvidenceFile e : c.media) if (e.getId().equals(fid)) { f = e; break; }
            if (f == null) { Api.send(resp, 404, Api.msg("error", "File not found.")); return; }
            Path dir = ROOT.resolve(String.valueOf(c.concernId)).normalize();
            Path p = dir.resolve(f.getStoredName()).normalize();
            if (!p.startsWith(dir) || !Files.isRegularFile(p)) { Api.send(resp, 404, Api.msg("error", "File not found.")); return; }
            resp.setContentType(f.getContentType());
            resp.setHeader("X-Content-Type-Options", "nosniff");
            resp.setHeader("Cache-Control", "private, max-age=300");
            resp.setHeader("Accept-Ranges", "none");
            resp.setContentLengthLong(Files.size(p));
            Files.copy(p, resp.getOutputStream());
            return;
        }

        List<Map<String, Object>> out = new ArrayList<>();
        all.sort(Comparator.comparingInt((Concern c) -> c.concernId).reversed());
        for (Concern c : all) {
            if (!canSee(role, me, officerCity, c)) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.concernId); m.put("reference", c.reference); m.put("type", c.type); m.put("description", c.description);
            m.put("location", c.location); m.put("lat", c.lat); m.put("lng", c.lng); m.put("occurredAt", c.occurredAt);
            m.put("danger", c.danger); m.put("priority", c.priority); m.put("status", c.status); m.put("statusNote", c.statusNote);
            m.put("createdAt", c.createdAt);
            if (!"user".equals(role)) { m.put("reporter", c.reporter); m.put("city", c.city); }
            List<Map<String, Object>> media = new ArrayList<>();
            for (EvidenceFile f : c.media) {
                Map<String, Object> e = new LinkedHashMap<>();
                e.put("id", f.getId()); e.put("name", f.getOriginalName()); e.put("type", f.getContentType()); e.put("size", f.getSize());
                media.add(e);
            }
            m.put("media", media);
            out.add(m);
        }
        Api.send(resp, 200, out);
    }

    /* ------------------------------------------------------------------ helpers */

    private static boolean canSee(String role, int me, String officerCity, Concern c) {
        if ("admin".equals(role)) return true;
        if ("user".equals(role)) return c.userId == me;
        return "officer".equals(role) && sameCity(officerCity, c.city);
    }

    private static boolean sameCity(String a, String b) { return a != null && b != null && a.equalsIgnoreCase(b); }

    private static String officerCity(int officerId) {
        for (Officer o : JsonStorage.<Officer>readList("officers.json", OFFICERS)) if (o.getOfficerId() == officerId) return o.getCity();
        return null;
    }

    private static void bad(HttpServletResponse resp, String m) throws IOException { Api.send(resp, 400, Api.msg("error", m)); }

    private static Double num(String s, double min, double max) {
        try { double d = Double.parseDouble(Api.clean(s)); return d >= min && d <= max ? d : null; } catch (Exception e) { return null; }
    }

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

    /** The content type we will store and serve for this file, or null when the type is not allowed. */
    static String contentTypeFor(String ext, String declared) {
        String d = declared == null ? "" : declared.toLowerCase(Locale.ROOT).split(";")[0].trim();
        switch (ext) {
            case "jpg": case "jpeg": return "image/jpeg";
            case "png": return "image/png";
            case "webp": return "image/webp";
            case "gif": return "image/gif";
            case "mov": return "video/quicktime";
            case "mp3": return "audio/mpeg";
            case "wav": return "audio/wav";
            case "ogg": return "audio/ogg";
            case "m4a": return "audio/mp4";
            case "weba": return "audio/webm";
            case "webm": return d.startsWith("audio/") ? "audio/webm" : "video/webm";
            case "mp4": return d.startsWith("audio/") ? "audio/mp4" : "video/mp4";
            default: return null;
        }
    }

    static String signatureProblem(String ext, byte[] d) {
        switch (ext) {
            case "jpg": case "jpeg": return d.length > 3 && (d[0] & 0xFF) == 0xFF && (d[1] & 0xFF) == 0xD8 && (d[2] & 0xFF) == 0xFF ? null : "This is not a valid JPEG image.";
            case "png": return d.length > 8 && (d[0] & 0xFF) == 0x89 && d[1] == 'P' && d[2] == 'N' && d[3] == 'G' ? null : "This is not a valid PNG image.";
            case "gif": return d.length > 6 && d[0] == 'G' && d[1] == 'I' && d[2] == 'F' && d[3] == '8' ? null : "This is not a valid GIF image.";
            case "webp": return d.length > 12 && d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F' && d[8] == 'W' && d[9] == 'E' && d[10] == 'B' && d[11] == 'P' ? null : "This is not a valid WebP image.";
            case "webm": case "weba": return d.length > 4 && (d[0] & 0xFF) == 0x1A && (d[1] & 0xFF) == 0x45 && (d[2] & 0xFF) == 0xDF && (d[3] & 0xFF) == 0xA3 ? null : "This is not a valid WebM recording.";
            case "mp4": case "m4a": case "mov": {
                if (d.length < 12) return "This is not a valid video or audio file.";
                String box = new String(d, 4, 4, java.nio.charset.StandardCharsets.ISO_8859_1);
                return box.equals("ftyp") || box.equals("moov") || box.equals("mdat") || box.equals("wide") || box.equals("free") ? null : "This is not a valid video or audio file.";
            }
            case "ogg": return d.length > 4 && d[0] == 'O' && d[1] == 'g' && d[2] == 'g' && d[3] == 'S' ? null : "This is not a valid Ogg audio file.";
            case "wav": return d.length > 12 && d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F' && d[8] == 'W' && d[9] == 'A' && d[10] == 'V' && d[11] == 'E' ? null : "This is not a valid WAV file.";
            case "mp3": return d.length > 3 && ((d[0] == 'I' && d[1] == 'D' && d[2] == '3') || ((d[0] & 0xFF) == 0xFF && (d[1] & 0xE0) == 0xE0)) ? null : "This is not a valid MP3 file.";
            default: return "This file type is not allowed.";
        }
    }
}

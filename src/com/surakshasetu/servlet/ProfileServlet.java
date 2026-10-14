package com.surakshasetu.servlet;

import java.io.IOException;
import java.lang.reflect.Type;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import com.google.gson.reflect.TypeToken;
import com.surakshasetu.util.Api;
import com.surakshasetu.util.JsonStorage;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * "My profile": personal details a citizen can fill in (contact, address, emergency contact, language, location).
 *
 * GET  /api/profile  -> the logged-in person's profile (empty strings for anything not filled yet)
 * POST /api/profile  phone,email,dob,gender,address,city,state,pincode,emergencyName,emergencyPhone,language,lat,lng
 *
 * Stored in data/profiles.json, one entry per user id. Only the owner can read or change their own profile.
 */
@WebServlet("/api/profile")
public class ProfileServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final Type PROFILES = new TypeToken<List<Profile>>() {}.getType();
    private static final String FILE = "profiles.json";
    private static final Pattern PHONE = Pattern.compile("^[+0-9 ()-]{7,16}$");
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final Pattern PIN = Pattern.compile("^[0-9]{6}$");
    private static final List<String> LANGS = Arrays.asList("en", "hi", "kn", "ta", "te", "ml", "bn", "mr");
    private static final List<String> GENDERS = Arrays.asList("Female", "Male", "Other", "Prefer not to say");

    public static class Profile {
        int userId;
        String phone, email, dob, gender, address, city, state, pincode, emergencyName, emergencyPhone, language;
        Double lat, lng;
        String updatedAt;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!Api.require(req, resp, null)) return;
        int me = Api.id(req);
        Profile p = null;
        synchronized (Api.LOCK) {
            List<Profile> all = JsonStorage.readList(FILE, PROFILES);
            for (Profile x : all) if (x.userId == me) { p = x; break; }
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", Api.name(req));
        m.put("phone", s(p == null ? null : p.phone));
        m.put("email", s(p == null ? null : p.email));
        m.put("dob", s(p == null ? null : p.dob));
        m.put("gender", s(p == null ? null : p.gender));
        m.put("address", s(p == null ? null : p.address));
        m.put("city", s(p == null ? null : p.city));
        m.put("state", s(p == null ? null : p.state));
        m.put("pincode", s(p == null ? null : p.pincode));
        m.put("emergencyName", s(p == null ? null : p.emergencyName));
        m.put("emergencyPhone", s(p == null ? null : p.emergencyPhone));
        m.put("language", s(p == null ? null : p.language));
        m.put("lat", p == null ? null : p.lat);
        m.put("lng", p == null ? null : p.lng);
        Api.send(resp, 200, m);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        if (!Api.require(req, resp, null)) return;
        int me = Api.id(req);

        String phone = Api.clean(req.getParameter("phone")), email = Api.clean(req.getParameter("email"));
        String dob = Api.clean(req.getParameter("dob")), gender = Api.clean(req.getParameter("gender"));
        String address = Api.clean(req.getParameter("address")), city = Api.clean(req.getParameter("city"));
        String state = Api.clean(req.getParameter("state")), pin = Api.clean(req.getParameter("pincode"));
        String en = Api.clean(req.getParameter("emergencyName")), ep = Api.clean(req.getParameter("emergencyPhone"));
        String lang = Api.clean(req.getParameter("language"));

        if (!phone.isEmpty() && !PHONE.matcher(phone).matches()) { bad(resp, "Please enter a valid mobile number."); return; }
        if (!email.isEmpty() && (email.length() > 120 || !EMAIL.matcher(email).matches())) { bad(resp, "Please enter a valid email address."); return; }
        if (!ep.isEmpty() && !PHONE.matcher(ep).matches()) { bad(resp, "Please enter a valid emergency contact number."); return; }
        if (!pin.isEmpty() && !PIN.matcher(pin).matches()) { bad(resp, "PIN code must be 6 digits."); return; }
        if (!gender.isEmpty() && !GENDERS.contains(gender)) { bad(resp, "Please choose a gender from the list."); return; }
        if (!lang.isEmpty() && !LANGS.contains(lang)) { bad(resp, "That language is not available."); return; }
        if (!dob.isEmpty()) {
            try {
                LocalDate d = LocalDate.parse(dob);
                if (d.isAfter(LocalDate.now()) || d.isBefore(LocalDate.of(1900, 1, 1))) { bad(resp, "Please enter a valid date of birth."); return; }
            } catch (Exception e) { bad(resp, "Please enter a valid date of birth."); return; }
        }
        if (address.length() > 300 || city.length() > 80 || state.length() > 80 || en.length() > 80) { bad(resp, "One of the fields is too long."); return; }
        Double lat = num(req.getParameter("lat"), -90, 90), lng = num(req.getParameter("lng"), -180, 180);
        if (lat == null || lng == null) { lat = null; lng = null; }

        synchronized (Api.LOCK) {
            List<Profile> list = new ArrayList<>(JsonStorage.readList(FILE, PROFILES));
            Profile p = null;
            for (Profile x : list) if (x.userId == me) { p = x; break; }
            if (p == null) { p = new Profile(); p.userId = me; list.add(p); }
            p.phone = phone; p.email = email; p.dob = dob; p.gender = gender; p.address = address; p.city = city; p.state = state;
            p.pincode = pin; p.emergencyName = en; p.emergencyPhone = ep; p.language = lang; p.lat = lat; p.lng = lng;
            p.updatedAt = LocalDateTime.now().toString();
            JsonStorage.writeList(FILE, list);
        }
        Api.send(resp, 200, Api.msg("success", "Your profile has been saved."));
    }

    private static String s(String v) { return v == null ? "" : v; }

    private static Double num(String raw, double lo, double hi) {
        try {
            if (raw == null || raw.trim().isEmpty()) return null;
            double d = Double.parseDouble(raw.trim());
            return d >= lo && d <= hi ? d : null;
        } catch (Exception e) { return null; }
    }

    private static void bad(HttpServletResponse resp, String message) throws IOException {
        Api.send(resp, 400, Api.msg("error", message));
    }
}

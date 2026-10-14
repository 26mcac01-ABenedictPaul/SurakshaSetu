package com.surakshasetu.servlet;

import java.io.IOException;
import java.lang.reflect.Type;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.google.gson.reflect.TypeToken;
import com.surakshasetu.model.Officer;
import com.surakshasetu.model.User;
import com.surakshasetu.util.Api;
import com.surakshasetu.util.JsonStorage;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * GET  /api/appointments -> citizen: own bookings | officer: bookings made with them
 * POST /api/appointments -> citizen books (officerId, purpose, date, time)
 *                           officer answers (action=accept|decline, appointmentId, note)
 */
@WebServlet("/api/appointments")
public class AppointmentServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final Type APPTS = new TypeToken<List<Appointment>>() {}.getType();
    private static final Type USERS = new TypeToken<List<User>>() {}.getType();
    private static final Type OFFICERS = new TypeToken<List<Officer>>() {}.getType();
    private static final String FILE = "appointments.json";
    private static final List<String> PURPOSES = Arrays.asList(
            "Submit documents", "Meet investigating officer", "Verify identity",
            "Case follow-up", "Statement recording", "Other");

    /** Plain data holder stored in data/appointments.json */
    public static class Appointment {
        int appointmentId;
        int userId;
        String userName;
        int officerId;
        String officerName;
        String station;
        String purpose;
        String date;     // yyyy-MM-dd
        String time;     // HH:mm
        String status;   // Pending | Accepted | Declined
        String note;     // officer's reply
        String createdAt;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!Api.require(req, resp, null)) return;
        String role = Api.role(req);
        int me = Api.id(req);
        if ("admin".equals(role)) { Api.send(resp, 200, new ArrayList<>()); return; }

        List<Appointment> list = JsonStorage.readList(FILE, APPTS);
        List<Appointment> mine = new ArrayList<>();
        for (Appointment a : list) {
            if (("user".equals(role) && a.userId == me) || ("officer".equals(role) && a.officerId == me)) mine.add(a);
        }
        mine.sort(Comparator.comparingInt((Appointment a) -> a.appointmentId).reversed());
        Api.send(resp, 200, mine);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        if (!Api.require(req, resp, null)) return;
        String role = Api.role(req);
        if ("user".equals(role)) book(req, resp);
        else if ("officer".equals(role)) answer(req, resp);
        else Api.send(resp, 403, Api.msg("error", "You are not allowed to do this."));
    }

    private void book(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        int officerId;
        try { officerId = Integer.parseInt(Api.clean(req.getParameter("officerId"))); }
        catch (NumberFormatException e) { Api.send(resp, 400, Api.msg("error", "Please choose a police station.")); return; }

        String purpose = Api.clean(req.getParameter("purpose"));
        String date = Api.clean(req.getParameter("date"));
        String time = Api.clean(req.getParameter("time"));

        if (!PURPOSES.contains(purpose)) { Api.send(resp, 400, Api.msg("error", "Please choose a purpose.")); return; }
        LocalDate d;
        try { d = LocalDate.parse(date); }
        catch (Exception e) { Api.send(resp, 400, Api.msg("error", "Please pick a valid date.")); return; }
        if (d.isBefore(LocalDate.now())) { Api.send(resp, 400, Api.msg("error", "The date cannot be in the past.")); return; }
        if (!time.matches("^([01]\\d|2[0-3]):[0-5]\\d$")) { Api.send(resp, 400, Api.msg("error", "Please pick a valid time.")); return; }

        Officer officer = null;
        for (Officer o : JsonStorage.<Officer>readList("officers.json", OFFICERS)) {
            if (o.getOfficerId() == officerId) { officer = o; break; }
        }
        if (officer == null) { Api.send(resp, 404, Api.msg("error", "Police station not found.")); return; }

        String userName = Api.name(req);
        for (User u : JsonStorage.<User>readList("users.json", USERS)) {
            if (u.getUserId() == Api.id(req)) { userName = u.getUsername(); break; }
        }

        Appointment a = new Appointment();
        synchronized (Api.LOCK) {
            List<Appointment> list = JsonStorage.readList(FILE, APPTS);
            int next = 1;
            for (Appointment x : list) next = Math.max(next, x.appointmentId + 1);
            a.appointmentId = next;
            a.userId = Api.id(req);
            a.userName = userName;
            a.officerId = officer.getOfficerId();
            a.officerName = officer.getName();
            a.station = officer.getStation();
            a.purpose = purpose;
            a.date = date;
            a.time = time;
            a.status = "Pending";
            a.note = "";
            a.createdAt = LocalDateTime.now().toString();
            list.add(a);
            JsonStorage.writeList(FILE, list);
        }
        Map<String, Object> m = Api.msg("success", "Appointment #" + a.appointmentId + " requested with "
                + a.station + ". You will see it here once the officer accepts.");
        m.put("appointmentId", a.appointmentId);
        Api.send(resp, 201, m);
    }

    private void answer(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String action = Api.clean(req.getParameter("action"));
        String note = Api.clean(req.getParameter("note"));
        int id;
        try { id = Integer.parseInt(Api.clean(req.getParameter("appointmentId"))); }
        catch (NumberFormatException e) { Api.send(resp, 400, Api.msg("error", "Invalid appointment id.")); return; }
        if (!action.equals("accept") && !action.equals("decline")) {
            Api.send(resp, 400, Api.msg("error", "Unknown action.")); return;
        }
        if (note.length() > 300) note = note.substring(0, 300);

        synchronized (Api.LOCK) {
            List<Appointment> list = JsonStorage.readList(FILE, APPTS);
            for (Appointment a : list) {
                if (a.appointmentId == id && a.officerId == Api.id(req)) {
                    if (!"Pending".equals(a.status)) {
                        Api.send(resp, 409, Api.msg("error", "This appointment has already been answered.")); return;
                    }
                    a.status = action.equals("accept") ? "Accepted" : "Declined";
                    a.note = note;
                    JsonStorage.writeList(FILE, list);
                    Api.send(resp, 200, Api.msg("success", "Appointment #" + id + " " + a.status.toLowerCase() + "."));
                    return;
                }
            }
        }
        Api.send(resp, 404, Api.msg("error", "Appointment not found."));
    }
}

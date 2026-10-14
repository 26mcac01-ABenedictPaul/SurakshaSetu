package com.surakshasetu.util;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

import com.google.gson.Gson;
import com.surakshasetu.service.impl.ComplaintServiceImpl;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/** Small helpers shared by all servlets: JSON replies, session/role checks, one shared service + lock. */
public class Api {

    public static final Gson GSON = new Gson();
    public static final ComplaintServiceImpl SERVICE = new ComplaintServiceImpl();
    /** All read-modify-write on the JSON files happens inside synchronized (LOCK). */
    public static final Object LOCK = new Object();

    public static void send(HttpServletResponse resp, int status, Object body) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        resp.setHeader("Cache-Control", "no-store");
        resp.getWriter().write(GSON.toJson(body));
    }

    public static Map<String, Object> msg(String status, String message) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("status", status);
        m.put("message", message);
        return m;
    }

    public static String role(HttpServletRequest req) {
        HttpSession s = req.getSession(false);
        return s == null ? null : (String) s.getAttribute("role");
    }

    public static int id(HttpServletRequest req) {
        HttpSession s = req.getSession(false);
        Object v = (s == null) ? null : s.getAttribute("id");
        return v == null ? -1 : (Integer) v;
    }

    public static String name(HttpServletRequest req) {
        HttpSession s = req.getSession(false);
        return s == null ? null : (String) s.getAttribute("name");
    }

    /** True if logged in (and has the given role, when role != null). Otherwise sends 401/403 and returns false. */
    public static boolean require(HttpServletRequest req, HttpServletResponse resp, String role) throws IOException {
        String r = role(req);
        if (r == null) {
            send(resp, HttpServletResponse.SC_UNAUTHORIZED, msg("error", "Please log in first."));
            return false;
        }
        if (role != null && !role.equals(r)) {
            send(resp, HttpServletResponse.SC_FORBIDDEN, msg("error", "You are not allowed to do this."));
            return false;
        }
        return true;
    }

    public static String clean(String s) {
        return s == null ? "" : s.trim();
    }
}

package com.surakshasetu.servlet;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.List;
import java.util.Map;

import com.google.gson.reflect.TypeToken;
import com.surakshasetu.exception.InvalidCredentialsException;
import com.surakshasetu.model.Admin;
import com.surakshasetu.model.Officer;
import com.surakshasetu.model.User;
import com.surakshasetu.service.impl.AuthServiceImpl;
import com.surakshasetu.util.Api;
import com.surakshasetu.util.JsonStorage;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/** One login box for everyone: tries citizen, then police officer, then admin. Creates the session. */
@WebServlet("/login")
public class LoginServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final Type ADMIN_LIST = new TypeToken<List<Admin>>() {}.getType();
    private final AuthServiceImpl auth = new AuthServiceImpl();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        String username = Api.clean(req.getParameter("username"));
        String password = req.getParameter("password") == null ? "" : req.getParameter("password");

        if (username.isEmpty() || password.isEmpty()) {
            Api.send(resp, 400, Api.msg("error", "Username and password are required."));
            return;
        }

        // A bad data row (for example a null field in a JSON file) must not block the other roles,
        // and must not stay hidden: it is printed in the Eclipse Console and reported at the end.
        RuntimeException problem = null;

        // 1) citizen
        try {
            User u = auth.loginUser(username, password);
            start(req, resp, "user", u.getUserId(), u.getUsername(), "user.jsp");
            return;
        } catch (InvalidCredentialsException ignored) {
        } catch (RuntimeException e) {
            e.printStackTrace();
            problem = e;
        }

        // 2) police officer
        try {
            Officer o = auth.loginOfficer(username, password);
            start(req, resp, "officer", o.getOfficerId(), o.getName(), "officer.html");
            return;
        } catch (InvalidCredentialsException ignored) {
        } catch (RuntimeException e) {
            e.printStackTrace();
            problem = e;
        }

        // 3) admin (data/admins.json; falls back to admin / admin123 if the file is missing or empty)
        try {
            List<Admin> admins = JsonStorage.readList("admins.json", ADMIN_LIST);
            if (admins.isEmpty()) {
                Admin def = new Admin("admin", "admin123");
                def.setAdminId(1);
                admins.add(def);
            }
            for (Admin a : admins) {
                if (username.equals(a.getUsername()) && password.equals(a.getPassword())) {
                    start(req, resp, "admin", a.getAdminId(), a.getUsername(), "admin.html");
                    return;
                }
            }
        } catch (RuntimeException e) {
            e.printStackTrace();
            problem = e;
        }

        if (problem != null) {
            Api.send(resp, 500, Api.msg("error", "Server error while logging in: " + problem));
            return;
        }
        Api.send(resp, 401, Api.msg("error", "Invalid username or password."));
    }

    private void start(HttpServletRequest req, HttpServletResponse resp, String role, int id, String name, String page)
            throws IOException {
        HttpSession old = req.getSession(false);
        if (old != null) old.invalidate();           // fresh session on every login
        HttpSession s = req.getSession(true);
        s.setAttribute("role", role);
        s.setAttribute("id", id);
        s.setAttribute("name", name);
        s.setMaxInactiveInterval(30 * 60);

        Map<String, Object> m = Api.msg("success", "Welcome, " + name + "! Redirecting...");
        m.put("role", role);
        m.put("redirect", page);
        Api.send(resp, 200, m);
    }
}
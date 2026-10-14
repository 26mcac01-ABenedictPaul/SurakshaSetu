package com.surakshasetu.servlet;

import java.io.IOException;
import java.util.Map;

import com.surakshasetu.util.Api;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** Pages call this on load to find out who is logged in (401 -> redirect to login). */
@WebServlet("/api/me")
public class MeServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!Api.require(req, resp, null)) return;
        Map<String, Object> m = Api.msg("success", "ok");
        m.put("role", Api.role(req));
        m.put("id", Api.id(req));
        m.put("name", Api.name(req));
        Api.send(resp, 200, m);
    }
}

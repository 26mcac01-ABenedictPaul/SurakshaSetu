package com.surakshasetu.servlet;

import java.io.IOException;
import java.io.PrintWriter;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.surakshasetu.exception.DuplicateUserException;
import com.surakshasetu.model.User;
import com.surakshasetu.service.impl.AuthServiceImpl;
import com.surakshasetu.util.EmailService;

@WebServlet("/register")
public class RegisterServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private final AuthServiceImpl authService = new AuthServiceImpl();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String username = request.getParameter("username");
        String password = request.getParameter("password");
        String phone = request.getParameter("phone");
        String address = request.getParameter("address");
        String state = request.getParameter("state");
        String city = request.getParameter("city");
        String email = request.getParameter("email");

        PrintWriter out = response.getWriter();

        try {
            User user = authService.registerUser(username, password, phone, address, state, city, email);
            // Sent in the background: a mail problem must never make a successful registration look failed.
            final String mailTo = user.getEmail(), mailName = user.getUsername();
            new Thread(() -> {
                try { EmailService.sendWelcomeEmail(mailTo, mailName); }
                catch (RuntimeException ex) { System.out.println("Welcome email not sent: " + ex.getMessage()); }
            }).start();

            out.write("{\"status\":\"success\",\"message\":\"Registered successfully. A welcome email is on its way.\"}");

        } catch (DuplicateUserException e) {
            response.setStatus(HttpServletResponse.SC_CONFLICT);
            out.write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write("{\"status\":\"error\",\"message\":\"Server error: " + e.getMessage() + "\"}");
        }
    }
}
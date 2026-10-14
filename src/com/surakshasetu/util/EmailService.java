package com.surakshasetu.util;

import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.PasswordAuthentication;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

import java.util.Properties;

import com.surakshasetu.model.Complaint;
import com.surakshasetu.model.Officer;

public class EmailService {

    // Credentials are never stored in the code. Set them as environment variables (Render dashboard,
    // Windows "set", etc.), as JVM options (-Dmail.password=...), or in a local mail.properties file
    // (git-ignored) containing:  mail.user=you@gmail.com   mail.password=your-16-char-app-password
    private static final String FROM_EMAIL = setting("MAIL_USER", "mail.user", "surakshasetucrime@gmail.com");
    private static final String APP_PASSWORD = setting("MAIL_PASSWORD", "mail.password", "").replace(" ", "");

    private static String setting(String envName, String propName, String fallback) {
        String v = System.getenv(envName);
        if (v == null || v.trim().isEmpty()) v = System.getProperty(propName);
        if (v == null || v.trim().isEmpty()) {
            java.io.File f = new java.io.File("mail.properties");
            if (f.isFile()) {
                try (java.io.InputStream in = new java.io.FileInputStream(f)) {
                    Properties p = new Properties();
                    p.load(in);
                    v = p.getProperty(propName);
                } catch (java.io.IOException ignored) { }
            }
        }
        return (v == null || v.trim().isEmpty()) ? fallback : v.trim();
    }

    private static Session getSession() {
        if (APP_PASSWORD.isEmpty()) {
            System.out.println("⚠️ Email is not configured: set MAIL_PASSWORD (Gmail app password). Emails will fail.");
        }
        Properties props = new Properties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.host", "smtp.gmail.com");
        props.put("mail.smtp.port", "587");
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");

        return Session.getInstance(props, new jakarta.mail.Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(FROM_EMAIL, APP_PASSWORD);
            }
        });
    }

    public static void sendOtp(String toEmail, String otp) {
        Session session = getSession();

        try {
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(FROM_EMAIL));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
            message.setSubject("SurakshaSetu - Password Reset OTP");
            message.setText("Your OTP for password reset is: " + otp +
                    "\n\nThis code is valid for this session only. If you did not request this, please ignore this email.");

            Transport.send(message);
            System.out.println("✅ OTP sent to " + toEmail);

        } catch (MessagingException e) {
            System.out.println("❌ Failed to send email: " + e.getMessage());
            throw new RuntimeException("Email sending failed", e);
        }
    }

    public static void sendWelcomeEmail(String toEmail, String username) {
        Session session = getSession();

        try {
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(FROM_EMAIL));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
            message.setSubject("Welcome to SurakshaSetu 🛡️");
            message.setText(
                "Hi " + username + ",\n\n" +
                "Welcome to SurakshaSetu — your digital bridge to safety.\n\n" +
                "You can now report incidents quickly and securely, track their status, " +
                "and get connected with the right police officer for your case — no more " +
                "long queues or delayed paperwork.\n\n" +
                "Your safety, reported and resolved faster.\n\n" +
                "Stay safe,\n" +
                "Team SurakshaSetu"
            );

            Transport.send(message);
            System.out.println("✅ Welcome email sent to " + toEmail);

        } catch (MessagingException e) {
            System.out.println("⚠️ Could not send welcome email: " + e.getMessage());
        }
    }

    public static void sendComplaintConfirmation(String toEmail, String username, Complaint complaint) {
        Session session = getSession();

        try {
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(FROM_EMAIL));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
            message.setSubject("SurakshaSetu - Complaint Filed Successfully (Case #" + complaint.getComplaintId() + ")");
            message.setText(
                "Hi " + username + ",\n\n" +
                "Your complaint has been filed successfully with SurakshaSetu.\n\n" +
                "----------------------------------------\n" +
                "Case ID       : " + complaint.getComplaintId() + "\n" +
                "Category      : " + complaint.getCategory() + "\n" +
                "Severity      : " + complaint.getSeverity() + "\n" +
                "Status        : " + complaint.getStatus() + "\n" +
                "Filed On      : " + complaint.getDateFiled() + "\n" +
                "Description   : " + complaint.getDescription() + "\n" +
                "----------------------------------------\n\n" +
                "Our team will review your complaint and assign the appropriate officer shortly. " +
                "You will be notified once an officer is assigned and accepts your case.\n\n" +
                "Stay safe,\n" +
                "Team SurakshaSetu"
            );

            Transport.send(message);
            System.out.println("✅ Complaint confirmation email sent to " + toEmail);

        } catch (MessagingException e) {
            System.out.println("⚠️ Could not send complaint confirmation email: " + e.getMessage());
        }
    }

    public static void sendCaseAcceptedEmail(String toEmail, String username, Complaint complaint, Officer officer) {
        Session session = getSession();

        try {
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(FROM_EMAIL));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
            message.setSubject("SurakshaSetu - Case #" + complaint.getComplaintId() + " Accepted by Officer");
            message.setText(
                "Hi " + username + ",\n\n" +
                "Good news — your case has been reviewed and accepted by a police officer. " +
                "It is now waiting for further enquiry.\n\n" +
                "----------------------------------------\n" +
                "Case ID              : " + complaint.getComplaintId() + "\n" +
                "Category             : " + complaint.getCategory() + "\n" +
                "Severity             : " + complaint.getSeverity() + "\n" +
                "Status               : " + complaint.getStatus() + "\n" +
                "----------------------------------------\n" +
                "Police In-Charge     : " + officer.getName() + "\n" +
                "Badge Number         : " + officer.getBadgeNumber() + "\n" +
                "Station / Address    : " + officer.getStation() + ", " + officer.getCity() + ", " + officer.getState() + "\n" +
                "Contact Number       : " + (officer.getContactNumber() != null ? officer.getContactNumber() : "N/A") + "\n" +
                "Specialization       : " + officer.getSpecialization() + "\n" +
                "----------------------------------------\n\n" +
                "You may be contacted by the officer for further details regarding your case.\n\n" +
                "Stay safe,\n" +
                "Team SurakshaSetu"
            );

            Transport.send(message);
            System.out.println("✅ Case acceptance email sent to " + toEmail);

        } catch (MessagingException e) {
            System.out.println("⚠️ Could not send case acceptance email: " + e.getMessage());
        }
    }
}
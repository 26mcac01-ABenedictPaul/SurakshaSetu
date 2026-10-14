package com.surakshasetu.test;

import java.sql.Connection;
import com.surakshasetu.util.DBConnection;

public class DBTest {
    public static void main(String[] args) {
        try (Connection conn = DBConnection.getConnection()) {
            System.out.println("✅ Connected to database successfully!");
        } catch (Exception e) {
            System.out.println("❌ Connection failed:");
            e.printStackTrace();
        }
    }
}
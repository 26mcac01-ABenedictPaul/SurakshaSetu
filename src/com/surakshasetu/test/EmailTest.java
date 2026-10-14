package com.surakshasetu.test;

import com.surakshasetu.util.EmailService;

public class EmailTest {
    public static void main(String[] args) {
        EmailService.sendOtp("benedictpaul321@gmail.com", "123456");
    }
}
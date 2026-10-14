package com.surakshasetu.util;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

public class OtpService {

    // Temporary in-memory storage: username -> OTP (never written to JSON)
    private static final Map<String, String> otpStore = new HashMap<>();

    public static String generateOtp(String username) {
        Random random = new Random();
        String otp = String.format("%06d", random.nextInt(999999));
        otpStore.put(username, otp);
        return otp;
    }

    public static boolean verifyOtp(String username, String enteredOtp) {
        String actualOtp = otpStore.get(username);
        if (actualOtp != null && actualOtp.equals(enteredOtp)) {
            otpStore.remove(username); // OTP is single-use, discard after success
            return true;
        }
        return false;
    }
}